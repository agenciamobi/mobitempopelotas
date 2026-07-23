import { createFileRoute } from "@tanstack/react-router";

import { HydrologyOverviewPage } from "@/components/hydrology/HydrologyPages";
import { getGuaibaObservation } from "@/lib/hydrology/guaiba.functions";
import { getLagoonMonitoringNetwork } from "@/lib/hydrology/lagoon-network.functions";
import { getLaranjalLevelData } from "@/lib/hydrology/laranjal-level.functions";
import { createPageHead } from "@/lib/page-meta";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

export const Route = createFileRoute("/situacao-hidrologica-pelotas")({
  head: () =>
    createPageHead(
      "Situação das águas em Pelotas",
      "Leitura da Estação Laranjal, evolução recente da Lagoa dos Patos e contexto meteorológico e regional para Pelotas.",
      "/situacao-hidrologica-pelotas",
    ),
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
