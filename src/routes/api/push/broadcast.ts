import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import {
  hasBearerSecret,
  pushJsonResponse,
  readLimitedJson,
  safeInternalPath,
} from "@/lib/push/push-http.server";
import { PUSH_TOPICS } from "@/lib/push/push.types";
import { broadcastPushNotification } from "@/lib/push/web-push.server";

const payloadSchema = z.object({
  title: z.string().trim().min(1).max(90),
  body: z.string().trim().min(1).max(240),
  url: z.string().optional(),
  tag: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_-]+$/)
    .max(32)
    .optional(),
  urgency: z.enum(["very-low", "low", "normal", "high"]).default("normal"),
  topic: z.enum(PUSH_TOPICS),
});

async function broadcast(request: Request) {
  const secret = process.env.PUSH_ADMIN_SECRET?.trim();
  if (!secret) {
    return pushJsonResponse(
      {
        success: false,
        error: "O envio administrativo de avisos ainda não foi configurado.",
      },
      503,
    );
  }

  if (!hasBearerSecret(request, secret)) {
    return pushJsonResponse({ success: false, error: "Não autorizado." }, 401);
  }

  const body = await readLimitedJson(request);
  if (!body.ok) {
    return pushJsonResponse({ success: false, error: body.error }, body.status);
  }

  const parsed = payloadSchema.safeParse(body.value);
  if (!parsed.success) {
    return pushJsonResponse(
      {
        success: false,
        error: "Informe título, mensagem, categoria de consentimento e parâmetros válidos.",
      },
      400,
    );
  }

  try {
    const result = await broadcastPushNotification({
      ...parsed.data,
      url: safeInternalPath(parsed.data.url),
      requireInteraction: parsed.data.urgency === "high",
      renotify: parsed.data.urgency === "high",
    });

    return pushJsonResponse({ success: true, ...result });
  } catch (error) {
    console.error("[push/broadcast] Falha no envio administrativo", {
      message: error instanceof Error ? error.message : String(error),
    });
    return pushJsonResponse(
      { success: false, error: "Não foi possível enviar os avisos agora." },
      500,
    );
  }
}

export const Route = createFileRoute("/api/push/broadcast")({
  server: {
    handlers: {
      POST: ({ request }) => broadcast(request),
    },
  },
});
