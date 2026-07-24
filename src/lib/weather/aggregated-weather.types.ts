import type {
  CppmetForecastItem,
  EmbrapaObservation,
  InmetAlert,
  OfficialSourceStatus,
} from "./official-sources.types";
import type { DailyForecast, HourlyForecast, WeatherIconName } from "./types";

export type WeatherSourceKey = "embrapa" | "inmet" | "cppmet" | "open-meteo";

export type AggregatedWeatherStatus = "live" | "degraded" | "unavailable";
export type WeatherConfidence = "high" | "medium" | "low";
export type WeatherSourceHealthStatus = OfficialSourceStatus | "stale";

export type AggregatedCurrentWeather = {
  city: string;
  state: string;
  temperature: number | null;
  feelsLike: number | null;
  condition: string | null;
  humidity: number | null;
  pressure: number | null;
  windSpeed: number | null;
  windGust: number | null;
  windDirection: string | null;
  visibilityKm: number | null;
  sunrise: string | null;
  sunset: string | null;
  observedAt: string | null;
  icon: WeatherIconName | null;
};

export type AggregatedCurrentField = Exclude<keyof AggregatedCurrentWeather, "city" | "state">;

export type AggregatedCurrentProvenance = Partial<Record<AggregatedCurrentField, WeatherSourceKey>>;

export type WeatherDiscrepancyField =
  | "temperature"
  | "feelsLike"
  | "humidity"
  | "pressure"
  | "windSpeed"
  | "minimum"
  | "maximum";

export type WeatherDiscrepancy = {
  scope: "current" | "daily";
  field: WeatherDiscrepancyField;
  severity: "notice" | "significant";
  referenceSource: WeatherSourceKey;
  comparisonSource: WeatherSourceKey;
  referenceValue: number;
  comparisonValue: number;
  difference: number;
  unit: "°C" | "%" | "hPa" | "km/h";
  day: string | null;
};

export type WeatherSourceHealth = {
  source: WeatherSourceKey;
  status: WeatherSourceHealthStatus;
  role: "observation" | "forecast" | "alerts" | "forecast-context";
  fetchedAt: string;
  usable: boolean;
  reason: string | null;
};

export type AggregatedWeatherQuality = {
  score: number;
  confidence: WeatherConfidence;
  currentSource: "embrapa" | "open-meteo" | null;
  forecastSource: "open-meteo" | null;
  forecastProvider: string | null;
  degradedSources: WeatherSourceKey[];
  observationAgeMinutes: number | null;
  discrepancies: WeatherDiscrepancy[];
  notes: string[];
};

export type AggregatedWeatherData = {
  status: AggregatedWeatherStatus;
  current: AggregatedCurrentWeather | null;
  currentProvenance: AggregatedCurrentProvenance;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  observation: EmbrapaObservation;
  alerts: InmetAlert[];
  officialForecast: CppmetForecastItem[];
  sources: Record<WeatherSourceKey, WeatherSourceHealth>;
  quality: AggregatedWeatherQuality;
  source: {
    name: "MOBI Tempo Pelotas";
    kind: "aggregated";
    fetchedAt: string;
  };
  message: string | null;
};
