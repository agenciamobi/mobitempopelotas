import { createFileRoute } from "@tanstack/react-router";

import { TodayForecastPage } from "@/components/weather/ForecastPages";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Tempo hoje em Pelotas";
const PAGE_DESCRIPTION =
  "Condições atuais e previsão por hora para hoje em Pelotas, com chuva, vento, temperatura e alertas oficiais.";
const PAGE_PATH = "/tempo-hoje-pelotas";

export const Route = createFileRoute(PAGE_PATH)({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Tempo hoje em Pelotas", path: PAGE_PATH },
        ],
        about: ["Previsão do tempo", "Condições meteorológicas em Pelotas"],
      }),
    ]),
  loader: () => getWeatherIntelligence(),
  staleTime: 5 * 60 * 1_000,
  component: TempoHojePage,
});

function TempoHojePage() {
  const weather = Route.useLoaderData();
  return <TodayForecastPage data={weather} />;
}
