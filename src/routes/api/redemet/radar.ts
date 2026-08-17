import { createFileRoute } from "@tanstack/react-router";

import { withRedemetLastGood } from "@/lib/redemet/redemet-last-good.server";
import { fetchRedemetRadarResilient } from "@/lib/redemet/redemet-radar.server";

const DEFAULT_FRAMES = 8;
const MAX_FRAMES = 8;

const BASE_RESPONSE_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

function responseHeaders(available: boolean) {
  return {
    ...BASE_RESPONSE_HEADERS,
    "Cache-Control": available
      ? "public, max-age=120, stale-while-revalidate=300"
      : "public, max-age=15, stale-while-revalidate=30",
    "CDN-Cache-Control": available
      ? "max-age=300, stale-while-revalidate=600"
      : "max-age=15, stale-while-revalidate=30",
  };
}

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
          fetchRedemetRadarResilient(frames),
        );

        return new Response(JSON.stringify(payload), {
          headers: responseHeaders(payload.available),
        });
      },
    },
  },
});
