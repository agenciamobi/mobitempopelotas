import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholderPage } from "@/components/migration/MigrationPlaceholderPage";
import { createPageHead } from "@/lib/page-meta";

export const Route = createFileRoute("/chuva-em-pelotas")({
  head: () =>
    createPageHead(
      "Chuva em Pelotas",
      "Previsão de chuva, probabilidade e acumulados para Pelotas. Página em migração.",
    ),
  component: ChuvaPage,
});

function ChuvaPage() {
  return <MigrationPlaceholderPage title="Chuva em Pelotas" />;
}
