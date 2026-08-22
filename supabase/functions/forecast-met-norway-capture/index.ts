import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.110.8";

const LOCATION_SLUG = "pelotas-rs";
const TIMEZONE = "America/Sao_Paulo";
const ENDPOINT = "https://api.met.no/weatherapi/locationforecast/2.0/compact";
const COLLECTOR_KEY = "forecast-met-norway";
const SOURCE_KEY = "met-norway-forecast";
const PROVIDER_KEY = "met-norway";
const MAX_ATTEMPTS = 2;
const TIMEOUT_MS = 25_000;
const LATITUDE = -31.7654;
const LONGITUDE = -52.3376;
const ALTITUDE = 7;

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

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function localParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    hour: Number(values.hour),
  };
}

function leadHours(capturedAt: Date, validAt: string) {
  const validTime = Date.parse(validAt);
  if (!Number.isFinite(validTime)) return null;
  return Math.max(0, Math.round((validTime - capturedAt.getTime()) / 3_600_000));
}

function metersPerSecondToKilometersPerHour(value: unknown) {
  const number = finiteNumber(value);
  return number === null ? null : Number((number * 3.6).toFixed(2));
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function buildUrl() {
  const params = new URLSearchParams({
    lat: String(LATITUDE),
    lon: String(LONGITUDE),
    altitude: String(ALTITUDE),
  });
  return `${ENDPOINT}?${params.toString()}`;
}

async function fetchForecast() {
  let lastError = "MET Norway indisponível";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(buildUrl(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "MOBI-Tempo-Pelotas/2.0 (+https://tempopelotas.com.br)",
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(`MET Norway respondeu com status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 1_000));
      }
    }
  }

  throw new Error(lastError);
}

type ForecastPoint = {
  valid_at: string;
  lead_hours: number;
  temperature_2m: number | null;
  apparent_temperature: null;
  relative_humidity_2m: number | null;
  dew_point_2m: number | null;
  precipitation_probability: number | null;
  precipitation_mm: number | null;
  pressure_msl: number | null;
  cloud_cover: number | null;
  cloud_cover_low: number | null;
  cloud_cover_mid: number | null;
  cloud_cover_high: number | null;
  visibility_m: null;
  cape: null;
  boundary_layer_height_m: null;
  wind_speed_10m: number | null;
  wind_gusts_10m: number | null;
  wind_direction_10m: number | null;
  weather_code: null;
  is_day: null;
};

function buildPoints(payload: Record<string, unknown>, capturedAt: Date) {
  const properties = isRecord(payload.properties) ? payload.properties : null;
  const timeseries = properties && Array.isArray(properties.timeseries) ? properties.timeseries : [];

  return timeseries.flatMap<ForecastPoint>((entry) => {
    if (!isRecord(entry) || typeof entry.time !== "string") return [];
    const timestamp = entry.time;
    const lead = leadHours(capturedAt, timestamp);
    if (lead === null || lead > 384) return [];

    const data = isRecord(entry.data) ? entry.data : null;
    const instant = data && isRecord(data.instant) ? data.instant : null;
    const details = instant && isRecord(instant.details) ? instant.details : null;
    if (!details) return [];

    const nextOneHour = data && isRecord(data.next_1_hours) ? data.next_1_hours : null;
    const nextOneHourDetails = nextOneHour && isRecord(nextOneHour.details)
      ? nextOneHour.details
      : null;

    return [
      {
        valid_at: timestamp,
        lead_hours: lead,
        temperature_2m: finiteNumber(details.air_temperature),
        apparent_temperature: null,
        relative_humidity_2m: finiteNumber(details.relative_humidity),
        dew_point_2m: finiteNumber(details.dew_point_temperature),
        precipitation_probability: finiteNumber(nextOneHourDetails?.probability_of_precipitation),
        precipitation_mm: finiteNumber(nextOneHourDetails?.precipitation_amount),
        pressure_msl: finiteNumber(details.air_pressure_at_sea_level),
        cloud_cover: finiteNumber(details.cloud_area_fraction),
        cloud_cover_low: finiteNumber(details.cloud_area_fraction_low),
        cloud_cover_mid: finiteNumber(details.cloud_area_fraction_medium),
        cloud_cover_high: finiteNumber(details.cloud_area_fraction_high),
        visibility_m: null,
        cape: null,
        boundary_layer_height_m: null,
        wind_speed_10m: metersPerSecondToKilometersPerHour(details.wind_speed),
        wind_gusts_10m: metersPerSecondToKilometersPerHour(details.wind_speed_of_gust),
        wind_direction_10m: finiteNumber(details.wind_from_direction),
        weather_code: null,
        is_day: null,
      },
    ];
  });
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

  const capturedAt = new Date();
  const local = localParts(capturedAt);
  const cycleHour = Math.floor(local.hour / 6) * 6;

  try {
    const { data: existing, error: existingError } = await supabase
      .from("weather_forecast_runs")
      .select("id,capture_status,point_count,first_valid_at,last_valid_at")
      .eq("location_slug", LOCATION_SLUG)
      .eq("provider_key", PROVIDER_KEY)
      .eq("captured_local_date", local.date)
      .eq("cycle_hour", cycleHour)
      .maybeSingle();

    if (existingError) throw new Error(existingError.message);

    if (existing?.capture_status === "complete") {
      return json({
        success: true,
        provider: PROVIDER_KEY,
        status: "existing",
        runId: Number(existing.id),
        capturedLocalDate: local.date,
        cycleHour,
        storedCount: Number(existing.point_count ?? 0),
        firstValidAt: existing.first_valid_at,
        lastValidAt: existing.last_valid_at,
      });
    }

    const rawPayload = await fetchForecast();
    if (!isRecord(rawPayload)) throw new Error("Resposta inválida do MET Norway.");

    const points = buildPoints(rawPayload, capturedAt);
    if (!points.length) throw new Error("Nenhum ponto estruturado foi reconhecido no MET Norway.");

    const properties = isRecord(rawPayload.properties) ? rawPayload.properties : null;
    const meta = properties && isRecord(properties.meta) ? properties.meta : null;
    const providerUpdatedAt = typeof meta?.updated_at === "string" ? meta.updated_at : null;
    const geometry = isRecord(rawPayload.geometry) ? rawPayload.geometry : null;
    const coordinates = geometry && Array.isArray(geometry.coordinates) ? geometry.coordinates : [];
    const longitude = finiteNumber(coordinates[0]) ?? LONGITUDE;
    const latitude = finiteNumber(coordinates[1]) ?? LATITUDE;
    const payloadHash = await sha256Hex(JSON.stringify(rawPayload));
    const firstValidAt = points[0].valid_at;
    const lastValidAt = points.at(-1)?.valid_at ?? firstValidAt;
    const horizonHours = Math.min(
      384,
      Math.max(0, Math.round((Date.parse(lastValidAt) - Date.parse(firstValidAt)) / 3_600_000) + 1),
    );

    const runValues = {
      source_key: SOURCE_KEY,
      location_slug: LOCATION_SLUG,
      provider_key: PROVIDER_KEY,
      provider_name: "MET Norway",
      model: "Locationforecast 2.0",
      model_run: providerUpdatedAt,
      captured_at: capturedAt.toISOString(),
      captured_local_date: local.date,
      cycle_hour: cycleHour,
      timezone: TIMEZONE,
      latitude,
      longitude,
      utc_offset_seconds: -10_800,
      generation_time_ms: null,
      forecast_hours: horizonHours,
      first_valid_at: firstValidAt,
      last_valid_at: lastValidAt,
      capture_status: "pending",
      point_count: 0,
      payload_hash: payloadHash,
      error: null,
      metadata: {
        capturePolicy: "first-complete-snapshot-per-6h-bucket",
        capturedBy: "forecast-met-norway-capture",
        providerUpdatedAt,
        temporalResolution: "provider-timeseries-variable",
        precipitationStoredOnlyWhenNext1HoursAvailable: true,
        sourceUnits: isRecord(meta?.units) ? meta?.units : null,
      },
      completed_at: null,
    };

    let runId = existing ? Number(existing.id) : null;

    if (runId === null) {
      const { data: inserted, error: insertError } = await supabase
        .from("weather_forecast_runs")
        .insert(runValues)
        .select("id")
        .maybeSingle();

      if (insertError && insertError.code !== "23505") throw new Error(insertError.message);
      runId = inserted?.id ? Number(inserted.id) : null;

      if (runId === null) {
        const { data: concurrent, error: concurrentError } = await supabase
          .from("weather_forecast_runs")
          .select("id,capture_status,point_count")
          .eq("location_slug", LOCATION_SLUG)
          .eq("provider_key", PROVIDER_KEY)
          .eq("captured_local_date", local.date)
          .eq("cycle_hour", cycleHour)
          .maybeSingle();

        if (concurrentError || !concurrent) {
          throw new Error(concurrentError?.message ?? "Não foi possível resolver o forecast run concorrente.");
        }
        if (concurrent.capture_status === "complete") {
          return json({
            success: true,
            provider: PROVIDER_KEY,
            status: "existing",
            runId: Number(concurrent.id),
            capturedLocalDate: local.date,
            cycleHour,
            storedCount: Number(concurrent.point_count ?? 0),
          });
        }
        runId = Number(concurrent.id);
      }
    } else {
      const { error: retryError } = await supabase
        .from("weather_forecast_runs")
        .update(runValues)
        .eq("id", runId);
      if (retryError) throw new Error(retryError.message);
    }

    const pointRows = points.map((point) => ({ run_id: runId, ...point }));
    const { error: pointsError } = await supabase
      .from("weather_forecast_hourly_points")
      .upsert(pointRows, { onConflict: "run_id,valid_at" });

    if (pointsError) {
      await supabase
        .from("weather_forecast_runs")
        .update({ capture_status: "failed", error: pointsError.message, completed_at: null })
        .eq("id", runId);
      throw new Error(pointsError.message);
    }

    const completedAt = new Date().toISOString();
    const { error: completeError } = await supabase
      .from("weather_forecast_runs")
      .update({
        capture_status: "complete",
        point_count: pointRows.length,
        error: null,
        completed_at: completedAt,
      })
      .eq("id", runId);
    if (completeError) throw new Error(completeError.message);

    return json({
      success: true,
      provider: PROVIDER_KEY,
      status: "stored",
      runId,
      capturedAt: capturedAt.toISOString(),
      capturedLocalDate: local.date,
      cycleHour,
      providerUpdatedAt,
      storedCount: pointRows.length,
      forecastHours: horizonHours,
      firstValidAt,
      lastValidAt,
    });
  } catch (error) {
    console.error("[forecast-met-norway-capture] Falha", error);
    return json(
      {
        success: false,
        provider: PROVIDER_KEY,
        error: error instanceof Error ? error.message : String(error),
      },
      502,
    );
  }
});
