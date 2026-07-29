import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.110.8";

const PROVIDER_KEY = "open-meteo";
const LOCATION_SLUG = "pelotas-rs";
const ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const FRESH_SECONDS = 240;
const STALE_LEASE_SECONDS = 45;
const MAX_ATTEMPTS = 2;
const TIMEOUT_MS = 25_000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
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

function hasForecastPayload(value: unknown) {
  if (!isRecord(value)) return false;
  if (!isRecord(value.current) || !isRecord(value.hourly) || !isRecord(value.daily)) return false;
  return (
    Array.isArray(value.hourly.time) &&
    value.hourly.time.length > 0 &&
    Array.isArray(value.daily.time) &&
    value.daily.time.length > 0
  );
}

function ageSeconds(value: string | null | undefined) {
  if (!value) return Number.POSITIVE_INFINITY;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return Number.POSITIVE_INFINITY;
  return Math.max(0, (Date.now() - timestamp) / 1_000);
}

function buildUrl() {
  const params = new URLSearchParams({
    latitude: "-31.7654",
    longitude: "-52.3376",
    timezone: "America/Sao_Paulo",
    forecast_days: "7",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
    timeformat: "iso8601",
    cell_selection: "land",
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "dew_point_2m",
      "weather_code",
      "pressure_msl",
      "visibility",
      "wind_speed_10m",
      "wind_gusts_10m",
      "wind_direction_10m",
      "is_day",
    ].join(","),
    hourly: [
      "temperature_2m",
      "relative_humidity_2m",
      "dew_point_2m",
      "precipitation_probability",
      "pressure_msl",
      "visibility",
      "cloud_cover",
      "cloud_cover_low",
      "cloud_cover_mid",
      "cloud_cover_high",
      "cape",
      "boundary_layer_height",
      "wind_speed_10m",
      "wind_gusts_10m",
      "weather_code",
      "is_day",
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "precipitation_sum",
      "wind_gusts_10m_max",
      "sunrise",
      "sunset",
    ].join(","),
  });
  return `${ENDPOINT}?${params.toString()}`;
}

async function fetchForecastPayload() {
  let lastError = "Open-Meteo indisponível";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(buildUrl(), {
        headers: {
          Accept: "application/json",
          "User-Agent": "MOBI-Tempo-Pelotas-Supabase/2.0",
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(`Open-Meteo respondeu com status ${response.status}`);
      }

      const payload: unknown = await response.json();
      if (!hasForecastPayload(payload)) {
        throw new Error("O Open-Meteo respondeu sem as séries meteorológicas esperadas.");
      }
      return payload;
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

  const readCache = async () => {
    const { data, error } = await supabase
      .from("weather_provider_payload_cache")
      .select("payload,fetched_at,last_success_at,status,error")
      .eq("provider_key", PROVIDER_KEY)
      .maybeSingle();
    if (error) throw new Error(`Falha ao consultar cache meteorológico: ${error.message}`);
    return data;
  };

  try {
    const cached = await readCache();
    if (
      cached &&
      hasForecastPayload(cached.payload) &&
      ageSeconds(cached.last_success_at ?? cached.fetched_at) <= FRESH_SECONDS
    ) {
      return json({
        success: true,
        provider: PROVIDER_KEY,
        cacheStatus: "fresh",
        fetchedAt: cached.fetched_at,
        payload: cached.payload,
      });
    }

    const leaseToken = crypto.randomUUID();
    const { data: claimed, error: claimError } = await supabase.rpc(
      "claim_weather_provider_refresh",
      {
        p_provider_key: PROVIDER_KEY,
        p_lease_token: leaseToken,
        p_fresh_seconds: FRESH_SECONDS,
        p_stale_lease_seconds: STALE_LEASE_SECONDS,
      },
    );
    if (claimError) throw new Error(`Falha ao reservar atualização: ${claimError.message}`);

    if (claimed !== true) {
      await new Promise((resolve) => setTimeout(resolve, 700));
      const shared = await readCache();
      if (shared && hasForecastPayload(shared.payload)) {
        return json({
          success: true,
          provider: PROVIDER_KEY,
          cacheStatus:
            ageSeconds(shared.last_success_at ?? shared.fetched_at) <= FRESH_SECONDS
              ? "shared"
              : "stale",
          fetchedAt: shared.fetched_at,
          warning: shared.error,
          payload: shared.payload,
        });
      }
      return json(
        { success: false, error: "A previsão está sendo atualizada e ainda não possui cache válido." },
        503,
      );
    }

    try {
      const payload = await fetchForecastPayload();
      const fetchedAt = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("weather_provider_payload_cache")
        .update({
          status: "live",
          payload,
          fetched_at: fetchedAt,
          last_success_at: fetchedAt,
          error: null,
          refresh_started_at: null,
          refresh_lease_token: null,
        })
        .eq("provider_key", PROVIDER_KEY)
        .eq("refresh_lease_token", leaseToken);
      if (updateError) throw new Error(`Falha ao persistir previsão: ${updateError.message}`);

      return json({
        success: true,
        provider: PROVIDER_KEY,
        cacheStatus: "refreshed",
        fetchedAt,
        payload,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await supabase
        .from("weather_provider_payload_cache")
        .update({
          status: cached && hasForecastPayload(cached.payload) ? "stale" : "unavailable",
          error: message,
          refresh_started_at: null,
          refresh_lease_token: null,
        })
        .eq("provider_key", PROVIDER_KEY)
        .eq("refresh_lease_token", leaseToken);

      if (cached && hasForecastPayload(cached.payload)) {
        return json({
          success: true,
          provider: PROVIDER_KEY,
          cacheStatus: "stale",
          fetchedAt: cached.fetched_at,
          warning: message,
          payload: cached.payload,
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("[open-meteo-forecast] Falha", error);
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
