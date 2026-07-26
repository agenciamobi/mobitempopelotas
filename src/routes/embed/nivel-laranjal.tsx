import { createFileRoute } from "@tanstack/react-router";

import "@/components/embed/LaranjalEmbedIsolation.css";
import { LaranjalLevelEmbed } from "@/components/embed/LaranjalLevelEmbed";
import { getLaranjalLevelData } from "@/lib/hydrology/laranjal-level.functions";

export const Route = createFileRoute("/embed/nivel-laranjal")({
  head: () => ({
    meta: [
      { title: "Nível da Lagoa dos Patos no Laranjal — widget" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "theme-color", content: "#ffffff" },
    ],
  }),
  loader: () => getLaranjalLevelData(),
  staleTime: 60 * 1_000,
  component: LaranjalEmbedRoute,
});

function LaranjalEmbedRoute() {
  return <LaranjalLevelEmbed data={Route.useLoaderData()} />;
}
