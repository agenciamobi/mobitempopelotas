import { createFileRoute } from "@tanstack/react-router";

import { FrostMapPage } from "@/components/inmet/FrostMapPage";
import { getInmetFrostOverview } from "@/lib/inmet/frost.functions";
import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";

const PAGE_TITLE = "Mapa de geadas no Rio Grande do Sul — registros do INMET";
const PAGE_DESCRIPTION =
  "Consulte ocorrências de geada registradas pelas estações do INMET no Rio Grande do Sul, com temperatura mínima, intensidade, data e localização.";
const PAGE_PATH = "/mapa-de-geadas-rio-grande-do-sul";

export const Route = createFileRoute("/mapa-de-geadas-rio-grande-do-sul")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Monitoramento", path: "/radar-e-satelite-pelotas" },
          { name: "Mapa de geadas no RS", path: PAGE_PATH },
        ],
        about: [
          "Geadas observadas no Rio Grande do Sul",
          "Estações meteorológicas do INMET",
          "Temperatura mínima e intensidade de geada",
          "Monitoramento agrometeorológico",
        ],
      }),
    ]),
  loader: async () => getInmetFrostOverview(),
  staleTime: 15 * 60 * 1_000,
  component: FrostRoutePage,
});

function FrostRoutePage() {
  return <FrostMapPage initialData={Route.useLoaderData()} />;
}
