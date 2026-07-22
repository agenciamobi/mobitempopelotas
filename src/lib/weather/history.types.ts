export type HistoricalWeatherDay = {
  date: string;
  label: string;
  weekday: string;
  temperatureMax: number;
  temperatureMin: number;
  precipitation: number | null;
  windGust: number | null;
};

export type HistoricalWeatherSummary = {
  periodLabel: string;
  averageMax: number;
  averageMin: number;
  totalPrecipitation: number | null;
  strongestWindGust: number | null;
  warmestDay: HistoricalWeatherDay;
  coldestDay: HistoricalWeatherDay;
  wettestDay: HistoricalWeatherDay | null;
  windiestDay: HistoricalWeatherDay | null;
};

export type WeatherHistoryStatus = "live" | "partial" | "unavailable";

export type WeatherHistoryData = {
  status: WeatherHistoryStatus;
  days: HistoricalWeatherDay[];
  summary: HistoricalWeatherSummary | null;
  source: {
    name: string;
    url: string;
    fetchedAt: string;
    periodStart: string | null;
    periodEnd: string | null;
  };
  error: string | null;
};
