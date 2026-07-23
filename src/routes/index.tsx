import { createFileRoute } from "@tanstack/react-router";

import { WeatherHome } from "@/components/weather/WeatherHome";
import "@/components/weather/WeatherHomeIntegrated.css";
import { getGuaibaObservation } from "@/lib/hydrology/guaiba.functions";
import { getLagoonMonitoringNetwork } from "@/lib/hydrology/lagoon-network.functions";
import { getLaranjalLevelData } from "@/lib/hydrology/laranjal-level.functions";
import { createPageHead } from "@/lib/page-meta";
import { getRedemetOverview } from "@/lib/redemet/redemet.functions";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

export const Route = createFileRoute("/")({
  head: () =>
    createPageHead(
      "Tempo Pelotas — Previsão do tempo em Pelotas",
      "Condições atuais, alertas oficiais e previsão meteorológica consolidada para Pelotas, Rio Grande do Sul.",
      "/",
    ),
  loader: async () => {
    const [weather, laranjal, redemet, guaiba, lagoon] = await Promise.all([
      getWeatherIntelligence(),
      getLaranjalLevelData(),
      getRedemetOverview(),
      getGuaibaObservation(),
      getLagoonMonitoringNetwork(),
    ]);

    return { weather, laranjal, redemet, guaiba, lagoon };
  },
  staleTime: 60 * 1_000,
  component: HomePage,
});

function HomePage() {
  const { weather, laranjal, redemet, guaiba, lagoon } = Route.useLoaderData();
  return (
    <WeatherHome
      data={weather}
      laranjal={laranjal}
      redemet={redemet}
      guaiba={guaiba}
      lagoon={lagoon}
    />
  );
}
