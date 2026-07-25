import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { WindPage } from "@/components/weather/RainWindPages";
import { WIND_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Vento em Pelotas";
const PAGE_DESCRIPTION =
  "Velocidade, direção e rajadas de vento previstas para Pelotas nas próximas horas e nos próximos sete dias.";
const PAGE_PATH = "/vento-em-pelotas";

export const Route = createFileRoute("/vento-em-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Vento em Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Previsão de vento em Pelotas",
          "Rajadas de vento em Pelotas",
          "Direção do vento em Pelotas",
          "Vento por hora em Pelotas",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, WIND_EDITORIAL_CONTENT.faqs),
    ]),
  loader: () => getWeatherIntelligence(),
  staleTime: 5 * 60 * 1_000,
  component: VentoPage,
});

function VentoPage() {
  const weather = Route.useLoaderData();

  return (
    <>
      <WindPage data={weather} />
      <EditorialContentSection
        id="como-interpretar-a-previsao-de-vento"
        content={WIND_EDITORIAL_CONTENT}
      />
    </>
  );
}
