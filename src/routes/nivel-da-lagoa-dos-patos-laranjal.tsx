import { createFileRoute } from "@tanstack/react-router";

import { LaranjalLevelPage } from "@/components/hydrology/HydrologyPages";
import { getLaranjalLevelData } from "@/lib/hydrology/laranjal-level.functions";
import { createPageHead } from "@/lib/page-meta";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

export const Route = createFileRoute("/nivel-da-lagoa-dos-patos-laranjal")({
  head: () =>
    createPageHead(
      "Nível da Lagoa dos Patos no Laranjal",
      "Telemetria pública da Estação Laranjal, evolução do nível nas últimas 24 horas e contexto meteorológico para Pelotas.",
    ),
  loader: async () => {
    const [weather, level] = await Promise.all([
      getWeatherIntelligence(),
      getLaranjalLevelData(),
    ]);
    return { weather, level };
  },
  staleTime: 60 * 1_000,
  component: NivelLagoaPage,
});

function NivelLagoaPage() {
  const data = Route.useLoaderData();
  return <LaranjalLevelPage weather={data.weather} level={data.level} />;
}
