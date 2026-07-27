import { z } from "zod";

const ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const SOURCE_URL = "https://open-meteo.com/";
const TIMEZONE = "America/Sao_Paulo";
const REQUEST_TIMEOUT_MS = 15_000;
const FORECAST_HOURS = 48;

const PELOTAS = {
  latitude: -31.7654,
  longitude: -52.3376,
} as const;

const finiteNumber = z.number().finite();
const nullableNumber = finiteNumber.nullable();
const numberSeries = z.array(nullableNumber).min(1);
const timeSeries = z.array(z.string().min(1)).min(1);

const responseSchema = z
  .object({
    latitude: finiteNumber.optional(),
    longitude: finiteNumber.optional(),
    timezone: z.string().optional(),
    utc_offset_seconds: finiteNumber.optional(),
    generationtime_ms: finiteNumber.optional(),
    hourly: z.object({
      time: timeSeries,
      temperature_2m: numberSeries,
      apparent_temperature: numberSeries,
      relative_humidity_2m: numberSeries,
      dew_point_2m: numberSeries,
      precipitation_probability: numberSeries,
      precipitation: numberSeries,
      pressure_msl: numberSeries,
      cloud_cover: numberSeries,
      cloud_cover_low: numberSeries,
      cloud_cover_mid: numberSeries,
      cloud_cover_high: numberSeries,
      visibility: numberSeries,
      cape: numberSeries,
      boundary_layer_height: numberSeries,
      wind_speed_10m: numberSeries,
      wind_gusts_10m: numberSeries,
      wind_direction_10m: numberSeries,
      weather_code: numberSeries,
      is_day: numberSeries,
    }),
  })
  .superRefine((data, context) => {
    const length = data.hourly.time.length;
    for (const [key, values] of Object.entries(data.hourly)) {
      if (Array.isArray(values) && values.length !== length) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["hourly", key],
          message: "Série horária incompleta",
        });
      }
    }
  });

type MeteogramPayload = z.infer<typeof responseSchema>;

export type MeteogramHour = {
  timestamp: string;
  temperature: number | null;
  feelsLike: number | null;
  relativeHumidity: number | null;
  dewPoint: number | null;
  precipitationProbability: number | null;
  precipitationMm: number | null;
  pressure: number | null;
  cloudCover: number | null;
  cloudCoverLow: number | null;
  cloudCoverMid: number | null;
  cloudCoverHigh: number | null;
  visibilityKm: number | null;
  cape: number | null;
  boundaryLayerHeight: number | null;
  windSpeed: number | null;
  windGust: number | null;
  windDirectionDegrees: number | null;
  weatherCode: number | null;
  isDay: boolean | null;
};

export type MeteogramData = {
  status: "live" | "unavailable";
  hours: MeteogramHour[];
  source: {
    name: "Open-Meteo";
    model: "Best Match";
    url: string;
    fetchedAt: string;
    timezone: "America/Sao_Paulo";
    temporalResolutionMinutes: 60;
    forecastHours: 48;
    generationTimeMs: number | null;
  };
  message: string | null;
};

function decimal(value: number | null | undefined, digits = 1) {
  return value === null || value === undefined ? null : Number(value.toFixed(digits));
}

function integer(value: number | null | undefined) {
  return value === null || value === undefined ? null : Math.round(value);
}

function seriesValue(values: Array<number | null>, index: number) {
  return values[index] ?? null;
}

function normalize(payload: MeteogramPayload, fetchedAt: Date): MeteogramData {
  const hours = payload.hourly.time.slice(0, FORECAST_HOURS).map<MeteogramHour>((timestamp, index) => ({
    timestamp,
    temperature: decimal(seriesValue(payload.hourly.temperature_2m, index)),
    feelsLike: decimal(seriesValue(payload.hourly.apparent_temperature, index)),
    relativeHumidity: integer(seriesValue(payload.hourly.relative_humidity_2m, index)),
    dewPoint: decimal(seriesValue(payload.hourly.dew_point_2m, index)),
    precipitationProbability: integer(
      seriesValue(payload.hourly.precipitation_probability, index),
    ),
    precipitationMm: decimal(seriesValue(payload.hourly.precipitation, index)),
    pressure: decimal(seriesValue(payload.hourly.pressure_msl, index)),
    cloudCover: integer(seriesValue(payload.hourly.cloud_cover, index)),
    cloudCoverLow: integer(seriesValue(payload.hourly.cloud_cover_low, index)),
    cloudCoverMid: integer(seriesValue(payload.hourly.cloud_cover_mid, index)),
    cloudCoverHigh: integer(seriesValue(payload.hourly.cloud_cover_high, index)),
    visibilityKm:
      seriesValue(payload.hourly.visibility, index) === null
        ? null
        : decimal((seriesValue(payload.hourly.visibility, index) as number) / 1_000),
    cape: integer(seriesValue(payload.hourly.cape, index)),
    boundaryLayerHeight: integer(seriesValue(payload.hourly.boundary_layer_height, index)),
    windSpeed: decimal(seriesValue(payload.hourly.wind_speed_10m, index)),
    windGust: decimal(seriesValue(payload.hourly.wind_gusts_10m, index)),
    windDirectionDegrees: integer(seriesValue(payload.hourly.wind_direction_10m, index)),
    weatherCode: integer(seriesValue(payload.hourly.weather_code, index)),
    isDay:
      seriesValue(payload.hourly.is_day, index) === null
        ? null
        : seriesValue(payload.hourly.is_day, index) !== 0,
  }));

  return {
    status: hours.length ? "live" : "unavailable",
    hours,
    source: {
      name: "Open-Meteo",
      model: "Best Match",
      url: SOURCE_URL,
      fetchedAt: fetchedAt.toISOString(),
      timezone: TIMEZONE,
      temporalResolutionMinutes: 60,
      forecastHours: FORECAST_HOURS,
      generationTimeMs: payload.generationtime_ms ?? null,
    },
    message: hours.length ? null : "O modelo não retornou horários utilizáveis para Pelotas.",
  };
}

function unavailable(message: string, fetchedAt = new Date()): MeteogramData {
  return {
    status: "unavailable",
    hours: [],
    source: {
      name: "Open-Meteo",
      model: "Best Match",
      url: SOURCE_URL,
      fetchedAt: fetchedAt.toISOString(),
      timezone: TIMEZONE,
      temporalResolutionMinutes: 60,
      forecastHours: FORECAST_HOURS,
      generationTimeMs: null,
    },
    message,
  };
}

export function createMeteogramUrl() {
  const params = new URLSearchParams({
    latitude: String(PELOTAS.latitude),
    longitude: String(PELOTAS.longitude),
    timezone: TIMEZONE,
    forecast_hours: String(FORECAST_HOURS),
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
    timeformat: "iso8601",
    cell_selection: "land",
    hourly: [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "dew_point_2m",
      "precipitation_probability",
      "precipitation",
      "pressure_msl",
      "cloud_cover",
      "cloud_cover_low",
      "cloud_cover_mid",
      "cloud_cover_high",
      "visibility",
      "cape",
      "boundary_layer_height",
      "wind_speed_10m",
      "wind_gusts_10m",
      "wind_direction_10m",
      "weather_code",
      "is_day",
    ].join(","),
  });
  return `${ENDPOINT}?${params.toString()}`;
}

export async function fetchPelotasMeteogram(): Promise<MeteogramData> {
  const fetchedAt = new Date();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(createMeteogramUrl(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "MOBI-Tempo-Pelotas/2.0 (+https://tempopelotas.com.br)",
      },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Open-Meteo respondeu HTTP ${response.status}`);

    const parsed = responseSchema.safeParse((await response.json()) as unknown);
    if (!parsed.success) {
      console.error("[weather/meteogram] Resposta inválida", {
        issues: parsed.error.issues.slice(0, 12).map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
      return unavailable("Os dados do meteograma foram recebidos em uma estrutura inesperada.", fetchedAt);
    }

    return normalize(parsed.data, fetchedAt);
  } catch (error) {
    console.error("[weather/meteogram] Falha ao carregar meteograma", {
      message: error instanceof Error ? error.message : String(error),
    });
    return unavailable("O meteograma está temporariamente indisponível.", fetchedAt);
  } finally {
    clearTimeout(timeout);
  }
}
