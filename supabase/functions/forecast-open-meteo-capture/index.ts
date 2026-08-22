import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.110.8";

const TIMEZONE = "America/Sao_Paulo";
const LOCATION_SLUG = "pelotas-rs";
const ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const MAX_ATTEMPTS = 2;
const TIMEOUT_MS = 25_000;
const FORECAST_DAYS = 7;

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

function dateDistanceDays(from: string, to: string) {
  const fromTime = new Date(`${from}T12:00:00Z`).getTime();
  const toTime = new Date(`${to}T12:00:00Z`).getTime();
  return Math.max(0, Math.round((toTime - fromTime) / 86_400_000));
}

function leadHoursToDay(issuedAt: Date, targetDate: string) {
  const targetStart = new Date(`${targetDate}T00:00:00-03:00`).getTime();
  return Math.max(0, Math.round((targetStart - issuedAt.getTime()) / 3_600_000));
}

function leadHoursToTimestamp(capturedAt: Date, validAt: string) {
  const validTime = new Date(validAt).getTime();
  return Math.max(0, Math.round((validTime - capturedAt.getTime()) / 3_600_000));
}

function numberAt(values: unknown, index: number) {
  if (!Array.isArray(values)) return null;
  const value = values[index];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function integerAt(values: unknown, index: number) {
  const value = numberAt(values, index);
  return value === null ? null : Math.round(value);
}

function finiteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function localTimestampToIso(value: unknown, utcOffsetSeconds: number) {
  if (typeof value !== "string") return null;
  const normalized = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)
    ? `${value}:00Z`
    : /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)
      ? `${value}Z`
      : null;
  if (!normalized) return null;

  const localAsUtc = Date.parse(normalized);
  if (!Number.isFinite(localAsUtc)) return null;
  return new Date(localAsUtc - utcOffsetSeconds * 1_000).toISOString();
}

async function sha256Hex(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function buildUrl() {
  const params = new URLSearchParams({
    latitude: "-31.7654",
    longitude: "-52.3376",
    timezone: TIMEZONE,
    forecast_days: String(FORECAST_DAYS),
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
    timeformat: "iso8601",
    cell_selection: "land",
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "precipitation_sum",
      "wind_gusts_10m_max",
    ].join(","),
    hourly: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "dew_point_2m",
      "precipitation_probability",
      "precipitation",
      "pressure_msl",
      "cloud_cover",
      "cloud_cover_low",
      "cloud_cover_mid",
      "cloud_cover_high",
      "visibility",
      "cape",
      "boundary_layer_height",
      "wind_speed_10m",
      "wind_gusts_10m",
      "wind_direction_10m",
      "weather_code",
      "is_day",
    ].join(","),
  });
  return `${ENDPOINT}?${params.toString()}`;
}

async function fetchForecast() {
  let lastError = "Open-Meteo indisponível";
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(buildUrl(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "MOBI-Tempo-Pelotas-Supabase/1.0",
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`Open-Meteo respondeu com status ${response.status}`);
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

type RichArchiveResult = {
  status: "stored" | "existing" | "degraded";
  runId: number | null;
  storedCount: number;
  error: string | null;
};

async function archiveRichForecastRun(
  supabase: ReturnType<typeof createClient>,
  payload: Record<string, unknown>,
  capturedAt: Date,
  capturedLocalDate: string,
  cycleHour: number,
): Promise<RichArchiveResult> {
  const hourly = isRecord(payload.hourly) ? payload.hourly : null;
  const times = hourly && Array.isArray(hourly.time) ? hourly.time : [];
  if (!hourly || !times.length) {
    return {
      status: "degraded",
      runId: null,
      storedCount: 0,
      error: "O Open-Meteo não retornou a série horária rica para arquivamento.",
    };
  }

  const utcOffsetSeconds = finiteNumber(payload.utc_offset_seconds) ?? -10_800;
  const points = times.flatMap((timestamp, index) => {
    const validAt = localTimestampToIso(timestamp, utcOffsetSeconds);
    if (!validAt) return [];

    const isDayValue = numberAt(hourly.is_day, index);
    return [
      {
        valid_at: validAt,
        lead_hours: leadHoursToTimestamp(capturedAt, validAt),
        temperature_2m: numberAt(hourly.temperature_2m, index),
        apparent_temperature: numberAt(hourly.apparent_temperature, index),
        relative_humidity_2m: numberAt(hourly.relative_humidity_2m, index),
        dew_point_2m: numberAt(hourly.dew_point_2m, index),
        precipitation_probability: numberAt(hourly.precipitation_probability, index),
        precipitation_mm: numberAt(hourly.precipitation, index),
        pressure_msl: numberAt(hourly.pressure_msl, index),
        cloud_cover: numberAt(hourly.cloud_cover, index),
        cloud_cover_low: numberAt(hourly.cloud_cover_low, index),
        cloud_cover_mid: numberAt(hourly.cloud_cover_mid, index),
        cloud_cover_high: numberAt(hourly.cloud_cover_high, index),
        visibility_m: numberAt(hourly.visibility, index),
        cape: numberAt(hourly.cape, index),
        boundary_layer_height_m: numberAt(hourly.boundary_layer_height, index),
        wind_speed_10m: numberAt(hourly.wind_speed_10m, index),
        wind_gusts_10m: numberAt(hourly.wind_gusts_10m, index),
        wind_direction_10m: numberAt(hourly.wind_direction_10m, index),
        weather_code: integerAt(hourly.weather_code, index),
        is_day: isDayValue === null ? null : isDayValue !== 0,
      },
    ];
  });

  if (!points.length) {
    return {
      status: "degraded",
      runId: null,
      storedCount: 0,
      error: "Nenhum horário válido foi reconhecido para o forecast run.",
    };
  }

  const cycleFilter = {
    location_slug: LOCATION_SLUG,
    provider_key: "open-meteo",
    captured_local_date: capturedLocalDate,
    cycle_hour: cycleHour,
  } as const;

  const { data: existing, error: existingError } = await supabase
    .from("weather_forecast_runs")
    .select("id,capture_status,point_count")
    .eq("location_slug", cycleFilter.location_slug)
    .eq("provider_key", cycleFilter.provider_key)
    .eq("captured_local_date", cycleFilter.captured_local_date)
    .eq("cycle_hour", cycleFilter.cycle_hour)
    .maybeSingle();
  if (existingError) throw new Error(existingError.message);

  if (existing?.capture_status === "complete") {
    return {
      status: "existing",
      runId: Number(existing.id),
      storedCount: Number(existing.point_count ?? 0),
      error: null,
    };
  }

  const payloadHash = await sha256Hex(JSON.stringify(payload));
  const runValues = {
    source_key: "open-meteo-forecast",
    ...cycleFilter,
    provider_name: "Open-Meteo",
    model: "Open-Meteo Best Match",
    model_run: null,
    captured_at: capturedAt.toISOString(),
    timezone: TIMEZONE,
    latitude: finiteNumber(payload.latitude) ?? -31.7654,
    longitude: finiteNumber(payload.longitude) ?? -52.3376,
    utc_offset_seconds: utcOffsetSeconds,
    generation_time_ms: finiteNumber(payload.generationtime_ms),
    forecast_hours: points.length,
    first_valid_at: points[0].valid_at,
    last_valid_at: points.at(-1)?.valid_at ?? points[0].valid_at,
    capture_status: "pending",
    point_count: 0,
    payload_hash: payloadHash,
    error: null,
    completed_at: null,
    metadata: {
      temporalResolutionMinutes: 60,
      capturePolicy: "first-complete-snapshot-per-6h-bucket",
      capturedBy: "forecast-open-meteo-capture",
      providerIssuedAtAvailable: false,
    },
  };

  let runId = existing ? Number(existing.id) : null;

  if (runId === null) {
    const { data: inserted, error: insertError } = await supabase
      .from("weather_forecast_runs")
      .insert(runValues)
      .select("id")
      .maybeSingle();

    if (insertError && insertError.code !== "23505") {
      throw new Error(insertError.message);
    }

    runId = inserted?.id ? Number(inserted.id) : null;
    if (runId === null) {
      const { data: concurrentRun, error: concurrentError } = await supabase
        .from("weather_forecast_runs")
        .select("id,capture_status,point_count")
        .eq("location_slug", cycleFilter.location_slug)
        .eq("provider_key", cycleFilter.provider_key)
        .eq("captured_local_date", cycleFilter.captured_local_date)
        .eq("cycle_hour", cycleFilter.cycle_hour)
        .maybeSingle();
      if (concurrentError || !concurrentRun) {
        throw new Error(concurrentError?.message ?? "Não foi possível resolver o forecast run concorrente.");
      }
      if (concurrentRun.capture_status === "complete") {
        return {
          status: "existing",
          runId: Number(concurrentRun.id),
          storedCount: Number(concurrentRun.point_count ?? 0),
          error: null,
        };
      }
      runId = Number(concurrentRun.id);
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

  return {
    status: "stored",
    runId,
    storedCount: pointRows.length,
    error: null,
  };
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
    .from("weather_forecast_accuracy_settings")
    .select("collector_token,enabled")
    .eq("location_slug", LOCATION_SLUG)
    .maybeSingle();

  if (
    settingsError ||
    !settings?.enabled ||
    !receivedToken ||
    !constantTimeEqual(receivedToken, settings.collector_token)
  ) {
    return json({ success: false, error: "Não autorizado." }, 401);
  }

  try {
    const rawPayload = await fetchForecast();
    if (!isRecord(rawPayload)) throw new Error("O Open-Meteo retornou um payload inválido.");
    const payload = rawPayload;
    const daily = isRecord(payload.daily) ? payload.daily : null;
    const dates = daily && Array.isArray(daily.time) ? daily.time : [];
    if (!daily || !dates.length) throw new Error("O Open-Meteo não retornou datas diárias.");

    const capturedAt = new Date();
    const local = localParts(capturedAt);
    const cycleHour = Math.floor(local.hour / 6) * 6;
    const rows = dates.flatMap((targetDate: unknown, index: number) => {
      if (typeof targetDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
        return [];
      }
      const minimum = numberAt(daily.temperature_2m_min, index);
      const maximum = numberAt(daily.temperature_2m_max, index);
      const precipitation = numberAt(daily.precipitation_sum, index);
      if (minimum === null || maximum === null || precipitation === null) return [];
      const rainChance = numberAt(daily.precipitation_probability_max, index);
      const windGust = numberAt(daily.wind_gusts_10m_max, index);
      const leadDays = dateDistanceDays(local.date, targetDate);

      return [
        {
          location_slug: LOCATION_SLUG,
          provider_key: "open-meteo",
          provider_name: "Open-Meteo",
          model: "Open-Meteo Best Match",
          model_run: null,
          issued_at: capturedAt.toISOString(),
          issued_local_date: local.date,
          cycle_hour: cycleHour,
          target_date: targetDate,
          lead_hours: leadHoursToDay(capturedAt, targetDate),
          lead_days: leadDays,
          temperature_min: Math.round(minimum),
          temperature_max: Math.round(maximum),
          precipitation_mm: Number(Math.max(0, precipitation).toFixed(1)),
          rain_chance: rainChance === null ? null : Math.round(rainChance),
          wind_gust: windGust === null ? null : Math.round(windGust),
        },
      ];
    });

    if (!rows.length) throw new Error("Nenhuma previsão diária válida foi reconhecida.");

    const { data, error } = await supabase
      .from("weather_forecast_predictions")
      .upsert(rows, {
        onConflict: "location_slug,provider_key,issued_local_date,cycle_hour,target_date",
      })
      .select("id");
    if (error) throw new Error(error.message);

    let archive: RichArchiveResult;
    try {
      archive = await archiveRichForecastRun(
        supabase,
        payload,
        capturedAt,
        local.date,
        cycleHour,
      );
    } catch (archiveError) {
      const message = archiveError instanceof Error ? archiveError.message : String(archiveError);
      console.error("[forecast-open-meteo-capture] Arquivo rico degradado", { message });
      archive = { status: "degraded", runId: null, storedCount: 0, error: message };
    }

    return json({
      success: true,
      provider: "open-meteo",
      capturedAt: capturedAt.toISOString(),
      issuedLocalDate: local.date,
      cycleHour,
      storedCount: data?.length ?? rows.length,
      firstTargetDate: rows[0].target_date,
      lastTargetDate: rows.at(-1)?.target_date ?? rows[0].target_date,
      richArchive: archive,
    });
  } catch (error) {
    console.error("[forecast-open-meteo-capture] Falha", error);
    return json(
      {
        success: false,
        provider: "open-meteo",
        error: error instanceof Error ? error.message : String(error),
      },
      502,
    );
  }
});
