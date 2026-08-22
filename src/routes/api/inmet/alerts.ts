import { createFileRoute } from "@tanstack/react-router";

import { fetchInmetAlerts } from "@/lib/weather/inmet.server";

const RESPONSE_HEADERS = {
  "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
  "CDN-Cache-Control": "max-age=180, stale-while-revalidate=600",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

export const Route = createFileRoute("/api/inmet/alerts")({
  server: {
    handlers: {
      GET: async () => {
        const payload = await fetchInmetAlerts();
        return new Response(JSON.stringify(payload), { headers: RESPONSE_HEADERS });
      },
    },
  },
});
