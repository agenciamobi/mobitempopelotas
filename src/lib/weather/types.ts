export type WeatherIconName =
  | "sun"
  | "moon"
  | "partly-cloudy"
  | "partly-cloudy-night"
  | "cloud"
  | "rain"
  | "storm"
  | "wind";

export type ForecastSourceKey = "open-meteo" | "met-norway";

export type WeatherSource = {
  name: string;
  url: string;
  kind: "forecast";
  key: ForecastSourceKey;
  fetchedAt: string;
  isFallback: boolean;
  model?: string | null;
  modelRun?: string | null;
  temporalResolutionMinutes?: number | null;
};

export type CurrentWeather = {
  city: string;
  state: string;
  temperature: number | null;
  feelsLike: number | null;
  condition: string | null;
  humidity: number | null;
  dewPoint?: number | null;
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

export type HourlyForecast = {
  time: string;
  timestamp?: string;
  temperature: number;
  precipitationProbability: number | null;
  windSpeed: number;
  windGust: number | null;
  icon: WeatherIconName;
  relativeHumidity?: number | null;
  dewPoint?: number | null;
  pressure?: number | null;
  visibilityKm?: number | null;
  cloudCover?: number | null;
  cloudCoverLow?: number | null;
  cloudCoverMid?: number | null;
  cloudCoverHigh?: number | null;
  cape?: number | null;
  boundaryLayerHeight?: number | null;
};

export type DailyForecast = {
  weekday: string;
  date: string;
  min: number;
  max: number;
  rainChance: number | null;
  precipitationMm: number;
  windGust: number | null;
  icon: WeatherIconName;
};

export type WeatherHomeData = {
  status: "live" | "unavailable";
  current: CurrentWeather | null;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  source: WeatherSource;
  message: string | null;
};