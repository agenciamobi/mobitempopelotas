const METSUL_GUAIBA_SERIES_URL = "https://metsul.com/wp-json/custom/v1/nivel-guaiba";
const METSUL_GUAIBA_PUBLIC_PAGE_URL = "https://metsul.com/nivel-do-guaiba/";
const TIDESAT_PUBLIC_URL = "https://www.tidesatglobal.com/";

const FALLBACK_GUAIBA_SERIES_URL = "https://nivelguaiba.com.br/portoalegre.json";
const FALLBACK_GUAIBA_PUBLIC_PAGE_URL = "https://nivelguaiba.com.br/";
const FALLBACK_GUAIBA_METHODOLOGY_URL = "https://nivelguaiba.com.br/metodologia";

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

type ObservationSource = {
  name: string;
  url: string;
  methodologyUrl: string;
  originalInstitutions: string;
  station: string;
  location: string;
};

type MetsulGuaibaRow = {
  year?: unknown;
  month?: unknown;
  day?: unknown;
  hour?: unknown;
  minute?: unknown;
  second?: unknown;
  level?: unknown;
};

const METSUL_SOURCE: ObservationSource = {
  name: "MetSul / TideSat Global",
  url: METSUL_GUAIBA_PUBLIC_PAGE_URL,
  methodologyUrl: TIDESAT_PUBLIC_URL,
  originalInstitutions: "TideSat Global",
  station: "Régua do Cais Mauá",
  location: "Porto Alegre / RS",
};

const FALLBACK_SOURCE: ObservationSource = {
  name: "Nível Guaíba",
  url: FALLBACK_GUAIBA_PUBLIC_PAGE_URL,
  methodologyUrl: FALLBACK_GUAIBA_METHODOLOGY_URL,
  originalInstitutions: "ANA / SGB",
  station: "Usina do Gasômetro",
  location: "Porto Alegre / RS",
};

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function unavailableObservation(
  error: string,
  fetchedAt = new Date(),
  source: ObservationSource = METSUL_SOURCE,
): GuaibaObservationData {
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
    station: source.station,
    location: source.location,
    series: [],
    source: {
      name: source.name,
      url: source.url,
      methodologyUrl: source.methodologyUrl,
      originalInstitutions: source.originalInstitutions,
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

function numberPart(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseMetsulTimestamp(row: MetsulGuaibaRow) {
  const year = numberPart(row.year);
  const month = numberPart(row.month);
  const day = numberPart(row.day);
  const hour = numberPart(row.hour);
  const minute = numberPart(row.minute);
  const second = numberPart(row.second) ?? 0;

  if (
    year === null ||
    month === null ||
    day === null ||
    hour === null ||
    minute === null ||
    year < 2000 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59
  ) {
    return null;
  }

  // O endpoint publica os componentes em UTC. A interface da MetSul converte a leitura para GMT-3.
  const timestamp = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
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

function buildObservation(
  points: ParsedPoint[],
  source: ObservationSource,
  fetchedAt: Date,
): GuaibaObservationData {
  if (points.length < 2) {
    return unavailableObservation(
      "A série pública não possui leituras válidas suficientes.",
      fetchedAt,
      source,
    );
  }

  const orderedPoints = [...points].sort((first, second) => first.epoch - second.epoch);
  const current = orderedPoints.at(-1)!;
  const latest24Hours = orderedPoints.filter(
    (point) => point.epoch >= current.epoch - 24 * 3_600_000,
  );
  const chartSeries = (latest24Hours.length >= 2 ? latest24Hours : orderedPoints.slice(-96)).map(
    ({ timestamp, level }) => ({ timestamp, level }),
  );
  const values = orderedPoints.map((point) => point.level);
  const baseline24h = findClosestPoint(orderedPoints, current.epoch - 24 * 3_600_000);
  const variation24hCm = baseline24h ? (current.level - baseline24h.level) * 100 : null;
  const trendCmPerHour = calculateRate(orderedPoints, current, 6);
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
    station: source.station,
    location: source.location,
    series: chartSeries,
    source: {
      name: source.name,
      url: source.url,
      methodologyUrl: source.methodologyUrl,
      originalInstitutions: source.originalInstitutions,
      fetchedAt: fetchedAt.toISOString(),
    },
    error: stale ? "A última leitura disponível está atrasada." : null,
  };
}

export function normalizeGuaibaSeries(
  payload: unknown,
  fetchedAt = new Date(),
): GuaibaObservationData {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return unavailableObservation(
      "A série pública retornou um formato inválido.",
      fetchedAt,
      FALLBACK_SOURCE,
    );
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
    .filter((point): point is ParsedPoint => Boolean(point));

  return buildObservation(points, FALLBACK_SOURCE, fetchedAt);
}

export function normalizeMetsulGuaibaSeries(
  payload: unknown,
  fetchedAt = new Date(),
): GuaibaObservationData {
  if (!Array.isArray(payload)) {
    return unavailableObservation(
      "A série do Cais Mauá retornou um formato inválido.",
      fetchedAt,
      METSUL_SOURCE,
    );
  }

  // A própria aplicação da MetSul desconsidera o último registro, que pode estar em consolidação.
  const stableRows = payload.length > 1 ? payload.slice(0, -1) : payload;
  const points = stableRows
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const row = item as MetsulGuaibaRow;
      const parsedDate = parseMetsulTimestamp(row);
      const level = numberPart(row.level);

      if (!parsedDate || level === null || level <= 0 || level > 20) return null;

      return {
        timestamp: parsedDate.toISOString(),
        level,
        epoch: parsedDate.getTime(),
      };
    })
    .filter((point): point is ParsedPoint => Boolean(point));

  return buildObservation(points, METSUL_SOURCE, fetchedAt);
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "MOBI-Tempo-Pelotas/2.0 (+https://tempopelotas.com.br)",
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) throw new Error(`A fonte respondeu HTTP ${response.status}.`);
  return response.json() as Promise<unknown>;
}

async function fetchMetsulObservation(fetchedAt: Date) {
  return normalizeMetsulGuaibaSeries(await fetchJson(METSUL_GUAIBA_SERIES_URL), fetchedAt);
}

async function fetchFallbackObservation(fetchedAt: Date) {
  return normalizeGuaibaSeries(await fetchJson(FALLBACK_GUAIBA_SERIES_URL), fetchedAt);
}

export async function fetchGuaibaObservation(): Promise<GuaibaObservationData> {
  const fetchedAt = new Date();
  const errors: string[] = [];
  let metsulObservation: GuaibaObservationData | null = null;

  try {
    metsulObservation = await fetchMetsulObservation(fetchedAt);
    if (metsulObservation.status === "live") return metsulObservation;
    if (metsulObservation.error) errors.push(`Cais Mauá: ${metsulObservation.error}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`Cais Mauá: ${message}`);
    console.error("[hydrology/guaiba] Falha ao consultar MetSul/TideSat", { message });
  }

  try {
    const fallbackObservation = await fetchFallbackObservation(fetchedAt);
    if (fallbackObservation.status === "live") return fallbackObservation;
    if (metsulObservation?.status === "stale") return metsulObservation;
    if (fallbackObservation.status === "stale") return fallbackObservation;
    if (fallbackObservation.error) errors.push(`Gasômetro: ${fallbackObservation.error}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`Gasômetro: ${message}`);
    console.error("[hydrology/guaiba] Falha ao consultar fonte de contingência", { message });
  }

  if (metsulObservation?.status === "stale") return metsulObservation;

  return unavailableObservation(
    errors.join(" ") || "O nível do Guaíba está temporariamente indisponível.",
    fetchedAt,
    METSUL_SOURCE,
  );
}

export const GUAIBA_CONFIG = {
  floodReferenceMeters: FLOOD_REFERENCE_METERS,
  methodologyUrl: TIDESAT_PUBLIC_URL,
  sourceUrl: METSUL_GUAIBA_PUBLIC_PAGE_URL,
  fallbackSourceUrl: FALLBACK_GUAIBA_PUBLIC_PAGE_URL,
  staleAfterMinutes: STALE_AFTER_MINUTES,
} as const;
