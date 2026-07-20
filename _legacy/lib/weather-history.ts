export type HistoricalWeatherDay = {
  date: string;
  label: string;
  weekday: string;
  temperatureMax: number;
  temperatureMin: number;
  precipitation: number;
  windGust: number;
};

export type HistoricalWeatherSummary = {
  periodLabel: string;
  averageMax: number;
  averageMin: number;
  totalPrecipitation: number;
  strongestWindGust: number;
  warmestDay: HistoricalWeatherDay;
  coldestDay: HistoricalWeatherDay;
  wettestDay: HistoricalWeatherDay;
};

export type WeatherHistoryData = {
  days: HistoricalWeatherDay[];
  summary: HistoricalWeatherSummary;
  source: {
    name: string;
    url: string;
    isFallback: boolean;
  };
};
