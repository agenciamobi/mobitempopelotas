import { createSupabaseAdminClient, getSupabaseServerConfig } from "@/lib/supabase/server-client.server";

export type EmbrapaHealthLevel = "normal" | "degraded" | "critical" | "unavailable";
export type EmbrapaHealthAlertSeverity = "warning" | "critical";

export type EmbrapaHealthAlert = {
  code: string;
  severity: EmbrapaHealthAlertSeverity;
  title: string;
  message: string;
  firstDetectedAt: string;
  lastDetectedAt: string;
  occurrenceCount: number;
};

export type EmbrapaHealthSnapshot = {
  stationId: string;
  stationName: string;
  level: EmbrapaHealthLevel;
  collector: {
    enabled: boolean;
    lastAttemptAt: string | null;
    lastSuccessAt: string | null;
    attemptAgeMinutes: number | null;
    successAgeMinutes: number | null;
    consecutiveFailures: number;
    lastDurationMs: number | null;
    lastOutcome: "success" | "failure" | null;
    successfulCollects: number;
    failedCollects: number;
  };
  data: {
    status: "live" | "partial" | "unavailable";
    fetchedAt: string | null;
    observationTime: string | null;
    lastDataChangeAt: string | null;
    temperatureAvailable: boolean;
    humidityAvailable: boolean;
    pressureAvailable: boolean;
    windAvailable: boolean;
    rainAvailable: boolean;
  };
  history: {
    total: number;
    last24Hours: number;
    firstAt: string | null;
    latestAt: string | null;
  };
  alerts: {
    openCount: number;
    criticalCount: number;
    warningCount: number;
    items: EmbrapaHealthAlert[];
  };
  generatedAt: string;
};

type HealthRpcClient = {
  rpc: (name: "get_embrapa_health_snapshot") => PromiseLike<{
    data: unknown;
    error: { message: string } | null;
  }>;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function nullableText(value: unknown) {
  return typeof value === "string" && value ? value : null;
}

function finiteNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function nullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function booleanValue(value: unknown) {
  return value === true;
}

function healthLevel(value: unknown): EmbrapaHealthLevel {
  return value === "normal" || value === "degraded" || value === "critical"
    ? value
    : "unavailable";
}

function sourceStatus(value: unknown): EmbrapaHealthSnapshot["data"]["status"] {
  return value === "live" || value === "partial" ? value : "unavailable";
}

function lastOutcome(value: unknown): EmbrapaHealthSnapshot["collector"]["lastOutcome"] {
  return value === "success" || value === "failure" ? value : null;
}

function parseAlert(value: unknown): EmbrapaHealthAlert | null {
  if (!isRecord(value)) return null;
  const severity = value.severity === "critical" ? "critical" : "warning";
  const code = text(value.code);
  const title = text(value.title);
  const message = text(value.message);
  if (!code || !title || !message) return null;

  return {
    code,
    severity,
    title,
    message,
    firstDetectedAt: text(value.firstDetectedAt),
    lastDetectedAt: text(value.lastDetectedAt),
    occurrenceCount: finiteNumber(value.occurrenceCount, 1),
  };
}

function unavailableSnapshot(): EmbrapaHealthSnapshot {
  const generatedAt = new Date().toISOString();
  return {
    stationId: "embrapa-cpact-sede-pelotas",
    stationName: "Posto Meteorológico da Sede",
    level: "unavailable",
    collector: {
      enabled: false,
      lastAttemptAt: null,
      lastSuccessAt: null,
      attemptAgeMinutes: null,
      successAgeMinutes: null,
      consecutiveFailures: 0,
      lastDurationMs: null,
      lastOutcome: null,
      successfulCollects: 0,
      failedCollects: 0,
    },
    data: {
      status: "unavailable",
      fetchedAt: null,
      observationTime: null,
      lastDataChangeAt: null,
      temperatureAvailable: false,
      humidityAvailable: false,
      pressureAvailable: false,
      windAvailable: false,
      rainAvailable: false,
    },
    history: { total: 0, last24Hours: 0, firstAt: null, latestAt: null },
    alerts: { openCount: 0, criticalCount: 0, warningCount: 0, items: [] },
    generatedAt,
  };
}

function parseSnapshot(value: unknown): EmbrapaHealthSnapshot {
  if (!isRecord(value)) return unavailableSnapshot();

  const collector = isRecord(value.collector) ? value.collector : {};
  const data = isRecord(value.data) ? value.data : {};
  const history = isRecord(value.history) ? value.history : {};
  const alerts = isRecord(value.alerts) ? value.alerts : {};
  const alertItems = Array.isArray(alerts.items)
    ? alerts.items.flatMap((item) => {
        const parsed = parseAlert(item);
        return parsed ? [parsed] : [];
      })
    : [];

  return {
    stationId: text(value.stationId, "embrapa-cpact-sede-pelotas"),
    stationName: text(value.stationName, "Posto Meteorológico da Sede"),
    level: healthLevel(value.level),
    collector: {
      enabled: booleanValue(collector.enabled),
      lastAttemptAt: nullableText(collector.lastAttemptAt),
      lastSuccessAt: nullableText(collector.lastSuccessAt),
      attemptAgeMinutes: nullableNumber(collector.attemptAgeMinutes),
      successAgeMinutes: nullableNumber(collector.successAgeMinutes),
      consecutiveFailures: finiteNumber(collector.consecutiveFailures),
      lastDurationMs: nullableNumber(collector.lastDurationMs),
      lastOutcome: lastOutcome(collector.lastOutcome),
      successfulCollects: finiteNumber(collector.successfulCollects),
      failedCollects: finiteNumber(collector.failedCollects),
    },
    data: {
      status: sourceStatus(data.status),
      fetchedAt: nullableText(data.fetchedAt),
      observationTime: nullableText(data.observationTime),
      lastDataChangeAt: nullableText(data.lastDataChangeAt),
      temperatureAvailable: booleanValue(data.temperatureAvailable),
      humidityAvailable: booleanValue(data.humidityAvailable),
      pressureAvailable: booleanValue(data.pressureAvailable),
      windAvailable: booleanValue(data.windAvailable),
      rainAvailable: booleanValue(data.rainAvailable),
    },
    history: {
      total: finiteNumber(history.total),
      last24Hours: finiteNumber(history.last24Hours),
      firstAt: nullableText(history.firstAt),
      latestAt: nullableText(history.latestAt),
    },
    alerts: {
      openCount: finiteNumber(alerts.openCount),
      criticalCount: finiteNumber(alerts.criticalCount),
      warningCount: finiteNumber(alerts.warningCount),
      items: alertItems,
    },
    generatedAt: text(value.generatedAt, new Date().toISOString()),
  };
}

export async function getEmbrapaHealthSnapshotServer(): Promise<EmbrapaHealthSnapshot> {
  if (!getSupabaseServerConfig().isAdminConfigured) return unavailableSnapshot();

  try {
    const client = createSupabaseAdminClient() as unknown as HealthRpcClient;
    const { data, error } = await client.rpc("get_embrapa_health_snapshot");
    if (error) throw new Error(error.message);
    return parseSnapshot(data);
  } catch (error) {
    console.error("[embrapa/health] Falha ao consultar saúde operacional", {
      message: error instanceof Error ? error.message : String(error),
    });
    return unavailableSnapshot();
  }
}
