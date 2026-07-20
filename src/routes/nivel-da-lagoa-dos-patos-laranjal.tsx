import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholderPage } from "@/components/migration/MigrationPlaceholderPage";
import { createPageHead } from "@/lib/page-meta";

export const Route = createFileRoute("/nivel-da-lagoa-dos-patos-laranjal")({
  head: () =>
    createPageHead(
      "Nível da Lagoa dos Patos no Laranjal",
      "Acompanhamento do nível da Lagoa dos Patos no Laranjal. Página em migração.",
    ),
  component: NivelLagoaPage,
});

function NivelLagoaPage() {
  return <MigrationPlaceholderPage title="Nível da Lagoa dos Patos no Laranjal" />;
}
