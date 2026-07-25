import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { TodayForecastPageV3 } from "@/components/weather/TodayForecastPageV3";
import { TODAY_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Tempo hoje em Pelotas";
const PAGE_DESCRIPTION =
  "Condições atuais e previsão por hora para hoje em Pelotas, com chuva, vento, temperatura e alertas oficiais.";
const PAGE_PATH = "/tempo-hoje-pelotas";

export const Route = createFileRoute("/tempo-hoje-pelotas")({
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
        about: [
          "Previsão do tempo",
          "Condições meteorológicas em Pelotas",
          "Temperatura atual em Pelotas",
          "Previsão por hora em Pelotas",
          "Medição meteorológica da Embrapa em Pelotas",
          "Alertas meteorológicos do INMET em Pelotas",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, TODAY_EDITORIAL_CONTENT.faqs),
    ]),
  loader: () => getWeatherIntelligence(),
  staleTime: 5 * 60 * 1_000,
  component: TempoHojePage,
});

function TempoHojePage() {
  const weather = Route.useLoaderData();

  return (
    <>
      <TodayForecastPageV3 data={weather} />
      <EditorialContentSection id="como-interpretar-hoje" content={TODAY_EDITORIAL_CONTENT} />
    </>
  );
}
