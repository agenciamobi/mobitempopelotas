import { z } from "zod";

import type {
  HistoricalWeatherDay,
  HistoricalWeatherSummary,
  WeatherHistoryData,
} from "./history.types";

const TIMEZONE = "America/Sao_Paulo";
const REQUEST_TIMEOUT_MS = 10_000;
const HISTORY_DAYS = 30;
const PELOTAS = { latitude: -31.7654, longitude: -52.3376 } as const;

const HISTORY_SOURCES = [
  {
    id: "historical-forecast",
    name: "Open-Meteo Historical Forecast",
    endpoint: "https://historical-forecast-api.open-meteo.com/v1/forecast",
    url: "https://open-meteo.com/en/docs/historical-forecast-api",
  },
  {
    id: "archive",
    name: "Open-Meteo Archive",
    endpoint: "https://archive-api.open-meteo.com/v1/archive",
    url: "https://open-meteo.com/en/docs/historical-weather-api",
  },
] as const;

const finiteNumber = z.number().finite();
const nullableNumberArray = z.array(finiteNumber.nullable()).min(1);
const dateArray = z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1);

const historicalResponseSchema = z
  .object({
    daily: z.object({
      time: dateArray,
      temperature_2m_max: nullableNumberArray,
      temperature_2m_min: nullableNumberArray,
      precipitation_sum: nullableNumberArray,
      wind_gusts_10m_max: nullableNumberArray,
    }),
  })
  .superRefine((data, context) => {
    const expectedLength = data.daily.time.length;
    for (const [key, values] of Object.entries(data.daily)) {
      if (values.length !== expectedLength) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["daily", key],
          message: "Série histórica incompleta",
        });
      }
    }
  });

type HistoricalResponse = z.infer<typeof historicalResponseSchema>;
type HistorySource = (typeof HISTORY_SOURCES)[number];

function localDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function shiftDate(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function formatDay(date: string) {
  const value = new Date(`${date}T12:00:00-03:00`);
  const label = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: TIMEZONE,
  })
    .format(value)
    .replace(" de ", " ")
    .replace(".", "");
  const weekday = new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    timeZone: TIMEZONE,
  })
    .format(value)
    .replace(".", "")
    .replace(/^./, (letter) => letter.toUpperCase());

  return { label, weekday };
}

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function average(values: number[]) {
  return round(values.reduce((total, value) => total + value, 0) / values.length);
}

function buildSummary(days: HistoricalWeatherDay[]): HistoricalWeatherSummary {
  const warmestDay = days.reduce((selected, day) =>
    day.temperatureMax > selected.temperatureMax ? day : selected,
  );
  const coldestDay = days.reduce((selected, day) =>
    day.temperatureMin < selected.temperatureMin ? day : selected,
  );
  const precipitationDays = days.filter((day) => day.precipitation !== null);
  const gustDays = days.filter((day) => day.windGust !== null);
  const wettestDay =
    precipitationDays.length > 0
      ? precipitationDays.reduce((selected, day) =>
          (day.precipitation ?? -1) > (selected.precipitation ?? -1) ? day : selected,
        )
      : null;
  const windiestDay =
    gustDays.length > 0
      ? gustDays.reduce((selected, day) =>
          (day.windGust ?? -1) > (selected.windGust ?? -1) ? day : selected,
        )
      : null;

  return {
    periodLabel: `${days[0].label} a ${days.at(-1)?.label ?? days[0].label}`,
    averageMax: average(days.map((day) => day.temperatureMax)),
    averageMin: average(days.map((day) => day.temperatureMin)),
    totalPrecipitation:
      precipitationDays.length > 0
        ? round(precipitationDays.reduce((total, day) => total + (day.precipitation ?? 0), 0))
        : null,
    strongestWindGust: windiestDay?.windGust ?? null,
    warmestDay,
    coldestDay,
    wettestDay,
    windiestDay,
  };
}

function normalizeHistory(response: HistoricalResponse) {
  return response.daily.time.flatMap((date, index): HistoricalWeatherDay[] => {
    const temperatureMax = response.daily.temperature_2m_max[index];
    const temperatureMin = response.daily.temperature_2m_min[index];
    if (temperatureMax === null || temperatureMin === null) return [];

    const { label, weekday } = formatDay(date);
    const precipitation = response.daily.precipitation_sum[index];
    const windGust = response.daily.wind_gusts_10m_max[index];

    return [
      {
        date,
        label,
        weekday,
        temperatureMax: round(temperatureMax),
        temperatureMin: round(temperatureMin),
        precipitation: precipitation === null ? null : round(precipitation),
        windGust: windGust === null ? null : round(windGust),
      },
    ];
  });
}

function createQueryParams() {
  const today = localDateString();
  const endDate = shiftDate(today, -1);
  const startDate = shiftDate(endDate, -(HISTORY_DAYS - 1));

  return new URLSearchParams({
    latitude: String(PELOTAS.latitude),
    longitude: String(PELOTAS.longitude),
    timezone: TIMEZONE,
    start_date: startDate,
    end_date: endDate,
    daily: [
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "wind_gusts_10m_max",
    ].join(","),
  });
}

async function fetchHistorySource(source: HistorySource, params: URLSearchParams) {
  const response = await fetch(`${source.endpoint}?${params}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "MOBI-Tempo-Pelotas/1.0 (+https://agenciamobi.com.br)",
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`${source.name} respondeu com HTTP ${response.status}.`);
  }

  const parsed = historicalResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error(`${source.name} respondeu com uma estrutura inesperada.`);
  }

  const days = normalizeHistory(parsed.data).slice(-HISTORY_DAYS);
  if (days.length === 0) {
    throw new Error(`${source.name} não devolveu dias válidos para Pelotas.`);
  }

  return days;
}

function unavailable(error: string, fetchedAt: string): WeatherHistoryData {
  return {
    status: "unavailable",
    days: [],
    summary: null,
    source: {
      name: "Open-Meteo Historical APIs",
      url: HISTORY_SOURCES[0].url,
      fetchedAt,
      periodStart: null,
      periodEnd: null,
    },
    error,
  };
}

function createHistoryData(
  days: HistoricalWeatherDay[],
  source: HistorySource,
  fetchedAt: string,
): WeatherHistoryData {
  return {
    status: days.length === HISTORY_DAYS ? "live" : "partial",
    days,
    summary: buildSummary(days),
    source: {
      name: source.name,
      url: source.url,
      fetchedAt,
      periodStart: days[0]?.date ?? null,
      periodEnd: days.at(-1)?.date ?? null,
    },
    error:
      days.length === HISTORY_DAYS
        ? null
        : `${source.name} retornou apenas ${days.length} dos ${HISTORY_DAYS} dias solicitados.`,
  };
}

export async function fetchPelotasWeatherHistory(): Promise<WeatherHistoryData> {
  const fetchedAt = new Date().toISOString();
  const params = createQueryParams();
  const failures: string[] = [];

  for (const source of HISTORY_SOURCES) {
    try {
      const days = await fetchHistorySource(source, params);
      if (source.id !== HISTORY_SOURCES[0].id) {
        console.warn("[weather/history] Fonte principal indisponível; contingência utilizada", {
          source: source.name,
          failures,
        });
      }
      return createHistoryData(days, source, fetchedAt);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(message);
      console.warn("[weather/history] Fonte histórica indisponível", {
        source: source.name,
        message,
      });
    }
  }

  const error =
    failures.length > 0 ? failures.join(" ") : "Falha desconhecida ao consultar o histórico.";
  console.error("[weather/history] Todas as fontes históricas falharam", { failures });
  return unavailable(error, fetchedAt);
}
