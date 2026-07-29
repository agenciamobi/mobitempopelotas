import type { ForecastStoryData } from "@/components/weather/HomeForecastStory";
import type { RegionalCityWeatherData } from "@/lib/weather/regional-city-weather.types";

import { formatRegionalHour } from "./regional-time-format";
import { regionalWeatherIcon } from "./regional-weather-presentation";

function regionalDateLabel(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}`;
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
