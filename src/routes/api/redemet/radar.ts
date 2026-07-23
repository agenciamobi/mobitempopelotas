import { createFileRoute } from "@tanstack/react-router";

import { withRedemetLastGood } from "@/lib/redemet/redemet-last-good.server";
import { fetchRedemetRadar } from "@/lib/redemet/redemet.server";

const RESPONSE_HEADERS = {
  "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
  "CDN-Cache-Control": "max-age=180, stale-while-revalidate=600",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

function requestedFrames(request: Request) {
  const value = Number(new URL(request.url).searchParams.get("frames") ?? 10);
  return Number.isFinite(value) ? value : 10;
}

export const Route = createFileRoute("/api/redemet/radar")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const frames = requestedFrames(request);
        const payload = await withRedemetLastGood(`radar:${frames}`, () =>
          fetchRedemetRadar(frames),
        );

        return new Response(JSON.stringify(payload), { headers: RESPONSE_HEADERS });
      },
    },
  },
});
