import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.110.8";

const TIMEZONE = "America/Sao_Paulo";
const LOCATION_SLUG = "pelotas-rs";
const ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const MAX_ATTEMPTS = 2;
const TIMEOUT_MS = 25_000;

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

function leadHours(issuedAt: Date, targetDate: string) {
  const targetStart = new Date(`${targetDate}T00:00:00-03:00`).getTime();
  return Math.max(0, Math.round((targetStart - issuedAt.getTime()) / 3_600_000));
}

function numberAt(values: unknown, index: number) {
  if (!Array.isArray(values)) return null;
  const value = values[index];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function buildUrl() {
  const params = new URLSearchParams({
    latitude: "-31.7654",
    longitude: "-52.3376",
    timezone: TIMEZONE,
    forecast_days: "7",
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
    const payload = await fetchForecast();
    const daily = payload && typeof payload === "object" ? payload.daily : null;
    const dates = daily && Array.isArray(daily.time) ? daily.time : [];
    if (!dates.length) throw new Error("O Open-Meteo não retornou datas diárias.");

    const issuedAt = new Date();
    const local = localParts(issuedAt);
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
          issued_at: issuedAt.toISOString(),
          issued_local_date: local.date,
          cycle_hour: cycleHour,
          target_date: targetDate,
          lead_hours: leadHours(issuedAt, targetDate),
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

    return json({
      success: true,
      provider: "open-meteo",
      capturedAt: issuedAt.toISOString(),
      issuedLocalDate: local.date,
      cycleHour,
      storedCount: data?.length ?? rows.length,
      firstTargetDate: rows[0].target_date,
      lastTargetDate: rows.at(-1)?.target_date ?? rows[0].target_date,
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
