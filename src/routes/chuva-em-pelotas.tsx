import { createFileRoute } from "@tanstack/react-router";

import { RainPage } from "@/components/weather/RainWindPages";
import { createPageHead } from "@/lib/page-meta";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

export const Route = createFileRoute("/chuva-em-pelotas")({
  head: () =>
    createPageHead(
      "Chuva em Pelotas",
      "Previsão de chuva por hora, probabilidade e volume acumulado previsto para Pelotas nos próximos sete dias.",
      "/chuva-em-pelotas",
    ),
  loader: () => getWeatherIntelligence(),
  staleTime: 5 * 60 * 1_000,
  component: ChuvaPage,
});

function ChuvaPage() {
  const weather = Route.useLoaderData();
  return <RainPage data={weather} />;
}
