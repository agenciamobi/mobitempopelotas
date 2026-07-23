import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import {
  isSameOriginRequest,
  pushJsonResponse,
} from "@/lib/push/push-http.server";
import {
  deletePushSubscription,
  getPushStorageStatus,
  savePushSubscription,
} from "@/lib/push/push-storage.server";
import { PUSH_TOPICS } from "@/lib/push/push.types";
import { getPushConfigurationStatus } from "@/lib/push/web-push.server";

const subscriptionSchema = z.object({
  endpoint: z.string().url().startsWith("https://").max(2_048),
  expirationTime: z.number().finite().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(16).max(512),
    auth: z.string().min(8).max(256),
  }),
});

const topicsSchema = z.array(z.enum(PUSH_TOPICS)).min(1).max(PUSH_TOPICS.length);

const createSubscriptionSchema = z.object({
  subscription: subscriptionSchema,
  topics: topicsSchema.default([...PUSH_TOPICS]),
});

const deleteSubscriptionSchema = z.object({
  endpoint: z.string().url().startsWith("https://").max(2_048),
});

async function parseJson(request: Request) {
  return request.json().catch(() => null);
}

async function subscribe(request: Request) {
  if (!isSameOriginRequest(request)) {
    return pushJsonResponse({ success: false, error: "Origem não permitida." }, 403);
  }

  const configuration = getPushConfigurationStatus();
  if (!configuration.enabled) {
    return pushJsonResponse(
      {
        success: false,
        error: "As notificações ainda não estão disponíveis neste ambiente.",
      },
      503,
    );
  }

  const parsed = createSubscriptionSchema.safeParse(await parseJson(request));
  if (!parsed.success) {
    return pushJsonResponse({ success: false, error: "Inscrição inválida." }, 400);
  }

  try {
    await savePushSubscription(
      {
        endpoint: parsed.data.subscription.endpoint,
        expirationTime: parsed.data.subscription.expirationTime ?? null,
        keys: parsed.data.subscription.keys,
        topics: parsed.data.topics,
      },
      request.headers.get("user-agent"),
      parsed.data.topics,
    );

    return pushJsonResponse({ success: true });
  } catch (error) {
    console.error("[push/subscription] Falha ao salvar inscrição", {
      message: error instanceof Error ? error.message : String(error),
    });
    return pushJsonResponse(
      { success: false, error: "Não foi possível ativar os avisos neste aparelho." },
      500,
    );
  }
}

async function unsubscribe(request: Request) {
  if (!isSameOriginRequest(request)) {
    return pushJsonResponse({ success: false, error: "Origem não permitida." }, 403);
  }

  if (!getPushStorageStatus().configured) {
    return pushJsonResponse(
      {
        success: false,
        error: "As notificações ainda não estão disponíveis neste ambiente.",
      },
      503,
    );
  }

  const parsed = deleteSubscriptionSchema.safeParse(await parseJson(request));
  if (!parsed.success) {
    return pushJsonResponse({ success: false, error: "Inscrição inválida." }, 400);
  }

  try {
    await deletePushSubscription(parsed.data.endpoint);
    return pushJsonResponse({ success: true });
  } catch (error) {
    console.error("[push/subscription] Falha ao remover inscrição", {
      message: error instanceof Error ? error.message : String(error),
    });
    return pushJsonResponse(
      { success: false, error: "Não foi possível desativar os avisos neste aparelho." },
      500,
    );
  }
}

export const Route = createFileRoute("/api/push/subscription")({
  server: {
    handlers: {
      POST: ({ request }) => subscribe(request),
      DELETE: ({ request }) => unsubscribe(request),
    },
  },
});
