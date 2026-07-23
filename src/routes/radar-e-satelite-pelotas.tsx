import { createFileRoute } from "@tanstack/react-router";

import { RedemetOverview } from "@/components/redemet/RedemetOverview";
import { createPageHead } from "@/lib/page-meta";
import { getRedemetOverview } from "@/lib/redemet/redemet.functions";

export const Route = createFileRoute("/radar-e-satelite-pelotas")({
  head: () =>
    createPageHead(
      "Radar meteorológico, satélite e trovoadas em Pelotas",
      "Acompanhe produtos regionais da REDEMET/DECEA: radar meteorológico, imagens de satélite e ocorrências de trovoada próximas de Pelotas.",
      "/radar-e-satelite-pelotas",
    ),
  loader: async () => getRedemetOverview(),
  staleTime: 60 * 1_000,
  component: RedemetPage,
});

function RedemetPage() {
  const data = Route.useLoaderData();
  return <RedemetOverview data={data} />;
}
