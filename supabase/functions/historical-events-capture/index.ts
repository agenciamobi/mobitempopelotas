import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.110.8";

const COLLECTOR_KEY = "historical-events";
const STSC_ENDPOINT = "https://tempopelotas.com.br/api/redemet/storms?frames=12";
const INMET_ENDPOINT = "https://tempopelotas.com.br/api/inmet/alerts";
const REQUEST_TIMEOUT_MS = 30_000;
const PELOTAS = { latitude: -31.7654, longitude: -52.3376 } as const;

type JsonRecord = Record<string, unknown>;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function number(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function stringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "MOBI-Tempo-Pelotas-Historical-Events/1.0 (+https://tempopelotas.com.br)",
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) throw new Error(`${url} respondeu HTTP ${response.status}`);
  return (await response.json()) as unknown;
}

function distanceKm(
  first: { latitude: number; longitude: number },
  second: { latitude: number; longitude: number },
) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);
  const calculation =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(calculation));
}

async function buildStscRows(payload: unknown, seenAt: string) {
  if (!isRecord(payload)) throw new Error("Resposta STSC inválida.");
  const frames = Array.isArray(payload.frames) ? payload.frames : [];
  const rows: JsonRecord[] = [];

  for (const rawFrame of frames) {
    if (!isRecord(rawFrame)) continue;
    const observedAt = text(rawFrame.observedAt);
    if (!observedAt || !Number.isFinite(Date.parse(observedAt))) continue;
    const frameId = text(rawFrame.id) ?? observedAt;
    const frameLabel = text(rawFrame.label);
    const points = Array.isArray(rawFrame.points) ? rawFrame.points : [];

    for (const rawPoint of points) {
      if (!isRecord(rawPoint)) continue;
      const latitude = number(rawPoint.latitude);
      const longitude = number(rawPoint.longitude);
      if (latitude === null || longitude === null) continue;
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) continue;

      const sourceRecordId = `${observedAt}:${latitude.toFixed(4)}:${longitude.toFixed(4)}`;
      const distance = Number(distanceKm(PELOTAS, { latitude, longitude }).toFixed(1));
      const eventPayload = {
        frameId,
        frameLabel,
        observedAt,
        latitude,
        longitude,
        distanceKmFromPelotas: distance,
      };

      rows.push({
        source_key: "redemet-stsc",
        event_type: "storm-occurrence",
        source_record_id: sourceRecordId,
        event_at: observedAt,
        starts_at: null,
        ends_at: null,
        severity: null,
        latitude,
        longitude,
        title: "Ocorrência de trovoada — STSC",
        description: frameLabel ? `Ocorrência presente no quadro STSC ${frameLabel}.` : null,
        payload_hash: await sha256Hex(JSON.stringify(eventPayload)),
        metadata: {
          ...eventPayload,
          timestampSemantics: "frame-ultima-ocorrencia",
          sourceProduct: text(payload.product) ?? "STSC — ocorrências de trovoada",
          sourceLabel: text(payload.sourceLabel),
        },
        last_seen_at: seenAt,
      });
    }
  }

  return rows;
}

async function buildInmetRows(payload: unknown, seenAt: string) {
  if (!isRecord(payload)) throw new Error("Resposta INMET inválida.");
  const alerts = Array.isArray(payload.alerts) ? payload.alerts : [];
  const source = isRecord(payload.source) ? payload.source : null;
  const fetchedAt = text(source?.fetchedAt) ?? seenAt;
  const rows: JsonRecord[] = [];

  for (const rawAlert of alerts) {
    if (!isRecord(rawAlert)) continue;
    const id = text(rawAlert.id);
    const event = text(rawAlert.event) ?? "Aviso meteorológico";
    const headline = text(rawAlert.headline) ?? event;
    const sentAt = text(rawAlert.sentAt);
    const startsAt = text(rawAlert.startsAt);
    const expiresAt = text(rawAlert.expiresAt);
    const eventAt = sentAt ?? startsAt ?? fetchedAt;
    if (!id || !Number.isFinite(Date.parse(eventAt))) continue;

    const eventPayload = {
      id,
      event,
      headline,
      description: text(rawAlert.description),
      instruction: text(rawAlert.instruction),
      severity: text(rawAlert.severity),
      severityLabel: text(rawAlert.severityLabel),
      relevance: text(rawAlert.relevance),
      period: text(rawAlert.period),
      startsAt,
      expiresAt,
      sentAt,
      areas: stringArray(rawAlert.areas),
      municipalities: stringArray(rawAlert.municipalities),
      municipalityCodes: stringArray(rawAlert.municipalityCodes),
      officialUrl: text(rawAlert.officialUrl),
    };

    rows.push({
      source_key: "inmet-alerts",
      event_type: "official-weather-alert",
      source_record_id: id,
      event_at: eventAt,
      starts_at: startsAt,
      ends_at: expiresAt,
      severity: eventPayload.severity,
      latitude: null,
      longitude: null,
      title: headline,
      description: eventPayload.description,
      payload_hash: await sha256Hex(JSON.stringify(eventPayload)),
      metadata: {
        ...eventPayload,
        sourceFeedUrl: text(source?.feedUrl),
        sourcePortalUrl: text(source?.portalUrl),
      },
      last_seen_at: seenAt,
    });
  }

  return rows;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return json({ success: false, error: "Método não permitido." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ success: false, error: "Ambiente do Supabase incompleto." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const receivedToken = request.headers.get("x-collector-token")?.trim() ?? "";
  const { data: settings, error: settingsError } = await supabase
    .from("historical_collector_settings")
    .select("collector_token,enabled")
    .eq("collector_key", COLLECTOR_KEY)
    .maybeSingle();

  if (
    settingsError ||
    !settings?.enabled ||
    !receivedToken ||
    !constantTimeEqual(receivedToken, settings.collector_token)
  ) {
    return json({ success: false, error: "Não autorizado." }, 401);
  }

  const startedAt = new Date().toISOString();
  const { data: run, error: runError } = await supabase
    .from("historical_collection_runs")
    .insert({ action: "event-capture", started_at: startedAt, details: {} })
    .select("id")
    .maybeSingle();
  if (runError) return json({ success: false, error: runError.message }, 500);

  const runId = Number(run?.id);
  const seenAt = new Date().toISOString();
  const results = await Promise.allSettled([
    fetchJson(STSC_ENDPOINT).then((payload) => buildStscRows(payload, seenAt)),
    fetchJson(INMET_ENDPOINT).then((payload) => buildInmetRows(payload, seenAt)),
  ]);

  const sourceResults = [
    { key: "redemet-stsc", result: results[0] },
    { key: "inmet-alerts", result: results[1] },
  ] as const;

  let storedCount = 0;
  const details: Record<string, unknown> = {};
  const errors: string[] = [];
  let successfulSources = 0;

  for (const item of sourceResults) {
    if (item.result.status === "rejected") {
      const message = item.result.reason instanceof Error
        ? item.result.reason.message
        : String(item.result.reason);
      details[item.key] = { status: "failed", storedCount: 0, error: message };
      errors.push(`${item.key}: ${message}`);
      continue;
    }

    const rows = item.result.value;
    if (rows.length > 0) {
      const { data, error } = await supabase
        .from("historical_events")
        .upsert(rows, { onConflict: "source_key,event_type,source_record_id" })
        .select("id");

      if (error) {
        details[item.key] = { status: "failed", storedCount: 0, error: error.message };
        errors.push(`${item.key}: ${error.message}`);
        continue;
      }

      const count = data?.length ?? rows.length;
      storedCount += count;
      details[item.key] = { status: "ok", storedCount: count };
    } else {
      details[item.key] = { status: "ok", storedCount: 0 };
    }
    successfulSources += 1;
  }

  const finishedAt = new Date().toISOString();
  const success = successfulSources > 0;
  await supabase
    .from("historical_collection_runs")
    .update({
      finished_at: finishedAt,
      success,
      stored_count: storedCount,
      details,
      error: errors.length ? errors.join(" | ") : null,
    })
    .eq("id", runId);

  if (!success) {
    return json({ success: false, storedCount, details, errors }, 502);
  }

  return json({
    success: true,
    partial: errors.length > 0,
    storedCount,
    details,
    errors,
    capturedAt: finishedAt,
  });
});
