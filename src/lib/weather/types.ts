export type WeatherIconName = "sun" | "moon" | "partly-cloudy" | "partly-cloudy-night" | "cloud" | "rain" | "storm" | "wind";

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

export type HourlyForecast = {
  time: string;
  temperature: number;
  precipitationProbability: number | null;
  windSpeed: number;
  windGust: number | null;
  icon: WeatherIconName;
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
