import { createFileRoute } from "@tanstack/react-router";

import { HOME_EDITORIAL_CONTENT } from "@/lib/editorial-content";
import { getGuaibaObservation } from "@/lib/hydrology/guaiba.functions";
import { getLagoonMonitoringNetwork } from "@/lib/hydrology/lagoon-network.functions";
import { getLaranjalLevelData } from "@/lib/hydrology/laranjal-level.functions";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd, createFaqPageJsonLd } from "@/lib/structured-data";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";
import { ProductionHome } from "@/production/ProductionHome";

const PAGE_TITLE = "Tempo Pelotas — Previsão do tempo em Pelotas";
const PAGE_DESCRIPTION =
  "Condições atuais, alertas oficiais e previsão meteorológica consolidada para Pelotas, Rio Grande do Sul.";
const PAGE_PATH = "/";

export const Route = createFileRoute("/")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [{ name: "Tempo Pelotas", path: PAGE_PATH }],
        about: [
          "Tempo em Pelotas",
          "Previsão do tempo em Pelotas",
          "Meteorologia na Zona Sul do Rio Grande do Sul",
          "Lagoa dos Patos",
          "Câmera ao vivo da Praia do Laranjal",
        ],
      }),
      createFaqPageJsonLd(PAGE_PATH, HOME_EDITORIAL_CONTENT.faqs),
    ]),
  loader: async () => {
    const [weather, laranjal, guaiba, lagoon] = await Promise.all([
      getWeatherIntelligence(),
      getLaranjalLevelData(),
      getGuaibaObservation(),
      getLagoonMonitoringNetwork(),
    ]);

    return { weather, laranjal, guaiba, lagoon };
  },
  staleTime: 60 * 1_000,
  component: HomePage,
});

function HomePage() {
  const { weather, laranjal, guaiba, lagoon } = Route.useLoaderData();
  return (
    <ProductionHome
      data={weather}
      laranjal={laranjal}
      guaiba={guaiba}
      lagoon={lagoon}
    />
  );
}
