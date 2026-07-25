import { createFileRoute } from "@tanstack/react-router";

import { EditorialContentSection } from "@/components/content/EditorialContentSection";
import { LaranjalLevelPage } from "@/components/hydrology/HydrologyPages";
import { LARANJAL_LEVEL_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { getLaranjalLevelData } from "@/lib/hydrology/laranjal-level.functions";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

const PAGE_TITLE = "Nível da Lagoa dos Patos no Laranjal";
const PAGE_DESCRIPTION =
  "Telemetria pública da Estação Laranjal, evolução do nível nas últimas 24 horas e contexto meteorológico para Pelotas.";
const PAGE_PATH = "/nivel-da-lagoa-dos-patos-laranjal";

export const Route = createFileRoute("/nivel-da-lagoa-dos-patos-laranjal")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Situação das águas", path: "/situacao-hidrologica-pelotas" },
          { name: "Nível da Lagoa no Laranjal", path: PAGE_PATH },
        ],
        about: [
          "Nível da Lagoa dos Patos",
          "Estação Laranjal",
          "Praia do Laranjal",
          "Telemetria hidrológica em Pelotas",
          "Tendência do nível da água no Laranjal",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, LARANJAL_LEVEL_EDITORIAL_CONTENT.faqs),
    ]),
  loader: async () => {
    const [weather, level] = await Promise.all([getWeatherIntelligence(), getLaranjalLevelData()]);
    return { weather, level };
  },
  staleTime: 60 * 1_000,
  component: NivelLagoaPage,
});

function NivelLagoaPage() {
  const data = Route.useLoaderData();

  return (
    <>
      <LaranjalLevelPage weather={data.weather} level={data.level} />
      <EditorialContentSection id="como-interpretar-nivel-laranjal" content={LARANJAL_LEVEL_EDITORIAL_CONTENT} />
    </>
  );
}
