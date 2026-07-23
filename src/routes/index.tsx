import { createFileRoute } from "@tanstack/react-router";

import { WeatherHome } from "@/components/weather/WeatherHome";
import "@/components/weather/WeatherHomeIntegrated.css";
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
    const [weather, laranjal, redemet] = await Promise.all([
      getWeatherIntelligence(),
      getLaranjalLevelData(),
      getRedemetOverview(),
    ]);

    return { weather, laranjal, redemet };
  },
  staleTime: 60 * 1_000,
  component: HomePage,
});

function HomePage() {
  const { weather, laranjal, redemet } = Route.useLoaderData();
  return <WeatherHome data={weather} laranjal={laranjal} redemet={redemet} />;
}
