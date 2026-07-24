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
  precipitation: number | null;
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
  precipitation: number;
  windGust: number | null;
  icon: WeatherIconName;
};

export type CurrentWeatherSource = {
  name: string;
  url: string;
  kind: "observation" | "unavailable";
  observedAt: string | null;
};

export type CurrentWeather = {
  available: boolean;
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
  visibility: number | null;
  sunrise: string | null;
  sunset: string | null;
  updatedAt: string | null;
  icon: WeatherIconName | null;
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

/**
 * Estado vazio para falhas totais de carregamento.
 * Não contém números demonstrativos nem valores meteorológicos inventados.
 */
export const fallbackWeatherData: WeatherData = {
  current: {
    available: false,
    city: "Pelotas",
    state: "RS",
    temperature: null,
    feelsLike: null,
    condition: null,
    humidity: null,
    pressure: null,
    windSpeed: null,
    windGust: null,
    windDirection: null,
    visibility: null,
    sunrise: null,
    sunset: null,
    updatedAt: null,
    icon: null,
    source: {
      name: "Embrapa Clima Temperado",
      url: "https://agromet.cpact.embrapa.br/online/Current_Monitor.htm",
      kind: "unavailable",
      observedAt: null,
    },
  },
  hourly: [],
  daily: [],
  regional: [],
  source: {
    name: "Dados meteorológicos indisponíveis",
    url: "/metodologia",
    isFallback: true,
    observationName: "Embrapa Clima Temperado",
    observationUrl: "https://agromet.cpact.embrapa.br/online/Current_Monitor.htm",
    forecastName: "Previsão indisponível",
    forecastUrl: "/metodologia",
  },
};
