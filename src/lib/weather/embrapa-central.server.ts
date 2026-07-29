import { createHash, timingSafeEqual } from "node:crypto";

import type { Database, Json } from "@/lib/supabase/database.types";
import {
  createSupabaseAdminClient,
  getSupabaseServerConfig,
} from "@/lib/supabase/server-client.server";

import { fetchEmbrapaObservation } from "./embrapa.server";
import type { EmbrapaObservation } from "./official-sources.types";

export const EMBRAPA_STATION_ID = "embrapa-cpact-sede-pelotas";

const CENTRAL_READING_MAX_AGE_MS = 75_000;
const REFRESH_LEASE_SECONDS = 90;
const CONCURRENT_REFRESH_WAIT_MS = 450;

type CurrentRow = Database["public"]["Tables"]["weather_station_current"]["Row"];
type CurrentUpdate = Database["public"]["Tables"]["weather_station_current"]["Update"];
type ObservationInsert = Database["public"]["Tables"]["weather_station_observations"]["Insert"];

export type CentralEmbrapaRefreshResult = {
  observation: EmbrapaObservation;
  refreshed: boolean;
  stored: boolean;
  sourceHash: string | null;
  fallback: "central" | "direct" | "last-known";
  error: string | null;
};

function storageConfigured() {
  return getSupabaseServerConfig().isAdminConfigured;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEmbrapaObservation(value: unknown): value is EmbrapaObservation {
  if (!isRecord(value) || !isRecord(value.current) || !isRecord(value.source)) return false;
  return (
    (value.status === "live" || value.status === "partial" || value.status === "unavailable") &&
    value.source.name === "Embrapa Clima Temperado" &&
    typeof value.source.station === "string" &&
    typeof value.source.fetchedAt === "string" &&
    "temperature" in value.current
  );
}

function observationFromRow(row: CurrentRow | null): EmbrapaObservation | null {
  return row && isEmbrapaObservation(row.payload) ? row.payload : null;
}

function isFresh(row: CurrentRow | null) {
  const timestamp = row?.last_success_at ?? row?.fetched_at;
  if (!timestamp) return false;
  const time = new Date(timestamp).getTime();
  return Number.isFinite(time) && Date.now() - time <= CENTRAL_READING_MAX_AGE_MS;
}

function sourceHash(observation: EmbrapaObservation) {
  const normalized = {
    status: observation.status,
    current: observation.current,
    extremes: observation.extremes,
    accumulated: observation.accumulated,
    observationTime: observation.source.observationTime,
  };
  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

function persistenceFields(observation: EmbrapaObservation, hash: string) {
  return {
    station_id: EMBRAPA_STATION_ID,
    provider: "embrapa",
    station_name: observation.source.station,
    status: observation.status,
    observation_time: observation.source.observationTime,
    fetched_at: observation.source.fetchedAt,
    source_hash: hash,
    temperature: observation.current.temperature,
    humidity: observation.current.humidity,
    feels_like: observation.current.feelsLike,
    dew_point: observation.current.dewPoint,
    pressure: observation.current.pressure,
    pressure_trend: observation.current.pressureTrend,
    wind_direction: observation.current.windDirection,
    wind_speed: observation.current.windSpeed,
    rain_daily: observation.accumulated.rainDaily,
    rain_monthly: observation.accumulated.rainMonthly,
    rain_annual: observation.accumulated.rainAnnual,
    payload: observation as unknown as Json,
  } as const;
}

async function readCurrentRow(): Promise<CurrentRow | null> {
  if (!storageConfigured()) return null;
  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from("weather_station_current")
    .select("*")
    .eq("station_id", EMBRAPA_STATION_ID)
    .maybeSingle();

  if (error) throw new Error(`Falha ao consultar a leitura central da Embrapa: ${error.message}`);
  return data;
}

async function claimRefresh(leaseToken: string) {
  const client = createSupabaseAdminClient();
  const { data, error } = await client.rpc("claim_weather_station_refresh", {
    p_station_id: EMBRAPA_STATION_ID,
    p_lease_token: leaseToken,
    p_stale_after_seconds: REFRESH_LEASE_SECONDS,
  });
  if (error) throw new Error(`Falha ao reservar a atualização da Embrapa: ${error.message}`);
  return data === true;
}

async function persistSuccessfulRefresh(
  observation: EmbrapaObservation,
  hash: string,
  leaseToken: string,
) {
  const client = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const common = persistenceFields(observation, hash);
  const currentUpdate: CurrentUpdate = {
    ...common,
    last_attempt_at: now,
    last_success_at: now,
    error: null,
    refresh_started_at: null,
    refresh_lease_token: null,
  };

  const { error: currentError } = await client
    .from("weather_station_current")
    .update(currentUpdate)
    .eq("station_id", EMBRAPA_STATION_ID)
    .eq("refresh_lease_token", leaseToken);

  if (currentError) {
    throw new Error(`Falha ao atualizar a leitura central da Embrapa: ${currentError.message}`);
  }

  const historyInsert: ObservationInsert = common;
  const { error: historyError } = await client
    .from("weather_station_observations")
    .upsert(historyInsert, {
      onConflict: "station_id,source_hash",
      ignoreDuplicates: true,
    });

  if (historyError) {
    console.error("[embrapa/central] Falha ao gravar histórico deduplicado", {
      message: historyError.message,
      sourceHash: hash,
    });
  }
}

async function releaseFailedRefresh(leaseToken: string, errorMessage: string) {
  const client = createSupabaseAdminClient();
  const { error } = await client
    .from("weather_station_current")
    .update({
      last_attempt_at: new Date().toISOString(),
      error: errorMessage,
      refresh_started_at: null,
      refresh_lease_token: null,
    })
    .eq("station_id", EMBRAPA_STATION_ID)
    .eq("refresh_lease_token", leaseToken);

  if (error) {
    console.error("[embrapa/central] Falha ao liberar atualização malsucedida", {
      message: error.message,
    });
  }
}

function directResult(observation: EmbrapaObservation): CentralEmbrapaRefreshResult {
  return {
    observation,
    refreshed: true,
    stored: false,
    sourceHash: observation.status === "unavailable" ? null : sourceHash(observation),
    fallback: "direct",
    error: observation.error,
  };
}

export async function refreshCentralEmbrapaObservation(): Promise<CentralEmbrapaRefreshResult> {
  if (!storageConfigured()) return directResult(await fetchEmbrapaObservation());

  let previousRow: CurrentRow | null = null;
  try {
    previousRow = await readCurrentRow();
  } catch (error) {
    console.error("[embrapa/central] Banco indisponível; usando consulta direta", {
      message: error instanceof Error ? error.message : String(error),
    });
    return directResult(await fetchEmbrapaObservation());
  }

  const leaseToken = crypto.randomUUID();
  let claimed = false;
  try {
    claimed = await claimRefresh(leaseToken);
  } catch (error) {
    console.error("[embrapa/central] Não foi possível obter lease; usando consulta direta", {
      message: error instanceof Error ? error.message : String(error),
    });
    return directResult(await fetchEmbrapaObservation());
  }

  if (!claimed) {
    await new Promise((resolve) => setTimeout(resolve, CONCURRENT_REFRESH_WAIT_MS));
    const concurrentRow = await readCurrentRow().catch(() => null);
    const concurrentObservation = observationFromRow(concurrentRow) ?? observationFromRow(previousRow);
    if (concurrentObservation) {
      return {
        observation: concurrentObservation,
        refreshed: false,
        stored: true,
        sourceHash: concurrentRow?.source_hash ?? previousRow?.source_hash ?? null,
        fallback: "central",
        error: concurrentRow?.error ?? previousRow?.error ?? null,
      };
    }
    return directResult(await fetchEmbrapaObservation());
  }

  const observation = await fetchEmbrapaObservation();
  if (observation.status === "unavailable") {
    await releaseFailedRefresh(leaseToken, observation.error ?? "Embrapa indisponível.");
    const lastKnown = observationFromRow(previousRow);
    if (lastKnown) {
      return {
        observation: lastKnown,
        refreshed: false,
        stored: true,
        sourceHash: previousRow?.source_hash ?? null,
        fallback: "last-known",
        error: observation.error,
      };
    }
    return directResult(observation);
  }

  const hash = sourceHash(observation);
  try {
    await persistSuccessfulRefresh(observation, hash, leaseToken);
    return {
      observation,
      refreshed: true,
      stored: true,
      sourceHash: hash,
      fallback: "central",
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[embrapa/central] Leitura obtida, mas não persistida", { message });
    await releaseFailedRefresh(leaseToken, message);
    return {
      observation,
      refreshed: true,
      stored: false,
      sourceHash: hash,
      fallback: "direct",
      error: message,
    };
  }
}

export async function getCentralEmbrapaObservation(): Promise<EmbrapaObservation> {
  if (!storageConfigured()) return fetchEmbrapaObservation();

  try {
    const row = await readCurrentRow();
    const observation = observationFromRow(row);
    if (observation && isFresh(row)) return observation;
    return (await refreshCentralEmbrapaObservation()).observation;
  } catch (error) {
    console.error("[embrapa/central] Falha ao ler centralizador; usando fonte direta", {
      message: error instanceof Error ? error.message : String(error),
    });
    return fetchEmbrapaObservation();
  }
}

function safeTokenEqual(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

export async function authorizeEmbrapaCollectorRequest(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");
  if (cronSecret && authorization === `Bearer ${cronSecret}`) return true;

  const receivedToken = request.headers.get("x-collector-token")?.trim();
  if (!receivedToken || !storageConfigured()) return false;

  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from("weather_collector_settings")
    .select("collector_token,enabled")
    .eq("station_id", EMBRAPA_STATION_ID)
    .maybeSingle();

  if (error || !data?.enabled) return false;
  return safeTokenEqual(receivedToken, data.collector_token);
}
