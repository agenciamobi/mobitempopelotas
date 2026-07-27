import { z } from "zod";

import type { DailyForecast, ForecastSourceKey, HourlyForecast, WeatherHomeData, WeatherIconName } from "./types";

const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const OPEN_METEO_URL = "https://open-meteo.com/";
const TIMEZONE = "America/Sao_Paulo";
const REQUEST_TIMEOUT_MS = 15_000;
const HOURLY_FORECAST_LIMIT = 24;

const PELOTAS = {
  city: "Pelotas",
  state: "RS",
  latitude: -31.7654,
  longitude: -52.3376,
} as const;

const finiteNumber = z.number().finite();
const nullableFiniteNumber = finiteNumber.nullable();
const nullableFiniteNumberArray = z.array(nullableFiniteNumber).min(1);
const optionalNullableFiniteNumberArray = nullableFiniteNumberArray.optional();
const timeArray = z.array(z.string().min(1)).min(1);

const openMeteoResponseSchema = z
  .object({
    current: z.object({
      time: z.string().min(1),
      temperature_2m: nullableFiniteNumber,
      relative_humidity_2m: nullableFiniteNumber,
      apparent_temperature: nullableFiniteNumber,
      dew_point_2m: nullableFiniteNumber.optional(),
      weather_code: nullableFiniteNumber,
      pressure_msl: nullableFiniteNumber,
      visibility: nullableFiniteNumber.optional(),
      wind_speed_10m: nullableFiniteNumber,
      wind_gusts_10m: nullableFiniteNumber,
      wind_direction_10m: nullableFiniteNumber,
      is_day: nullableFiniteNumber,
    }),
    hourly: z.object({
      time: timeArray,
      temperature_2m: nullableFiniteNumberArray,
      precipitation_probability: nullableFiniteNumberArray,
      wind_speed_10m: nullableFiniteNumberArray,
      wind_gusts_10m: nullableFiniteNumberArray,
      weather_code: nullableFiniteNumberArray,
      is_day: nullableFiniteNumberArray,
      relative_humidity_2m: optionalNullableFiniteNumberArray,
      dew_point_2m: optionalNullableFiniteNumberArray,
      pressure_msl: optionalNullableFiniteNumberArray,
      visibility: optionalNullableFiniteNumberArray,
      cloud_cover: optionalNullableFiniteNumberArray,
      cloud_cover_low: optionalNullableFiniteNumberArray,
      cloud_cover_mid: optionalNullableFiniteNumberArray,
      cloud_cover_high: optionalNullableFiniteNumberArray,
      cape: optionalNullableFiniteNumberArray,
      boundary_layer_height: optionalNullableFiniteNumberArray,
    }),
    daily: z.object({
      time: timeArray,
      weather_code: nullableFiniteNumberArray,
      temperature_2m_max: nullableFiniteNumberArray,
      temperature_2m_min: nullableFiniteNumberArray,
      precipitation_probability_max: nullableFiniteNumberArray,
      precipitation_sum: nullableFiniteNumberArray,
      wind_gusts_10m_max: nullableFiniteNumberArray,
      sunrise: timeArray,
      sunset: timeArray,
    }),
  })
  .superRefine((data, context) => {
    const hourlyLength = data.hourly.time.length;
    const dailyLength = data.daily.time.length;

    for (const [key, values] of Object.entries(data.hourly)) {
      if (Array.isArray(values) && values.length !== hourlyLength) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["hourly", key],
          message: "Série horária incompleta",
        });
      }
    }

    for (const [key, values] of Object.entries(data.daily)) {
      if (values.length !== dailyLength) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["daily", key],
          message: "Série diária incompleta",
        });
      }
    }
  });

type OpenMeteoResponse = z.infer<typeof openMeteoResponseSchema>;

type WeatherPresentation = {
  label: string;
  icon: WeatherIconName;
};

function weatherCodeToPresentation(
  code: number | null | undefined,
  isDay = true,
): WeatherPresentation {
  if (code === null || code === undefined) {
    return { label: "Condição em atualização", icon: "cloud" };
  }

  if (code === 0) {
    return {
      label: isDay ? "Céu limpo" : "Noite de céu limpo",
      icon: isDay ? "sun" : "moon",
    };
  }

  if (code === 1 || code === 2) {
    return {
      label: isDay ? "Sol entre nuvens" : "Noite parcialmente nublada",
      icon: isDay ? "partly-cloudy" : "partly-cloudy-night",
    };
  }

  if (code === 3 || code === 45 || code === 48) {
    return {
      label: code >= 45 ? "Neblina" : "Céu nublado",
      icon: "cloud",
    };
  }

  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 86)) {
    return { label: "Chuva", icon: "rain" };
  }

  if (code >= 71 && code <= 77) {
    return { label: "Precipitação de inverno", icon: "rain" };
  }

  if (code >= 95) {
    return { label: "Temporal", icon: "storm" };
  }

  return { label: "Tempo variável", icon: "cloud" };
}

function degreesToCompass(degrees: number | null | undefined) {
  if (degrees === null || degrees === undefined) return null;

  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "L",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSO",
    "SO",
    "OSO",
    "O",
    "ONO",
    "NO",
    "NNO",
  ];
  const normalizedDegrees = ((degrees % 360) + 360) % 360;
  return directions[Math.round(normalizedDegrees / 22.5) % directions.length];
}

function formatClock(value: string | null | undefined) {
  if (!value) return null;
  const [, time] = value.split("T");
  return time ? time.slice(0, 5) : value;
}

function formatDay(date: string, index: number) {
  if (index === 0) return "Hoje";

  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    timeZone: "UTC",
  })
    .format(new Date(`${date}T12:00:00Z`))
    .replace(".", "")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  })
    .format(new Date(`${date}T12:00:00Z`))
    .replace(" de ", " ")
    .replace(".", "");
}

function roundOrNull(value: number | null | undefined) {
  return value === null || value === undefined ? null : Math.round(value);
}

function decimalOrNull(value: number | null | undefined) {
  return value === null || value === undefined ? null : Number(value.toFixed(1));
}

function arrayValue(
  values: Array<number | null> | undefined,
  index: number,
): number | null {
  return values?.[index] ?? null;
}

function normalizeHourly(response: OpenMeteoResponse): HourlyForecast[] {
  const foundIndex = response.hourly.time.findIndex((time) => time >= response.current.time);
  const currentIndex = foundIndex === -1 ? 0 : foundIndex;
  const items: HourlyForecast[] = [];

  for (let offset = 0; offset < HOURLY_FORECAST_LIMIT; offset += 1) {
    const index = currentIndex + offset;
    const timestamp = response.hourly.time[index];
    const temperature = response.hourly.temperature_2m[index];
    if (!timestamp || temperature === null || temperature === undefined) continue;

    const windSpeed = response.hourly.wind_speed_10m[index];
    if (windSpeed === null || windSpeed === undefined) continue;

    const presentation = weatherCodeToPresentation(
      response.hourly.weather_code[index],
      response.hourly.is_day[index] !== 0,
    );
    const precipitationProbability = response.hourly.precipitation_probability[index];
    const windGust = response.hourly.wind_gusts_10m[index];

    items.push({
      time: offset === 0 ? "Agora" : `${formatClock(timestamp)?.slice(0, 2) ?? "--"}h`,
      timestamp,
      temperature: Math.round(temperature),
      precipitationProbability:
        precipitationProbability === null || precipitationProbability === undefined
          ? null
          : Math.round(precipitationProbability),
      windSpeed: Math.round(windSpeed),
      windGust: windGust === null || windGust === undefined ? null : Math.round(windGust),
      icon: presentation.icon,
      relativeHumidity: roundOrNull(arrayValue(response.hourly.relative_humidity_2m, index)),
      dewPoint: decimalOrNull(arrayValue(response.hourly.dew_point_2m, index)),
      pressure: roundOrNull(arrayValue(response.hourly.pressure_msl, index)),
      visibilityKm: decimalOrNull(
        arrayValue(response.hourly.visibility, index) === null
          ? null
          : (arrayValue(response.hourly.visibility, index) as number) / 1_000,
      ),
      cloudCover: roundOrNull(arrayValue(response.hourly.cloud_cover, index)),
      cloudCoverLow: roundOrNull(arrayValue(response.hourly.cloud_cover_low, index)),
      cloudCoverMid: roundOrNull(arrayValue(response.hourly.cloud_cover_mid, index)),
      cloudCoverHigh: roundOrNull(arrayValue(response.hourly.cloud_cover_high, index)),
      cape: roundOrNull(arrayValue(response.hourly.cape, index)),
      boundaryLayerHeight: roundOrNull(
        arrayValue(response.hourly.boundary_layer_height, index),
      ),
    });
  }

  return items;
}

function normalizeDaily(response: OpenMeteoResponse): DailyForecast[] {
  const items: DailyForecast[] = [];

  response.daily.time.forEach((date, index) => {
    const minimum = response.daily.temperature_2m_min[index];
    const maximum = response.daily.temperature_2m_max[index];
    if (minimum === null || minimum === undefined || maximum === null || maximum === undefined) {
      return;
    }

    const precipitation = response.daily.precipitation_sum[index];
    if (precipitation === null || precipitation === undefined) return;

    const rainChance = response.daily.precipitation_probability_max[index];
    const windGust = response.daily.wind_gusts_10m_max[index];

    items.push({
      weekday: formatDay(date, index),
      date: formatDate(date),
      min: Math.round(minimum),
      max: Math.round(maximum),
      rainChance: rainChance === null || rainChance === undefined ? null : Math.round(rainChance),
      precipitationMm: Number(precipitation.toFixed(1)),
      windGust: windGust === null || windGust === undefined ? null : Math.round(windGust),
      icon: weatherCodeToPresentation(response.daily.weather_code[index], true).icon,
    });
  });

  return items;
}

function createUnavailableWeather(message: string): WeatherHomeData {
  return {
    status: "unavailable",
    current: null,
    hourly: [],
    daily: [],
    source: {
      name: "Open-Meteo",
      url: OPEN_METEO_URL,
      kind: "forecast",
      key: "open-meteo",
      fetchedAt: new Date().toISOString(),
      isFallback: true,
      model: "Open-Meteo Best Match",
      modelRun: null,
      temporalResolutionMinutes: 60,
    },
    message,
  };
}

export function normalizeOpenMeteoWeather(response: OpenMeteoResponse): WeatherHomeData {
  const currentPresentation = weatherCodeToPresentation(
    response.current.weather_code,
    response.current.is_day !== 0,
  );
  const hasUsefulCurrent = [
    response.current.temperature_2m,
    response.current.relative_humidity_2m,
    response.current.pressure_msl,
    response.current.wind_speed_10m,
  ].some((value) => value !== null && value !== undefined);
  const current = hasUsefulCurrent
    ? {
        city: PELOTAS.city,
        state: PELOTAS.state,
        temperature: roundOrNull(response.current.temperature_2m),
        feelsLike: roundOrNull(response.current.apparent_temperature),
        condition: currentPresentation.label,
        humidity: roundOrNull(response.current.relative_humidity_2m),
        dewPoint: decimalOrNull(response.current.dew_point_2m),
        pressure: roundOrNull(response.current.pressure_msl),
        windSpeed: roundOrNull(response.current.wind_speed_10m),
        windGust: roundOrNull(response.current.wind_gusts_10m),
        windDirection: degreesToCompass(response.current.wind_direction_10m),
        visibilityKm:
          response.current.visibility === null || response.current.visibility === undefined
            ? null
            : Math.round(response.current.visibility / 1_000),
        sunrise: formatClock(response.daily.sunrise[0]),
        sunset: formatClock(response.daily.sunset[0]),
        observedAt: response.current.time,
        icon: currentPresentation.icon,
      }
    : null;
  const hourly = normalizeHourly(response);
  const daily = normalizeDaily(response);

  if (!current && hourly.length === 0 && daily.length === 0) {
    return createUnavailableWeather(
      "O Open-Meteo respondeu, mas não forneceu uma previsão utilizável para Pelotas.",
    );
  }

  return {
    status: "live",
    current,
    hourly,
    daily,
    source: {
      name: "Open-Meteo",
      url: OPEN_METEO_URL,
      kind: "forecast",
      key: "open-meteo",
      fetchedAt: new Date().toISOString(),
      isFallback: false,
      model: "Open-Meteo Best Match",
      modelRun: null,
      temporalResolutionMinutes: 60,
    },
    message: null,
  };
}

export function createOpenMeteoForecastUrl() {
  const params = new URLSearchParams({
    latitude: String(PELOTAS.latitude),
    longitude: String(PELOTAS.longitude),
    timezone: TIMEZONE,
    forecast_days: "7",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
    timeformat: "iso8601",
    cell_selection: "land",
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "dew_point_2m",
      "weather_code",
      "pressure_msl",
      "visibility",
      "wind_speed_10m",
      "wind_gusts_10m",
      "wind_direction_10m",
      "is_day",
    ].join(","),
    hourly: [
      "temperature_2m",
      "relative_humidity_2m",
      "dew_point_2m",
      "precipitation_probability",
      "pressure_msl",
      "visibility",
      "cloud_cover",
      "cloud_cover_low",
      "cloud_cover_mid",
      "cloud_cover_high",
      "cape",
      "boundary_layer_height",
      "wind_speed_10m",
      "wind_gusts_10m",
      "weather_code",
      "is_day",
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "precipitation_sum",
      "wind_gusts_10m_max",
      "sunrise",
      "sunset",
    ].join(","),
  });

  return `${FORECAST_ENDPOINT}?${params.toString()}`;
}

function logOpenMeteoError(error: unknown) {
  if (error instanceof Error) {
    console.error("[weather/open-meteo] Falha ao carregar previsão", {
      name: error.name,
      message: error.message,
    });
    return;
  }

  console.error("[weather/open-meteo] Falha desconhecida ao carregar previsão", {
    error: String(error),
  });
}

export async function fetchPelotasWeather(): Promise<WeatherHomeData> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(createOpenMeteoForecastUrl(), {
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "User-Agent": "MOBI-Tempo-Pelotas/2.0 (+https://tempopelotas.com.br)",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo respondeu com status ${response.status}`);
    }

    const payload: unknown = await response.json();
    const parsed = openMeteoResponseSchema.safeParse(payload);
    if (!parsed.success) {
      console.error("[weather/open-meteo] Resposta inválida", {
        issues: parsed.error.issues.slice(0, 12).map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
      return createUnavailableWeather(
        "Os dados meteorológicos foram recebidos, mas não puderam ser processados.",
      );
    }

    return normalizeOpenMeteoWeather(parsed.data);
  } catch (error) {
    logOpenMeteoError(error);
    return createUnavailableWeather("A previsão do Open-Meteo está temporariamente indisponível.");
  } finally {
    clearTimeout(timeout);
  }
}

export type { ForecastSourceKey };