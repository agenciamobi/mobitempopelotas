import type { ForecastSourceKey, WeatherHomeData } from "./types";

export type WeatherBaselineData = WeatherHomeData & {
  providers: Record<ForecastSourceKey, WeatherHomeData>;
};

function unavailableMessage(openMeteo: WeatherHomeData, metNorway: WeatherHomeData) {
  const details = [openMeteo.message, metNorway.message].filter(Boolean).join(" ");

  return details
    ? `Não foi possível obter uma previsão meteorológica utilizável. ${details}`
    : "Não foi possível obter a previsão no Open-Meteo nem na fonte de contingência do MET Norway.";
}

export function selectBaseline(
  openMeteo: WeatherHomeData,
  metNorway: WeatherHomeData,
): WeatherBaselineData {
  const providers: Record<ForecastSourceKey, WeatherHomeData> = {
    "open-meteo": openMeteo,
    "met-norway": metNorway,
  };

  if (openMeteo.status === "live") {
    return { ...openMeteo, providers };
  }
  if (metNorway.status === "live") {
    return { ...metNorway, providers };
  }

  return {
    ...openMeteo,
    message: unavailableMessage(openMeteo, metNorway),
    providers,
  };
}
