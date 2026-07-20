import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/layout/SiteLayout";

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
  component: Index,
});

function Index() {
  return (
    <SiteLayout>
      <h2 className="text-2xl font-semibold">Projeto em migração</h2>
    </SiteLayout>
  );
}
