import { createFileRoute } from "@tanstack/react-router";

import { ProductionHome } from "@/production/ProductionHome";
import { getGuaibaObservation } from "@/lib/hydrology/guaiba.functions";
import { getLagoonMonitoringNetwork } from "@/lib/hydrology/lagoon-network.functions";
import { getLaranjalLevelData } from "@/lib/hydrology/laranjal-level.functions";
import { createPageHead } from "@/lib/page-meta";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

export const Route = createFileRoute("/")({
  head: () =>
    createPageHead(
      "Tempo Pelotas — Previsão do tempo em Pelotas",
      "Condições atuais, alertas oficiais e previsão meteorológica consolidada para Pelotas, Rio Grande do Sul.",
      "/",
    ),
  loader: async () => {
    const [weather, laranjal, guaiba, lagoon] = await Promise.all([
      getWeatherIntelligence(),
      getLaranjalLevelData(),
      getGuaibaObservation(),
      getLagoonMonitoringNetwork(),
    ]);

    return { weather, laranjal, guaiba, lagoon };
  },
  staleTime: 60 * 1_000,
  component: HomePage,
});

function HomePage() {
  const { weather, laranjal, guaiba, lagoon } = Route.useLoaderData();
  return <ProductionHome data={weather} laranjal={laranjal} guaiba={guaiba} lagoon={lagoon} />;
}
