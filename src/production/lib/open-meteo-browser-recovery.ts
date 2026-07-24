import { useEffect, useState } from "react";

import type {
  DailyForecast,
  HourlyForecast,
  WeatherData,
  WeatherIconName,
} from "@/production/lib/weather-data";

const OPEN_METEO_URL = "https://open-meteo.com/";
const REQUEST_TIMEOUT_MS = 12_000;

type OpenMeteoPayload = {
  current?: { time?: unknown };
  hourly?: Record<string, unknown>;
  daily?: Record<string, unknown>;
};

function stringArray(value: unknown): string[] | null {
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : null;
}

function numberArray(value: unknown): Array<number | null> | null {
  return Array.isArray(value) &&
    value.every((item) => item === null || (typeof item === "number" && Number.isFinite(item)))
    ? value
    : null;
}

function presentation(code: number | null, isDay = true): WeatherIconName {
  if (code === 0) return isDay ? "sun" : "moon";
  if (code === 1 || code === 2) return isDay ? "partly-cloudy" : "partly-cloudy-night";
  if (code === 3 || code === 45 || code === 48) return "cloud";
  if ((code !== null && code >= 51 && code <= 86) || (code !== null && code >= 95)) {
    return code >= 95 ? "storm" : "rain";
  }
  return "cloud";
}

function clockLabel(value: string, index: number) {
  if (index === 0) return "Próxima hora";
  const time = value.split("T")[1];
  return time ? `${time.slice(0, 2)}h` : value;
}

function weekdayLabel(date: string, index: number) {
  if (index === 0) return "Hoje";
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" })
    .format(new Date(`${date}T12:00:00Z`))
    .replace(".", "")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function dateLabel(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  })
    .format(new Date(`${date}T12:00:00Z`))
    .replace(" de ", " ")
    .replace(".", "");
}

function normalizeHourly(payload: OpenMeteoPayload): HourlyForecast[] | null {
  const hourly = payload.hourly;
  const currentTime = typeof payload.current?.time === "string" ? payload.current.time : null;
  if (!hourly || !currentTime) return null;

  const times = stringArray(hourly.time);
  const temperatures = numberArray(hourly.temperature_2m);
  const precipitation = numberArray(hourly.precipitation_probability);
  const windSpeed = numberArray(hourly.wind_speed_10m);
  const windGusts = numberArray(hourly.wind_gusts_10m);
  const weatherCodes = numberArray(hourly.weather_code);
  const isDay = numberArray(hourly.is_day);
  if (
    !times ||
    !temperatures ||
    !precipitation ||
    !windSpeed ||
    !windGusts ||
    !weatherCodes ||
    !isDay
  ) {
    return null;
  }

  const start = Math.max(
    0,
    times.findIndex((time) => time >= currentTime),
  );
  const result: HourlyForecast[] = [];

  for (let offset = 0; offset < 7; offset += 1) {
    const index = start + offset;
    const time = times[index];
    const temperature = temperatures[index];
    const speed = windSpeed[index];
    if (!time || temperature === null || speed === null) return null;

    result.push({
      time: clockLabel(time, offset),
      temperature: Math.round(temperature),
      precipitation:
        precipitation[index] === null ? null : Math.round(precipitation[index] as number),
      windSpeed: Math.round(speed),
      windGust: windGusts[index] === null ? null : Math.round(windGusts[index] as number),
      icon: presentation(weatherCodes[index] ?? null, isDay[index] !== 0),
    });
  }

  return result;
}

function normalizeDaily(payload: OpenMeteoPayload): DailyForecast[] | null {
  const daily = payload.daily;
  if (!daily) return null;

  const times = stringArray(daily.time);
  const minimums = numberArray(daily.temperature_2m_min);
  const maximums = numberArray(daily.temperature_2m_max);
  const rainChances = numberArray(daily.precipitation_probability_max);
  const precipitation = numberArray(daily.precipitation_sum);
  const windGusts = numberArray(daily.wind_gusts_10m_max);
  const weatherCodes = numberArray(daily.weather_code);
  if (
    !times ||
    !minimums ||
    !maximums ||
    !rainChances ||
    !precipitation ||
    !windGusts ||
    !weatherCodes
  ) {
    return null;
  }

  const result: DailyForecast[] = [];
  for (let index = 0; index < Math.min(7, times.length); index += 1) {
    const date = times[index];
    const minimum = minimums[index];
    const maximum = maximums[index];
    const volume = precipitation[index];
    if (!date || minimum === null || maximum === null || volume === null) return null;

    result.push({
      weekday: weekdayLabel(date, index),
      date: dateLabel(date),
      min: Math.round(minimum),
      max: Math.round(maximum),
      rainChance: rainChances[index] === null ? null : Math.round(rainChances[index] as number),
      precipitation: Number(volume.toFixed(1)),
      windGust: windGusts[index] === null ? null : Math.round(windGusts[index] as number),
      icon: presentation(weatherCodes[index] ?? null),
    });
  }

  return result.length > 0 ? result : null;
}

export function needsOpenMeteoRecovery(weather: WeatherData) {
  return (
    weather.hourly.length < 7 ||
    weather.daily.length === 0 ||
    weather.hourly.some(
      (hour) => hour.precipitation === null || hour.windGust === null,
    ) ||
    weather.daily.some((day) => day.rainChance === null || day.windGust === null)
  );
}

export function recoverWeatherDataFromOpenMeteo(
  weather: WeatherData,
  payload: unknown,
): WeatherData | null {
  if (!payload || typeof payload !== "object") return null;
  const hourly = normalizeHourly(payload as OpenMeteoPayload);
  const daily = normalizeDaily(payload as OpenMeteoPayload);
  if (!hourly || !daily) return null;

  return {
    ...weather,
    hourly,
    daily,
    source: {
      ...weather.source,
      forecastName: "Open-Meteo",
      forecastUrl: OPEN_METEO_URL,
    },
  };
}

function createForecastUrl() {
  const params = new URLSearchParams({
    latitude: "-31.7654",
    longitude: "-52.3376",
    timezone: "America/Sao_Paulo",
    forecast_days: "7",
    temperature_unit: "celsius",
    wind_speed_unit: "kmh",
    precipitation_unit: "mm",
    cell_selection: "land",
    current: "temperature_2m",
    hourly:
      "temperature_2m,precipitation_probability,wind_speed_10m,wind_gusts_10m,weather_code,is_day",
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_gusts_10m_max",
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

export function useOpenMeteoForecastRecovery(baseline: WeatherData) {
  const [weather, setWeather] = useState(baseline);

  useEffect(() => {
    setWeather(baseline);
    if (!needsOpenMeteoRecovery(baseline)) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let active = true;

    void fetch(createForecastUrl(), {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`Open-Meteo respondeu com status ${response.status}`);
        return response.json() as Promise<unknown>;
      })
      .then((payload) => {
        const recovered = recoverWeatherDataFromOpenMeteo(baseline, payload);
        if (active && recovered) setWeather(recovered);
      })
      .catch(() => {
        // O SSR já entregou o fallback auditável; uma falha no reforço do navegador é silenciosa.
      })
      .finally(() => window.clearTimeout(timeout));

    return () => {
      active = false;
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [baseline]);

  return weather;
}
