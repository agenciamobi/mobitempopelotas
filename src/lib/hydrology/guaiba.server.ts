const GUAIBA_SERIES_URL = "https://nivelguaiba.com.br/portoalegre.json";
const GUAIBA_PUBLIC_PAGE_URL = "https://nivelguaiba.com.br/";
const GUAIBA_METHODOLOGY_URL = "https://nivelguaiba.com.br/metodologia";
const FLOOD_REFERENCE_METERS = 3;
const REQUEST_TIMEOUT_MS = 8_000;
const STALE_AFTER_MINUTES = 120;

export type GuaibaObservationStatus = "live" | "stale" | "unavailable";

export type GuaibaSeriesPoint = {
  timestamp: string;
  level: number;
};

export type GuaibaObservationData = {
  status: GuaibaObservationStatus;
  currentLevel: number | null;
  updatedAt: string | null;
  ageMinutes: number | null;
  trendCmPerHour: number | null;
  variation24hCm: number | null;
  periodAverage: number | null;
  periodMinimum: number | null;
  periodMaximum: number | null;
  distanceToFloodReference: number | null;
  floodReference: number;
  station: string;
  location: string;
  series: GuaibaSeriesPoint[];
  source: {
    name: string;
    url: string;
    methodologyUrl: string;
    originalInstitutions: string;
    fetchedAt: string;
  };
  error: string | null;
};

type ParsedPoint = GuaibaSeriesPoint & {
  epoch: number;
};

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function unavailableObservation(error: string, fetchedAt = new Date()): GuaibaObservationData {
  return {
    status: "unavailable",
    currentLevel: null,
    updatedAt: null,
    ageMinutes: null,
    trendCmPerHour: null,
    variation24hCm: null,
    periodAverage: null,
    periodMinimum: null,
    periodMaximum: null,
    distanceToFloodReference: null,
    floodReference: FLOOD_REFERENCE_METERS,
    station: "Usina do Gasômetro",
    location: "Porto Alegre / RS",
    series: [],
    source: {
      name: "Nível Guaíba",
      url: GUAIBA_PUBLIC_PAGE_URL,
      methodologyUrl: GUAIBA_METHODOLOGY_URL,
      originalInstitutions: "ANA / SGB",
      fetchedAt: fetchedAt.toISOString(),
    },
    error,
  };
}

function parseBrasiliaTimestamp(value: string) {
  const normalized = value.trim().replace(" ", "T");
  const withSeconds = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(normalized)
    ? `${normalized}:00`
    : normalized;
  const timestamp = new Date(`${withSeconds}-03:00`);

  return Number.isNaN(timestamp.getTime()) ? null : timestamp;
}

function findClosestPoint(points: ParsedPoint[], targetEpoch: number) {
  return points.reduce<ParsedPoint | null>((closest, point) => {
    if (!closest) return point;

    return Math.abs(point.epoch - targetEpoch) < Math.abs(closest.epoch - targetEpoch)
      ? point
      : closest;
  }, null);
}

function calculateRate(points: ParsedPoint[], current: ParsedPoint, windowHours: number) {
  const targetEpoch = current.epoch - windowHours * 60 * 60 * 1_000;
  const baseline = findClosestPoint(points, targetEpoch);
  if (!baseline || baseline.epoch >= current.epoch) return null;

  const elapsedHours = (current.epoch - baseline.epoch) / 3_600_000;
  if (elapsedHours < Math.min(1, windowHours / 2)) return null;

  return ((current.level - baseline.level) * 100) / elapsedHours;
}

export function normalizeGuaibaSeries(
  payload: unknown,
  fetchedAt = new Date(),
): GuaibaObservationData {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return unavailableObservation("A série pública retornou um formato inválido.", fetchedAt);
  }

  const points = Object.entries(payload)
    .map(([timestamp, rawLevel]) => {
      const parsedDate = parseBrasiliaTimestamp(timestamp);
      const level = typeof rawLevel === "number" ? rawLevel : Number(rawLevel);

      if (!parsedDate || !Number.isFinite(level) || level <= 0 || level > 20) return null;

      return {
        timestamp: parsedDate.toISOString(),
        level,
        epoch: parsedDate.getTime(),
      };
    })
    .filter((point): point is ParsedPoint => Boolean(point))
    .sort((first, second) => first.epoch - second.epoch);

  if (points.length < 2) {
    return unavailableObservation(
      "A série pública não possui leituras válidas suficientes.",
      fetchedAt,
    );
  }

  const current = points.at(-1)!;
  const latest24Hours = points.filter((point) => point.epoch >= current.epoch - 24 * 3_600_000);
  const chartSeries = (latest24Hours.length >= 2 ? latest24Hours : points.slice(-96)).map(
    ({ timestamp, level }) => ({ timestamp, level }),
  );
  const values = points.map((point) => point.level);
  const baseline24h = findClosestPoint(points, current.epoch - 24 * 3_600_000);
  const variation24hCm = baseline24h ? (current.level - baseline24h.level) * 100 : null;
  const trendCmPerHour = calculateRate(points, current, 6);
  const ageMinutes = Math.max(0, (fetchedAt.getTime() - current.epoch) / 60_000);
  const stale = ageMinutes > STALE_AFTER_MINUTES;

  return {
    status: stale ? "stale" : "live",
    currentLevel: round(current.level),
    updatedAt: current.timestamp,
    ageMinutes: Math.round(ageMinutes),
    trendCmPerHour: trendCmPerHour === null ? null : round(trendCmPerHour, 1),
    variation24hCm: variation24hCm === null ? null : round(variation24hCm, 1),
    periodAverage: round(values.reduce((sum, value) => sum + value, 0) / values.length),
    periodMinimum: round(Math.min(...values)),
    periodMaximum: round(Math.max(...values)),
    distanceToFloodReference: round(FLOOD_REFERENCE_METERS - current.level),
    floodReference: FLOOD_REFERENCE_METERS,
    station: "Usina do Gasômetro",
    location: "Porto Alegre / RS",
    series: chartSeries,
    source: {
      name: "Nível Guaíba",
      url: GUAIBA_PUBLIC_PAGE_URL,
      methodologyUrl: GUAIBA_METHODOLOGY_URL,
      originalInstitutions: "ANA / SGB",
      fetchedAt: fetchedAt.toISOString(),
    },
    error: stale ? "A última leitura disponível está atrasada." : null,
  };
}

export async function fetchGuaibaObservation(): Promise<GuaibaObservationData> {
  const fetchedAt = new Date();

  try {
    const response = await fetch(GUAIBA_SERIES_URL, {
      headers: {
        Accept: "application/json",
        "User-Agent": "MOBI-Tempo-Pelotas/2.0 (+https://tempopelotas.com.br)",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`A fonte respondeu HTTP ${response.status}.`);
    }

    return normalizeGuaibaSeries(await response.json(), fetchedAt);
  } catch (error) {
    console.error("[hydrology/guaiba] Falha ao consultar a fonte", {
      message: error instanceof Error ? error.message : String(error),
    });
    return unavailableObservation(
      "O nível do Guaíba está temporariamente indisponível.",
      fetchedAt,
    );
  }
}

export const GUAIBA_CONFIG = {
  floodReferenceMeters: FLOOD_REFERENCE_METERS,
  methodologyUrl: GUAIBA_METHODOLOGY_URL,
  sourceUrl: GUAIBA_PUBLIC_PAGE_URL,
  staleAfterMinutes: STALE_AFTER_MINUTES,
} as const;
