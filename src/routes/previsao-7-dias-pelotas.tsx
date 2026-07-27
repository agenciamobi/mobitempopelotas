import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { SevenDayForecastPage } from "@/components/weather/ForecastPages";
import { SEVEN_DAY_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Previsão de 7 dias para Pelotas";
const PAGE_DESCRIPTION =
  "Previsão meteorológica para os próximos sete dias em Pelotas, com temperaturas, chuva, vento e contexto regional.";
const PAGE_PATH = "/previsao-7-dias-pelotas";

export const Route = createFileRoute("/previsao-7-dias-pelotas")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Previsão de 7 dias para Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Previsão do tempo em Pelotas",
          "Tendência meteorológica em Pelotas",
          "Previsão de chuva para 7 dias",
          "Temperaturas para os próximos 7 dias",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, SEVEN_DAY_EDITORIAL_CONTENT.faqs),
    ]),
  loader: () => getWeatherIntelligence(),
  staleTime: 5 * 60 * 1_000,
  component: PrevisaoSeteDiasPage,
});

function PrevisaoSeteDiasPage() {
  const weather = Route.useLoaderData();

  return (
    <InternalWeatherPageShell
      data={weather}
      pageClassName="internal-weather-shell--seven-day"
    >
      <SevenDayForecastPage data={weather} />
      <EditorialContentSection
        id="como-interpretar-a-previsao-semanal"
        content={SEVEN_DAY_EDITORIAL_CONTENT}
      />
    </InternalWeatherPageShell>
  );
}
