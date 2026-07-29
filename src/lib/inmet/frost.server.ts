import { z } from "zod";

import type {
  FrostIntensity,
  FrostMapData,
  FrostObservation,
  FrostStation,
  FrostStationType,
} from "./frost.types";

const INMET_FROST_ENDPOINT = "https://apitempo.inmet.gov.br/geada";
const INMET_FROST_PORTAL = "https://portal.inmet.gov.br/paginas/geadas";
const REQUEST_TIMEOUT_MS = 12_000;
const CACHE_TTL_MS = 30 * 60 * 1_000;
const STALE_TTL_MS = 6 * 60 * 60 * 1_000;
const DEFAULT_STATE = "RS";

const rawObservationSchema = z.object({
  UF: z.string().min(1),
  DT_MEDICAO: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  CODIGO: z.string().min(1),
  LONGITUDE: z.union([z.string(), z.number()]),
  NOME: z.string().min(1),
  LATITUDE: z.union([z.string(), z.number()]),
  TEMP_MIN: z.union([z.string(), z.number(), z.null()]).optional(),
});

const rawResponseSchema = z.array(rawObservationSchema);

type FrostRequest = {
  endDate?: string;
  days?: number;
  stationType?: FrostStationType;
  state?: string;
};

type CacheEntry = {
  data: FrostMapData;
  storedAt: number;
};

const cache = new Map<string, CacheEntry>();

function localDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function normalizedDate(value: string | undefined) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return localDateKey();
}

function subtractDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

function finiteNumber(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function automaticStation(code: string, stationType: FrostStationType) {
  return stationType === "AUTOMATICA" || /^[ASB]/i.test(code);
}

function intensityFor(
  temperature: number | null,
  code: string,
  stationType: FrostStationType,
): { intensity: FrostIntensity; label: string } {
  if (automaticStation(code, stationType)) {
    return { intensity: "possible", label: "Possível ocorrência" };
  }
  if (temperature === null) return { intensity: "undefined", label: "Indefinida" };
  if (temperature < 1) return { intensity: "strong", label: "Forte" };
  if (temperature < 3) return { intensity: "moderate", label: "Moderada" };
  return { intensity: "weak", label: "Fraca" };
}

function emptySummary() {
  return {
    stations: 0,
    observations: 0,
    lowestTemperature: null as number | null,
    strong: 0,
    moderate: 0,
    weak: 0,
    possible: 0,
    undefined: 0,
  };
}

function unavailableData(
  filters: FrostMapData["filters"],
  endpoint: string,
  message: string,
): FrostMapData {
  return {
    status: "unavailable",
    filters,
    summary: emptySummary(),
    stations: [],
    source: {
      name: "INMET",
      endpoint,
      portalUrl: INMET_FROST_PORTAL,
      fetchedAt: new Date().toISOString(),
    },
    message,
  };
}

function normalizeData(
  rows: z.infer<typeof rawResponseSchema>,
  filters: FrostMapData["filters"],
  endpoint: string,
): FrostMapData {
  const observations: FrostObservation[] = rows
    .filter((row) => row.UF.toUpperCase() === filters.state)
    .map((row) => {
      const latitude = finiteNumber(row.LATITUDE);
      const longitude = finiteNumber(row.LONGITUDE);
      const minimumTemperature = finiteNumber(row.TEMP_MIN);
      const intensity = intensityFor(minimumTemperature, row.CODIGO, filters.stationType);

      if (latitude === null || longitude === null) return null;

      return {
        id: `${row.CODIGO}:${row.DT_MEDICAO}`,
        state: row.UF.toUpperCase(),
        date: row.DT_MEDICAO,
        stationCode: row.CODIGO,
        stationName: row.NOME.trim(),
        latitude,
        longitude,
        minimumTemperature,
        intensity: intensity.intensity,
        intensityLabel: intensity.label,
      } satisfies FrostObservation;
    })
    .filter((item): item is FrostObservation => item !== null)
    .sort((a, b) => b.date.localeCompare(a.date));

  const stationGroups = new Map<string, FrostObservation[]>();
  for (const observation of observations) {
    const items = stationGroups.get(observation.stationCode) ?? [];
    items.push(observation);
    stationGroups.set(observation.stationCode, items);
  }

  const stations: FrostStation[] = [...stationGroups.values()]
    .map((items) => ({
      stationCode: items[0].stationCode,
      stationName: items[0].stationName,
      state: items[0].state,
      latitude: items[0].latitude,
      longitude: items[0].longitude,
      latest: items[0],
      observations: items,
    }))
    .sort((a, b) => a.stationName.localeCompare(b.stationName, "pt-BR"));

  const temperatures = observations
    .map((item) => item.minimumTemperature)
    .filter((value): value is number => value !== null);
  const summary = {
    ...emptySummary(),
    stations: stations.length,
    observations: observations.length,
    lowestTemperature: temperatures.length > 0 ? Math.min(...temperatures) : null,
  };

  for (const observation of observations) summary[observation.intensity] += 1;

  return {
    status: "live",
    filters,
    summary,
    stations,
    source: {
      name: "INMET",
      endpoint,
      portalUrl: INMET_FROST_PORTAL,
      fetchedAt: new Date().toISOString(),
    },
    message:
      stations.length === 0
        ? "O INMET não retornou ocorrências para os filtros selecionados."
        : null,
  };
}

export async function fetchInmetFrostMap(request: FrostRequest = {}): Promise<FrostMapData> {
  const endDate = normalizedDate(request.endDate);
  const days = Math.min(30, Math.max(1, Math.round(request.days ?? 30)));
  const stationType: FrostStationType =
    request.stationType === "AUTOMATICA" ? "AUTOMATICA" : "CONVENCIONAL";
  const state = (request.state ?? DEFAULT_STATE).trim().toUpperCase().slice(0, 2) || DEFAULT_STATE;
  const startDate = subtractDays(endDate, days);
  const filters = { startDate, endDate, days, stationType, state };
  const endpoint = `${INMET_FROST_ENDPOINT}/${startDate}/${endDate}/${stationType}`;
  const cacheKey = `${startDate}:${endDate}:${stationType}:${state}`;
  const cached = cache.get(cacheKey);
  const age = cached ? Date.now() - cached.storedAt : Number.POSITIVE_INFINITY;

  if (cached && age < CACHE_TTL_MS) return cached.data;

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`INMET respondeu com status ${response.status}`);

    const parsed = rawResponseSchema.safeParse(await response.json());
    if (!parsed.success) throw new Error("O INMET retornou uma estrutura de geadas inesperada");

    const data = normalizeData(parsed.data, filters, endpoint);
    cache.set(cacheKey, { data, storedAt: Date.now() });
    return data;
  } catch (error) {
    console.error("[inmet/geadas] Falha ao carregar ocorrências", {
      message: error instanceof Error ? error.message : String(error),
      endpoint,
    });

    if (cached && age < STALE_TTL_MS) {
      return {
        ...cached.data,
        message: "O INMET está temporariamente indisponível. Exibindo a última consulta válida.",
      };
    }

    return unavailableData(
      filters,
      endpoint,
      "Não foi possível consultar o mapa de geadas do INMET neste momento.",
    );
  }
}
