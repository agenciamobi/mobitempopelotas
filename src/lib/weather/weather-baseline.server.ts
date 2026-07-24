import { fetchMetNorwayWeather } from "./met-norway.server";
import { fetchPelotasWeather as fetchOpenMeteoWeather } from "./open-meteo.server";
import { selectBaseline, type WeatherBaselineData } from "./weather-baseline-select";

export type { WeatherBaselineData } from "./weather-baseline-select";

export async function fetchPelotasWeather(): Promise<WeatherBaselineData> {
  const [openMeteo, metNorway] = await Promise.all([
    fetchOpenMeteoWeather(),
    fetchMetNorwayWeather(),
  ]);

  return selectBaseline(openMeteo, metNorway);
}
