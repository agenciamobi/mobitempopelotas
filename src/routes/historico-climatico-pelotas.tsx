import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholderPage } from "@/components/migration/MigrationPlaceholderPage";
import { createPageHead } from "@/lib/page-meta";

export const Route = createFileRoute("/historico-climatico-pelotas")({
  head: () =>
    createPageHead(
      "Histórico climático de Pelotas",
      "Histórico meteorológico e climático de Pelotas. Página em migração.",
    ),
  component: HistoricoClimaticoPage,
});

function HistoricoClimaticoPage() {
  return <MigrationPlaceholderPage title="Histórico climático de Pelotas" />;
}
