import { createFileRoute } from "@tanstack/react-router";

import { withRedemetLastGood } from "@/lib/redemet/redemet-last-good.server";
import { fetchRedemetRadar } from "@/lib/redemet/redemet.server";

const DEFAULT_FRAMES = 8;
const MAX_FRAMES = 8;

const RESPONSE_HEADERS = {
  "Cache-Control": "public, max-age=120, stale-while-revalidate=600",
  "CDN-Cache-Control": "max-age=300, stale-while-revalidate=900",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

function requestedFrames(request: Request) {
  const value = Number(new URL(request.url).searchParams.get("frames") ?? DEFAULT_FRAMES);
  if (!Number.isFinite(value)) return DEFAULT_FRAMES;
  return Math.min(MAX_FRAMES, Math.max(1, Math.round(value)));
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
