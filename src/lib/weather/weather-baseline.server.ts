import { fetchMetNorwayWeather } from "./met-norway.server";
import { fetchPelotasWeather as fetchOpenMeteoWeather } from "./open-meteo.server";
import type { WeatherHomeData } from "./types";

function unavailableMessage(openMeteo: WeatherHomeData, metNorway: WeatherHomeData) {
  const details = [openMeteo.message, metNorway.message].filter(Boolean).join(" ");

  return details
    ? `Não foi possível obter uma previsão meteorológica utilizável. ${details}`
    : "Não foi possível obter a previsão no Open-Meteo nem na fonte de contingência do MET Norway.";
}

export async function fetchPelotasWeather(): Promise<WeatherHomeData> {
  const [openMeteo, metNorway] = await Promise.all([
    fetchOpenMeteoWeather(),
    fetchMetNorwayWeather(),
  ]);

  if (openMeteo.status === "live") return openMeteo;
  if (metNorway.status === "live") return metNorway;

  return {
    ...openMeteo,
    message: unavailableMessage(openMeteo, metNorway),
  };
}
