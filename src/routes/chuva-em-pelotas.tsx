import { createFileRoute } from "@tanstack/react-router";

import { RainPage } from "@/components/weather/RainWindPages";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Chuva em Pelotas";
const PAGE_DESCRIPTION =
  "Previsão de chuva por hora, probabilidade e volume acumulado previsto para Pelotas nos próximos sete dias.";
const PAGE_PATH = "/chuva-em-pelotas";

export const Route = createFileRoute(PAGE_PATH)({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Chuva em Pelotas", path: PAGE_PATH },
        ],
        about: ["Previsão de chuva", "Precipitação em Pelotas"],
      }),
    ]),
  loader: () => getWeatherIntelligence(),
  staleTime: 5 * 60 * 1_000,
  component: ChuvaPage,
});

function ChuvaPage() {
  const weather = Route.useLoaderData();
  return <RainPage data={weather} />;
}
