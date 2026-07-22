import { z } from "zod";

import type {
  HistoricalWeatherDay,
  HistoricalWeatherSummary,
  WeatherHistoryData,
} from "./history.types";

const TIMEZONE = "America/Sao_Paulo";
const REQUEST_TIMEOUT_MS = 10_000;
const NASA_REQUEST_TIMEOUT_MS = 20_000;
const HISTORY_DAYS = 30;
const NASA_LOOKBACK_DAYS = 90;
const PELOTAS = { latitude: -31.7654, longitude: -52.3376 } as const;

const OPEN_METEO_HISTORY_SOURCES = [
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

const NASA_POWER_SOURCE = {
  id: "nasa-power",
  name: "NASA POWER Daily",
  endpoint: "https://power.larc.nasa.gov/api/temporal/daily/point",
  url: "https://power.larc.nasa.gov/docs/services/api/temporal/daily/",
} as const;

const finiteNumber = z.number().finite();
const nullableNumberArray = z.array(finiteNumber.nullable()).min(1);
const dateArray = z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1);
const nasaDailySeries = z.record(finiteNumber);

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

const nasaPowerResponseSchema = z.object({
  header: z
    .object({
      fill_value: finiteNumber.optional(),
    })
    .passthrough(),
  properties: z.object({
    parameter: z.object({
      T2M_MAX: nasaDailySeries,
      T2M_MIN: nasaDailySeries,
      PRECTOTCORR: nasaDailySeries,
    }),
  }),
});

type HistoricalResponse = z.infer<typeof historicalResponseSchema>;
type NasaPowerResponse = z.infer<typeof nasaPowerResponseSchema>;
type OpenMeteoHistorySource = (typeof OPEN_METEO_HISTORY_SOURCES)[number];
type HistorySourceInfo = {
  id: string;
  name: string;
  url: string;
};

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

function formatDateForMessage(date: string) {
  const value = new Date(`${date}T12:00:00-03:00`);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: TIMEZONE,
  }).format(value);
}

function dateDifferenceDays(laterDate: string, earlierDate: string) {
  const later = new Date(`${laterDate}T12:00:00Z`).getTime();
  const earlier = new Date(`${earlierDate}T12:00:00Z`).getTime();
  return Math.max(0, Math.round((later - earlier) / 86_400_000));
}

function nasaDateToIso(date: string) {
  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
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

function normalizeOpenMeteoHistory(response: HistoricalResponse) {
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

function normalizeNasaPowerHistory(response: NasaPowerResponse) {
  const fillValue = response.header.fill_value ?? -999;
  const parameters = response.properties.parameter;

  return Object.keys(parameters.T2M_MAX)
    .filter((date) => /^\d{8}$/.test(date))
    .sort()
    .flatMap((date): HistoricalWeatherDay[] => {
      const temperatureMax = parameters.T2M_MAX[date];
      const temperatureMin = parameters.T2M_MIN[date];
      if (
        temperatureMax === undefined ||
        temperatureMin === undefined ||
        temperatureMax === fillValue ||
        temperatureMin === fillValue
      ) {
        return [];
      }

      const precipitationValue = parameters.PRECTOTCORR[date];
      const precipitation =
        precipitationValue === undefined || precipitationValue === fillValue
          ? null
          : round(precipitationValue);
      const isoDate = nasaDateToIso(date);
      const { label, weekday } = formatDay(isoDate);

      return [
        {
          date: isoDate,
          label,
          weekday,
          temperatureMax: round(temperatureMax),
          temperatureMin: round(temperatureMin),
          precipitation,
          windGust: null,
        },
      ];
    })
    .slice(-HISTORY_DAYS);
}

function historyPeriod() {
  const today = localDateString();
  const endDate = shiftDate(today, -1);
  const startDate = shiftDate(endDate, -(HISTORY_DAYS - 1));
  return { startDate, endDate };
}

function createOpenMeteoQueryParams(startDate: string, endDate: string) {
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

function createNasaPowerQueryParams(endDate: string) {
  const startDate = shiftDate(endDate, -(NASA_LOOKBACK_DAYS - 1));
  return new URLSearchParams({
    parameters: "T2M_MAX,T2M_MIN,PRECTOTCORR",
    community: "AG",
    longitude: String(PELOTAS.longitude),
    latitude: String(PELOTAS.latitude),
    start: startDate.replaceAll("-", ""),
    end: endDate.replaceAll("-", ""),
    format: "JSON",
    "time-standard": "UTC",
  });
}

async function fetchOpenMeteoHistory(source: OpenMeteoHistorySource, params: URLSearchParams) {
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

  const days = normalizeOpenMeteoHistory(parsed.data).slice(-HISTORY_DAYS);
  if (days.length === 0) {
    throw new Error(`${source.name} não devolveu dias válidos para Pelotas.`);
  }

  return days;
}

async function fetchNasaPowerHistory(endDate: string) {
  const params = createNasaPowerQueryParams(endDate);
  const response = await fetch(`${NASA_POWER_SOURCE.endpoint}?${params}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "MOBI-Tempo-Pelotas/1.0 (+https://agenciamobi.com.br)",
    },
    signal: AbortSignal.timeout(NASA_REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`${NASA_POWER_SOURCE.name} respondeu com HTTP ${response.status}.`);
  }

  const parsed = nasaPowerResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error(`${NASA_POWER_SOURCE.name} respondeu com uma estrutura inesperada.`);
  }

  const days = normalizeNasaPowerHistory(parsed.data);
  if (days.length === 0) {
    throw new Error(`${NASA_POWER_SOURCE.name} não devolveu dias válidos para Pelotas.`);
  }

  return days;
}

function unavailable(error: string, fetchedAt: string): WeatherHistoryData {
  return {
    status: "unavailable",
    days: [],
    summary: null,
    source: {
      name: "Open-Meteo / NASA POWER",
      url: NASA_POWER_SOURCE.url,
      fetchedAt,
      periodStart: null,
      periodEnd: null,
    },
    error,
  };
}

function createHistoryData(
  days: HistoricalWeatherDay[],
  source: HistorySourceInfo,
  fetchedAt: string,
  expectedEndDate: string,
): WeatherHistoryData {
  const periodEnd = days.at(-1)?.date ?? null;
  const lagDays = periodEnd ? dateDifferenceDays(expectedEndDate, periodEnd) : 0;
  const notes: string[] = [];

  if (days.length !== HISTORY_DAYS) {
    notes.push(
      `${source.name} retornou apenas ${days.length} dos ${HISTORY_DAYS} dias solicitados.`,
    );
  }
  if (periodEnd && lagDays > 0) {
    notes.push(
      `${source.name} possui dados até ${formatDateForMessage(periodEnd)}, ${lagDays} ${lagDays === 1 ? "dia" : "dias"} antes do fim solicitado.`,
    );
  }
  if (source.id === NASA_POWER_SOURCE.id) {
    notes.push(
      "A NASA POWER não fornece rajadas compatíveis com este histórico; esse campo permanece não informado.",
    );
  }

  return {
    status: notes.length === 0 ? "live" : "partial",
    days,
    summary: buildSummary(days),
    source: {
      name: source.name,
      url: source.url,
      fetchedAt,
      periodStart: days[0]?.date ?? null,
      periodEnd,
    },
    error: notes.length > 0 ? notes.join(" ") : null,
  };
}

export async function fetchPelotasWeatherHistory(): Promise<WeatherHistoryData> {
  const fetchedAt = new Date().toISOString();
  const { startDate, endDate } = historyPeriod();
  const openMeteoParams = createOpenMeteoQueryParams(startDate, endDate);
  const failures: string[] = [];

  for (const source of OPEN_METEO_HISTORY_SOURCES) {
    try {
      const days = await fetchOpenMeteoHistory(source, openMeteoParams);
      if (source.id !== OPEN_METEO_HISTORY_SOURCES[0].id) {
        console.warn("[weather/history] Fonte principal indisponível; contingência utilizada", {
          source: source.name,
          failures,
        });
      }
      return createHistoryData(days, source, fetchedAt, endDate);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(message);
      console.warn("[weather/history] Fonte histórica indisponível", {
        source: source.name,
        message,
      });
    }
  }

  try {
    const days = await fetchNasaPowerHistory(endDate);
    console.warn("[weather/history] Open-Meteo indisponível; NASA POWER utilizada", {
      source: NASA_POWER_SOURCE.name,
      failures,
    });
    return createHistoryData(days, NASA_POWER_SOURCE, fetchedAt, endDate);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    failures.push(message);
    console.warn("[weather/history] Fonte histórica indisponível", {
      source: NASA_POWER_SOURCE.name,
      message,
    });
  }

  const error =
    failures.length > 0 ? failures.join(" ") : "Falha desconhecida ao consultar o histórico.";
  console.error("[weather/history] Todas as fontes históricas falharam", { failures });
  return unavailable(error, fetchedAt);
}
