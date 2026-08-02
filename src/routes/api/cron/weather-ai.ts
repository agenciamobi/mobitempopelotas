import { createFileRoute } from "@tanstack/react-router";

import { hasBearerSecret, pushJsonResponse } from "@/lib/push/push-http.server";
import { generateScheduledWeatherAiSnapshot } from "@/lib/weather/weather-ai-snapshot.server";

async function generateWeatherAiSnapshot(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return pushJsonResponse(
      {
        success: false,
        configured: false,
        error: "A rotina de IA meteorológica ainda não foi configurada.",
      },
      503,
    );
  }

  if (!hasBearerSecret(request, cronSecret)) {
    return pushJsonResponse({ success: false, error: "Não autorizado." }, 401);
  }

  const result = await generateScheduledWeatherAiSnapshot();

  if (result.status === "generated") {
    return pushJsonResponse({ success: true, ...result });
  }

  if (result.status === "already-claimed") {
    return pushJsonResponse({
      success: true,
      skipped: true,
      reason: "slot-already-claimed",
      ...result,
    });
  }

  if (result.status === "not-configured") {
    return pushJsonResponse({ success: false, configured: false, ...result }, 503);
  }

  return pushJsonResponse({ success: false, ...result }, 500);
}

export const Route = createFileRoute("/api/cron/weather-ai")({
  server: {
    handlers: {
      GET: ({ request }) => generateWeatherAiSnapshot(request),
      POST: ({ request }) => generateWeatherAiSnapshot(request),
    },
  },
});
