import type { GuaibaObservationData } from "@/lib/hydrology/guaiba.server";
import type { LagoonMonitoringNetworkData } from "@/lib/hydrology/lagoon-network.server";
import type { LaranjalLevelData } from "@/lib/hydrology/laranjal-level.server";
import type { AggregatedWeatherData } from "@/lib/weather/aggregated-weather.types";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import type { EmbrapaObservationData } from "@/production/lib/embrapa-observation";
import type { InmetAlertsData } from "@/production/lib/inmet-alerts";
import type { WeatherAiSummaries } from "@/production/lib/weather-ai-summary";
import type { CurrentWeather, WeatherData } from "@/production/lib/weather-data";

function formatUpdatedAt(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function forecastTimeLabel(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR") === "agora" ? "Próxima hora" : value;
}

function unavailableCurrent(data: AggregatedWeatherData): CurrentWeather {
  return {
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
      url: data.observation.source.url,
      kind: "unavailable",
      observedAt: null,
    },
  };
}

function observedCurrent(data: AggregatedWeatherData): CurrentWeather {
  const current = data.current;
  if (!current || data.quality.currentSource !== "embrapa") return unavailableCurrent(data);

  return {
    available: true,
    city: current.city,
    state: current.state,
    temperature: current.temperature,
    feelsLike: current.feelsLike,
    condition: null,
    humidity: current.humidity,
    pressure: current.pressure,
    windSpeed: current.windSpeed,
    windGust: null,
    windDirection: current.windDirection,
    visibility: null,
    sunrise: current.sunrise,
    sunset: current.sunset,
    updatedAt: formatUpdatedAt(current.observedAt),
    icon: null,
    source: {
      name: "Embrapa Clima Temperado",
      url: data.observation.source.url,
      kind: "observation",
      observedAt: current.observedAt,
    },
  };
}

export function toProductionWeatherData(data: AggregatedWeatherData): WeatherData {
  return {
    current: observedCurrent(data),
    hourly: data.hourly.map((hour) => ({
      time: forecastTimeLabel(hour.time),
      temperature: hour.temperature,
      precipitation: hour.precipitationProbability,
      windSpeed: hour.windSpeed,
      windGust: hour.windGust,
      icon: hour.icon,
    })),
    daily: data.daily.map((day) => ({
      weekday: day.weekday,
      date: day.date,
      min: day.min,
      max: day.max,
      rainChance: day.rainChance,
      precipitation: day.precipitationMm,
      windGust: day.windGust,
      icon: day.icon,
    })),
    // O mapa operacional usa REDEMET. Não criamos marcadores de condição atual a partir de modelos.
    regional: [],
    source: {
      name: "MOBI Tempo Pelotas",
      url: "/metodologia",
      isFallback: data.status !== "live",
      observationName: data.observation.source.name,
      observationUrl: data.observation.source.url,
      forecastName: data.quality.forecastProvider ?? "Previsão meteorológica indisponível",
      forecastUrl: "/metodologia",
    },
  };
}

export function toProductionObservation(data: AggregatedWeatherData): EmbrapaObservationData {
  const observation = data.observation;
  const empty = { value: null, time: null };
  return {
    ...observation,
    extremes: {
      ...observation.extremes,
      dewPointMin: empty,
      dewPointMax: empty,
    },
    accumulated: {
      ...observation.accumulated,
      evapotranspirationDaily: null,
      evapotranspirationMonthly: null,
      evapotranspirationAnnual: null,
    },
  };
}

export function toProductionAlerts(data: AggregatedWeatherData): InmetAlertsData {
  const alerts = data.alerts;
  return {
    status: data.sources.inmet.usable ? "live" : "unavailable",
    alerts,
    counts: {
      total: alerts.length,
      pelotas: alerts.filter((alert) => alert.relevance === "pelotas").length,
      regional: alerts.filter((alert) => alert.relevance === "regional").length,
      state: alerts.filter((alert) => alert.relevance === "state").length,
    },
    source: {
      name: "INMET",
      feedUrl: "https://apiprevmet3.inmet.gov.br/avisos/ativos",
      portalUrl: "https://alertas2.inmet.gov.br/",
      fetchedAt: data.sources.inmet.fetchedAt,
    },
    error: data.sources.inmet.reason,
  };
}

export function toProductionSummaries(data: WeatherIntelligenceData): WeatherAiSummaries {
  return {
    status: data.intelligence.origin === "gemini" ? "generated" : "unavailable",
    today: { headline: data.brief.headline, summary: data.brief.summary },
    tomorrow: null,
    generatedAt: data.intelligence.generatedAt,
    model: data.intelligence.model,
  };
}

export type ProductionHomeHydrology = {
  laranjal: LaranjalLevelData;
  guaiba: GuaibaObservationData;
  lagoon: LagoonMonitoringNetworkData;
};
