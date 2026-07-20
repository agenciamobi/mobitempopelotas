import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholderPage } from "@/components/migration/MigrationPlaceholderPage";
import { createPageHead } from "@/lib/page-meta";

export const Route = createFileRoute("/previsao-7-dias-pelotas")({
  head: () =>
    createPageHead(
      "Previsão de 7 dias para Pelotas",
      "Previsão meteorológica para os próximos sete dias em Pelotas. Página em migração.",
    ),
  component: PrevisaoSeteDiasPage,
});

function PrevisaoSeteDiasPage() {
  return <MigrationPlaceholderPage title="Previsão de 7 dias para Pelotas" />;
}
