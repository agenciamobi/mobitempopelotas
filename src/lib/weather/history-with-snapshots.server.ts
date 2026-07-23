import { absoluteUrl } from "@/lib/site-config";

import { fetchPelotasWeatherHistory } from "./history.server";
import type {
  HistoricalWeatherDay,
  HistoricalWeatherSummary,
  WeatherHistoryData,
} from "./history.types";
import { listWeatherSnapshots } from "./weather-snapshot-store.server";

const HISTORY_DAYS = 30;

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

function mergeHistoryDays(
  externalDays: HistoricalWeatherDay[],
  storedDays: HistoricalWeatherDay[],
) {
  const daysByDate = new Map(storedDays.map((day) => [day.date, day]));

  for (const day of externalDays) {
    daysByDate.set(day.date, day);
  }

  return Array.from(daysByDate.values())
    .sort((first, second) => first.date.localeCompare(second.date))
    .slice(-HISTORY_DAYS);
}

function storedHistory(
  storedDays: HistoricalWeatherDay[],
  externalHistory: WeatherHistoryData,
): WeatherHistoryData {
  const days = storedDays.slice(-HISTORY_DAYS);
  const externalError = externalHistory.error
    ? ` Motivo informado pelas fontes: ${externalHistory.error}`
    : "";

  return {
    status: "partial",
    days,
    summary: buildSummary(days),
    source: {
      name: "Arquivo meteorológico próprio do Tempo Pelotas",
      url: absoluteUrl("/metodologia"),
      fetchedAt: new Date().toISOString(),
      periodStart: days[0]?.date ?? null,
      periodEnd: days.at(-1)?.date ?? null,
    },
    error: `As fontes históricas externas estão temporariamente indisponíveis. O portal está exibindo somente dias já arquivados, sem preencher lacunas com números simulados.${externalError}`,
  };
}

export async function fetchPelotasWeatherHistoryWithSnapshots(): Promise<WeatherHistoryData> {
  let storedDays: HistoricalWeatherDay[] = [];

  try {
    storedDays = await listWeatherSnapshots(HISTORY_DAYS);
  } catch (error) {
    console.warn("[weather/history] Falha ao consultar o arquivo meteorológico próprio", {
      message: error instanceof Error ? error.message : String(error),
    });
  }

  const externalHistory = await fetchPelotasWeatherHistory();

  if (externalHistory.status === "unavailable") {
    return storedDays.length > 0 ? storedHistory(storedDays, externalHistory) : externalHistory;
  }

  if (storedDays.length === 0) return externalHistory;

  const externalDates = new Set(externalHistory.days.map((day) => day.date));
  const archivedGapCount = storedDays.filter((day) => !externalDates.has(day.date)).length;
  const days = mergeHistoryDays(externalHistory.days, storedDays);
  if (days.length === 0) return externalHistory;

  return {
    ...externalHistory,
    days,
    summary: buildSummary(days),
    source: {
      ...externalHistory.source,
      name:
        archivedGapCount > 0
          ? `Arquivo próprio do Tempo Pelotas + ${externalHistory.source.name}`
          : externalHistory.source.name,
      periodStart: days[0]?.date ?? externalHistory.source.periodStart,
      periodEnd: days.at(-1)?.date ?? externalHistory.source.periodEnd,
    },
  };
}
