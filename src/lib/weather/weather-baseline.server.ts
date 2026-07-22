import { fetchMetNorwayWeather } from "./met-norway.server";
import { fetchPelotasWeather as fetchOpenMeteoWeather } from "./open-meteo.server";
import type { WeatherHomeData } from "./types";

const OPEN_METEO_DEADLINE_MS = 2_200;

async function settleOpenMeteo(): Promise<WeatherHomeData | null> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      fetchOpenMeteoWeather(),
      new Promise<null>((resolve) => {
        timeout = setTimeout(() => resolve(null), OPEN_METEO_DEADLINE_MS);
      }),
    ]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function fetchPelotasWeather(): Promise<WeatherHomeData> {
  const openMeteo = await settleOpenMeteo();
  if (openMeteo?.status === "live") return openMeteo;

  const metNorway = await fetchMetNorwayWeather();
  if (metNorway.status === "live") return metNorway;

  return (
    openMeteo ?? {
      ...metNorway,
      message:
        "Não foi possível obter a previsão no Open-Meteo nem na fonte de contingência do MET Norway.",
    }
  );
}
