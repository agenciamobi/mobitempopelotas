import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholderPage } from "@/components/migration/MigrationPlaceholderPage";
import { createPageHead } from "@/lib/page-meta";

export const Route = createFileRoute("/estacao-embrapa-pelotas")({
  head: () =>
    createPageHead(
      "Estação Embrapa em Pelotas",
      "Dados da estação meteorológica da Embrapa em Pelotas. Página em migração.",
    ),
  component: EstacaoEmbrapaPage,
});

function EstacaoEmbrapaPage() {
  return <MigrationPlaceholderPage title="Estação Embrapa em Pelotas" />;
}
