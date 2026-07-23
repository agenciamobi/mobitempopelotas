import { createFileRoute } from "@tanstack/react-router";

import { EmbrapaStationPage } from "@/components/embrapa/EmbrapaStationPage";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Estação meteorológica da Embrapa em Pelotas";
const PAGE_DESCRIPTION =
  "Temperatura, umidade, pressão, vento, extremos e chuva acumulada consultados na Estação da Embrapa Clima Temperado em Pelotas.";
const PAGE_PATH = "/estacao-embrapa-pelotas";

export const Route = createFileRoute("/estacao-embrapa-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Estação Embrapa em Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Observação meteorológica em Pelotas",
          "Embrapa Clima Temperado",
          "Medições meteorológicas locais",
        ],
      }),
    ]),
  loader: () => getWeatherIntelligence(),
  staleTime: 60 * 1_000,
  component: EstacaoEmbrapaPage,
});

function EstacaoEmbrapaPage() {
  const data = Route.useLoaderData();
  return <EmbrapaStationPage data={data} />;
}
