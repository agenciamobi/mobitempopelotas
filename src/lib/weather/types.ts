export type WeatherIconName =
  "sun" | "moon" | "partly-cloudy" | "partly-cloudy-night" | "cloud" | "rain" | "storm" | "wind";

export type WeatherSource = {
  name: string;
  url: string;
  kind: "forecast";
  fetchedAt: string;
  isFallback: boolean;
};

export type CurrentWeather = {
  city: string;
  state: string;
  temperature: number;
  feelsLike: number;
  condition: string;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windGust: number;
  windDirection: string;
  visibilityKm: number;
  sunrise: string;
  sunset: string;
  observedAt: string;
  icon: WeatherIconName;
};

export type HourlyForecast = {
  time: string;
  temperature: number;
  precipitationProbability: number;
  windSpeed: number;
  windGust: number;
  icon: WeatherIconName;
};

export type DailyForecast = {
  weekday: string;
  date: string;
  min: number;
  max: number;
  rainChance: number;
  precipitationMm: number;
  windGust: number;
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
