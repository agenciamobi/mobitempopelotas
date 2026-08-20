import { createFileRoute } from "@tanstack/react-router";

import { verifyDataStatusGithubActionsRequest } from "@/lib/github-actions-oidc.server";
import { hasBearerSecret, pushJsonResponse } from "@/lib/push/push-http.server";
import { collectDataStatus } from "@/lib/status/data-status.server";
import { recordDataStatusOverview } from "@/lib/status/data-status-storage.server";

async function collectAndPersistStatus(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const sharedSecretAuthorized = hasBearerSecret(request, cronSecret);

  if (!sharedSecretAuthorized) {
    const oidcVerification = await verifyDataStatusGithubActionsRequest(request);
    if (!oidcVerification.valid) {
      console.warn("[data-status/cron] Autorização recusada", {
        reason: oidcVerification.reason,
      });
      return pushJsonResponse({ success: false, error: "Não autorizado." }, 401);
    }
  }

  try {
    const overview = await collectDataStatus();
    const persistence = await recordDataStatusOverview(overview);
    const openStates = overview.services.filter(
      (service) => service.state === "partial" || service.state === "offline" || service.state === "maintenance",
    );

    return pushJsonResponse({
      success: true,
      checkedAt: overview.checkedAt,
      overall: overview.overall,
      services: overview.services.length,
      affectedServices: openStates.map((service) => ({
        id: service.id,
        state: service.state,
      })),
      persistence,
    });
  } catch (error) {
    console.error("[data-status/cron] Falha ao registrar monitoramento", {
      message: error instanceof Error ? error.message : String(error),
    });
    return pushJsonResponse(
      { success: false, error: "Não foi possível registrar o status das fontes." },
      500,
    );
  }
}

export const Route = createFileRoute("/api/cron/data-status")({
  server: {
    handlers: {
      GET: ({ request }) => collectAndPersistStatus(request),
      POST: ({ request }) => collectAndPersistStatus(request),
    },
  },
});
