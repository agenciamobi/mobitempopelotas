import { createFileRoute } from "@tanstack/react-router";

import { InternalWeatherPageShell } from "@/components/layout/InternalWeatherPageShell";
import { TomorrowForecastPageV3 } from "@/components/weather/TomorrowForecastPageV3";
import { TomorrowRetailHero } from "@/components/weather/TomorrowRetailHero";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Previsão do tempo para amanhã em Pelotas";
const PAGE_DESCRIPTION =
  "Planeje amanhã em Pelotas com mínima, máxima, chuva, rajadas, comparação com hoje e contexto do INMET e CPPMet/UFPel.";
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
        about: [
          "Previsão do tempo",
          "Tempo amanhã em Pelotas",
          "Chuva amanhã em Pelotas",
          "Temperatura amanhã em Pelotas",
          "Vento amanhã em Pelotas",
          "Planejamento meteorológico em Pelotas",
        ],
      }),
    ]),
  loader: () => getWeatherIntelligence(),
  staleTime: 5 * 60 * 1_000,
  component: TempoAmanhaPage,
});

function TempoAmanhaPage() {
  const weather = Route.useLoaderData();

  return (
    <InternalWeatherPageShell
      data={weather}
      pageClassName="internal-weather-shell--tomorrow"
      hero={({ weather: productionWeather, advisoryLevel, officialAlertCount }) => (
        <TomorrowRetailHero
          weather={productionWeather}
          advisoryLevel={advisoryLevel}
          officialAlertCount={officialAlertCount}
        />
      )}
    >
      <TomorrowForecastPageV3 data={weather} />
    </InternalWeatherPageShell>
  );
}
