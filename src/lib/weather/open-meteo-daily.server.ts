import { z } from "zod";

import type { DailyForecast, WeatherHomeData, WeatherIconName } from "./types";

const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
const SOURCE_URL = "https://open-meteo.com/";
const TIMEZONE = "America/Sao_Paulo";
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_ATTEMPTS = 2;
const RETRY_DELAY_MS = 750;

const PELOTAS = {
  latitude: -31.7654,
  longitude: -52.3376,
} as const;

const nullableNumberArray = z.array(z.number().finite().nullable()).min(1);
const dailyForecastSchema = z
  .object({
    daily: z.object({
      time: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1),
      weather_code: nullableNumberArray,
      temperature_2m_max: nullableNumberArray,
      temperature_2m_min: nullableNumberArray,
      precipitation_probability_max: nullableNumberArray,
      precipitation_sum: nullableNumberArray,
      wind_gusts_10m_max: nullableNumberArray,
    }),
  })
  .superRefine((data, context) => {
    const expected = data.daily.time.length;
    for (const [key, values] of Object.entries(data.daily)) {
      if (values.length !== expected) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["daily", key],
          message: "Série diária incompleta",
        });
      }
    }
  });

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
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

function iconForCode(code: number | null): WeatherIconName {
  if (code === 0) return "sun";
  if (code === 1 || code === 2) return "partly-cloudy";
  if (code !== null && code >= 95) return "storm";
  if (code !== null && ((code >= 51 && code <= 86) || (code >= 71 && code <= 77))) {
    return "rain";
  }
  return "cloud";
}

function createUrl() {
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
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "precipitation_sum",
      "wind_gusts_10m_max",
    ].join(","),
  });
  return `${FORECAST_ENDPOINT}?${params.toString()}`;
}

function unavailable(message: string): WeatherHomeData {
  return {
    status: "unavailable",
    current: null,
    hourly: [],
    daily: [],
    source: {
      name: "Open-Meteo",
      url: SOURCE_URL,
      kind: "forecast",
      key: "open-meteo",
      fetchedAt: new Date().toISOString(),
      isFallback: false,
      model: "Open-Meteo Best Match",
      modelRun: null,
      temporalResolutionMinutes: 60,
    },
    message,
  };
}

function normalizeDaily(data: z.infer<typeof dailyForecastSchema>): DailyForecast[] {
  return data.daily.time.flatMap((date, index) => {
    const minimum = data.daily.temperature_2m_min[index];
    const maximum = data.daily.temperature_2m_max[index];
    const precipitation = data.daily.precipitation_sum[index];
    if (minimum === null || maximum === null || precipitation === null) return [];

    const rainChance = data.daily.precipitation_probability_max[index];
    const windGust = data.daily.wind_gusts_10m_max[index];
    const weatherCode = data.daily.weather_code[index];

    return [
      {
        weekday: formatDay(date, index),
        date: formatDate(date),
        dateIso: date,
        min: Math.round(minimum),
        max: Math.round(maximum),
        rainChance: rainChance === null ? null : Math.round(rainChance),
        precipitationMm: Number(precipitation.toFixed(1)),
        windGust: windGust === null ? null : Math.round(windGust),
        icon: iconForCode(weatherCode),
      },
    ];
  });
}

export async function fetchOpenMeteoDailyForecast(): Promise<WeatherHomeData> {
  let lastError = "A previsão diária do Open-Meteo está temporariamente indisponível.";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetch(createUrl(), {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "User-Agent": "MOBI-Tempo-Pelotas/2.0 (+https://tempopelotas.com.br)",
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) {
        throw new Error(`Open-Meteo respondeu com status ${response.status}`);
      }

      const parsed = dailyForecastSchema.safeParse(await response.json());
      if (!parsed.success) {
        console.error("[weather/open-meteo-daily] Resposta inválida", {
          issues: parsed.error.issues.slice(0, 8).map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        });
        return unavailable("O Open-Meteo respondeu, mas a previsão diária não pôde ser validada.");
      }

      const daily = normalizeDaily(parsed.data);
      if (!daily.length) {
        return unavailable("O Open-Meteo não forneceu dias completos para arquivamento.");
      }

      return {
        status: "live",
        current: null,
        hourly: [],
        daily,
        source: {
          name: "Open-Meteo",
          url: SOURCE_URL,
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
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.error("[weather/open-meteo-daily] Tentativa malsucedida", {
        attempt,
        message: lastError,
      });
      if (attempt < MAX_ATTEMPTS) await wait(RETRY_DELAY_MS);
    }
  }

  return unavailable(lastError);
}
