import { createFileRoute } from "@tanstack/react-router";
import { MigrationPlaceholderPage } from "@/components/migration/MigrationPlaceholderPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tempo Pelotas — Portal" },
      {
        name: "description",
        content: "Portal Tempo Pelotas — projeto em migração.",
      },
      { property: "og:title", content: "Tempo Pelotas — Portal" },
      {
        property: "og:description",
        content: "Portal Tempo Pelotas — projeto em migração.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return <MigrationPlaceholderPage />;
}
