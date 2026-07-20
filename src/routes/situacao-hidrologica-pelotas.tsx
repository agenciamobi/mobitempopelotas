import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholderPage } from "@/components/migration/MigrationPlaceholderPage";
import { createPageHead } from "@/lib/page-meta";

export const Route = createFileRoute("/situacao-hidrologica-pelotas")({
  head: () =>
    createPageHead(
      "Situação hidrológica de Pelotas",
      "Acompanhamento hidrológico de Pelotas e da região. Página em migração.",
    ),
  component: SituacaoHidrologicaPage,
});

function SituacaoHidrologicaPage() {
  return <MigrationPlaceholderPage title="Situação hidrológica de Pelotas" />;
}
