import type { InmetForecastPeriod } from "./official-sources.types";

type DailyTemperatureRange = {
  min: number;
  max: number;
};

type OfficialTemperatureRange = {
  minimum: number | null;
  maximum: number | null;
};

const TIMEZONE = "America/Sao_Paulo";

function localDateParts(value: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((item) => item.type === type)?.value ?? 0);

  return {
    year: part("year"),
    month: part("month"),
    day: part("day"),
  };
}

export function localForecastDateKey(offset: number, now = new Date()) {
  const { year, month, day } = localDateParts(now);
  const date = new Date(Date.UTC(year, month - 1, day + offset));
  return date.toISOString().slice(0, 10);
}

function officialRanges(periods: InmetForecastPeriod[]) {
  const ranges = new Map<string, OfficialTemperatureRange>();

  for (const period of periods) {
    if (!period.date) continue;
    const current = ranges.get(period.date) ?? { minimum: null, maximum: null };
    const minimum =
      period.minimum === null || period.minimum === undefined
        ? current.minimum
        : current.minimum === null
          ? period.minimum
          : Math.min(current.minimum, period.minimum);
    const maximum =
      period.maximum === null || period.maximum === undefined
        ? current.maximum
        : current.maximum === null
          ? period.maximum
          : Math.max(current.maximum, period.maximum);

    ranges.set(period.date, { minimum, maximum });
  }

  return ranges;
}

export function reconcileDailyTemperatures<T extends DailyTemperatureRange>(
  daily: T[],
  periods: InmetForecastPeriod[],
  now = new Date(),
): T[] {
  if (daily.length === 0 || periods.length === 0) return daily;

  const ranges = officialRanges(periods);

  return daily.map((day, index) => {
    const official = ranges.get(localForecastDateKey(index, now));
    if (!official) return day;

    const minimum = official.minimum ?? day.min;
    const maximum = official.maximum ?? day.max;
    if (!Number.isFinite(minimum) || !Number.isFinite(maximum) || minimum > maximum) return day;
    if (minimum === day.min && maximum === day.max) return day;

    return {
      ...day,
      min: minimum,
      max: maximum,
    };
  });
}
