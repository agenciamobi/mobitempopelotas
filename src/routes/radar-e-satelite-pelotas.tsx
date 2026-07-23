import { createFileRoute } from "@tanstack/react-router";

import { RedemetOverview } from "@/components/redemet/RedemetOverview";
import { createPageHead } from "@/lib/page-meta";
import { getRedemetOverview } from "@/lib/redemet/redemet.functions";
import { createEditorialPageJsonLd } from "@/lib/structured-data";

const PAGE_TITLE = "Radar meteorológico, satélite e trovoadas em Pelotas";
const PAGE_DESCRIPTION =
  "Acompanhe produtos regionais da REDEMET/DECEA: radar meteorológico, imagens de satélite e ocorrências de trovoada próximas de Pelotas.";
const PAGE_PATH = "/radar-e-satelite-pelotas";

export const Route = createFileRoute(PAGE_PATH)({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Radar e satélite em Pelotas", path: PAGE_PATH },
        ],
        about: [
          "Radar meteorológico de Canguçu",
          "Imagens de satélite sobre Pelotas",
          "Monitoramento regional de trovoadas",
        ],
      }),
    ]),
  loader: async () => getRedemetOverview(),
  staleTime: 60 * 1_000,
  component: RedemetPage,
});

function RedemetPage() {
  const data = Route.useLoaderData();
  return <RedemetOverview data={data} />;
}
