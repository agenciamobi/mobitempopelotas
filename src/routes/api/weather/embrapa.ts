import { createFileRoute } from "@tanstack/react-router";

import { getCentralEmbrapaObservation } from "@/lib/weather/embrapa-central.server";

const RESPONSE_HEADERS = {
  "Cache-Control": "public, max-age=30, stale-while-revalidate=30",
  "CDN-Cache-Control": "max-age=30, stale-while-revalidate=30",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, follow",
} as const;

async function currentEmbrapaObservation() {
  const observation = await getCentralEmbrapaObservation();
  return new Response(JSON.stringify(observation), {
    status: observation.status === "unavailable" ? 503 : 200,
    headers: RESPONSE_HEADERS,
  });
}

export const Route = createFileRoute("/api/weather/embrapa")({
  server: {
    handlers: {
      GET: () => currentEmbrapaObservation(),
    },
  },
});
