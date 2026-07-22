import { z } from "zod";

import type { DailyForecast, HourlyForecast, WeatherHomeData, WeatherIconName } from "./types";

const FORECAST_ENDPOINT = "https://api.met.no/weatherapi/locationforecast/2.0/compact";
const SOURCE_URL = "https://api.met.no/weatherapi/locationforecast/2.0/documentation";
const TIMEZONE = "America/Sao_Paulo";
const REQUEST_TIMEOUT_MS = 3_500;
const USER_AGENT = "MOBI-Tempo-Pelotas/1.0 (+https://agenciamobi.com.br)";

const PELOTAS = {
  city: "Pelotas",
  state: "RS",
  latitude: -31.7654,
  longitude: -52.3376,
  altitude: 7,
} as const;

const finiteNumber = z.number().finite();

const periodSchema = z
  .object({
    summary: z.object({ symbol_code: z.string().min(1).optional() }).optional(),
    details: z
      .object({
        precipitation_amount: finiteNumber.optional(),
        probability_of_precipitation: finiteNumber.optional(),
      })
      .passthrough()
      .optional(),
  })
  .optional();

const metNorwaySchema = z.object({
  properties: z.object({
    timeseries: z
      .array(
        z.object({
          time: z.string().datetime(),
          data: z.object({
            instant: z.object({
              details: z
                .object({
                  air_temperature: finiteNumber,
                  relative_humidity: finiteNumber.optional(),
                  air_pressure_at_sea_level: finiteNumber.optional(),
                  wind_speed: finiteNumber.optional(),
                  wind_speed_of_gust: finiteNumber.optional(),
                  wind_from_direction: finiteNumber.optional(),
                })
                .passthrough(),
            }),
            next_1_hours: periodSchema,
            next_6_hours: periodSchema,
            next_12_hours: periodSchema,
          }),
        }),
      )
      .min(1),
  }),
});

type MetNorwayResponse = z.infer<typeof metNorwaySchema>;
type MetPoint = MetNorwayResponse["properties"]["timeseries"][number];
type WeatherPresentation = { label: string; icon: WeatherIconName; severity: number };

type DailyAccumulator = {
  date: string;
  temperatures: number[];
  precipitation: number;
  probabilities: number[];
  windGusts: number[];
  presentations: WeatherPresentation[];
};

function createUnavailableWeather(message: string): WeatherHomeData {
  return {
    status: "unavailable",
    current: null,
    hourly: [],
    daily: [],
    source: {
      name: "MET Norway",
      url: SOURCE_URL,
      kind: "forecast",
      fetchedAt: new Date().toISOString(),
      isFallback: true,
    },
    message,
  };
}

function formatClock(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
}

function localDate(value: string) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(value));
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

function degreesToCompass(degrees: number | undefined) {
  if (degrees === undefined) return null;
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
  const normalized = ((degrees % 360) + 360) % 360;
  return directions[Math.round(normalized / 22.5) % directions.length];
}

function symbolPresentation(symbol: string | undefined): WeatherPresentation {
  const normalized = symbol?.toLowerCase() ?? "cloudy";
  const isNight = normalized.includes("night");

  if (normalized.includes("thunder")) {
    return { label: "Temporal", icon: "storm", severity: 5 };
  }
  if (
    normalized.includes("rain") ||
    normalized.includes("sleet") ||
    normalized.includes("snow") ||
    normalized.includes("showers")
  ) {
    return { label: "Chuva", icon: "rain", severity: 4 };
  }
  if (normalized.includes("fog")) {
    return { label: "Neblina", icon: "cloud", severity: 3 };
  }
  if (normalized.includes("cloudy")) {
    return { label: "Céu nublado", icon: "cloud", severity: 2 };
  }
  if (normalized.includes("partlycloudy") || normalized.includes("fair")) {
    return {
      label: isNight ? "Noite parcialmente nublada" : "Sol entre nuvens",
      icon: isNight ? "partly-cloudy-night" : "partly-cloudy",
      severity: 1,
    };
  }
  if (normalized.includes("clearsky")) {
    return {
      label: isNight ? "Noite de céu limpo" : "Céu limpo",
      icon: isNight ? "moon" : "sun",
      severity: 0,
    };
  }

  return { label: "Tempo variável", icon: "cloud", severity: 2 };
}

function pointPeriod(point: MetPoint) {
  return point.data.next_1_hours ?? point.data.next_6_hours ?? point.data.next_12_hours;
}

function pointPresentation(point: MetPoint) {
  return symbolPresentation(pointPeriod(point)?.summary?.symbol_code);
}

function metersPerSecondToKilometersPerHour(value: number | undefined) {
  return value === undefined ? null : Math.round(value * 3.6);
}

function precipitationProbability(point: MetPoint) {
  const period = pointPeriod(point);
  const explicit = period?.details?.probability_of_precipitation;
  if (explicit !== undefined) return Math.max(0, Math.min(100, Math.round(explicit)));

  const amount = period?.details?.precipitation_amount ?? 0;
  const presentation = pointPresentation(point);
  return amount > 0 || presentation.severity >= 4 ? 100 : 0;
}

function precipitationAmount(point: MetPoint) {
  return pointPeriod(point)?.details?.precipitation_amount ?? 0;
}

function normalizeHourly(points: MetPoint[]): HourlyForecast[] {
  return points.slice(0, 7).map((point, index) => {
    const details = point.data.instant.details;
    const presentation = pointPresentation(point);
    const windSpeed = metersPerSecondToKilometersPerHour(details.wind_speed) ?? 0;
    const windGust = metersPerSecondToKilometersPerHour(details.wind_speed_of_gust) ?? windSpeed;

    return {
      time: index === 0 ? "Agora" : `${formatClock(point.time).slice(0, 2)}h`,
      temperature: Math.round(details.air_temperature),
      precipitationProbability: precipitationProbability(point),
      windSpeed,
      windGust,
      icon: presentation.icon,
    };
  });
}

function normalizeDaily(points: MetPoint[]): DailyForecast[] {
  const groups = new Map<string, DailyAccumulator>();

  for (const point of points) {
    const date = localDate(point.time);
    if (!groups.has(date)) {
      if (groups.size >= 7) continue;
      groups.set(date, {
        date,
        temperatures: [],
        precipitation: 0,
        probabilities: [],
        windGusts: [],
        presentations: [],
      });
    }

    const group = groups.get(date);
    if (!group) continue;

    const details = point.data.instant.details;
    const windSpeed = metersPerSecondToKilometersPerHour(details.wind_speed) ?? 0;
    const windGust = metersPerSecondToKilometersPerHour(details.wind_speed_of_gust) ?? windSpeed;

    group.temperatures.push(details.air_temperature);
    group.precipitation += precipitationAmount(point);
    group.probabilities.push(precipitationProbability(point));
    group.windGusts.push(windGust);
    group.presentations.push(pointPresentation(point));
  }

  return [...groups.values()].map((group, index) => {
    const presentation = group.presentations.reduce(
      (selected, item) => (item.severity > selected.severity ? item : selected),
      group.presentations[0] ?? symbolPresentation(undefined),
    );

    return {
      weekday: formatDay(group.date, index),
      date: formatDate(group.date),
      min: Math.round(Math.min(...group.temperatures)),
      max: Math.round(Math.max(...group.temperatures)),
      rainChance: Math.max(...group.probabilities, 0),
      precipitationMm: Number(group.precipitation.toFixed(1)),
      windGust: Math.max(...group.windGusts, 0),
      icon: presentation.icon,
    };
  });
}

function createForecastUrl() {
  const params = new URLSearchParams({
    lat: String(PELOTAS.latitude),
    lon: String(PELOTAS.longitude),
    altitude: String(PELOTAS.altitude),
  });
  return `${FORECAST_ENDPOINT}?${params.toString()}`;
}

export async function fetchMetNorwayWeather(): Promise<WeatherHomeData> {
  try {
    const response = await fetch(createForecastUrl(), {
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`MET Norway respondeu com status ${response.status}`);
    }

    const parsed = metNorwaySchema.safeParse(await response.json());
    if (!parsed.success) {
      console.error("[weather/met-norway] Resposta inválida", {
        issues: parsed.error.issues.slice(0, 12).map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
      return createUnavailableWeather(
        "O MET Norway respondeu com dados que não puderam ser processados.",
      );
    }

    const points = parsed.data.properties.timeseries;
    const currentPoint = points[0];
    const details = currentPoint.data.instant.details;
    const presentation = pointPresentation(currentPoint);
    const windSpeed = metersPerSecondToKilometersPerHour(details.wind_speed);
    const windGust = metersPerSecondToKilometersPerHour(details.wind_speed_of_gust);
    const hourly = normalizeHourly(points);
    const daily = normalizeDaily(points);

    return {
      status: "live",
      current: {
        city: PELOTAS.city,
        state: PELOTAS.state,
        temperature: Math.round(details.air_temperature),
        feelsLike: null,
        condition: presentation.label,
        humidity:
          details.relative_humidity === undefined ? null : Math.round(details.relative_humidity),
        pressure:
          details.air_pressure_at_sea_level === undefined
            ? null
            : Math.round(details.air_pressure_at_sea_level),
        windSpeed,
        windGust: windGust ?? windSpeed,
        windDirection: degreesToCompass(details.wind_from_direction),
        visibilityKm: null,
        sunrise: null,
        sunset: null,
        observedAt: formatClock(currentPoint.time),
        icon: presentation.icon,
      },
      hourly,
      daily,
      source: {
        name: "MET Norway",
        url: SOURCE_URL,
        kind: "forecast",
        fetchedAt: new Date().toISOString(),
        isFallback: true,
      },
      message: null,
    };
  } catch (error) {
    console.error("[weather/met-norway] Falha ao carregar previsão", {
      message: error instanceof Error ? error.message : String(error),
    });
    return createUnavailableWeather(
      "A previsão de contingência também está temporariamente indisponível.",
    );
  }
}
