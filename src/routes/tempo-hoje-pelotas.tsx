import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholderPage } from "@/components/migration/MigrationPlaceholderPage";
import { createPageHead } from "@/lib/page-meta";

export const Route = createFileRoute("/tempo-hoje-pelotas")({
  head: () =>
    createPageHead(
      "Tempo hoje em Pelotas",
      "Condições e previsão do tempo para hoje em Pelotas. Página em migração.",
    ),
  component: TempoHojePage,
});

function TempoHojePage() {
  return <MigrationPlaceholderPage title="Tempo hoje em Pelotas" />;
}
