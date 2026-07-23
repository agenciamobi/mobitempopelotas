import { createFileRoute } from "@tanstack/react-router";

import { HydrologyOverviewPage } from "@/components/hydrology/HydrologyPages";
import { getGuaibaObservation } from "@/lib/hydrology/guaiba.functions";
import { getLagoonMonitoringNetwork } from "@/lib/hydrology/lagoon-network.functions";
import { getLaranjalLevelData } from "@/lib/hydrology/laranjal-level.functions";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Situação das águas em Pelotas";
const PAGE_DESCRIPTION =
  "Leitura da Estação Laranjal, evolução recente da Lagoa dos Patos e contexto meteorológico e regional para Pelotas.";
const PAGE_PATH = "/situacao-hidrologica-pelotas";

export const Route = createFileRoute(PAGE_PATH)({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Situação das águas em Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Nível da Lagoa dos Patos",
          "Estação Laranjal",
          "Monitoramento hidrológico regional",
        ],
      }),
    ]),
  loader: async () => {
    const [weather, level, guaiba, lagoon] = await Promise.all([
      getWeatherIntelligence(),
      getLaranjalLevelData(),
      getGuaibaObservation(),
      getLagoonMonitoringNetwork(),
    ]);
    return { weather, level, guaiba, lagoon };
  },
  staleTime: 60 * 1_000,
  component: SituacaoHidrologicaPage,
});

function SituacaoHidrologicaPage() {
  const data = Route.useLoaderData();
  return (
    <HydrologyOverviewPage
      weather={data.weather}
      level={data.level}
      guaiba={data.guaiba}
      lagoon={data.lagoon}
    />
  );
}
