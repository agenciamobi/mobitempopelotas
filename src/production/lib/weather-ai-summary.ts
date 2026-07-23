export type ForecastNarrative = {
  headline: string;
  summary: string;
};

export type WeatherAiSummaries = {
  status: "generated" | "unavailable";
  today: ForecastNarrative | null;
  tomorrow: ForecastNarrative | null;
  generatedAt: string | null;
  model: string | null;
};
