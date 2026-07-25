import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { RainPage } from "@/components/weather/RainWindPages";
import { RAIN_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Chuva em Pelotas";
const PAGE_DESCRIPTION =
  "Previsão de chuva por hora, probabilidade e volume acumulado previsto para Pelotas nos próximos sete dias.";
const PAGE_PATH = "/chuva-em-pelotas";

export const Route = createFileRoute("/chuva-em-pelotas")({
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
        about: [
          "Previsão de chuva em Pelotas",
          "Probabilidade de chuva em Pelotas",
          "Volume de precipitação em Pelotas",
          "Chuva por hora em Pelotas",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, RAIN_EDITORIAL_CONTENT.faqs),
    ]),
  loader: () => getWeatherIntelligence(),
  staleTime: 5 * 60 * 1_000,
  component: ChuvaPage,
});

function ChuvaPage() {
  const weather = Route.useLoaderData();

  return (
    <>
      <RainPage data={weather} />
      <EditorialContentSection
        id="como-interpretar-a-previsao-de-chuva"
        content={RAIN_EDITORIAL_CONTENT}
      />
    </>
  );
}
