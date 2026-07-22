import "server-only";
import { LAGOON_LEVEL_SOURCE } from "@/lib/lagoon-level";

const THINGSBOARD_URL = "https://tb.labhidrosens.com";
const PUBLIC_CUSTOMER_ID = "0a869e80-d9e8-11f0-ac7c-456d9a25fe9a";
const DEVICE_ID = "a3e1d520-b438-11f0-ac7c-456d9a25fe9a";
const TELEMETRY_KEY = "payload";
const SENSOR_REFERENCE_HEIGHT_METERS = 5.06;
const HISTORY_WINDOW_MS = 24 * 60 * 60 * 1000;
const STALE_AFTER_MINUTES = 30;
const MAX_SERIES_POINTS = 360;

export type LaranjalLevelStatus = "live" | "stale" | "unavailable";

export type LaranjalLevelPoint = {
  timestamp: string;
  level: number;
};

export type LaranjalLevelData = {
  status: LaranjalLevelStatus;
  currentLevel: number | null;
  updatedAt: string | null;
  trendCmPerHour: number | null;
  change1hCm: number | null;
  change6hCm: number | null;
  change24hCm: number | null;
  periodAverage: number | null;
  periodMinimum: number | null;
  periodMaximum: number | null;
  series: LaranjalLevelPoint[];
  source: {
    name: string;
    station: string;
    location: string;
    url: string;
    fetchedAt: string;
  };
  error: string | null;
};

type ParsedPoint = LaranjalLevelPoint & {
  epoch: number;
};

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function unavailableData(error: string): LaranjalLevelData {
  return {
    status: "unavailable",
    currentLevel: null,
    updatedAt: null,
    trendCmPerHour: null,
    change1hCm: null,
    change6hCm: null,
    change24hCm: null,
    periodAverage: null,
    periodMinimum: null,
    periodMaximum: null,
    series: [],
    source: {
      name: LAGOON_LEVEL_SOURCE.name,
      station: LAGOON_LEVEL_SOURCE.station,
      location: LAGOON_LEVEL_SOURCE.location,
      url: LAGOON_LEVEL_SOURCE.dashboardUrl,
      fetchedAt: new Date().toISOString(),
    },
    error,
  };
}

function parseDistance(value: unknown) {
  let serialized: string;

  try {
    serialized = typeof value === "string" ? value : JSON.stringify(value);
  } catch {
    return null;
  }

  const match = serialized.match(/Distance[^\d-]*(-?\d+(?:[.,]\d+)?)/i);
  if (!match?.[1]) return null;

  const distance = Number(match[1].replace(",", "."));
  if (
    !Number.isFinite(distance) ||
    distance < 0 ||
    distance > SENSOR_REFERENCE_HEIGHT_METERS + 1
  ) {
    return null;
  }

  return distance;
}

function calculateLevel(value: unknown) {
  const distance = parseDistance(value);
  if (distance === null) return null;

  return round(Math.max(0, SENSOR_REFERENCE_HEIGHT_METERS - distance));
}

function findClosestPoint(points: ParsedPoint[], targetEpoch: number) {
  return points.reduce<ParsedPoint | null>((closest, point) => {
    if (!closest) return point;

    return Math.abs(point.epoch - targetEpoch) < Math.abs(closest.epoch - targetEpoch)
      ? point
      : closest;
  }, null);
}

function calculateChange(points: ParsedPoint[], current: ParsedPoint, hours: number) {
  const targetEpoch = current.epoch - hours * 60 * 60 * 1000;
  const baseline = findClosestPoint(points, targetEpoch);

  if (!baseline || baseline.epoch >= current.epoch) return null;

  const elapsedHours = (current.epoch - baseline.epoch) / 3_600_000;
  const minimumUsefulWindow = hours === 1 ? 0.4 : hours * 0.45;
  if (elapsedHours < minimumUsefulWindow) return null;

  return {
    centimeters: (current.level - baseline.level) * 100,
    elapsedHours,
  };
}

function reduceSeries(points: ParsedPoint[]) {
  if (points.length <= MAX_SERIES_POINTS) {
    return points.map(({ timestamp, level }) => ({ timestamp, level }));
  }

  const step = Math.ceil(points.length / MAX_SERIES_POINTS);
  const reduced = points
    .filter((_, index) => index % step === 0)
    .map(({ timestamp, level }) => ({ timestamp, level }));
  const last = points.at(-1)!;

  if (reduced.at(-1)?.timestamp !== last.timestamp) {
    reduced.push({ timestamp: last.timestamp, level: last.level });
  }

  return reduced;
}

export function normalizeLaranjalTelemetry(
  payload: unknown,
  fetchedAt = new Date(),
): LaranjalLevelData {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return unavailableData("A medição do Laranjal retornou um formato inesperado.");
  }

  const telemetry = payload as Record<string, unknown>;
  const rawPoints = telemetry[TELEMETRY_KEY];

  if (!Array.isArray(rawPoints)) {
    return unavailableData("Nenhuma leitura do nível foi encontrada.");
  }

  const validPoints = new Map<number, ParsedPoint>();

  for (const rawPoint of rawPoints) {
    if (!rawPoint || typeof rawPoint !== "object" || Array.isArray(rawPoint)) continue;

    const point = rawPoint as Record<string, unknown>;
    const epoch = Number(point.ts);
    const level = calculateLevel(point.value);

    if (!Number.isFinite(epoch) || epoch <= 0 || level === null) continue;

    validPoints.set(epoch, {
      epoch,
      timestamp: new Date(epoch).toISOString(),
      level,
    });
  }

  const points = [...validPoints.values()].sort((a, b) => a.epoch - b.epoch);

  if (points.length < 1) {
    return unavailableData("A estação não enviou uma leitura válida neste período.");
  }

  const current = points.at(-1)!;
  const change1h = calculateChange(points, current, 1);
  const change6h = calculateChange(points, current, 6);
  const change24h = calculateChange(points, current, 24);
  const trendSource = change6h ?? change1h;
  const values = points.map((point) => point.level);
  const ageMinutes = Math.max(0, (fetchedAt.getTime() - current.epoch) / 60_000);

  return {
    status: ageMinutes > STALE_AFTER_MINUTES ? "stale" : "live",
    currentLevel: current.level,
    updatedAt: current.timestamp,
    trendCmPerHour: trendSource
      ? round(trendSource.centimeters / trendSource.elapsedHours, 1)
      : null,
    change1hCm: change1h ? round(change1h.centimeters, 1) : null,
    change6hCm: change6h ? round(change6h.centimeters, 1) : null,
    change24hCm: change24h ? round(change24h.centimeters, 1) : null,
    periodAverage: round(
      values.reduce((sum, value) => sum + value, 0) / values.length,
    ),
    periodMinimum: round(Math.min(...values)),
    periodMaximum: round(Math.max(...values)),
    series: reduceSeries(points),
    source: {
      name: LAGOON_LEVEL_SOURCE.name,
      station: LAGOON_LEVEL_SOURCE.station,
      location: LAGOON_LEVEL_SOURCE.location,
      url: LAGOON_LEVEL_SOURCE.dashboardUrl,
      fetchedAt: fetchedAt.toISOString(),
    },
    error:
      ageMinutes > STALE_AFTER_MINUTES
        ? "A última leitura disponível está atrasada."
        : null,
  };
}

async function getPublicAccessToken() {
  const response = await fetch(`${THINGSBOARD_URL}/api/auth/login/public`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ publicId: PUBLIC_CUSTOMER_ID }),
    next: {
      revalidate: 300,
      tags: ["laranjal-public-token"],
    },
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) {
    throw new Error(`Autenticação pública respondeu com status ${response.status}`);
  }

  const body = (await response.json()) as unknown;
  const token =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>).token
      : null;

  if (typeof token !== "string" || token.length < 20) {
    throw new Error("A fonte não devolveu uma autorização pública válida.");
  }

  return token;
}

export async function getLaranjalLevelData(): Promise<LaranjalLevelData> {
  try {
    const token = await getPublicAccessToken();
    const endTs = Date.now();
    const startTs = endTs - HISTORY_WINDOW_MS;
    const params = new URLSearchParams({
      keys: TELEMETRY_KEY,
      startTs: String(startTs),
      endTs: String(endTs),
      limit: "50000",
      agg: "NONE",
      orderBy: "ASC",
    });
    const response = await fetch(
      `${THINGSBOARD_URL}/api/plugins/telemetry/DEVICE/${DEVICE_ID}/values/timeseries?${params}`,
      {
        headers: {
          Accept: "application/json",
          "X-Authorization": `Bearer ${token}`,
        },
        next: {
          revalidate: 30,
          tags: ["laranjal-level"],
        },
        signal: AbortSignal.timeout(12_000),
      },
    );

    if (!response.ok) {
      throw new Error(`Leituras do Laranjal responderam com status ${response.status}`);
    }

    return normalizeLaranjalTelemetry(await response.json());
  } catch (error) {
    console.error("Falha ao consultar o nível da Estação Laranjal:", error);
    return unavailableData("O nível da Lagoa está temporariamente indisponível.");
  }
}

export const LARANJAL_LEVEL_CONFIG = {
  deviceId: DEVICE_ID,
  publicCustomerId: PUBLIC_CUSTOMER_ID,
  sensorReferenceHeightMeters: SENSOR_REFERENCE_HEIGHT_METERS,
  sourceUrl: LAGOON_LEVEL_SOURCE.dashboardUrl,
  mode: "telemetry",
} as const;
