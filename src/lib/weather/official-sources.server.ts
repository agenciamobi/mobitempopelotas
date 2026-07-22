import { fetchCppmetForecast } from "./cppmet.server";
import { fetchEmbrapaObservation } from "./embrapa.server";
import { fetchInmetAlerts } from "./inmet.server";
import type {
  CppmetForecast,
  EmbrapaObservation,
  InmetAlerts,
  OfficialWeatherSources,
  TimedObservation,
} from "./official-sources.types";

const OFFICIAL_SOURCE_DEADLINE_MS = 3_500;
const EMBRAPA_URL = "https://agromet.cpact.embrapa.br/online/Current_Monitor.htm";
const INMET_FEED_URL = "https://apiprevmet3.inmet.gov.br/avisos/rss";
const INMET_PORTAL_URL = "https://avisos.inmet.gov.br/";
const CPPMET_URL = "https://wp.ufpel.edu.br/cppmet/";

function emptyTimedObservation(): TimedObservation {
  return { value: null, time: null };
}

function unavailableEmbrapa(error: string): EmbrapaObservation {
  return {
    status: "unavailable",
    current: {
      temperature: null,
      humidity: null,
      feelsLike: null,
      dewPoint: null,
      pressure: null,
      pressureTrend: null,
      windDirection: null,
      windSpeed: null,
      sunrise: null,
      sunset: null,
    },
    extremes: {
      temperatureMin: emptyTimedObservation(),
      temperatureMax: emptyTimedObservation(),
      humidityMin: emptyTimedObservation(),
      humidityMax: emptyTimedObservation(),
      windSpeedMax: emptyTimedObservation(),
    },
    accumulated: { rainDaily: null, rainMonthly: null, rainAnnual: null },
    source: {
      name: "Embrapa Clima Temperado",
      station: "Posto Meteorológico da Sede",
      url: EMBRAPA_URL,
      latitude: -31.7,
      longitude: -52.4,
      altitude: 57,
      fetchedAt: new Date().toISOString(),
      observationTime: null,
    },
    error,
  };
}

function unavailableInmet(error: string): InmetAlerts {
  return {
    status: "unavailable",
    alerts: [],
    counts: { total: 0, pelotas: 0, regional: 0, state: 0 },
    source: {
      name: "INMET",
      feedUrl: INMET_FEED_URL,
      portalUrl: INMET_PORTAL_URL,
      fetchedAt: new Date().toISOString(),
    },
    error,
  };
}

function unavailableCppmet(error: string): CppmetForecast {
  return {
    status: "unavailable",
    items: [],
    fingerprint: null,
    source: {
      name: "CPPMet / UFPel",
      url: CPPMET_URL,
      fetchedAt: new Date().toISOString(),
      lastModified: null,
    },
    error,
  };
}

async function settleWithin<T>(
  promise: Promise<T>,
  sourceName: string,
  fallback: (error: string) => T,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeout = setTimeout(() => {
          resolve(
            fallback(
              `${sourceName} excedeu o limite de ${OFFICIAL_SOURCE_DEADLINE_MS / 1_000} segundos.`,
            ),
          );
        }, OFFICIAL_SOURCE_DEADLINE_MS);
      }),
    ]);
  } catch (error) {
    return fallback(
      error instanceof Error ? error.message : `Falha desconhecida ao consultar ${sourceName}.`,
    );
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function fetchOfficialWeatherSources(): Promise<OfficialWeatherSources> {
  const [embrapa, inmet, cppmet] = await Promise.all([
    settleWithin(fetchEmbrapaObservation(), "Embrapa", unavailableEmbrapa),
    settleWithin(fetchInmetAlerts(), "INMET", unavailableInmet),
    settleWithin(fetchCppmetForecast(), "CPPMet", unavailableCppmet),
  ]);

  const degradedSources: OfficialWeatherSources["degradedSources"] = [];
  if (embrapa.status !== "live") degradedSources.push("embrapa");
  if (inmet.status !== "live") degradedSources.push("inmet");
  if (cppmet.status !== "live") degradedSources.push("cppmet");

  return {
    embrapa,
    inmet,
    cppmet,
    fetchedAt: new Date().toISOString(),
    degradedSources,
  };
}
