import { createFileRoute } from "@tanstack/react-router";

import { WeatherAlertsPage } from "@/components/weather/WeatherAlertsPage";
import { createPageHead } from "@/lib/page-meta";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

export const Route = createFileRoute("/alertas")({
  head: () =>
    createPageHead(
      "Alertas meteorológicos em Pelotas",
      "Avisos meteorológicos oficiais do INMET para Pelotas e região, organizados por severidade e período.",
    ),
  loader: () => getWeatherIntelligence(),
  staleTime: 5 * 60 * 1_000,
  component: AlertasPage,
});

function AlertasPage() {
  const weather = Route.useLoaderData();
  return <WeatherAlertsPage data={weather} />;
}
