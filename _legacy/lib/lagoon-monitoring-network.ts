import "server-only";

export const LAGOON_MONITORING_SOURCE_URL =
  "https://monitoramentolagoadospatos.com.br/";
export const LAGOON_MONITORING_API_URL =
  "https://api-medidas-porto-7bni.onrender.com";

const REVALIDATE_SECONDS = 300;
const REQUEST_TIMEOUT_MS = 12_000;
const STALE_AFTER_MINUTES = 120;
const MAX_SERIES_POINTS = 280;

export type LagoonMonitoringStationDefinition = {
  id: string;
  sensorId: `sensor_${number}`;
  name: string;
  city: string;
  role: string;
  floodLevelCm: number;
  may2024MaximumCm: number;
};

export type LagoonMonitoringObservationStatus =
  | "live"
  | "stale"
  | "unavailable";

export type LagoonMonitoringRisk =
  | "normal"
  | "attention"
  | "flooding"
  | "unavailable";

export type LagoonMonitoringPoint = {
  timestamp: string;
  levelCm: number;
};

export type LagoonMonitoringObservation = {
  station: LagoonMonitoringStationDefinition;
  status: LagoonMonitoringObservationStatus;
  risk: LagoonMonitoringRisk;
  currentLevelCm: number | null;
  updatedAt: string | null;
  trendCmPerHour: number | null;
  change1hCm: number | null;
  change6hCm: number | null;
  change24hCm: number | null;
  periodMinimumCm: number | null;
  periodMaximumCm: number | null;
  series: LagoonMonitoringPoint[];
  floodLevelCm: number;
  may2024MaximumCm: number;
  distanceToFloodCm: number | null;
  floodThresholdPercentage: number | null;
  error: string | null;
};

export type LagoonMonitoringNetworkData = {
  status: "live" | "partial" | "stale" | "unavailable";
  available: number;
  total: number;
  latestUpdatedAt: string | null;
  observations: LagoonMonitoringObservation[];
  source: {
    name: string;
    organizations: string;
    url: string;
    apiUrl: string;
    reference: string;
    fetchedAt: string;
  };
  error: string | null;
};

type ApiLatestPayload = {
  dado?: {
    data_hora?: unknown;
    valor?: unknown;
    sensor_id?: unknown;
    criado_em?: unknown;
  };
};

type ApiGraphPoint = {
  data?: unknown;
  valor?: unknown;
};

type ParsedPoint = LagoonMonitoringPoint & {
  epoch: number;
};

export const LAGOON_MONITORING_STATIONS: LagoonMonitoringStationDefinition[] = [
  {
    id: "furg-ccmar",
    sensorId: "sensor_1",
    name: "FURG CCMAR",
    city: "Rio Grande / RS",
    role: "Acompanha o estuário e a saída da Lagoa dos Patos para o oceano.",
    floodLevelCm: 80,
    may2024MaximumCm: 218,
  },
  {
    id: "sao-lourenco-do-sul",
    sensorId: "sensor_2",
    name: "São Lourenço do Sul",
    city: "São Lourenço do Sul / RS",
    role: "Ajuda a observar a margem oeste da lagoa entre Arambaré e Pelotas.",
    floodLevelCm: 148,
    may2024MaximumCm: 284,
  },
  {
    id: "arambare",
    sensorId: "sensor_3",
    name: "Arambaré",
    city: "Arambaré / RS",
    role: "Mostra a propagação dos níveis pela região centro-oeste da lagoa.",
    floodLevelCm: 225,
    may2024MaximumCm: 286,
  },
  {
    id: "sao-jose-do-norte",
    sensorId: "sensor_4",
    name: "São José do Norte",
    city: "São José do Norte / RS",
    role: "Complementa a leitura do estuário no lado oposto a Rio Grande.",
    floodLevelCm: 108,
    may2024MaximumCm: 226,
  },
  {
    id: "itapua",
    sensorId: "sensor_5",
    name: "Itapuã",
    city: "Viamão / RS",
    role: "Acompanha a porção norte da lagoa, próxima à comunicação com o Guaíba.",
    floodLevelCm: 280,
    may2024MaximumCm: 318,
  },
];

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function parseLevel(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed > -500 && parsed < 5_000
    ? parsed
    : null;
}

/**
 * A API publica a hora local em uma string terminada em Z. O próprio frontend
 * da fonte remove o Z antes de exibir. Mantemos o mesmo significado,
 * interpretando esses campos como horário de Brasília.
 */
function parseSourceTimestamp(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;

  const trimmed = value.trim();
  const localWallClock = trimmed.match(
    /^(20\d{2}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?)Z$/,
  );
  const parsed = new Date(
    localWallClock ? `${localWallClock[1]}-03:00` : trimmed,
  );

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseLatestPayload(payload: unknown, expectedSensorId: string) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const data = (payload as ApiLatestPayload).dado;
  if (!data || typeof data !== "object") return null;
  if (
    typeof data.sensor_id === "string" &&
    data.sensor_id !== expectedSensorId
  ) {
    return null;
  }

  const date = parseSourceTimestamp(data.data_hora);
  const level = parseLevel(data.valor);
  if (!date || level === null) return null;

  return {
    timestamp: date.toISOString(),
    levelCm: round(level),
    epoch: date.getTime(),
  } satisfies ParsedPoint;
}

function parseGraphPayload(payload: unknown) {
  if (!Array.isArray(payload)) return [];

  const points = new Map<number, ParsedPoint>();

  for (const rawPoint of payload) {
    if (!rawPoint || typeof rawPoint !== "object" || Array.isArray(rawPoint)) {
      continue;
    }

    const point = rawPoint as ApiGraphPoint;
    const date = parseSourceTimestamp(point.data);
    const level = parseLevel(point.valor);
    if (!date || level === null) continue;

    points.set(date.getTime(), {
      timestamp: date.toISOString(),
      levelCm: round(level),
      epoch: date.getTime(),
    });
  }

  return [...points.values()]
    .sort((first, second) => first.epoch - second.epoch)
    .slice(-MAX_SERIES_POINTS);
}

function findClosestPoint(points: ParsedPoint[], targetEpoch: number) {
  return points.reduce<ParsedPoint | null>((closest, point) => {
    if (!closest) return point;

    return Math.abs(point.epoch - targetEpoch) <
      Math.abs(closest.epoch - targetEpoch)
      ? point
      : closest;
  }, null);
}

function calculateChange(
  points: ParsedPoint[],
  current: ParsedPoint,
  hours: number,
) {
  const targetEpoch = current.epoch - hours * 60 * 60 * 1_000;
  const baseline = findClosestPoint(points, targetEpoch);
  if (!baseline || baseline.epoch >= current.epoch) return null;

  const elapsedHours = (current.epoch - baseline.epoch) / 3_600_000;
  const minimumUsefulWindow = hours === 1 ? 0.4 : hours * 0.45;
  if (elapsedHours < minimumUsefulWindow) return null;

  return {
    centimeters: current.levelCm - baseline.levelCm,
    elapsedHours,
  };
}

function stationUnavailable(
  station: LagoonMonitoringStationDefinition,
  error: string,
): LagoonMonitoringObservation {
  return {
    station,
    status: "unavailable",
    risk: "unavailable",
    currentLevelCm: null,
    updatedAt: null,
    trendCmPerHour: null,
    change1hCm: null,
    change6hCm: null,
    change24hCm: null,
    periodMinimumCm: null,
    periodMaximumCm: null,
    series: [],
    floodLevelCm: station.floodLevelCm,
    may2024MaximumCm: station.may2024MaximumCm,
    distanceToFloodCm: null,
    floodThresholdPercentage: null,
    error,
  };
}

async function fetchApiJson(path: string) {
  const response = await fetch(`${LAGOON_MONITORING_API_URL}${path}`, {
    headers: {
      Accept: "application/json",
      "User-Agent":
        "TEMPO-Pelotas/1.0 (+https://tempopelotas.agenciamobi.com.br)",
    },
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`${path} respondeu com status ${response.status}`);
  }

  return response.json() as Promise<unknown>;
}

async function getStationObservation(
  station: LagoonMonitoringStationDefinition,
  fetchedAt: Date,
): Promise<LagoonMonitoringObservation> {
  const [latestResult, graphResult] = await Promise.allSettled([
    fetchApiJson(`/dados/${station.sensorId}`),
    fetchApiJson(`/dados/${station.sensorId}/grafico`),
  ]);

  const latest =
    latestResult.status === "fulfilled"
      ? parseLatestPayload(latestResult.value, station.sensorId)
      : null;
  const graph =
    graphResult.status === "fulfilled"
      ? parseGraphPayload(graphResult.value)
      : [];

  const pointMap = new Map<number, ParsedPoint>();
  for (const point of graph) pointMap.set(point.epoch, point);
  if (latest) pointMap.set(latest.epoch, latest);

  const points = [...pointMap.values()].sort(
    (first, second) => first.epoch - second.epoch,
  );
  const current = latest ?? points.at(-1) ?? null;

  if (!current) {
    const detail = [
      latestResult.status === "rejected" ? "leitura atual" : null,
      graphResult.status === "rejected" ? "série histórica" : null,
    ]
      .filter(Boolean)
      .join(" e ");

    return stationUnavailable(
      station,
      detail
        ? `A ${detail} de ${station.name} está temporariamente indisponível.`
        : `A fonte não devolveu uma leitura válida para ${station.name}.`,
    );
  }

  const currentIndex = points.findIndex((point) => point.epoch === current.epoch);
  const calculationPoints =
    currentIndex >= 0 ? points.slice(0, currentIndex + 1) : [...points, current];
  const change1h = calculateChange(calculationPoints, current, 1);
  const change6h = calculateChange(calculationPoints, current, 6);
  const change24h = calculateChange(calculationPoints, current, 24);
  const trendSource = change6h ?? change1h;
  const ageMinutes = Math.max(
    0,
    (fetchedAt.getTime() - current.epoch) / 60_000,
  );
  const status: LagoonMonitoringObservationStatus =
    ageMinutes > STALE_AFTER_MINUTES ? "stale" : "live";
  const distanceToFloodCm = round(station.floodLevelCm - current.levelCm);
  const floodThresholdPercentage = round(
    (current.levelCm / station.floodLevelCm) * 100,
  );
  const risk: LagoonMonitoringRisk =
    current.levelCm >= station.floodLevelCm
      ? "flooding"
      : current.levelCm >= station.floodLevelCm * 0.85
        ? "attention"
        : "normal";
  const values = calculationPoints.map((point) => point.levelCm);
  const series = calculationPoints.map(({ timestamp, levelCm }) => ({
    timestamp,
    levelCm,
  }));

  return {
    station,
    status,
    risk,
    currentLevelCm: current.levelCm,
    updatedAt: current.timestamp,
    trendCmPerHour: trendSource
      ? round(trendSource.centimeters / trendSource.elapsedHours)
      : null,
    change1hCm: change1h ? round(change1h.centimeters) : null,
    change6hCm: change6h ? round(change6h.centimeters) : null,
    change24hCm: change24h ? round(change24h.centimeters) : null,
    periodMinimumCm: values.length ? round(Math.min(...values)) : null,
    periodMaximumCm: values.length ? round(Math.max(...values)) : null,
    series,
    floodLevelCm: station.floodLevelCm,
    may2024MaximumCm: station.may2024MaximumCm,
    distanceToFloodCm,
    floodThresholdPercentage,
    error:
      status === "stale"
        ? "A última leitura publicada está atrasada."
        : graphResult.status === "rejected"
          ? "A leitura atual está disponível, mas a série histórica não pôde ser carregada."
          : null,
  };
}

function buildNetwork(
  observations: LagoonMonitoringObservation[],
  fetchedAt: Date,
): LagoonMonitoringNetworkData {
  const availableObservations = observations.filter(
    (observation) => observation.currentLevelCm !== null,
  );
  const live = availableObservations.filter(
    (observation) => observation.status === "live",
  ).length;
  const latestUpdatedAt =
    availableObservations
      .map((observation) => observation.updatedAt)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null;

  let status: LagoonMonitoringNetworkData["status"] = "unavailable";
  if (live === observations.length) status = "live";
  else if (live > 0) status = "partial";
  else if (availableObservations.length > 0) status = "stale";

  return {
    status,
    available: availableObservations.length,
    total: observations.length,
    latestUpdatedAt,
    observations,
    source: {
      name: "Rede de Monitoramento do Nível da Lagoa dos Patos",
      organizations: "FURG & Portos RS",
      url: LAGOON_MONITORING_SOURCE_URL,
      apiUrl: LAGOON_MONITORING_API_URL,
      reference: "Referencial vertical brasileiro — Marégrafo de Imbituba/SC",
      fetchedAt: fetchedAt.toISOString(),
    },
    error:
      availableObservations.length === 0
        ? "A Rede de Monitoramento da Lagoa dos Patos está temporariamente indisponível."
        : null,
  };
}

export async function getLagoonMonitoringNetwork(): Promise<LagoonMonitoringNetworkData> {
  const fetchedAt = new Date();
  const observations = await Promise.all(
    LAGOON_MONITORING_STATIONS.map((station) =>
      getStationObservation(station, fetchedAt).catch((error) => {
        console.error(
          `Falha ao consultar a estação ${station.sensorId} (${station.name}):`,
          error,
        );
        return stationUnavailable(
          station,
          `A leitura de ${station.name} está temporariamente indisponível.`,
        );
      }),
    ),
  );

  return buildNetwork(observations, fetchedAt);
}

export const LAGOON_MONITORING_CONFIG = {
  apiUrl: LAGOON_MONITORING_API_URL,
  revalidateSeconds: REVALIDATE_SECONDS,
  staleAfterMinutes: STALE_AFTER_MINUTES,
  sourceUrl: LAGOON_MONITORING_SOURCE_URL,
} as const;
