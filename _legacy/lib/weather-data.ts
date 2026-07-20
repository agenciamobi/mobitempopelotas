export type WeatherIconName =
  | "sun"
  | "moon"
  | "partly-cloudy"
  | "partly-cloudy-night"
  | "cloud"
  | "rain"
  | "storm"
  | "wind";

export type HourlyForecast = {
  time: string;
  temperature: number;
  precipitation: number;
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
  precipitation: number;
  windGust: number;
  icon: WeatherIconName;
};

export type CurrentWeatherSource = {
  name: string;
  url: string;
  kind: "observation" | "forecast" | "fallback";
  observedAt: string | null;
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
  visibility: number;
  sunrise: string;
  sunset: string;
  updatedAt: string;
  icon: WeatherIconName;
  source: CurrentWeatherSource;
};

export type RegionalWeather = {
  city: string;
  temperature: number;
  condition: WeatherIconName;
  latitude: number;
  longitude: number;
};

export type WeatherData = {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  regional: RegionalWeather[];
  source: {
    name: string;
    url: string;
    isFallback: boolean;
    observationName?: string;
    observationUrl?: string;
    forecastName?: string;
    forecastUrl?: string;
  };
};

export const fallbackWeatherData: WeatherData = {
  current: {
    city: "Pelotas",
    state: "RS",
    temperature: 20,
    feelsLike: 20,
    condition: "Sol entre nuvens",
    humidity: 86,
    pressure: 1003,
    windSpeed: 12,
    windGust: 22,
    windDirection: "NNE",
    visibility: 10,
    sunrise: "07:23",
    sunset: "17:47",
    updatedAt: "Dados temporariamente indisponíveis",
    icon: "partly-cloudy",
    source: {
      name: "dados demonstrativos",
      url: "",
      kind: "fallback",
      observedAt: null,
    },
  },
  hourly: [
    { time: "Agora", temperature: 20, precipitation: 0, windSpeed: 12, windGust: 22, icon: "partly-cloudy" },
    { time: "16h", temperature: 20, precipitation: 10, windSpeed: 13, windGust: 24, icon: "partly-cloudy" },
    { time: "17h", temperature: 19, precipitation: 28, windSpeed: 14, windGust: 27, icon: "rain" },
    { time: "18h", temperature: 18, precipitation: 42, windSpeed: 15, windGust: 30, icon: "rain" },
    { time: "19h", temperature: 17, precipitation: 35, windSpeed: 13, windGust: 26, icon: "rain" },
    { time: "20h", temperature: 16, precipitation: 18, windSpeed: 11, windGust: 22, icon: "cloud" },
    { time: "21h", temperature: 16, precipitation: 8, windSpeed: 10, windGust: 19, icon: "cloud" },
  ],
  daily: [
    { weekday: "Hoje", date: "18 jul", min: 14, max: 20, rainChance: 38, precipitation: 2.4, windGust: 35, icon: "partly-cloudy" },
    { weekday: "Dom", date: "19 jul", min: 13, max: 19, rainChance: 76, precipitation: 12.6, windGust: 48, icon: "rain" },
    { weekday: "Seg", date: "20 jul", min: 12, max: 18, rainChance: 68, precipitation: 8.2, windGust: 42, icon: "rain" },
    { weekday: "Ter", date: "21 jul", min: 11, max: 17, rainChance: 44, precipitation: 1.8, windGust: 34, icon: "cloud" },
    { weekday: "Qua", date: "22 jul", min: 10, max: 18, rainChance: 18, precipitation: 0.2, windGust: 28, icon: "partly-cloudy" },
    { weekday: "Qui", date: "23 jul", min: 12, max: 20, rainChance: 12, precipitation: 0, windGust: 24, icon: "sun" },
    { weekday: "Sex", date: "24 jul", min: 13, max: 21, rainChance: 24, precipitation: 0.6, windGust: 29, icon: "partly-cloudy" },
  ],
  regional: [
    { city: "Pelotas", temperature: 20, condition: "partly-cloudy", latitude: -31.7654, longitude: -52.3376 },
    { city: "Rio Grande", temperature: 19, condition: "cloud", latitude: -32.035, longitude: -52.0986 },
    { city: "Canguçu", temperature: 18, condition: "rain", latitude: -31.395, longitude: -52.6756 },
    { city: "São Lourenço do Sul", temperature: 19, condition: "partly-cloudy", latitude: -31.365, longitude: -51.978 },
  ],
  source: {
    name: "dados demonstrativos",
    url: "",
    isFallback: true,
  },
};