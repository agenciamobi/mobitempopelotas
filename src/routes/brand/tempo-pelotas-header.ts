import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/brand/tempo-pelotas-header")({
  server: {
    handlers: {
      GET: async () =>
        new Response(null, {
          status: 308,
          headers: {
            Location: "/brand/tempo-pelotas-header.svg",
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
          },
        }),
    },
  },
});
