import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { getVerifiedRequestUser } from "@/lib/auth/request-user.server";
import {
  isAllowedPushEndpoint,
  isSameOriginRequest,
  pushJsonResponse,
  readLimitedJson,
} from "@/lib/push/push-http.server";
import {
  deletePushSubscription,
  getPushStorageStatus,
  savePushSubscription,
} from "@/lib/push/push-storage.server";
import { PUSH_TOPICS } from "@/lib/push/push.types";
import { getPushConfigurationStatus } from "@/lib/push/web-push.server";

const endpointSchema = z
  .string()
  .url()
  .max(2_048)
  .refine(isAllowedPushEndpoint, "Provedor de notificações não permitido.");

const subscriptionSchema = z.object({
  endpoint: endpointSchema,
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
  endpoint: endpointSchema,
});

function validateBrowserRequest(request: Request) {
  if (!isSameOriginRequest(request)) {
    return pushJsonResponse({ success: false, error: "Origem não permitida." }, 403);
  }

  return null;
}

async function optionalAccountContext(request: Request): Promise<{
  userId: string | null | undefined;
  responseHeaders: Headers;
}> {
  try {
    const account = await getVerifiedRequestUser(request);
    return {
      userId: account.configured ? (account.user?.id ?? null) : undefined,
      responseHeaders: account.responseHeaders,
    };
  } catch (error) {
    console.warn("[push/subscription] Não foi possível verificar a conta opcional", {
      message: error instanceof Error ? error.message : String(error),
    });
    return { userId: undefined, responseHeaders: new Headers() };
  }
}

async function subscribe(request: Request) {
  const requestError = validateBrowserRequest(request);
  if (requestError) return requestError;

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

  const body = await readLimitedJson(request);
  if (!body.ok) {
    return pushJsonResponse({ success: false, error: body.error }, body.status);
  }

  const parsed = createSubscriptionSchema.safeParse(body.value);
  if (!parsed.success) {
    return pushJsonResponse({ success: false, error: "Inscrição inválida." }, 400);
  }

  const account = await optionalAccountContext(request);

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
      account.userId,
    );

    return pushJsonResponse({ success: true }, 200, account.responseHeaders);
  } catch (error) {
    console.error("[push/subscription] Falha ao salvar inscrição", {
      message: error instanceof Error ? error.message : String(error),
    });
    return pushJsonResponse(
      { success: false, error: "Não foi possível ativar os avisos neste aparelho." },
      500,
      account.responseHeaders,
    );
  }
}

async function unsubscribe(request: Request) {
  const requestError = validateBrowserRequest(request);
  if (requestError) return requestError;

  if (!getPushStorageStatus().configured) {
    return pushJsonResponse(
      {
        success: false,
        error: "As notificações ainda não estão disponíveis neste ambiente.",
      },
      503,
    );
  }

  const body = await readLimitedJson(request);
  if (!body.ok) {
    return pushJsonResponse({ success: false, error: body.error }, body.status);
  }

  const parsed = deleteSubscriptionSchema.safeParse(body.value);
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
