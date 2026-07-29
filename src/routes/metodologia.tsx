import { createFileRoute } from "@tanstack/react-router";

import { ForecastAccuracyPanel } from "@/components/methodology/ForecastAccuracyPanel";
import { MethodologyPage } from "@/components/methodology/MethodologyPage";
import { getGuaibaObservation } from "@/lib/hydrology/guaiba.functions";
import { getLagoonMonitoringNetwork } from "@/lib/hydrology/lagoon-network.functions";
import { getLaranjalLevelData } from "@/lib/hydrology/laranjal-level.functions";
import { createPageHead } from "@/lib/page-meta";
import { getRedemetOverview } from "@/lib/redemet/redemet.functions";
import { createEditorialPageJsonLd } from "@/lib/structured-data";
import { getForecastAccuracySummary } from "@/lib/weather/forecast-accuracy.functions";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Como os dados do Tempo Pelotas funcionam";
const PAGE_DESCRIPTION =
  "Veja de onde vêm as informações de tempo e nível da água, como a precisão das previsões é medida, o que acontece quando uma fonte falha e quais são os limites de cada dado.";
const PAGE_PATH = "/metodologia";

export const Route = createFileRoute("/metodologia")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Como os dados funcionam", path: PAGE_PATH },
        ],
        about: [
          "Metodologia meteorológica",
          "Fontes de dados meteorológicos em Pelotas",
          "Embrapa Clima Temperado",
          "INMET",
          "CPPMet/UFPel",
          "Open-Meteo e MET Norway",
          "Precisão das previsões meteorológicas",
          "Erro de temperatura e chuva prevista",
          "REDEMET/DECEA",
          "LabHidroSens/UFPel",
          "Régua do Cais Mauá",
          "MetSul e TideSat Global",
          "FURG e Portos RS",
          "Medições de nível na Lagoa dos Patos",
        ],
      }),
    ]),
  loader: async () => {
    const [weather, level, redemet, guaiba, lagoon, accuracy] = await Promise.all([
      getWeatherIntelligence(),
      getLaranjalLevelData(),
      getRedemetOverview(),
      getGuaibaObservation(),
      getLagoonMonitoringNetwork(),
      getForecastAccuracySummary(),
    ]);

    return { weather, level, redemet, guaiba, lagoon, accuracy };
  },
  staleTime: 60 * 1_000,
  component: MetodologiaPage,
});

function MetodologiaPage() {
  const data = Route.useLoaderData();

  return (
    <>
      <MethodologyPage
        weather={data.weather}
        level={data.level}
        redemet={data.redemet}
        guaiba={data.guaiba}
        lagoon={data.lagoon}
      />
      <ForecastAccuracyPanel summary={data.accuracy} />
    </>
  );
}
