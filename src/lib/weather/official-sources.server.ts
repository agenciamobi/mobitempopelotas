import { fetchCppmetForecast } from "./cppmet.server";
import { fetchEmbrapaObservation } from "./embrapa.server";
import { fetchInmetAlerts } from "./inmet.server";
import type { OfficialWeatherSources } from "./official-sources.types";

export async function fetchOfficialWeatherSources(): Promise<OfficialWeatherSources> {
  const [embrapa, inmet, cppmet] = await Promise.all([
    fetchEmbrapaObservation(),
    fetchInmetAlerts(),
    fetchCppmetForecast(),
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
