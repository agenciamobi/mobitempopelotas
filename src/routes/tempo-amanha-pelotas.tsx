import { createFileRoute } from "@tanstack/react-router";

import { TomorrowForecastPage } from "@/components/weather/TomorrowForecastPage";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Previsão do tempo para amanhã em Pelotas";
const PAGE_DESCRIPTION =
  "Veja a previsão do tempo para amanhã em Pelotas, com máxima, mínima, chance de chuva, volume previsto e rajadas de vento.";
const PAGE_PATH = "/tempo-amanha-pelotas";

export const Route = createFileRoute("/tempo-amanha-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Previsão para amanhã em Pelotas", path: PAGE_PATH },
        ],
        about: ["Previsão do tempo", "Tempo amanhã em Pelotas"],
      }),
    ]),
  loader: () => getWeatherIntelligence(),
  staleTime: 5 * 60 * 1_000,
  component: TempoAmanhaPage,
});

function TempoAmanhaPage() {
  const weather = Route.useLoaderData();
  return <TomorrowForecastPage data={weather} />;
}
