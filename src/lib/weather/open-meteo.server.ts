import { z } from "zod";

import type {
  DailyForecast,
  HourlyForecast,
  WeatherHomeData,
  WeatherIconName,
} from "./types";

const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const OPEN_METEO_URL = "https://open-meteo.com/";
const TIMEZONE = "America/Sao_Paulo";
const REQUEST_TIMEOUT_MS = 8_000;

const PELOTAS = {
  city: "Pelotas",
  state: "RS",
  latitude: -31.7654,
  longitude: -52.3376,
} as const;

const finiteNumber = z.number().finite();
const finiteNumberArray = z.array(finiteNumber).min(1);
const timeArray = z.array(z.string().min(1)).min(1);

const openMeteoResponseSchema = z
  .object({
    current: z.object({
      time: z.string().min(1),
      temperature_2m: finiteNumber,
      relative_humidity_2m: finiteNumber,
      apparent_temperature: finiteNumber,
      weather_code: z.number().int(),
      pressure_msl: finiteNumber,
      visibility: finiteNumber.optional(),
      wind_speed_10m: finiteNumber,
      wind_gusts_10m: finiteNumber,
      wind_direction_10m: finiteNumber,
      is_day: z.number().int().min(0).max(1),
    }),
    hourly: z.object({
      time: timeArray,
      temperature_2m: finiteNumberArray,
      precipitation_probability: finiteNumberArray,
      wind_speed_10m: finiteNumberArray,
      wind_gusts_10m: finiteNumberArray,
      weather_code: finiteNumberArray,
      is_day: finiteNumberArray,
    }),
    daily: z.object({
      time: timeArray,
      weather_code: finiteNumberArray,
      temperature_2m_max: finiteNumberArray,
      temperature_2m_min: finiteNumberArray,
      precipitation_probability_max: finiteNumberArray,
      precipitation_sum: finiteNumberArray,
      wind_gusts_10m_max: finiteNumberArray,
      sunrise: timeArray,
      sunset: timeArray,
    }),
  })
  .superRefine((data, context) => {
    const hourlyLength = data.hourly.time.length;
    const dailyLength = data.daily.time.length;

    for (const [key, values] of Object.entries(data.hourly)) {
      if (values.length !== hourlyLength) {
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

function weatherCodeToPresentation(code: number, isDay = true): WeatherPresentation {
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

function degreesToCompass(degrees: number) {
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

function formatClock(value: string) {
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

function normalizeHourly(response: OpenMeteoResponse): HourlyForecast[] {
  const foundIndex = response.hourly.time.findIndex((time) => time >= response.current.time);
  const currentIndex = foundIndex === -1 ? 0 : foundIndex;

  return response.hourly.time.slice(currentIndex, currentIndex + 7).map((time, offset) => {
    const index = currentIndex + offset;
    const presentation = weatherCodeToPresentation(
      response.hourly.weather_code[index],
      response.hourly.is_day[index] === 1,
    );

    return {
      time: offset === 0 ? "Agora" : `${formatClock(time).slice(0, 2)}h`,
      temperature: Math.round(response.hourly.temperature_2m[index]),
      precipitationProbability: Math.round(
        response.hourly.precipitation_probability[index] ?? 0,
      ),
      windSpeed: Math.round(response.hourly.wind_speed_10m[index] ?? 0),
      windGust: Math.round(response.hourly.wind_gusts_10m[index] ?? 0),
      icon: presentation.icon,
    };
  });
}

function normalizeDaily(response: OpenMeteoResponse): DailyForecast[] {
  return response.daily.time.map((date, index) => ({
    weekday: formatDay(date, index),
    date: formatDate(date),
    min: Math.round(response.daily.temperature_2m_min[index]),
    max: Math.round(response.daily.temperature_2m_max[index]),
    rainChance: Math.round(response.daily.precipitation_probability_max[index] ?? 0),
    precipitationMm: Number((response.daily.precipitation_sum[index] ?? 0).toFixed(1)),
    windGust: Math.round(response.daily.wind_gusts_10m_max[index] ?? 0),
    icon: weatherCodeToPresentation(response.daily.weather_code[index], true).icon,
  }));
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
      fetchedAt: new Date().toISOString(),
      isFallback: true,
    },
    message,
  };
}

function normalizeWeather(response: OpenMeteoResponse): WeatherHomeData {
  const presentation = weatherCodeToPresentation(
    response.current.weather_code,
    response.current.is_day === 1,
  );

  return {
    status: "live",
    current: {
      city: PELOTAS.city,
      state: PELOTAS.state,
      temperature: Math.round(response.current.temperature_2m),
      feelsLike: Math.round(response.current.apparent_temperature),
      condition: presentation.label,
      humidity: Math.round(response.current.relative_humidity_2m),
      pressure: Math.round(response.current.pressure_msl),
      windSpeed: Math.round(response.current.wind_speed_10m),
      windGust: Math.round(response.current.wind_gusts_10m),
      windDirection: degreesToCompass(response.current.wind_direction_10m),
      visibilityKm: Math.round((response.current.visibility ?? 10_000) / 1_000),
      sunrise: formatClock(response.daily.sunrise[0]),
      sunset: formatClock(response.daily.sunset[0]),
      observedAt: formatClock(response.current.time),
      icon: presentation.icon,
    },
    hourly: normalizeHourly(response),
    daily: normalizeDaily(response),
    source: {
      name: "Open-Meteo",
      url: OPEN_METEO_URL,
      kind: "forecast",
      fetchedAt: new Date().toISOString(),
      isFallback: false,
    },
    message: null,
  };
}

function createForecastUrl() {
  const params = new URLSearchParams({
    latitude: String(PELOTAS.latitude),
    longitude: String(PELOTAS.longitude),
    timezone: TIMEZONE,
    forecast_days: "7",
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
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
      "precipitation_probability",
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

export async function fetchPelotasWeather(): Promise<WeatherHomeData> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(createForecastUrl(), {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Open-Meteo respondeu com status ${response.status}`);
    }

    return normalizeWeather(openMeteoResponseSchema.parse(await response.json()));
  } catch (error) {
    console.error("Falha ao carregar a previsão meteorológica:", error);
    return createUnavailableWeather(
      "Os dados meteorológicos estão temporariamente indisponíveis. Tente novamente em alguns minutos.",
    );
  } finally {
    clearTimeout(timeout);
  }
}
