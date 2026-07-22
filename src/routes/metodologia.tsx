import { createFileRoute } from "@tanstack/react-router";

import { MethodologyPage } from "@/components/methodology/MethodologyPage";
import { getLaranjalLevelData } from "@/lib/hydrology/laranjal-level.functions";
import { createPageHead } from "@/lib/page-meta";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

export const Route = createFileRoute("/metodologia")({
  head: () =>
    createPageHead(
      "Metodologia e fontes do Tempo Pelotas",
      "Origem dos dados meteorológicos e hidrológicos, estado das integrações, critérios de validação, contingências e limites do Tempo Pelotas.",
    ),
  loader: async () => {
    const [weather, level] = await Promise.all([getWeatherIntelligence(), getLaranjalLevelData()]);
    return { weather, level };
  },
  staleTime: 60 * 1_000,
  component: MetodologiaPage,
});

function MetodologiaPage() {
  const data = Route.useLoaderData();
  return <MethodologyPage weather={data.weather} level={data.level} />;
}
