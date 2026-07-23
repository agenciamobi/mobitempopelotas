import type { GuaibaObservationData } from "@/lib/hydrology/guaiba.server";
import type { LagoonMonitoringNetworkData } from "@/lib/hydrology/lagoon-network.server";
import type { LaranjalLevelData } from "@/lib/hydrology/laranjal-level.server";
import type { AggregatedWeatherData } from "@/lib/weather/aggregated-weather.types";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import type { EmbrapaObservationData } from "@/production/lib/embrapa-observation";
import type { InmetAlertsData } from "@/production/lib/inmet-alerts";
import type { WeatherAiSummaries } from "@/production/lib/weather-ai-summary";
import type { WeatherData } from "@/production/lib/weather-data";

function firstFinite(...values: Array<number | null | undefined>) {
  return (
    values.find((value): value is number => typeof value === "number" && Number.isFinite(value)) ??
    null
  );
}

function formatUpdatedAt(value: string | null | undefined) {
  if (!value) return "Horário não informado";
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

export function toProductionWeatherData(data: AggregatedWeatherData): WeatherData {
  const current = data.current;
  const observation = data.observation.current;
  const today = data.daily[0];
  const temperature =
    firstFinite(current?.temperature, observation.temperature, today?.max, today?.min) ?? 0;
  const feelsLike =
    firstFinite(current?.feelsLike, observation.feelsLike, temperature) ?? temperature;
  const humidity = firstFinite(current?.humidity, observation.humidity) ?? 0;
  const pressure = firstFinite(current?.pressure, observation.pressure) ?? 0;
  const windSpeed = firstFinite(current?.windSpeed, observation.windSpeed) ?? 0;
  const windGust = firstFinite(current?.windGust, current?.windSpeed, observation.windSpeed) ?? 0;
  const observedAt =
    current?.observedAt ?? data.observation.source.observationTime ?? data.source.fetchedAt;

  return {
    current: {
      city: current?.city ?? "Pelotas",
      state: current?.state ?? "RS",
      temperature,
      feelsLike,
      condition: current?.condition ?? data.message ?? "Condições em atualização",
      humidity,
      pressure,
      windSpeed,
      windGust,
      windDirection: current?.windDirection ?? observation.windDirection ?? "Indisponível",
      visibility: firstFinite(current?.visibilityKm) ?? -1,
      sunrise: current?.sunrise ?? observation.sunrise ?? "—",
      sunset: current?.sunset ?? observation.sunset ?? "—",
      updatedAt: formatUpdatedAt(observedAt),
      icon: current?.icon ?? today?.icon ?? "cloud",
      source: {
        name:
          data.quality.currentSource === "embrapa"
            ? "Embrapa Clima Temperado"
            : (data.quality.forecastProvider ?? "MOBI Tempo Pelotas"),
        url:
          data.quality.currentSource === "embrapa" ? data.observation.source.url : "/metodologia",
        kind: data.quality.currentSource === "embrapa" ? "observation" : "forecast",
        observedAt: data.observation.source.observationTime ?? observedAt,
      },
    },
    hourly: data.hourly.map((hour) => ({
      time: hour.time,
      temperature: hour.temperature,
      precipitation: hour.precipitationProbability ?? 0,
      windSpeed: hour.windSpeed,
      windGust: hour.windGust ?? hour.windSpeed,
      icon: hour.icon,
    })),
    daily: data.daily.map((day) => ({
      weekday: day.weekday,
      date: day.date,
      min: day.min,
      max: day.max,
      rainChance: day.rainChance ?? 0,
      precipitation: day.precipitationMm,
      windGust: day.windGust ?? 0,
      icon: day.icon,
    })),
    regional: current
      ? [
          {
            city: "Pelotas",
            temperature,
            condition: current.icon ?? "cloud",
            latitude: -31.7654,
            longitude: -52.3376,
          },
        ]
      : [],
    source: {
      name: "MOBI Tempo Pelotas",
      url: "/metodologia",
      isFallback: data.status !== "live",
      observationName: data.observation.source.name,
      observationUrl: data.observation.source.url,
      forecastName: data.quality.forecastProvider ?? "Modelo meteorológico",
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
