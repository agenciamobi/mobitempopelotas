import { z } from "zod";

import { PELOTAS_LATITUDE, PELOTAS_LONGITUDE } from "@/lib/site-config";

const DEFESA_CIVIL_GRAPHQL_URL = "https://redehidrometeorologica.defesacivil.rs.gov.br/graphql";
const DEFESA_CIVIL_MAP_URL = "https://redehidrometeorologica.defesacivil.rs.gov.br/Mapa";
const DEFESA_CIVIL_DOCS_URL = "https://sistemas.defesacivil.rs.gov.br/api-redehidrometeorologica";
const DEFESA_CIVIL_CLIENT = "casa-militar-defesa-civil-rs";
const REQUEST_TIMEOUT_MS = 8_000;
const RETRY_DELAY_MS = 250;
const REGIONAL_RADIUS_KM = 320;
const MAX_REGIONAL_STATIONS = 36;
const FUTURE_TIMESTAMP_TOLERANCE_MS = 5 * 60_000;

const TAGS_DATA_QUERY = `
  query TempoPelotasRedeHidrometeorologica {
    tags_data(
      clients: ["${DEFESA_CIVIL_CLIENT}"]
      filters: {
        localizacao: [{
          codigos: ["43"]
          tipo: UNIDADE_FEDERATIVA
        }]
      }
    ) {
      qualle_meteorologia {
        codigo
        name { prefix general local }
        timestamp
        position {
          bacia
          latitude
          longitude
          regiao
          altitude
        }
        data {
          rio {
            rio_nome { value }
            rio_nivel { value }
          }
          chuva {
            acumulado {
              h001 { value }
              h003 { value }
              h006 { value }
              h012 { value }
              h024 { value }
              h168 { value }
            }
          }
          temperatura { atual { value } }
          umidade { atual { value } }
          pressaoatmos { atual { value } }
          senstermica { atual { value } }
          radiacaosolar { atual { value } }
          vento {
            velocidade_media { value }
            velocidade_maxima { value }
            direcao { value }
          }
        }
        filter {
          relacao {
            tem_chuva_acumulada
            tem_nivel_do_rio
            tem_pressao_atmosferica
            tem_umidade
            tem_vento
          }
        }
      }
    }
  }
`;

const scalarSchema = z.union([z.string(), z.number()]).nullable().optional();
const metricSchema = z.object({ value: scalarSchema }).passthrough().nullable().optional();

const stationSchema = z
  .object({
    codigo: z.string().min(1),
    name: z
      .object({
        prefix: z.string().nullable().optional(),
        general: z.string().nullable().optional(),
        local: z.string().nullable().optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    timestamp: z.union([z.string(), z.number()]).nullable().optional(),
    position: z
      .object({
        bacia: scalarSchema,
        latitude: scalarSchema,
        longitude: scalarSchema,
        regiao: scalarSchema,
        altitude: scalarSchema,
      })
      .passthrough()
      .nullable()
      .optional(),
    data: z
      .object({
        rio: z
          .object({
            rio_nome: metricSchema,
            rio_nivel: metricSchema,
          })
          .passthrough()
          .nullable()
          .optional(),
        chuva: z
          .object({
            acumulado: z
              .object({
                h001: metricSchema,
                h003: metricSchema,
                h006: metricSchema,
                h012: metricSchema,
                h024: metricSchema,
                h168: metricSchema,
              })
              .passthrough()
              .nullable()
              .optional(),
          })
          .passthrough()
          .nullable()
          .optional(),
        temperatura: z.object({ atual: metricSchema }).passthrough().nullable().optional(),
        umidade: z.object({ atual: metricSchema }).passthrough().nullable().optional(),
        pressaoatmos: z.object({ atual: metricSchema }).passthrough().nullable().optional(),
        senstermica: z.object({ atual: metricSchema }).passthrough().nullable().optional(),
        radiacaosolar: z.object({ atual: metricSchema }).passthrough().nullable().optional(),
        vento: z
          .object({
            velocidade_media: metricSchema,
            velocidade_maxima: metricSchema,
            direcao: metricSchema,
          })
          .passthrough()
          .nullable()
          .optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
  })
  .passthrough();

const graphqlResponseSchema = z
  .object({
    data: z
      .object({
        tags_data: z
          .object({
            qualle_meteorologia: z
              .union([z.array(stationSchema), stationSchema])
              .nullable()
              .optional(),
          })
          .passthrough()
          .nullable()
          .optional(),
      })
      .passthrough()
      .nullable()
      .optional(),
    errors: z.array(z.object({ message: z.string().optional() }).passthrough()).optional(),
  })
  .passthrough();

export type DefesaCivilReadingFreshness = "recent" | "delayed" | "old" | "unknown";

export type DefesaCivilHydroStation = {
  code: string;
  name: string;
  basin: string | null;
  region: string | null;
  latitude: number;
  longitude: number;
  altitudeM: number | null;
  distanceFromPelotasKm: number;
  observedAt: string | null;
  ageMinutes: number | null;
  freshness: DefesaCivilReadingFreshness;
  river: {
    name: string | null;
    levelM: number | null;
  };
  rain: {
    h1Mm: number | null;
    h3Mm: number | null;
    h6Mm: number | null;
    h12Mm: number | null;
    h24Mm: number | null;
    h168Mm: number | null;
  };
  weather: {
    temperatureC: number | null;
    apparentTemperatureC: number | null;
    humidityPct: number | null;
    pressureHpa: number | null;
    solarRadiationKwhM2: number | null;
    windAverageKmh: number | null;
    windMaximumKmh: number | null;
    windDirectionDeg: number | null;
  };
};

export type DefesaCivilHydroData = {
  status: "disabled" | "live" | "partial" | "unavailable";
  stations: DefesaCivilHydroStation[];
  statewideStationCount: number;
  regionalStationCount: number;
  recentStationCount: number;
  latestObservationAt: string | null;
  source: {
    name: "Defesa Civil RS — Rede de Monitoramento Hidrometeorológico";
    endpoint: string;
    mapUrl: string;
    documentationUrl: string;
    fetchedAt: string;
  };
  publication: {
    enabled: boolean;
    note: string;
  };
  error: string | null;
};

class DefesaCivilHttpError extends Error {
  retryable: boolean;

  constructor(message: string, retryable: boolean) {
    super(message);
    this.name = "DefesaCivilHttpError";
    this.retryable = retryable;
  }
}

function source(fetchedAt: Date) {
  return {
    name: "Defesa Civil RS — Rede de Monitoramento Hidrometeorológico" as const,
    endpoint: DEFESA_CIVIL_GRAPHQL_URL,
    mapUrl: DEFESA_CIVIL_MAP_URL,
    documentationUrl: DEFESA_CIVIL_DOCS_URL,
    fetchedAt: fetchedAt.toISOString(),
  };
}

function publication(enabled: boolean) {
  return {
    enabled,
    note: enabled
      ? "Integração habilitada no runtime após validação técnica e operacional da fonte."
      : "Integração técnica preparada; ativação aguarda validação do contrato, inventário, timestamps, referência dos níveis e condições indicadas pela documentação oficial.",
  };
}

function emptyData(
  status: DefesaCivilHydroData["status"],
  error: string | null,
  fetchedAt = new Date(),
): DefesaCivilHydroData {
  const enabled = status !== "disabled";
  return {
    status,
    stations: [],
    statewideStationCount: 0,
    regionalStationCount: 0,
    recentStationCount: 0,
    latestObservationAt: null,
    source: source(fetchedAt),
    publication: publication(enabled),
    error,
  };
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string") return null;
  const normalized = value.trim().replace(",", ".");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function toText(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized || null;
}

function normalizeTimestamp(value: string | number | null | undefined): string | null {
  if (typeof value === "number") {
    const milliseconds = value < 10_000_000_000 ? value * 1_000 : value;
    const date = new Date(milliseconds);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  if (typeof value !== "string" || !value.trim()) return null;

  const raw = value.trim();
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw);
  const normalized = raw.includes("T") ? raw : raw.replace(" ", "T");
  const candidate = hasTimezone ? normalized : `${normalized}-03:00`;
  const date = new Date(candidate);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function trustedObservedAt(
  value: string | number | null | undefined,
  fetchedAt: Date,
): string | null {
  const normalized = normalizeTimestamp(value);
  if (!normalized) return null;

  const observed = new Date(normalized);
  if (Number.isNaN(observed.getTime())) return null;
  if (observed.getTime() > fetchedAt.getTime() + FUTURE_TIMESTAMP_TOLERANCE_MS) return null;
  return normalized;
}

function distanceKm(latitude: number, longitude: number) {
  const earthRadiusKm = 6_371;
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const deltaLatitude = radians(latitude - PELOTAS_LATITUDE);
  const deltaLongitude = radians(longitude - PELOTAS_LONGITUDE);
  const firstLatitude = radians(PELOTAS_LATITUDE);
  const secondLatitude = radians(latitude);
  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.cos(firstLatitude) * Math.cos(secondLatitude) * Math.sin(deltaLongitude / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function freshness(observedAt: string | null, fetchedAt: Date) {
  if (!observedAt) {
    return { ageMinutes: null, freshness: "unknown" as const };
  }
  const observed = new Date(observedAt);
  if (Number.isNaN(observed.getTime())) {
    return { ageMinutes: null, freshness: "unknown" as const };
  }
  const ageMinutes = Math.max(0, (fetchedAt.getTime() - observed.getTime()) / 60_000);
  if (ageMinutes <= 30) return { ageMinutes, freshness: "recent" as const };
  if (ageMinutes <= 180) return { ageMinutes, freshness: "delayed" as const };
  return { ageMinutes, freshness: "old" as const };
}

function metricValue(metric: { value?: string | number | null } | null | undefined) {
  return toNumber(metric?.value);
}

function metricText(metric: { value?: string | number | null } | null | undefined) {
  return toText(metric?.value);
}

function stationName(station: z.infer<typeof stationSchema>) {
  return (
    station.name?.local?.trim() ||
    station.name?.general?.trim() ||
    station.name?.prefix?.trim() ||
    `Estação ${station.codigo}`
  );
}

function normalizeStation(
  station: z.infer<typeof stationSchema>,
  fetchedAt: Date,
): DefesaCivilHydroStation | null {
  const latitude = toNumber(station.position?.latitude);
  const longitude = toNumber(station.position?.longitude);
  if (latitude === null || longitude === null) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  const observedAt = trustedObservedAt(station.timestamp, fetchedAt);
  const timing = freshness(observedAt, fetchedAt);
  const rain = station.data?.chuva?.acumulado;

  return {
    code: station.codigo,
    name: stationName(station),
    basin: toText(station.position?.bacia),
    region: toText(station.position?.regiao),
    latitude,
    longitude,
    altitudeM: toNumber(station.position?.altitude),
    distanceFromPelotasKm: distanceKm(latitude, longitude),
    observedAt,
    ageMinutes: timing.ageMinutes,
    freshness: timing.freshness,
    river: {
      name: metricText(station.data?.rio?.rio_nome),
      levelM: metricValue(station.data?.rio?.rio_nivel),
    },
    rain: {
      h1Mm: metricValue(rain?.h001),
      h3Mm: metricValue(rain?.h003),
      h6Mm: metricValue(rain?.h006),
      h12Mm: metricValue(rain?.h012),
      h24Mm: metricValue(rain?.h024),
      h168Mm: metricValue(rain?.h168),
    },
    weather: {
      temperatureC: metricValue(station.data?.temperatura?.atual),
      apparentTemperatureC: metricValue(station.data?.senstermica?.atual),
      humidityPct: metricValue(station.data?.umidade?.atual),
      pressureHpa: metricValue(station.data?.pressaoatmos?.atual),
      solarRadiationKwhM2: metricValue(station.data?.radiacaosolar?.atual),
      windAverageKmh: metricValue(station.data?.vento?.velocidade_media),
      windMaximumKmh: metricValue(station.data?.vento?.velocidade_maxima),
      windDirectionDeg: metricValue(station.data?.vento?.direcao),
    },
  };
}

function isTransientStatus(status: number) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function requestGraphql() {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch(DEFESA_CIVIL_GRAPHQL_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": "MOBI-Tempo-Pelotas/2.0 (+https://tempopelotas.com.br)",
        },
        body: JSON.stringify({ query: TAGS_DATA_QUERY }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new DefesaCivilHttpError(
          `Defesa Civil RS respondeu HTTP ${response.status}.`,
          isTransientStatus(response.status),
        );
      }

      return response.json() as Promise<unknown>;
    } catch (error) {
      lastError = error;
      const retryable = !(error instanceof DefesaCivilHttpError) || error.retryable;
      if (attempt >= 2 || !retryable) throw error;
      await wait(RETRY_DELAY_MS);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Falha desconhecida ao consultar a Rede Hidrometeorológica da Defesa Civil RS.");
}

export function isDefesaCivilHydroEnabled() {
  return process.env.DEFESA_CIVIL_HYDRO_ENABLED?.trim().toLowerCase() === "true";
}

export async function fetchDefesaCivilHydroData(
  options: { enabled?: boolean } = {},
): Promise<DefesaCivilHydroData> {
  const fetchedAt = new Date();
  const enabled = options.enabled ?? isDefesaCivilHydroEnabled();

  if (!enabled) {
    return emptyData("disabled", null, fetchedAt);
  }

  let payload: unknown;
  try {
    payload = await requestGraphql();
  } catch {
    return emptyData(
      "unavailable",
      "A integração do Tempo Pelotas não conseguiu consultar a Rede Hidrometeorológica da Defesa Civil RS neste momento.",
      fetchedAt,
    );
  }

  const parsed = graphqlResponseSchema.safeParse(payload);
  if (!parsed.success) {
    return emptyData(
      "unavailable",
      "A Rede Hidrometeorológica respondeu com uma estrutura diferente do contrato público documentado.",
      fetchedAt,
    );
  }

  if (parsed.data.errors?.length) {
    return emptyData(
      "unavailable",
      "A Rede Hidrometeorológica retornou um erro GraphQL ao consultar as estações do Rio Grande do Sul.",
      fetchedAt,
    );
  }

  const rawStations = parsed.data.data?.tags_data?.qualle_meteorologia;
  const stationList = rawStations ? (Array.isArray(rawStations) ? rawStations : [rawStations]) : [];
  const normalized = stationList
    .map((station) => normalizeStation(station, fetchedAt))
    .filter((station): station is DefesaCivilHydroStation => Boolean(station));

  const regionalStations = normalized
    .filter((station) => station.distanceFromPelotasKm <= REGIONAL_RADIUS_KM)
    .sort((first, second) => first.distanceFromPelotasKm - second.distanceFromPelotasKm)
    .slice(0, MAX_REGIONAL_STATIONS);

  const latestObservationAt =
    regionalStations
      .map((station) => station.observedAt)
      .filter((value): value is string => Boolean(value))
      .sort((first, second) => new Date(second).getTime() - new Date(first).getTime())[0] ?? null;

  const recentStationCount = regionalStations.filter(
    (station) => station.freshness === "recent",
  ).length;

  const status: DefesaCivilHydroData["status"] = regionalStations.length > 0 ? "live" : "partial";

  return {
    status,
    stations: regionalStations,
    statewideStationCount: stationList.length,
    regionalStationCount: regionalStations.length,
    recentStationCount,
    latestObservationAt,
    source: source(fetchedAt),
    publication: publication(true),
    error:
      regionalStations.length > 0
        ? null
        : "A API respondeu, mas nenhuma estação com coordenadas válidas foi encontrada no recorte regional do Tempo Pelotas.",
  };
}
