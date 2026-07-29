import { createFileRoute } from "@tanstack/react-router";

import {
  authorizeForecastAccuracyRequest,
  captureForecastPredictions,
  verifyRecentForecasts,
} from "@/lib/weather/forecast-accuracy.server";

const RESPONSE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: RESPONSE_HEADERS });
}

async function handleForecastAccuracyJob(request: Request) {
  if (!(await authorizeForecastAccuracyRequest(request))) {
    return jsonResponse({ success: false, error: "Não autorizado." }, 401);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ success: false, error: "Corpo da solicitação inválido." }, 400);
  }

  const action =
    typeof payload === "object" && payload !== null && "action" in payload
      ? (payload as { action?: unknown }).action
      : null;

  try {
    if (action === "capture") {
      const result = await captureForecastPredictions();
      return jsonResponse({ success: true, action, ...result });
    }

    if (action === "verify") {
      const result = await verifyRecentForecasts();
      return jsonResponse({ success: true, action, ...result });
    }

    return jsonResponse(
      { success: false, error: "Ação inválida. Use capture ou verify." },
      400,
    );
  } catch (error) {
    console.error("[forecast/accuracy] Falha na rotina automática", {
      action,
      message: error instanceof Error ? error.message : String(error),
    });
    return jsonResponse(
      { success: false, action, error: "Não foi possível concluir a rotina de precisão." },
      500,
    );
  }
}

export const Route = createFileRoute("/api/cron/forecast-accuracy")({
  server: {
    handlers: {
      POST: ({ request }) => handleForecastAccuracyJob(request),
    },
  },
});
