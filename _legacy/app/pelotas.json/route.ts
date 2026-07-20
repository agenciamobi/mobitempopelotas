import { NextResponse } from "next/server";
import { getEmbrapaObservation } from "@/lib/embrapa-observation";
import { getGuaibaObservation } from "@/lib/guaiba-monitor";
import {
  HYDROLOGY_DATA_SOURCES,
  HYDROLOGY_STATIONS,
} from "@/lib/hydrology";
import { getLagoonMonitoringNetwork } from "@/lib/lagoon-monitoring-network";
import { getLaranjalLevelData } from "@/lib/laranjal-level";
import { LAGOON_LEVEL_SOURCE } from "@/lib/lagoon-level";
import { getNivelGuaibaRegionalObservations } from "@/lib/nivel-guaiba-regional";
import { absoluteUrl } from "@/lib/site";
import { getPelotasWeather } from "@/lib/weather-service";

export const revalidate = 300;

export async function GET() {
  const [
    weather,
    embrapaObservation,
    guaibaObservation,
    guaibaRegional,
    lagoonMonitoring,
    laranjalLevel,
  ] = await Promise.all([
    getPelotasWeather(),
    getEmbrapaObservation(),
    getGuaibaObservation(),
    getNivelGuaibaRegionalObservations(),
    getLagoonMonitoringNetwork(),
    getLaranjalLevelData(),
  ]);

  return NextResponse.json(
    {
      schema_version: "1.4",
      generated_at: new Date().toISOString(),
      location: {
        city: "Pelotas",
        state: "RS",
        country: "BR",
        latitude: -31.7654,
        longitude: -52.3376,
        timezone: "America/Sao_Paulo",
      },
      weather: {
        forecast: {
          current: weather.current,
          hourly: weather.hourly,
          daily: weather.daily,
          regional: weather.regional,
          source: weather.source,
        },
        observed: {
          embrapa: embrapaObservation,
        },
      },
      hydrology: {
        status: "contextual-monitoring",
        local_level: {
          laranjal: laranjalLevel,
          interpretation:
            "Medição local prioritária para acompanhar a Lagoa dos Patos na região de Pelotas.",
        },
        upstream_indicator: {
          guaiba: guaibaObservation,
          interpretation:
            "Indicador regional a montante. Não representa previsão isolada do nível futuro em Pelotas.",
        },
        upstream_network: {
          source: "Nível Guaíba",
          observations: guaibaRegional,
          interpretation:
            "Cada cidade utiliza uma régua e uma referência próprias. Compare a tendência de cada ponto, não os níveis absolutos entre cidades.",
        },
        lagoon_network: {
          data: lagoonMonitoring,
          interpretation:
            "Rede FURG e Portos RS com cotas em diferentes pontos da Lagoa dos Patos. Compare cada leitura com a cota de inundação indicada para a mesma estação.",
        },
        local_dashboard: {
          station: LAGOON_LEVEL_SOURCE.station,
          provider: LAGOON_LEVEL_SOURCE.name,
          location: LAGOON_LEVEL_SOURCE.location,
          url: LAGOON_LEVEL_SOURCE.dashboardUrl,
        },
        system_note:
          "A Lagoa dos Patos recebe contribuições do Guaíba e de outras bacias, rios e arroios. O nível em Pelotas também depende do vento, do Canal São Gonçalo e do escoamento pela Barra de Rio Grande.",
        official_stations: HYDROLOGY_STATIONS,
        sources: HYDROLOGY_DATA_SOURCES,
      },
      links: {
        home: absoluteUrl("/"),
        embrapa_station: absoluteUrl("/estacao-embrapa-pelotas"),
        embrapa_api: absoluteUrl("/api/weather/embrapa"),
        hydrology: absoluteUrl("/situacao-hidrologica-pelotas"),
        laranjal_api: absoluteUrl("/api/hydrology/laranjal"),
        guaiba_api: absoluteUrl("/api/hydrology/guaiba"),
        guaiba_cities_api: absoluteUrl("/api/hydrology/guaiba/cities"),
        lagoon_network_api: absoluteUrl("/api/hydrology/lagoon-network"),
        methodology: absoluteUrl("/metodologia"),
        feed: absoluteUrl("/feed"),
      },
      disclaimer:
        "Informação comunitária. Leituras representam pontos específicos e não substituem alertas ou orientações da Defesa Civil e das autoridades competentes.",
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=120, s-maxage=300, stale-while-revalidate=600",
      },
    },
  );
}
