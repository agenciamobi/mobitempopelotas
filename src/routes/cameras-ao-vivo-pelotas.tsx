import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholderPage } from "@/components/migration/MigrationPlaceholderPage";
import { createPageHead } from "@/lib/page-meta";

export const Route = createFileRoute("/cameras-ao-vivo-pelotas")({
  head: () =>
    createPageHead(
      "Câmeras ao vivo em Pelotas",
      "Pontos de observação e câmeras meteorológicas de Pelotas. Página em migração.",
    ),
  component: CamerasPage,
});

function CamerasPage() {
  return <MigrationPlaceholderPage title="Câmeras ao vivo em Pelotas" />;
}
