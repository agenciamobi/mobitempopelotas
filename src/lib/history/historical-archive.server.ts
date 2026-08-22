import { timingSafeEqual } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import { fetchGuaibaObservation } from "@/lib/hydrology/guaiba.server";
import { fetchLagoonMonitoringNetwork } from "@/lib/hydrology/lagoon-network.server";
import { fetchLaranjalLevelData } from "@/lib/hydrology/laranjal-level.server";
import {
  createSupabaseAdminClient,
  getSupabaseServerConfig,
} from "@/lib/supabase/server-client.server";

const COLLECTOR_KEY = "primary";
const INSERT_CHUNK_SIZE = 500;

type HistoricalMeasurementInsert = {
  source_key: string;
  station_key: string;
  variable_key: string;
  data_class?: "observation" | "forecast" | "reanalysis" | "derived";
  observed_at: string;
  value_numeric?: number | null;
  value_text?: string | null;
  unit: string;
  quality_flag?: string;
  source_record_id?: string | null;
  metadata?: Record<string, unknown>;
};

type HistoricalArchiveDatabase = {
  public: {
    Tables: {
      historical_data_sources: {
        Row: {
          source_key: string;
          collection_enabled: boolean;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      historical_measurements: {
        Row: HistoricalMeasurementInsert & { id: number; ingested_at: string };
        Insert: HistoricalMeasurementInsert;
        Update: Partial<HistoricalMeasurementInsert>;
        Relationships: [];
      };
      historical_collector_settings: {
        Row: {
          collector_key: string;
          collector_token: string;
          enabled: boolean;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      historical_collection_runs: {
        Row: {
          id: number;
          action: string;
          started_at: string;
          finished_at: string | null;
          success: boolean | null;
          stored_count: number;
          details: Record<string, unknown>;
          error: string | null;
        };
        Insert: {
          action: string;
          started_at?: string;
          finished_at?: string | null;
          success?: boolean | null;
          stored_count?: number;
          details?: Record<string, unknown>;
          error?: string | null;
        };
        Update: never;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type SourceResult = {
  source: string;
  status: string;
  candidatePoints: number;
};

export type HistoricalArchiveCaptureResult = {
  action: "environmental-capture" | "environmental-backfill";
  storedCount: number;
  candidateCount: number;
  sources: SourceResult[];
  startedAt: string;
  finishedAt: string;
};

function archiveClient() {
  return createSupabaseAdminClient() as unknown as SupabaseClient<HistoricalArchiveDatabase>;
}

function safeTokenEqual(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

export async function authorizeHistoricalArchiveRequest(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (cronSecret && request.headers.get("authorization") === `Bearer ${cronSecret}`) {
    return true;
  }

  const receivedToken = request.headers.get("x-collector-token")?.trim();
  if (!receivedToken || !getSupabaseServerConfig().isAdminConfigured) return false;

  const { data, error } = await archiveClient()
    .from("historical_collector_settings")
    .select("collector_token,enabled")
    .eq("collector_key", COLLECTOR_KEY)
    .maybeSingle();

  return Boolean(
    !error && data?.enabled && data.collector_token && safeTokenEqual(receivedToken, data.collector_token),
  );
}

async function enabledSources() {
  const { data, error } = await archiveClient()
    .from("historical_data_sources")
    .select("source_key,collection_enabled")
    .eq("collection_enabled", true);

  if (error) throw new Error(`Falha ao consultar fontes históricas: ${error.message}`);
  return new Set((data ?? []).map((source) => source.source_key));
}

function waterLevelPoint(options: {
  sourceKey: string;
  stationKey: string;
  observedAt: string | null;
  value: number | null;
  unit: "m" | "cm";
  quality: string;
  metadata?: Record<string, unknown>;
}): HistoricalMeasurementInsert | null {
  if (!options.observedAt || options.value === null || !Number.isFinite(options.value)) return null;

  return {
    source_key: options.sourceKey,
    station_key: options.stationKey,
    variable_key: "water_level",
    data_class: "observation",
    observed_at: options.observedAt,
    value_numeric: options.value,
    value_text: null,
    unit: options.unit,
    quality_flag: options.quality,
    source_record_id: `${options.stationKey}:${options.observedAt}`,
    metadata: options.metadata ?? {},
  };
}

async function insertMeasurements(rows: HistoricalMeasurementInsert[]) {
  let storedCount = 0;
  const client = archiveClient();

  for (let index = 0; index < rows.length; index += INSERT_CHUNK_SIZE) {
    const chunk = rows.slice(index, index + INSERT_CHUNK_SIZE);
    const { data, error } = await client
      .from("historical_measurements")
      .upsert(chunk, {
        onConflict: "source_key,station_key,variable_key,data_class,observed_at",
        ignoreDuplicates: true,
      })
      .select("id");

    if (error) throw new Error(`Falha ao gravar histórico ambiental: ${error.message}`);
    storedCount += data?.length ?? 0;
  }

  return storedCount;
}

function laranjalRows(
  data: Awaited<ReturnType<typeof fetchLaranjalLevelData>>,
  backfill: boolean,
) {
  const metadata = {
    source: data.source.name,
    station: data.source.station,
    location: data.source.location,
  };

  if (!backfill) {
    return [
      waterLevelPoint({
        sourceKey: "labhidrosens-ufpel",
        stationKey: "labhidrosens-laranjal",
        observedAt: data.updatedAt,
        value: data.currentLevel,
        unit: "m",
        quality: data.status,
        metadata,
      }),
    ].filter((row): row is HistoricalMeasurementInsert => Boolean(row));
  }

  return data.series.map((point) => ({
    source_key: "labhidrosens-ufpel",
    station_key: "labhidrosens-laranjal",
    variable_key: "water_level",
    data_class: "observation" as const,
    observed_at: point.timestamp,
    value_numeric: point.level,
    value_text: null,
    unit: "m",
    quality_flag: data.status,
    source_record_id: `labhidrosens-laranjal:${point.timestamp}`,
    metadata,
  }));
}

function lagoonRows(
  data: Awaited<ReturnType<typeof fetchLagoonMonitoringNetwork>>,
  backfill: boolean,
) {
  return data.observations.flatMap((observation) => {
    const stationKey = `lagoon-${observation.station.id}`;
    const metadata = {
      sensorId: observation.station.sensorId,
      city: observation.station.city,
      source: data.source.name,
    };

    if (!backfill) {
      const row = waterLevelPoint({
        sourceKey: "lagoa-monitoramento",
        stationKey,
        observedAt: observation.updatedAt,
        value: observation.currentLevelCm,
        unit: "cm",
        quality: observation.status,
        metadata,
      });
      return row ? [row] : [];
    }

    return observation.series.map((point) => ({
      source_key: "lagoa-monitoramento",
      station_key: stationKey,
      variable_key: "water_level",
      data_class: "observation" as const,
      observed_at: point.timestamp,
      value_numeric: point.levelCm,
      value_text: null,
      unit: "cm",
      quality_flag: observation.status,
      source_record_id: `${stationKey}:${point.timestamp}`,
      metadata,
    }));
  });
}

function guaibaReferenceRow(
  reference: NonNullable<Awaited<ReturnType<typeof fetchGuaibaObservation>>["references"]>[number],
) {
  const sourceKey = reference.id === "cais-maua" ? "metsul-tidesat" : "nivel-guaiba";
  const stationKey = reference.id === "cais-maua" ? "guaiba-cais-maua" : "guaiba-gasometro";

  return waterLevelPoint({
    sourceKey,
    stationKey,
    observedAt: reference.updatedAt,
    value: reference.currentLevel,
    unit: "m",
    quality: reference.status,
    metadata: {
      source: reference.source.name,
      originalInstitutions: reference.source.originalInstitutions,
      station: reference.station,
    },
  });
}

function guaibaRows(
  data: Awaited<ReturnType<typeof fetchGuaibaObservation>>,
  backfill: boolean,
) {
  const rows = (data.references ?? [])
    .map(guaibaReferenceRow)
    .filter((row): row is HistoricalMeasurementInsert => Boolean(row));

  if (!backfill || data.series.length === 0) return rows;

  const isCaisMaua = data.station.toLowerCase().includes("cais mauá");
  const sourceKey = isCaisMaua ? "metsul-tidesat" : "nivel-guaiba";
  const stationKey = isCaisMaua ? "guaiba-cais-maua" : "guaiba-gasometro";

  rows.push(
    ...data.series.map((point) => ({
      source_key: sourceKey,
      station_key: stationKey,
      variable_key: "water_level",
      data_class: "observation" as const,
      observed_at: point.timestamp,
      value_numeric: point.level,
      value_text: null,
      unit: "m",
      quality_flag: data.status,
      source_record_id: `${stationKey}:${point.timestamp}`,
      metadata: {
        source: data.source.name,
        originalInstitutions: data.source.originalInstitutions,
        station: data.station,
      },
    })),
  );

  return rows;
}

async function recordRun(
  action: HistoricalArchiveCaptureResult["action"],
  startedAt: string,
  finishedAt: string,
  success: boolean,
  storedCount: number,
  details: Record<string, unknown>,
  error: string | null,
) {
  const { error: insertError } = await archiveClient().from("historical_collection_runs").insert({
    action,
    started_at: startedAt,
    finished_at: finishedAt,
    success,
    stored_count: storedCount,
    details,
    error,
  });

  if (insertError) {
    console.error("[history/archive] Falha ao registrar execução", { message: insertError.message });
  }
}

export async function captureEnvironmentalHistory(
  backfill = false,
): Promise<HistoricalArchiveCaptureResult> {
  const action = backfill ? "environmental-backfill" : "environmental-capture";
  const startedAt = new Date().toISOString();
  let storedCount = 0;

  try {
    const enabled = await enabledSources();
    const [laranjal, lagoon, guaiba] = await Promise.all([
      enabled.has("labhidrosens-ufpel") ? fetchLaranjalLevelData() : null,
      enabled.has("lagoa-monitoramento") ? fetchLagoonMonitoringNetwork() : null,
      enabled.has("metsul-tidesat") || enabled.has("nivel-guaiba")
        ? fetchGuaibaObservation()
        : null,
    ]);

    const sourceResults: SourceResult[] = [];
    const rows: HistoricalMeasurementInsert[] = [];

    if (laranjal) {
      const sourceRows = laranjalRows(laranjal, backfill);
      rows.push(...sourceRows);
      sourceResults.push({
        source: "labhidrosens-ufpel",
        status: laranjal.status,
        candidatePoints: sourceRows.length,
      });
    }

    if (lagoon) {
      const sourceRows = lagoonRows(lagoon, backfill);
      rows.push(...sourceRows);
      sourceResults.push({
        source: "lagoa-monitoramento",
        status: lagoon.status,
        candidatePoints: sourceRows.length,
      });
    }

    if (guaiba) {
      const sourceRows = guaibaRows(guaiba, backfill).filter((row) => enabled.has(row.source_key));
      rows.push(...sourceRows);
      sourceResults.push({
        source: "guaiba",
        status: guaiba.status,
        candidatePoints: sourceRows.length,
      });
    }

    storedCount = await insertMeasurements(rows);
    const finishedAt = new Date().toISOString();
    const result: HistoricalArchiveCaptureResult = {
      action,
      storedCount,
      candidateCount: rows.length,
      sources: sourceResults,
      startedAt,
      finishedAt,
    };

    await recordRun(action, startedAt, finishedAt, true, storedCount, result, null);
    return result;
  } catch (error) {
    const finishedAt = new Date().toISOString();
    const message = error instanceof Error ? error.message : String(error);
    await recordRun(action, startedAt, finishedAt, false, storedCount, {}, message);
    throw error;
  }
}
