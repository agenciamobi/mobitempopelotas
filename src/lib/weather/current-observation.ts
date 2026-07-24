import type { EmbrapaObservation } from "./official-sources.types";
import type {
  AggregatedCurrentProvenance,
  AggregatedCurrentWeather,
} from "./aggregated-weather.types";

export const OBSERVATION_MAX_AGE_MINUTES = 30;

const TIMEZONE = "America/Sao_Paulo";

function clockToMinutes(value: string | null) {
  if (!value) return null;
  const match = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function formatFetchedClock(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function getObservationAgeMinutes(observation: EmbrapaObservation) {
  const observedMinutes = clockToMinutes(observation.source.observationTime);
  const fetchedMinutes = clockToMinutes(formatFetchedClock(observation.source.fetchedAt));
  if (observedMinutes === null || fetchedMinutes === null) return null;
  let age = fetchedMinutes - observedMinutes;
  if (age < -5) age += 24 * 60;
  return Math.max(0, age);
}

export function canUseEmbrapaObservation(
  observation: EmbrapaObservation,
  ageMinutes: number | null,
) {
  if (observation.status === "unavailable" || observation.current.temperature === null) {
    return false;
  }
  if (ageMinutes === null) return false;
  return ageMinutes <= OBSERVATION_MAX_AGE_MINUTES;
}

/**
 * Constrói a leitura atual EXCLUSIVAMENTE a partir da Embrapa.
 * Campos não medidos (condition, icon, visibility, windGust) permanecem null.
 * Se a observação não for utilizável, retorna { current: null, provenance: {} }.
 */
export function deriveEmbrapaCurrent(observation: EmbrapaObservation, ageMinutes: number | null) {
  const usable = canUseEmbrapaObservation(observation, ageMinutes);
  if (!usable) {
    return {
      usable: false,
      current: null as AggregatedCurrentWeather | null,
      provenance: {} as AggregatedCurrentProvenance,
    };
  }

  const c = observation.current;
  const current: AggregatedCurrentWeather = {
    city: "Pelotas",
    state: "RS",
    temperature: c.temperature === null ? null : Math.round(c.temperature),
    feelsLike: c.feelsLike === null ? null : Math.round(c.feelsLike),
    condition: null,
    humidity: c.humidity === null ? null : Math.round(c.humidity),
    pressure: c.pressure === null ? null : Math.round(c.pressure),
    windSpeed: c.windSpeed === null ? null : Math.round(c.windSpeed),
    windGust: null,
    windDirection: c.windDirection,
    visibilityKm: null,
    sunrise: c.sunrise,
    sunset: c.sunset,
    observedAt: observation.source.observationTime ?? observation.source.fetchedAt,
    icon: null,
  };

  const provenance: AggregatedCurrentProvenance = {};
  const mark = (field: keyof AggregatedCurrentProvenance, value: unknown) => {
    if (value !== null && value !== undefined) provenance[field] = "embrapa";
  };
  mark("temperature", current.temperature);
  mark("feelsLike", current.feelsLike);
  mark("humidity", current.humidity);
  mark("pressure", current.pressure);
  mark("windSpeed", current.windSpeed);
  mark("windDirection", current.windDirection);
  mark("sunrise", current.sunrise);
  mark("sunset", current.sunset);
  mark("observedAt", current.observedAt);

  return { usable: true, current, provenance };
}
