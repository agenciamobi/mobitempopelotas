import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholderPage } from "@/components/migration/MigrationPlaceholderPage";
import { createPageHead } from "@/lib/page-meta";

export const Route = createFileRoute("/vento-em-pelotas")({
  head: () =>
    createPageHead(
      "Vento em Pelotas",
      "Condições de vento, direção e rajadas em Pelotas. Página em migração.",
    ),
  component: VentoPage,
});

function VentoPage() {
  return <MigrationPlaceholderPage title="Vento em Pelotas" />;
}
