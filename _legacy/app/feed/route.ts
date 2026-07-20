import { getEmbrapaObservation } from "@/lib/embrapa-observation";
import { HYDROLOGY_STATIONS } from "@/lib/hydrology";
import { LAGOON_LEVEL_SOURCE } from "@/lib/lagoon-level";
import { absoluteUrl } from "@/lib/site";
import { getPelotasWeather } from "@/lib/weather-service";

export const revalidate = 300;

function formatObservationValue(value: number | null, unit: string) {
  return value === null ? "indisponível" : `${value}${unit}`;
}

export async function GET() {
  const [weather, embrapa] = await Promise.all([
    getPelotasWeather(),
    getEmbrapaObservation(),
  ]);
  const generatedAt = new Date().toISOString();
  const today = weather.daily[0];
  const laranjalStation = HYDROLOGY_STATIONS.find(
    (station) => station.code === "87955000",
  );
  const embrapaText =
    embrapa.status === "unavailable"
      ? "A estação automática da Embrapa está temporariamente indisponível para consulta pelo portal."
      : `A estação da Embrapa registrou ${formatObservationValue(embrapa.current.temperature, "°C")}, umidade de ${formatObservationValue(embrapa.current.humidity, "%")}, vento de ${formatObservationValue(embrapa.current.windSpeed, " km/h")} e ${formatObservationValue(embrapa.accumulated.rainDaily, " mm")} de chuva no dia.`;

  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: "TEMPO Pelotas",
    home_page_url: absoluteUrl("/"),
    feed_url: absoluteUrl("/feed"),
    description:
      "Previsão, observação meteorológica e contexto hidrológico para preparação comunitária em Pelotas, RS.",
    language: "pt-BR",
    items: [
      {
        id: absoluteUrl("/tempo-hoje-pelotas"),
        url: absoluteUrl("/tempo-hoje-pelotas"),
        title: `Tempo em Pelotas: ${weather.current.temperature}°C e ${weather.current.condition}`,
        content_text: `Sensação de ${weather.current.feelsLike}°C, vento de ${weather.current.windSpeed} km/h ${weather.current.windDirection}, rajadas de ${weather.current.windGust} km/h e ${today?.rainChance ?? 0}% de probabilidade de chuva hoje.`,
        date_modified: generatedAt,
        tags: ["tempo", "Pelotas", "previsão", "chuva", "vento"],
      },
      {
        id: absoluteUrl("/estacao-embrapa-pelotas"),
        url: absoluteUrl("/estacao-embrapa-pelotas"),
        title: "Observação meteorológica da Embrapa em Pelotas",
        content_text: embrapaText,
        date_modified: generatedAt,
        tags: ["Embrapa", "observação", "Pelotas", "chuva medida", "agrometeorologia"],
      },
      {
        id: absoluteUrl("/situacao-hidrologica-pelotas"),
        url: absoluteUrl("/situacao-hidrologica-pelotas"),
        title: "Situação hidrológica de Pelotas e da Lagoa dos Patos",
        content_text: `Acompanhe a Estação Laranjal${laranjalStation ? `, código ANA ${laranjalStation.code}` : ""}, o contexto do Guaíba, vento e chuva. O nível local é consultado no painel público ${LAGOON_LEVEL_SOURCE.name}.`,
        date_modified: generatedAt,
        tags: ["hidrologia", "Lagoa dos Patos", "Laranjal", "Guaíba", "prevenção"],
      },
      {
        id: absoluteUrl("/metodologia"),
        url: absoluteUrl("/metodologia"),
        title: "Metodologia e fontes do TEMPO Pelotas",
        content_text:
          "Consulte as fontes em uso, observações meteorológicas, estações oficiais, regras de validação, limitações e endpoints públicos do portal.",
        date_modified: generatedAt,
        tags: ["metodologia", "dados abertos", "fontes", "transparência"],
      },
    ],
  };

  return new Response(JSON.stringify(feed), {
    status: 200,
    headers: {
      "Content-Type": "application/feed+json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=120, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
