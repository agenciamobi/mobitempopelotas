import { createFileRoute } from "@tanstack/react-router";

import { TomorrowForecastPage } from "@/components/weather/TomorrowForecastPage";
import { createPageHead } from "@/lib/page-meta";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

export const Route = createFileRoute("/tempo-amanha-pelotas")({
  head: () =>
    createPageHead(
      "Previsão do tempo para amanhã em Pelotas",
      "Veja a previsão do tempo para amanhã em Pelotas, com máxima, mínima, chance de chuva, volume previsto e rajadas de vento.",
      "/tempo-amanha-pelotas",
    ),
  loader: () => getWeatherIntelligence(),
  staleTime: 5 * 60 * 1_000,
  component: TempoAmanhaPage,
});

function TempoAmanhaPage() {
  const weather = Route.useLoaderData();
  return <TomorrowForecastPage data={weather} />;
}
