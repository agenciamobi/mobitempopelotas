import { createFileRoute } from "@tanstack/react-router";

import { EmbrapaStationPage } from "@/components/embrapa/EmbrapaStationPage";
import { createPageHead } from "@/lib/page-meta";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

export const Route = createFileRoute("/estacao-embrapa-pelotas")({
  head: () =>
    createPageHead(
      "Estação meteorológica da Embrapa em Pelotas",
      "Temperatura, umidade, pressão, vento, extremos e chuva acumulada consultados na Estação da Embrapa Clima Temperado em Pelotas.",
      "/estacao-embrapa-pelotas",
    ),
  loader: () => getWeatherIntelligence(),
  staleTime: 60 * 1_000,
  component: EstacaoEmbrapaPage,
});

function EstacaoEmbrapaPage() {
  const data = Route.useLoaderData();
  return <EmbrapaStationPage data={data} />;
}
