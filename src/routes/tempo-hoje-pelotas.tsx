import { createFileRoute } from "@tanstack/react-router";

import { TodayForecastPage } from "@/components/weather/ForecastPages";
import { createPageHead } from "@/lib/page-meta";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

export const Route = createFileRoute("/tempo-hoje-pelotas")({
  head: () =>
    createPageHead(
      "Tempo hoje em Pelotas",
      "Condições atuais e previsão por hora para hoje em Pelotas, com chuva, vento, temperatura e alertas oficiais.",
      "/tempo-hoje-pelotas",
    ),
  loader: () => getWeatherIntelligence(),
  staleTime: 5 * 60 * 1_000,
  component: TempoHojePage,
});

function TempoHojePage() {
  const weather = Route.useLoaderData();
  return <TodayForecastPage data={weather} />;
}
