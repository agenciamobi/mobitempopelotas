import { createFileRoute } from "@tanstack/react-router";

import { MethodologyPage } from "@/components/methodology/MethodologyPage";
import { getLaranjalLevelData } from "@/lib/hydrology/laranjal-level.functions";
import { createPageHead } from "@/lib/page-meta";
import { getRedemetOverview } from "@/lib/redemet/redemet.functions";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

export const Route = createFileRoute("/metodologia")({
  head: () =>
    createPageHead(
      "Metodologia e fontes do Tempo Pelotas",
      "Origem dos dados meteorológicos e hidrológicos, estado das integrações, critérios de validação, contingências e limites do Tempo Pelotas.",
      "/metodologia",
    ),
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
