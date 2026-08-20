const METSUL_GUAIBA_SERIES_URL = "https://metsul.com/wp-json/custom/v1/nivel-guaiba";
const METSUL_GUAIBA_PUBLIC_PAGE_URL = "https://metsul.com/nivel-do-guaiba/";
const TIDESAT_PUBLIC_URL = "https://www.tidesatglobal.com/";

const FALLBACK_GUAIBA_SERIES_URL = "https://nivelguaiba.com.br/portoalegre.json";
const FALLBACK_GUAIBA_PUBLIC_PAGE_URL = "https://nivelguaiba.com.br/";
const FALLBACK_GUAIBA_METHODOLOGY_URL = "https://nivelguaiba.com.br/metodologia";

const CAIS_MAUA_FLOOD_REFERENCE_METERS = 3;
const GASOMETRO_FLOOD_REFERENCE_METERS = 2.6;
const REQUEST_TIMEOUT_MS = 8_000;
const STALE_AFTER_MINUTES = 120;

export type GuaibaObservationStatus = "live" | "stale" | "unavailable";

export type GuaibaSeriesPoint = {
  timestamp: string;
  level: number;
};

export type GuaibaReferenceObservation = {
  id: "gasometro" | "cais-maua";
  label: string;
  status: GuaibaObservationStatus;
  currentLevel: number | null;
  updatedAt: string | null;
  ageMinutes: number | null;
  trendCmPerHour: number | null;
  variation24hCm: number | null;
  floodReference: number;
  station: string;
  location: string;
  source: {
    name: string;
    url: string;
    originalInstitutions: string;
  };
  error: string | null;
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
  references?: GuaibaReferenceObservation[];
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
  floodReference: number;
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
  floodReference: CAIS_MAUA_FLOOD_REFERENCE_METERS,
};

const FALLBACK_SOURCE: ObservationSource = {
  name: "Nível Guaíba",
  url: FALLBACK_GUAIBA_PUBLIC_PAGE_URL,
  methodologyUrl: FALLBACK_GUAIBA_METHODOLOGY_URL,
  originalInstitutions: "ANA / SGB",
  station: "Usina do Gasômetro",
  location: "Porto Alegre / RS",
  floodReference: GASOMETRO_FLOOD_REFERENCE_METERS,
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
    floodReference: source.floodReference,
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
    distanceToFloodReference: round(source.floodReference - current.level),
    floodReference: source.floodReference,
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

function toReference(
  id: GuaibaReferenceObservation["id"],
  label: string,
  observation: GuaibaObservationData,
): GuaibaReferenceObservation {
  return {
    id,
    label,
    status: observation.status,
    currentLevel: observation.currentLevel,
    updatedAt: observation.updatedAt,
    ageMinutes: observation.ageMinutes,
    trendCmPerHour: observation.trendCmPerHour,
    variation24hCm: observation.variation24hCm,
    floodReference: observation.floodReference,
    station: observation.station,
    location: observation.location,
    source: {
      name: observation.source.name,
      url: observation.source.url,
      originalInstitutions: observation.source.originalInstitutions,
    },
    error: observation.error,
  };
}

function withReferences(
  selected: GuaibaObservationData,
  gasometro: GuaibaObservationData,
  caisMaua: GuaibaObservationData,
) {
  return {
    ...selected,
    references: [
      toReference("gasometro", "Nível do Guaíba", gasometro),
      toReference("cais-maua", "Cais Mauá", caisMaua),
    ],
  } satisfies GuaibaObservationData;
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
  const [metsulResult, fallbackResult] = await Promise.allSettled([
    fetchMetsulObservation(fetchedAt),
    fetchFallbackObservation(fetchedAt),
  ]);

  const metsulObservation =
    metsulResult.status === "fulfilled"
      ? metsulResult.value
      : unavailableObservation(
          `A leitura do Cais Mauá não respondeu: ${metsulResult.reason instanceof Error ? metsulResult.reason.message : String(metsulResult.reason)}`,
          fetchedAt,
          METSUL_SOURCE,
        );
  const fallbackObservation =
    fallbackResult.status === "fulfilled"
      ? fallbackResult.value
      : unavailableObservation(
          `A leitura da Usina do Gasômetro não respondeu: ${fallbackResult.reason instanceof Error ? fallbackResult.reason.message : String(fallbackResult.reason)}`,
          fetchedAt,
          FALLBACK_SOURCE,
        );

  if (metsulResult.status === "rejected") {
    console.error("[hydrology/guaiba] Falha ao consultar MetSul/TideSat", {
      message:
        metsulResult.reason instanceof Error
          ? metsulResult.reason.message
          : String(metsulResult.reason),
    });
  }
  if (fallbackResult.status === "rejected") {
    console.error("[hydrology/guaiba] Falha ao consultar Nível Guaíba", {
      message:
        fallbackResult.reason instanceof Error
          ? fallbackResult.reason.message
          : String(fallbackResult.reason),
    });
  }

  const selected =
    metsulObservation.status === "live"
      ? metsulObservation
      : fallbackObservation.status === "live"
        ? fallbackObservation
        : metsulObservation.status === "stale"
          ? metsulObservation
          : fallbackObservation.status === "stale"
            ? fallbackObservation
            : unavailableObservation(
                "As réguas do Guaíba em Porto Alegre estão temporariamente indisponíveis.",
                fetchedAt,
                METSUL_SOURCE,
              );

  return withReferences(selected, fallbackObservation, metsulObservation);
}

export const GUAIBA_CONFIG = {
  floodReferenceMeters: CAIS_MAUA_FLOOD_REFERENCE_METERS,
  gasometroFloodReferenceMeters: GASOMETRO_FLOOD_REFERENCE_METERS,
  methodologyUrl: TIDESAT_PUBLIC_URL,
  sourceUrl: METSUL_GUAIBA_PUBLIC_PAGE_URL,
  fallbackSourceUrl: FALLBACK_GUAIBA_PUBLIC_PAGE_URL,
  staleAfterMinutes: STALE_AFTER_MINUTES,
} as const;
