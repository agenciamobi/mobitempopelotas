import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholderPage } from "@/components/migration/MigrationPlaceholderPage";
import { createPageHead } from "@/lib/page-meta";

export const Route = createFileRoute("/metodologia")({
  head: () =>
    createPageHead(
      "Metodologia e fontes",
      "Metodologia, fontes e limites dos dados apresentados pelo Tempo Pelotas. Página em migração.",
    ),
  component: MetodologiaPage,
});

function MetodologiaPage() {
  return <MigrationPlaceholderPage title="Metodologia e fontes" />;
}
