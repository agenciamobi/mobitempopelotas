import { createFileRoute } from "@tanstack/react-router";

import { WeatherHome } from "@/components/weather/WeatherHome";
import "@/components/weather/WeatherHomeIntegrated.css";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tempo Pelotas — Previsão do tempo em Pelotas" },
      {
        name: "description",
        content:
          "Condições atuais, alertas oficiais e previsão meteorológica consolidada para Pelotas, Rio Grande do Sul.",
      },
      { property: "og:title", content: "Tempo Pelotas — Previsão do tempo em Pelotas" },
      {
        property: "og:description",
        content:
          "Condições atuais, alertas oficiais e previsão meteorológica consolidada para Pelotas, Rio Grande do Sul.",
      },
    ],
  }),
  loader: () => getWeatherIntelligence(),
  staleTime: 5 * 60 * 1_000,
  component: HomePage,
});

function HomePage() {
  const weather = Route.useLoaderData();
  return <WeatherHome data={weather} />;
}
