import {
  normalizeGuaibaSeries,
  type GuaibaObservationStatus,
} from "@/lib/guaiba-monitor";
import {
  NIVEL_GUAIBA_CITIES,
  type NivelGuaibaCity,
} from "@/lib/nivel-guaiba-cities";

const REVALIDATE_SECONDS = 300;
const REQUEST_TIMEOUT_MS = 7_000;

export type NivelGuaibaCityObservation = {
  city: NivelGuaibaCity;
  status: GuaibaObservationStatus;
  currentLevel: number | null;
  updatedAt: string | null;
  trendCmPerHour: number | null;
  variation24hCm: number | null;
  error: string | null;
  source: {
    name: string;
    url: string;
    jsonUrl: string;
    fetchedAt: string;
  };
};

function unavailableCityObservation(
  city: NivelGuaibaCity,
  error: string,
): NivelGuaibaCityObservation {
  return {
    city,
    status: "unavailable",
    currentLevel: null,
    updatedAt: null,
    trendCmPerHour: null,
    variation24hCm: null,
    error,
    source: {
      name: "Nível Guaíba",
      url: city.url,
      jsonUrl: city.jsonUrl,
      fetchedAt: new Date().toISOString(),
    },
  };
}

export async function getNivelGuaibaCityObservation(
  city: NivelGuaibaCity,
): Promise<NivelGuaibaCityObservation> {
  const fetchedAt = new Date();

  try {
    const response = await fetch(city.jsonUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "TEMPO-Pelotas/1.0 (+https://tempopelotas.agenciamobi.com.br)",
      },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`status ${response.status}`);
    }

    const normalized = normalizeGuaibaSeries(await response.json(), fetchedAt);

    return {
      city,
      status: normalized.status,
      currentLevel: normalized.currentLevel,
      updatedAt: normalized.updatedAt,
      trendCmPerHour: normalized.trendCmPerHour,
      variation24hCm: normalized.variation24hCm,
      error: normalized.error,
      source: {
        name: "Nível Guaíba",
        url: city.url,
        jsonUrl: city.jsonUrl,
        fetchedAt: fetchedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error(`Falha ao carregar o nível em ${city.name}:`, error);
    return unavailableCityObservation(
      city,
      `A leitura de ${city.name} está temporariamente indisponível.`,
    );
  }
}

export async function getNivelGuaibaRegionalObservations() {
  return Promise.all(
    NIVEL_GUAIBA_CITIES.map((city) => getNivelGuaibaCityObservation(city)),
  );
}

export { REVALIDATE_SECONDS as NIVEL_GUAIBA_REGIONAL_REVALIDATE_SECONDS };
