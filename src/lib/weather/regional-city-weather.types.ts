import type { RegionalCity } from "@/lib/regional-cities";

export type RegionalAlertSeverity = "potential" | "danger" | "great-danger" | "unknown";

export type RegionalCityAlert = {
  id: string;
  event: string;
  description: string;
  instruction: string;
  severity: RegionalAlertSeverity;
  severityLabel: string;
  startsAt: string | null;
  expiresAt: string | null;
  officialUrl: string;
};

export type RegionalCityCurrentWeather = {
  temperature: number | null;
  feelsLike: number | null;
  condition: string;
  humidity: number | null;
  pressure: number | null;
  precipitationMm: number | null;
  windSpeed: number | null;
  windGust: number | null;
  windDirection: string | null;
  observedAt: string | null;
};

export type RegionalCityHourlyForecast = {
  time: string;
  temperature: number | null;
  rainChance: number | null;
  precipitationMm: number | null;
  windSpeed: number | null;
  windGust: number | null;
  condition: string;
};

export type RegionalCityDailyForecast = {
  date: string;
  weekday: string;
  minimum: number | null;
  maximum: number | null;
  rainChance: number | null;
  precipitationMm: number | null;
  windGust: number | null;
  condition: string;
};

export type RegionalCityWeatherData = {
  status: "live" | "partial" | "unavailable";
  city: RegionalCity;
  current: RegionalCityCurrentWeather | null;
  hourly: RegionalCityHourlyForecast[];
  daily: RegionalCityDailyForecast[];
  astronomy: {
    sunrise: string | null;
    sunset: string | null;
  };
  alerts: {
    status: "live" | "unavailable";
    items: RegionalCityAlert[];
    sourceUrl: string;
  };
  source: {
    forecastName: "Open-Meteo";
    forecastUrl: string;
    alertsName: "INMET";
    fetchedAt: string;
  };
  message: string | null;
};
