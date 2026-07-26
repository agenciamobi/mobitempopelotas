import { createFileRoute } from "@tanstack/react-router";

import { fetchInmetFrostMap } from "@/lib/inmet/frost.server";
import type { FrostStationType } from "@/lib/inmet/frost.types";

const RESPONSE_HEADERS = {
  "Cache-Control": "public, max-age=900, stale-while-revalidate=3600",
  "CDN-Cache-Control": "max-age=1800, stale-while-revalidate=7200",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

function requestedFilters(request: Request) {
  const params = new URL(request.url).searchParams;
  const daysValue = Number(params.get("days") ?? 30);
  const days = Number.isFinite(daysValue) ? Math.min(30, Math.max(1, Math.round(daysValue))) : 30;
  const stationType: FrostStationType =
    params.get("stationType")?.toUpperCase() === "AUTOMATICA" ? "AUTOMATICA" : "CONVENCIONAL";
  const endDate = params.get("end") ?? undefined;
  const state = params.get("uf") ?? "RS";

  return { days, stationType, endDate, state };
}

export const Route = createFileRoute("/api/inmet/geadas")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const payload = await fetchInmetFrostMap(requestedFilters(request));
        return new Response(JSON.stringify(payload), { headers: RESPONSE_HEADERS });
      },
    },
  },
});
