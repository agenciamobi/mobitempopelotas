import { createFileRoute } from "@tanstack/react-router";

import { fetchLaranjalLevelData } from "@/lib/hydrology/laranjal-level.server";

const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=60, stale-while-revalidate=240",
  "CDN-Cache-Control": "max-age=60, stale-while-revalidate=240",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

export const Route = createFileRoute("/api/widgets/nivel-laranjal")({
  server: {
    handlers: {
      GET: async () => {
        const data = await fetchLaranjalLevelData();
        return new Response(
          JSON.stringify({
            widget: "nivel-laranjal",
            version: 1,
            status: data.status,
            currentLevel: data.currentLevel,
            updatedAt: data.updatedAt,
            trendCmPerHour: data.trendCmPerHour,
            change1hCm: data.change1hCm,
            change6hCm: data.change6hCm,
            change24hCm: data.change24hCm,
            series: data.series,
            source: data.source,
            detailsUrl: "https://tempopelotas.com.br/nivel-da-lagoa-dos-patos-laranjal",
          }),
          { headers: HEADERS },
        );
      },
      OPTIONS: () => new Response(null, { status: 204, headers: HEADERS }),
    },
  },
});
