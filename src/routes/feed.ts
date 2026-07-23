import { createFileRoute } from "@tanstack/react-router";

import { createPublicJsonFeed, fetchPublicPortalSnapshot } from "@/lib/public-portal.server";

const RESPONSE_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=120, stale-while-revalidate=600",
  "CDN-Cache-Control": "max-age=300, stale-while-revalidate=600",
  "Content-Type": "application/feed+json; charset=utf-8",
} as const;

export const Route = createFileRoute("/feed")({
  server: {
    handlers: {
      GET: async () => {
        const snapshot = await fetchPublicPortalSnapshot();
        return new Response(`${JSON.stringify(createPublicJsonFeed(snapshot), null, 2)}\n`, {
          headers: RESPONSE_HEADERS,
        });
      },
    },
  },
});
