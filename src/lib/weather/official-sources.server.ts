import { fetchCppmetForecast } from "./cppmet.server";
import { getCentralEmbrapaObservation } from "./embrapa-central.server";
import { fetchInmetForecast } from "./inmet-forecast.server";
import { fetchInmetStationReference } from "./inmet-station.server";
import { fetchStableInmetAlerts } from "./inmet-stable.server";
import type {
  CppmetForecast,
  EmbrapaObservation,
  InmetAlerts,
  InmetForecast,
  InmetStationReference,
  OfficialWeatherSources,
  TimedObservation,
} from "./official-sources.types";
import { OFFICIAL_SOURCE_DEADLINE_MS } from "./source-policy.ts";

const EMBRAPA_URL = "https://agromet.cpact.embrapa.br/online/Current_Monitor.htm";
const INMET_ALERTS_URL = "https://apiprevmet3.inmet.gov.br/avisos/rss";
const INMET_FORECAST_URL = "https://apiprevmet3.inmet.gov.br/previsao/4314407";
const INMET_STATION_URL = "https://apiprevmet3.inmet.gov.br/estacao/proxima/4314407";
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
      feedUrl: INMET_ALERTS_URL,
      portalUrl: INMET_PORTAL_URL,
      fetchedAt: new Date().toISOString(),
    },
    error,
  };
}

function unavailableInmetForecast(error: string): InmetForecast {
  return {
    status: "unavailable",
    periods: [],
    source: { name: "INMET", url: INMET_FORECAST_URL, fetchedAt: new Date().toISOString() },
    error,
  };
}

function unavailableInmetStation(error: string): InmetStationReference {
  return {
    status: "unavailable",
    station: null,
    source: { name: "INMET", url: INMET_STATION_URL, fetchedAt: new Date().toISOString() },
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
  deadlineMs: number,
  fallback: (error: string) => T,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeout = setTimeout(() => {
          resolve(fallback(`${sourceName} excedeu o limite de ${deadlineMs / 1_000} segundos.`));
        }, deadlineMs);
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
  const [embrapa, inmet, inmetForecast, inmetStation, cppmet] = await Promise.all([
    settleWithin(
      getCentralEmbrapaObservation(),
      "Embrapa",
      OFFICIAL_SOURCE_DEADLINE_MS.embrapa,
      unavailableEmbrapa,
    ),
    settleWithin(
      fetchStableInmetAlerts(),
      "INMET",
      OFFICIAL_SOURCE_DEADLINE_MS.inmet,
      unavailableInmet,
    ),
    settleWithin(
      fetchInmetForecast(),
      "Previsão do INMET",
      OFFICIAL_SOURCE_DEADLINE_MS.inmet,
      unavailableInmetForecast,
    ),
    settleWithin(
      fetchInmetStationReference(),
      "Estação do INMET",
      OFFICIAL_SOURCE_DEADLINE_MS.inmet,
      unavailableInmetStation,
    ),
    settleWithin(
      fetchCppmetForecast(),
      "CPPMet",
      OFFICIAL_SOURCE_DEADLINE_MS.cppmet,
      unavailableCppmet,
    ),
  ]);

  const degradedSources: OfficialWeatherSources["degradedSources"] = [];
  if (embrapa.status !== "live") degradedSources.push("embrapa");
  if (inmet.status !== "live") degradedSources.push("inmet");
  if (inmetForecast.status !== "live") degradedSources.push("inmet-forecast");
  if (inmetStation.status !== "live") degradedSources.push("inmet-station");
  if (cppmet.status !== "live") degradedSources.push("cppmet");

  return {
    embrapa,
    inmet,
    inmetForecast,
    inmetStation,
    cppmet,
    fetchedAt: new Date().toISOString(),
    degradedSources,
  };
}
