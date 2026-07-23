import { createFileRoute } from "@tanstack/react-router";

import { withRedemetLastGood } from "@/lib/redemet/redemet-last-good.server";
import { fetchRedemetSatellite } from "@/lib/redemet/redemet.server";
import type { RedemetSatelliteType } from "@/lib/redemet/redemet.types";

const ALLOWED_TYPES = new Set<RedemetSatelliteType>(["realcada", "ir", "vis"]);

const RESPONSE_HEADERS = {
  "Cache-Control": "public, max-age=120, stale-while-revalidate=600",
  "CDN-Cache-Control": "max-age=300, stale-while-revalidate=900",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

function requestOptions(request: Request) {
  const searchParams = new URL(request.url).searchParams;
  const rawType = searchParams.get("type") ?? "realcada";
  const type = ALLOWED_TYPES.has(rawType as RedemetSatelliteType)
    ? (rawType as RedemetSatelliteType)
    : "realcada";
  const requested = Number(searchParams.get("frames") ?? 10);

  return {
    type,
    frames: Number.isFinite(requested) ? requested : 10,
  };
}

export const Route = createFileRoute("/api/redemet/satellite")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { type, frames } = requestOptions(request);
        const payload = await withRedemetLastGood(`satellite:${type}:${frames}`, () =>
          fetchRedemetSatellite(type, frames),
        );

        return new Response(JSON.stringify(payload), { headers: RESPONSE_HEADERS });
      },
    },
  },
});
