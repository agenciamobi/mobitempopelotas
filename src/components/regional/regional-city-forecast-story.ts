import type { ForecastStoryData } from "@/components/weather/HomeForecastStory";
import { selectPriorityRegionalAlert } from "@/lib/weather/regional-alert-priority";
import type { RegionalCityWeatherData } from "@/lib/weather/regional-city-weather.types";
import type { WeatherData } from "@/production/lib/weather-data";
import type { AdvisoryLevel } from "@/production/lib/weather-insights";

import { formatRegionalHour } from "./regional-time-format";
import { regionalWeatherIcon } from "./regional-weather-presentation";

function regionalDateLabel(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}`;
}

function finite(value: number | null): value is number {
  return value !== null && Number.isFinite(value);
}

export function toRegionalForecastStory(data: RegionalCityWeatherData): ForecastStoryData {
  return {
    weather: {
      current: data.current
        ? {
            windSpeed: data.current.windSpeed,
            windGust: data.current.windGust,
          }
        : null,
      hourly: data.hourly.map((hour, index) => ({
        time: index === 0 ? "Agora" : formatRegionalHour(hour.time),
        timestamp: hour.time,
        temperature: hour.temperature,
        precipitationProbability: hour.rainChance,
        precipitationMm: hour.precipitationMm,
        windSpeed: hour.windSpeed,
        windGust: hour.windGust,
        icon: regionalWeatherIcon(hour.condition, hour.time),
      })),
      daily: data.daily.map((day) => ({
        weekday: day.weekday,
        date: regionalDateLabel(day.date),
        dateIso: day.date,
        min: day.minimum,
        max: day.maximum,
        rainChance: day.rainChance,
        precipitationMm: day.precipitationMm,
        windGust: day.windGust,
        icon: regionalWeatherIcon(day.condition),
      })),
    },
  };
}

export function toRegionalRetailWeather(data: RegionalCityWeatherData): WeatherData {
  const current = data.current;
  const hourly = data.hourly
    .filter((hour) => finite(hour.temperature) && finite(hour.windSpeed))
    .map((hour) => ({
      time: formatRegionalHour(hour.time),
      temperature: hour.temperature as number,
      precipitation: hour.rainChance,
      windSpeed: hour.windSpeed as number,
      windGust: hour.windGust,
      icon: regionalWeatherIcon(hour.condition, hour.time),
    }));
  const daily = data.daily
    .filter(
      (day) =>
        finite(day.minimum) &&
        finite(day.maximum) &&
        finite(day.precipitationMm),
    )
    .map((day) => ({
      weekday: day.weekday,
      date: regionalDateLabel(day.date),
      min: day.minimum as number,
      max: day.maximum as number,
      rainChance: day.rainChance,
      precipitation: day.precipitationMm as number,
      windGust: day.windGust,
      icon: regionalWeatherIcon(day.condition),
    }));

  return {
    current: {
      available: finite(current?.temperature ?? null),
      city: data.city.name,
      state: "RS",
      temperature: current?.temperature ?? null,
      feelsLike: current?.feelsLike ?? null,
      condition: current?.condition ?? null,
      humidity: current?.humidity ?? null,
      pressure: current?.pressure ?? null,
      windSpeed: current?.windSpeed ?? null,
      windGust: current?.windGust ?? null,
      windDirection: current?.windDirection ?? null,
      visibility: null,
      sunrise: data.astronomy.sunrise,
      sunset: data.astronomy.sunset,
      updatedAt: current?.observedAt ?? data.source.fetchedAt,
      icon: regionalWeatherIcon(current?.condition, current?.observedAt),
      source: {
        name: "Open-Meteo",
        url: data.source.forecastUrl,
        kind: "unavailable",
        observedAt: current?.observedAt ?? data.source.fetchedAt,
      },
    },
    hourly,
    daily,
    regional: [],
    astronomy: {
      date: data.daily[0]?.date ?? null,
      sunrise: data.astronomy.sunrise,
      sunset: data.astronomy.sunset,
      moonPhase: null,
      season: null,
      solarSource: "Open-Meteo",
      seasonSource: null,
      lunarSource: null,
    },
    source: {
      name: "MOBI Tempo Pelotas",
      url: data.source.forecastUrl,
      isFallback: false,
      observationName: "Estimativa do modelo Open-Meteo",
      observationUrl: data.source.forecastUrl,
      forecastName: "Open-Meteo",
      forecastUrl: data.source.forecastUrl,
    },
  };
}

export function regionalAdvisoryLevel(data: RegionalCityWeatherData): AdvisoryLevel {
  const alert = selectPriorityRegionalAlert(data.alerts.items);
  if (!alert) return "normal";
  if (alert.severity === "great-danger" || alert.severity === "danger") return "warning";
  if (alert.severity === "potential") return "attention";
  return "normal";
}
