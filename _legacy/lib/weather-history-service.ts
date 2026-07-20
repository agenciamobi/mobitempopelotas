import type {
  HistoricalWeatherDay,
  HistoricalWeatherSummary,
  WeatherHistoryData,
} from "@/lib/weather-history";
import { listWeatherSnapshots } from "@/lib/weather-snapshot-store";

const HISTORICAL_ENDPOINT = "https://historical-forecast-api.open-meteo.com/v1/forecast";
const HISTORICAL_SOURCE_NAME = "Open-Meteo Historical Forecast";
const HISTORICAL_SOURCE_URL = "https://open-meteo.com/en/docs/historical-forecast-api";
const TIMEZONE = "America/Sao_Paulo";
const REVALIDATE_SECONDS = 21600;
const PELOTAS = { latitude: -31.7654, longitude: -52.3376 } as const;

type HistoricalForecastResponse = {
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    wind_gusts_10m_max: number[];
  };
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

function average(values: number[]) {
  if (!values.length) return 0;
  return Math.round((values.reduce((total, value) => total + value, 0) / values.length) * 10) / 10;
}

function buildSummary(days: HistoricalWeatherDay[]): HistoricalWeatherSummary {
  const warmestDay = days.reduce((selected, day) =>
    day.temperatureMax > selected.temperatureMax ? day : selected,
  );
  const coldestDay = days.reduce((selected, day) =>
    day.temperatureMin < selected.temperatureMin ? day : selected,
  );
  const wettestDay = days.reduce((selected, day) =>
    day.precipitation > selected.precipitation ? day : selected,
  );

  return {
    periodLabel: `${days[0].label} a ${days.at(-1)?.label ?? days[0].label}`,
    averageMax: average(days.map((day) => day.temperatureMax)),
    averageMin: average(days.map((day) => day.temperatureMin)),
    totalPrecipitation:
      Math.round(days.reduce((total, day) => total + day.precipitation, 0) * 10) / 10,
    strongestWindGust: Math.max(...days.map((day) => day.windGust)),
    warmestDay,
    coldestDay,
    wettestDay,
  };
}

function createFallbackDays(): HistoricalWeatherDay[] {
  const today = localDateString();
  return Array.from({ length: 30 }, (_, index) => {
    const date = shiftDate(today, index - 30);
    const wave = Math.sin(index / 3.4);
    const { label, weekday } = formatDay(date);

    return {
      date,
      label,
      weekday,
      temperatureMax: Math.round(17 + wave * 4 + (index % 5) * 0.35),
      temperatureMin: Math.round(9 + wave * 2.6 + (index % 4) * 0.25),
      precipitation: index % 6 === 0 ? Number((4 + (index % 9) * 1.3).toFixed(1)) : index % 4 === 0 ? 1.2 : 0,
      windGust: Math.round(24 + Math.abs(wave) * 18 + (index % 7)),
    };
  });
}

function normalizeHistory(response: HistoricalForecastResponse): HistoricalWeatherDay[] {
  return response.daily.time.map((date, index) => {
    const { label, weekday } = formatDay(date);

    return {
      date,
      label,
      weekday,
      temperatureMax: Math.round(response.daily.temperature_2m_max[index] ?? 0),
      temperatureMin: Math.round(response.daily.temperature_2m_min[index] ?? 0),
      precipitation: Number((response.daily.precipitation_sum[index] ?? 0).toFixed(1)),
      windGust: Math.round(response.daily.wind_gusts_10m_max[index] ?? 0),
    };
  });
}

function mergeHistoryDays(
  externalDays: HistoricalWeatherDay[],
  storedDays: HistoricalWeatherDay[],
) {
  const daysByDate = new Map(externalDays.map((day) => [day.date, day]));

  for (const day of storedDays) {
    daysByDate.set(day.date, day);
  }

  return Array.from(daysByDate.values())
    .sort((first, second) => first.date.localeCompare(second.date))
    .slice(-30);
}

async function fetchHistoryRange(startDate: string, endDate: string) {
  const params = new URLSearchParams({
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

  const response = await fetch(`${HISTORICAL_ENDPOINT}?${params}`, {
    next: { revalidate: REVALIDATE_SECONDS },
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Open-Meteo histórico respondeu com status ${response.status}`);
  }

  return (await response.json()) as HistoricalForecastResponse;
}

export async function getPelotasHistoricalDay(date?: string): Promise<HistoricalWeatherDay> {
  const targetDate = date ?? shiftDate(localDateString(), -1);
  const response = await fetchHistoryRange(targetDate, targetDate);
  const day = normalizeHistory(response)[0];

  if (!day) {
    throw new Error(`A fonte histórica não retornou dados para ${targetDate}`);
  }

  return day;
}

export async function getPelotasWeatherHistory(): Promise<WeatherHistoryData> {
  let storedDays: HistoricalWeatherDay[] = [];

  try {
    storedDays = await listWeatherSnapshots(30);
  } catch (error) {
    console.error("Falha ao consultar snapshots meteorológicos próprios:", error);
  }

  try {
    const today = localDateString();
    const endDate = shiftDate(today, -1);
    const startDate = shiftDate(endDate, -29);
    const response = await fetchHistoryRange(startDate, endDate);
    const externalDays = normalizeHistory(response);
    const days = mergeHistoryDays(externalDays, storedDays);

    if (!days.length) throw new Error("A fonte histórica não retornou dias válidos");

    return {
      days,
      summary: buildSummary(days),
      source: {
        name: storedDays.length
          ? `Arquivo próprio (${storedDays.length} dias) + ${HISTORICAL_SOURCE_NAME}`
          : HISTORICAL_SOURCE_NAME,
        url: HISTORICAL_SOURCE_URL,
        isFallback: false,
      },
    };
  } catch (error) {
    console.error("Falha ao carregar o histórico meteorológico externo:", error);

    if (storedDays.length) {
      const days = storedDays.slice(-30);

      return {
        days,
        summary: buildSummary(days),
        source: {
          name: "Arquivo meteorológico próprio",
          url: "",
          isFallback: false,
        },
      };
    }

    const days = createFallbackDays();

    return {
      days,
      summary: buildSummary(days),
      source: {
        name: "dados históricos demonstrativos",
        url: "",
        isFallback: true,
      },
    };
  }
}
