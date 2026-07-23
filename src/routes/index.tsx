import { createFileRoute } from "@tanstack/react-router";

import { WeatherHome } from "@/components/weather/WeatherHome";
import "@/components/weather/WeatherHomeIntegrated.css";
import { createPageHead } from "@/lib/page-meta";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

export const Route = createFileRoute("/")({
  head: () =>
    createPageHead(
      "Tempo Pelotas — Previsão do tempo em Pelotas",
      "Condições atuais, alertas oficiais e previsão meteorológica consolidada para Pelotas, Rio Grande do Sul.",
      "/",
    ),
  loader: () => getWeatherIntelligence(),
  staleTime: 5 * 60 * 1_000,
  component: HomePage,
});

function HomePage() {
  const weather = Route.useLoaderData();
  return <WeatherHome data={weather} />;
}
