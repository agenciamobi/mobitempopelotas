import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { TodayForecastPageV5 } from "@/components/weather/TodayForecastPageV5";
import { TodayRetailHero } from "@/components/weather/TodayRetailHero";
import { TODAY_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Tempo hoje em Pelotas";
const PAGE_DESCRIPTION =
  "Tempo hoje em Pelotas com condições atuais, previsão por hora, melhores janelas das próximas 12 horas, chuva, vento, radar e alertas oficiais.";
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
          "Melhores horários para atividades ao ar livre em Pelotas",
          "Janelas de chuva e vento nas próximas horas",
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
    <InternalWeatherPageShell
      data={weather}
      pageClassName="internal-weather-shell--today"
      hero={({ weather: productionWeather, advisoryLevel, officialAlertCount }) => (
        <TodayRetailHero
          weather={productionWeather}
          advisoryLevel={advisoryLevel}
          officialAlertCount={officialAlertCount}
        />
      )}
    >
      <TodayForecastPageV5 data={weather} />
      <EditorialContentSection
        id="como-interpretar-hoje"
        content={TODAY_EDITORIAL_CONTENT}
      />
    </InternalWeatherPageShell>
  );
}
