import { createFileRoute } from "@tanstack/react-router";

import { SevenDayForecastPage } from "@/components/weather/ForecastPages";
import { createPageHead } from "@/lib/page-meta";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

export const Route = createFileRoute("/previsao-7-dias-pelotas")({
  head: () =>
    createPageHead(
      "Previsão de 7 dias para Pelotas",
      "Previsão meteorológica para os próximos sete dias em Pelotas, com temperaturas, chuva, vento e contexto regional.",
      "/previsao-7-dias-pelotas",
    ),
  loader: () => getWeatherIntelligence(),
  staleTime: 5 * 60 * 1_000,
  component: PrevisaoSeteDiasPage,
});

function PrevisaoSeteDiasPage() {
  const weather = Route.useLoaderData();
  return <SevenDayForecastPage data={weather} />;
}
