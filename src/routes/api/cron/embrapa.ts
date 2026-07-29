import { createFileRoute } from "@tanstack/react-router";

import {
  authorizeEmbrapaCollectorRequest,
  refreshCentralEmbrapaObservation,
} from "@/lib/weather/embrapa-central.server";

const RESPONSE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: RESPONSE_HEADERS,
  });
}

async function collectEmbrapa(request: Request) {
  if (!(await authorizeEmbrapaCollectorRequest(request))) {
    return jsonResponse({ success: false, error: "Não autorizado." }, 401);
  }

  try {
    const result = await refreshCentralEmbrapaObservation();
    return jsonResponse({
      success: result.observation.status !== "unavailable" || result.fallback === "last-known",
      station: result.observation.source.station,
      status: result.observation.status,
      refreshed: result.refreshed,
      stored: result.stored,
      fallback: result.fallback,
      sourceHash: result.sourceHash,
      fetchedAt: result.observation.source.fetchedAt,
      observationTime: result.observation.source.observationTime,
      error: result.error,
    });
  } catch (error) {
    console.error("[cron/embrapa] Falha no coletor central", {
      message: error instanceof Error ? error.message : String(error),
    });
    return jsonResponse(
      {
        success: false,
        error: "Não foi possível atualizar a leitura central da Embrapa.",
      },
      500,
    );
  }
}

export const Route = createFileRoute("/api/cron/embrapa")({
  server: {
    handlers: {
      GET: ({ request }) => collectEmbrapa(request),
      POST: ({ request }) => collectEmbrapa(request),
    },
  },
});
