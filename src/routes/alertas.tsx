import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholderPage } from "@/components/migration/MigrationPlaceholderPage";
import { createPageHead } from "@/lib/page-meta";

export const Route = createFileRoute("/alertas")({
  head: () =>
    createPageHead(
      "Alertas meteorológicos em Pelotas",
      "Condições de atenção e alertas meteorológicos para Pelotas. Página em migração.",
    ),
  component: AlertasPage,
});

function AlertasPage() {
  return <MigrationPlaceholderPage title="Alertas meteorológicos em Pelotas" />;
}
