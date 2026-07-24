import type { AggregatedWeatherData } from "./aggregated-weather.types";

export type WeatherBriefOrigin = "gemini" | "deterministic";

export type GeminiWeatherStatus =
  "generated" | "not-configured" | "disabled" | "skipped" | "unavailable";

export type WeatherBrief = {
  headline: string;
  summary: string;
  highlights: string[];
  cautions: string[];
};

export type WeatherIntelligenceData = {
  weather: AggregatedWeatherData;
  brief: WeatherBrief;
  intelligence: {
    origin: WeatherBriefOrigin;
    geminiStatus: GeminiWeatherStatus;
    model: string | null;
    generatedAt: string;
    error: string | null;
  };
};
