import { createFileRoute } from "@tanstack/react-router";

import { WindPage } from "@/components/weather/RainWindPages";
import { createPageHead } from "@/lib/page-meta";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

export const Route = createFileRoute("/vento-em-pelotas")({
  head: () =>
    createPageHead(
      "Vento em Pelotas",
      "Velocidade, direção e rajadas de vento previstas para Pelotas nas próximas horas e nos próximos sete dias.",
    ),
  loader: () => getWeatherIntelligence(),
  staleTime: 5 * 60 * 1_000,
  component: VentoPage,
});

function VentoPage() {
  const weather = Route.useLoaderData();
  return <WindPage data={weather} />;
}
