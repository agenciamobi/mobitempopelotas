import { createFileRoute } from "@tanstack/react-router";

import { MethodologyPage } from "@/components/methodology/MethodologyPage";
import { getLaranjalLevelData } from "@/lib/hydrology/laranjal-level.functions";
import { createPageHead } from "@/lib/page-meta";
import { getRedemetOverview } from "@/lib/redemet/redemet.functions";
import { createEditorialPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Metodologia e fontes do Tempo Pelotas";
const PAGE_DESCRIPTION =
  "Origem dos dados meteorológicos e hidrológicos, estado das integrações, critérios de validação, contingências e limites do Tempo Pelotas.";
const PAGE_PATH = "/metodologia";

export const Route = createFileRoute("/metodologia")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Metodologia e fontes", path: PAGE_PATH },
        ],
        about: [
          "Fontes meteorológicas do Tempo Pelotas",
          "Fontes hidrológicas do Tempo Pelotas",
          "Critérios de atualização e contingência",
        ],
      }),
    ]),
  loader: async () => {
    const [weather, level, redemet] = await Promise.all([
      getWeatherIntelligence(),
      getLaranjalLevelData(),
      getRedemetOverview(),
    ]);
    return { weather, level, redemet };
  },
  staleTime: 60 * 1_000,
  component: MetodologiaPage,
});

function MetodologiaPage() {
  const data = Route.useLoaderData();
  return <MethodologyPage weather={data.weather} level={data.level} redemet={data.redemet} />;
}
