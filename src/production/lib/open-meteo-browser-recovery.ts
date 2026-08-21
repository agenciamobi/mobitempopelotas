import { useEffect, useState } from "react";

import { reconcileDailyTemperatures } from "@/lib/weather/daily-temperature-reconciliation";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import type {
  DailyForecast,
  HourlyForecast,
  WeatherData,
  WeatherIconName,
} from "./weather-data.ts";
import { fallbackWeatherData } from "./weather-data.ts";

const OPEN_METEO_URL = "https://open-meteo.com/";
const REQUEST_TIMEOUT_MS = 12_000;
const HOURLY_RECOVERY_LIMIT = 24;
const sourceLabels = {
  embrapa: "Embrapa",
  inmet: "INMET",
  cppmet: "CPPMet",
  "open-meteo": "Open-Meteo",
  "met-norway": "MET Norway",
} as const;

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

function arrayNumber(values: Array<number | null> | null, index: number, digits = 0) {
  const value = values?.[index];
  if (value === null || value === undefined) return null;
  return digits === 0 ? Math.round(value) : Number(value.toFixed(digits));
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
  const precipitationProbability = numberArray(hourly.precipitation_probability);
  const precipitationMm = numberArray(hourly.precipitation);
  const windSpeed = numberArray(hourly.wind_speed_10m);
  const windGusts = numberArray(hourly.wind_gusts_10m);
  const windDirection = numberArray(hourly.wind_direction_10m);
  const weatherCodes = numberArray(hourly.weather_code);
  const isDay = numberArray(hourly.is_day);
  const relativeHumidity = numberArray(hourly.relative_humidity_2m);
  const dewPoint = numberArray(hourly.dew_point_2m);
  const pressure = numberArray(hourly.pressure_msl);
  const visibility = numberArray(hourly.visibility);
  const cloudCover = numberArray(hourly.cloud_cover);
  const cloudCoverLow = numberArray(hourly.cloud_cover_low);
  const cloudCoverMid = numberArray(hourly.cloud_cover_mid);
  const cloudCoverHigh = numberArray(hourly.cloud_cover_high);
  const cape = numberArray(hourly.cape);
  const boundaryLayerHeight = numberArray(hourly.boundary_layer_height);

  if (
    !times ||
    !temperatures ||
    !precipitationProbability ||
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

  for (let offset = 0; offset < HOURLY_RECOVERY_LIMIT; offset += 1) {
    const index = start + offset;
    const time = times[index];
    const temperature = temperatures[index];
    const speed = windSpeed[index];
    if (!time || temperature === null || speed === null) break;

    result.push({
      time: clockLabel(time, offset),
      timestamp: time,
      temperature: Math.round(temperature),
      precipitation:
        precipitationProbability[index] === null
          ? null
          : Math.round(precipitationProbability[index] as number),
      precipitationMm: arrayNumber(precipitationMm, index, 1),
      windSpeed: Math.round(speed),
      windGust: windGusts[index] === null ? null : Math.round(windGusts[index] as number),
      windDirectionDegrees: arrayNumber(windDirection, index),
      icon: presentation(weatherCodes[index] ?? null, isDay[index] !== 0),
      relativeHumidity: arrayNumber(relativeHumidity, index),
      dewPoint: arrayNumber(dewPoint, index, 1),
      pressure: arrayNumber(pressure, index),
      visibilityKm:
        visibility?.[index] === null || visibility?.[index] === undefined
          ? null
          : Number(((visibility[index] as number) / 1_000).toFixed(1)),
      cloudCover: arrayNumber(cloudCover, index),
      cloudCoverLow: arrayNumber(cloudCoverLow, index),
      cloudCoverMid: arrayNumber(cloudCoverMid, index),
      cloudCoverHigh: arrayNumber(cloudCoverHigh, index),
      cape: arrayNumber(cape, index),
      boundaryLayerHeight: arrayNumber(boundaryLayerHeight, index),
    });
  }

  return result.length ? result : null;
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
    hourly: [
      "temperature_2m",
      "relative_humidity_2m",
      "dew_point_2m",
      "precipitation_probability",
      "precipitation",
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
      "wind_direction_10m",
      "weather_code",
      "is_day",
    ].join(","),
    daily:
      "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_gusts_10m_max",
  });
  return `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
}

function fetchForecastPayload(signal: AbortSignal) {
  return fetch(createForecastUrl(), {
    headers: { Accept: "application/json" },
    signal,
  }).then((response) => {
    if (!response.ok) throw new Error(`Open-Meteo respondeu com status ${response.status}`);
    return response.json() as Promise<unknown>;
  });
}

export function needsOpenMeteoIntelligenceRecovery(data: WeatherIntelligenceData) {
  return (
    data.weather.quality.forecastSource !== "open-meteo" ||
    data.weather.hourly.length < 7 ||
    data.weather.daily.length === 0 ||
    data.weather.hourly.some(
      (hour) => hour.precipitationProbability === null || hour.windGust === null,
    ) ||
    data.weather.daily.some((day) => day.rainChance === null || day.windGust === null)
  );
}

function recoveredBrief(
  data: WeatherIntelligenceData,
  hourly: HourlyForecast[],
  daily: DailyForecast[],
) {
  const current = data.weather.current;
  const today = daily[0];
  const currentText =
    current?.temperature === null || current?.temperature === undefined
      ? null
      : `Agora, a Embrapa registra ${Math.round(current.temperature)} °C em Pelotas`;
  const todayText = today
    ? `Hoje, a previsão indica mínima de ${today.min} °C, máxima de ${today.max} °C e ${today.rainChance === null ? `${today.precipitation} mm de precipitação` : `${today.rainChance}% de chance de chuva`}`
    : null;
  const strongestGust = hourly.reduce<number | null>(
    (maximum, hour) =>
      hour.windGust === null ? maximum : Math.max(maximum ?? hour.windGust, hour.windGust),
    null,
  );

  return {
    headline:
      current?.temperature === null || current?.temperature === undefined
        ? today
          ? `Previsão entre ${today.min} °C e ${today.max} °C em Pelotas`
          : data.brief.headline
        : `${Math.round(current.temperature)} °C em Pelotas`,
    summary: [currentText, todayText].filter(Boolean).join(". ") + ".",
    highlights: [
      today
        ? `Hoje: ${today.min} °C a ${today.max} °C, com ${today.rainChance === null ? `${today.precipitation} mm previstos` : `${today.rainChance}% de chance de chuva`}.`
        : null,
      strongestGust === null ? null : `Rajadas previstas de até ${strongestGust} km/h.`,
    ].filter((item): item is string => item !== null),
    cautions: data.brief.cautions.filter(
      (caution) => !/Open-Meteo|fontes? com restrição ou indisponibilidade/i.test(caution),
    ),
  };
}

export function recoverWeatherIntelligenceFromOpenMeteo(
  data: WeatherIntelligenceData,
  payload: unknown,
): WeatherIntelligenceData | null {
  const production = recoverWeatherDataFromOpenMeteo(
    {
      ...fallbackWeatherData,
      current: {
        ...fallbackWeatherData.current,
        available: data.weather.current !== null,
      },
    },
    payload,
  );
  if (!production) return null;

  const reconciledDaily = reconcileDailyTemperatures(
    production.daily,
    data.weather.inmetForecast,
  );
  const hourly = production.hourly.map((hour) => ({
    time: hour.time === "Próxima hora" ? "Agora" : hour.time,
    timestamp: hour.timestamp,
    temperature: hour.temperature,
    precipitationProbability: hour.precipitation,
    precipitationMm: hour.precipitationMm,
    windSpeed: hour.windSpeed,
    windGust: hour.windGust,
    windDirectionDegrees: hour.windDirectionDegrees,
    icon: hour.icon,
    relativeHumidity: hour.relativeHumidity,
    dewPoint: hour.dewPoint,
    pressure: hour.pressure,
    visibilityKm: hour.visibilityKm,
    cloudCover: hour.cloudCover,
    cloudCoverLow: hour.cloudCoverLow,
    cloudCoverMid: hour.cloudCoverMid,
    cloudCoverHigh: hour.cloudCoverHigh,
    cape: hour.cape,
    boundaryLayerHeight: hour.boundaryLayerHeight,
  }));
  const daily = reconciledDaily.map((day) => ({
    weekday: day.weekday,
    date: day.date,
    min: day.min,
    max: day.max,
    rainChance: day.rainChance,
    precipitationMm: day.precipitation,
    windGust: day.windGust,
    icon: day.icon,
  }));
  const degradedSources = data.weather.quality.degradedSources.filter(
    (source) => source !== "open-meteo",
  );
  const status = degradedSources.length > 0 ? "degraded" : "live";
  const now = new Date().toISOString();
  const message =
    degradedSources.length === 0
      ? null
      : `Dados disponíveis em modo degradado. Fontes com restrição: ${degradedSources.map((source) => sourceLabels[source]).join(", ")}.`;

  return {
    ...data,
    weather: {
      ...data.weather,
      status,
      hourly,
      daily,
      sources: {
        ...data.weather.sources,
        "open-meteo": {
          source: "open-meteo",
          status: "live",
          role: "forecast",
          fetchedAt: now,
          usable: true,
          reason: null,
        },
      },
      quality: {
        ...data.weather.quality,
        forecastSource: "open-meteo",
        forecastProvider: "Open-Meteo",
        degradedSources,
        notes: [
          ...data.weather.quality.notes.filter(
            (note) => !/Open-Meteo|MET Norway|contingência/i.test(note),
          ),
          "Previsão recuperada diretamente do Open-Meteo no navegador.",
        ],
      },
      source: {
        ...data.weather.source,
        fetchedAt: now,
      },
      message,
    },
    brief: recoveredBrief(data, production.hourly, reconciledDaily),
    intelligence: {
      ...data.intelligence,
      origin: "deterministic",
      model: null,
      generatedAt: now,
    },
  };
}

export function useOpenMeteoIntelligenceRecovery(baseline: WeatherIntelligenceData) {
  const [data, setData] = useState(baseline);

  useEffect(() => {
    setData(baseline);
    if (!needsOpenMeteoIntelligenceRecovery(baseline)) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let active = true;

    void fetchForecastPayload(controller.signal)
      .then((payload) => {
        const recovered = recoverWeatherIntelligenceFromOpenMeteo(baseline, payload);
        if (active && recovered) setData(recovered);
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

  return data;
}

export function useOpenMeteoForecastRecovery(baseline: WeatherData) {
  const [weather, setWeather] = useState(baseline);

  useEffect(() => {
    setWeather(baseline);
    if (!needsOpenMeteoRecovery(baseline)) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let active = true;

    void fetchForecastPayload(controller.signal)
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
