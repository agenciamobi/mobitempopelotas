import { createFileRoute } from "@tanstack/react-router";

import { withRedemetLastGood } from "@/lib/redemet/redemet-last-good.server";
import { fetchRedemetSatellite } from "@/lib/redemet/redemet.server";
import {
  keepUsefulVisibleSatelliteFrames,
} from "@/lib/redemet/redemet-visible-daylight";
import type {
  RedemetImageLayerResponse,
  RedemetSatelliteType,
} from "@/lib/redemet/redemet.types";

const ALLOWED_TYPES = new Set<RedemetSatelliteType>(["realcada", "ir", "vis"]);
const DEFAULT_FRAMES = 8;
const MAX_FRAMES = 8;
const VISIBLE_LOOKBACK_FRAMES = 15;

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
  const requested = Number(searchParams.get("frames") ?? DEFAULT_FRAMES);
  const frames = Number.isFinite(requested)
    ? Math.min(MAX_FRAMES, Math.max(1, Math.round(requested)))
    : DEFAULT_FRAMES;

  return { type, frames };
}

function daylightVisiblePayload(payload: RedemetImageLayerResponse, requestedFrames: number) {
  if (!payload.available) return payload;

  const frames = keepUsefulVisibleSatelliteFrames(payload.frames, requestedFrames);
  if (!frames.length) {
    return {
      ...payload,
      available: false,
      frames: [],
      currentIndex: 0,
      error:
        "O canal visível depende de luz solar e não há imagem diurna recente nesta janela. Use Infravermelho ou Realçado durante a noite.",
    } satisfies RedemetImageLayerResponse;
  }

  return {
    ...payload,
    frames,
    currentIndex: frames.length - 1,
    updatedAt: frames.at(-1)?.observedAt ?? payload.updatedAt,
    error: null,
  } satisfies RedemetImageLayerResponse;
}

export const Route = createFileRoute("/api/redemet/satellite")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { type, frames } = requestOptions(request);
        const upstreamFrames = type === "vis" ? VISIBLE_LOOKBACK_FRAMES : frames;
        const payload = await withRedemetLastGood(`satellite:${type}:${upstreamFrames}`, () =>
          fetchRedemetSatellite(type, upstreamFrames),
        );
        const publicPayload = type === "vis" ? daylightVisiblePayload(payload, frames) : payload;

        return new Response(JSON.stringify(publicPayload), { headers: RESPONSE_HEADERS });
      },
    },
  },
});
