import { fetchAggregatedPelotasWeather } from "./aggregated-weather.server";
import type { AggregatedWeatherData, WeatherSourceKey } from "./aggregated-weather.types";
import { generateGeminiWeatherBrief } from "./gemini-weather.server";
import type { WeatherBrief, WeatherIntelligenceData } from "./weather-intelligence.types";

const SOURCE_LABELS: Record<WeatherSourceKey, string> = {
  embrapa: "Embrapa",
  inmet: "INMET",
  cppmet: "CPPMet",
  "open-meteo": "Open-Meteo",
};

function withFinalPunctuation(value: string) {
  return /[.!?]$/.test(value) ? value : `${value}.`;
}

function unique(items: string[], limit: number) {
  return Array.from(new Set(items.filter(Boolean))).slice(0, limit);
}

function createHeadline(weather: AggregatedWeatherData) {
  const current = weather.current;
  if (current?.temperature !== null && current?.temperature !== undefined) {
    const condition = current.condition ? ` e ${current.condition.toLowerCase()}` : "";
    return `${Math.round(current.temperature)} °C em Pelotas${condition}`;
  }

  const today = weather.daily[0];
  if (today) return `Previsão entre ${today.min} °C e ${today.max} °C em Pelotas`;
  return "Dados meteorológicos temporariamente indisponíveis";
}

function createSummary(weather: AggregatedWeatherData) {
  const parts: string[] = [];
  const current = weather.current;
  const today = weather.daily[0];

  if (current) {
    const currentParts: string[] = [];
    if (current.temperature !== null) currentParts.push(`${Math.round(current.temperature)} °C`);
    if (current.condition) currentParts.push(current.condition.toLowerCase());
    if (currentParts.length > 0) parts.push(`Agora em Pelotas: ${currentParts.join(", ")}`);

    const details: string[] = [];
    if (current.humidity !== null) details.push(`umidade em ${Math.round(current.humidity)}%`);
    if (current.windSpeed !== null) {
      details.push(`vento de ${Math.round(current.windSpeed)} km/h`);
    }
    if (details.length > 0) parts.push(details.join(" e "));
  }

  if (today) {
    parts.push(
      `para hoje, mínima de ${today.min} °C, máxima de ${today.max} °C e ${today.rainChance}% de chance de chuva`,
    );
  }

  const activeAlerts = weather.alerts.filter((alert) => alert.period === "active");
  if (activeAlerts.length > 0) {
    parts.push(
      `${activeAlerts.length} alerta${activeAlerts.length === 1 ? " oficial está ativo" : "s oficiais estão ativos"}`,
    );
  }

  if (parts.length === 0) {
    return "As fontes consultadas não forneceram dados suficientes para uma síntese meteorológica.";
  }

  return withFinalPunctuation(parts.join(". "));
}

function createHighlights(weather: AggregatedWeatherData) {
  const highlights: string[] = [];
  const current = weather.current;
  const today = weather.daily[0];

  if (current?.feelsLike !== null && current?.feelsLike !== undefined) {
    highlights.push(`Sensação térmica de ${Math.round(current.feelsLike)} °C.`);
  }
  if (current?.windGust !== null && current?.windGust !== undefined) {
    highlights.push(`Rajadas de até ${Math.round(current.windGust)} km/h.`);
  }
  if (today) {
    highlights.push(
      `Hoje: ${today.min} °C a ${today.max} °C, com ${today.rainChance}% de chance de chuva.`,
    );
  }

  const cppmetToday = weather.officialForecast[0];
  if (cppmetToday?.summary) {
    highlights.push(`CPPMet: ${withFinalPunctuation(cppmetToday.summary)}`);
  }

  return unique(highlights, 4);
}

function createCautions(weather: AggregatedWeatherData) {
  const cautions: string[] = [];
  const activeAlerts = weather.alerts.filter((alert) => alert.period === "active");
  const upcomingAlerts = weather.alerts.filter((alert) => alert.period === "upcoming");
  const significantDiscrepancies = weather.quality.discrepancies.filter(
    (item) => item.severity === "significant",
  );

  if (activeAlerts.length > 0) {
    const events = unique(
      activeAlerts.map((alert) => alert.event),
      2,
    ).join(" e ");
    cautions.push(
      `Há ${activeAlerts.length} alerta${activeAlerts.length === 1 ? " ativo" : "s ativos"} do INMET${events ? `: ${events}` : ""}.`,
    );
  }
  if (upcomingAlerts.length > 0) {
    cautions.push(
      `${upcomingAlerts.length} alerta${upcomingAlerts.length === 1 ? " oficial começa" : "s oficiais começam"} em breve.`,
    );
  }
  if (significantDiscrepancies.length > 0) {
    cautions.push(
      `Existem ${significantDiscrepancies.length} divergência${significantDiscrepancies.length === 1 ? " significativa" : "s significativas"} entre as fontes.`,
    );
  }
  if (weather.quality.confidence === "low") {
    cautions.push("A confiança geral dos dados está baixa; consulte novamente em alguns minutos.");
  }
  if (weather.quality.degradedSources.length > 0) {
    const sources = weather.quality.degradedSources
      .map((source) => SOURCE_LABELS[source])
      .join(", ");
    cautions.push(`Fontes com restrição ou indisponibilidade: ${sources}.`);
  }

  return unique(cautions, 4);
}

export function createDeterministicWeatherBrief(weather: AggregatedWeatherData): WeatherBrief {
  return {
    headline: createHeadline(weather),
    summary: createSummary(weather),
    highlights: createHighlights(weather),
    cautions: createCautions(weather),
  };
}

export async function fetchWeatherIntelligence(): Promise<WeatherIntelligenceData> {
  const weather = await fetchAggregatedPelotasWeather();
  const deterministicBrief = createDeterministicWeatherBrief(weather);
  const gemini = await generateGeminiWeatherBrief(weather);
  const generatedBrief = gemini.status === "generated" ? gemini.brief : null;
  const useGemini = generatedBrief !== null;

  return {
    weather,
    brief: generatedBrief ?? deterministicBrief,
    intelligence: {
      origin: useGemini ? "gemini" : "deterministic",
      geminiStatus: gemini.status,
      model: gemini.model,
      generatedAt: new Date().toISOString(),
      error: gemini.error,
    },
  };
}
