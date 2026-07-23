import webpush from "web-push";

import {
  deletePushSubscription,
  getPushStorageStatus,
  listPushSubscriptions,
} from "./push-storage.server";
import type {
  PushDeliveryResult,
  PushPayload,
  StoredPushSubscription,
} from "./push.types";

const DELIVERY_BATCH_SIZE = 50;
const DELIVERY_TIMEOUT_MS = 12_000;
const DEFAULT_SUBJECT = "mailto:contato@agenciamobi.com.br";

export type PushConfigurationStatus = {
  enabled: boolean;
  publicKey: string | null;
  missing: string[];
};

function normalizedEnvironmentValue(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function getVapidConfig() {
  return {
    publicKey:
      normalizedEnvironmentValue(process.env.VAPID_PUBLIC_KEY) ??
      normalizedEnvironmentValue(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
    privateKey: normalizedEnvironmentValue(process.env.VAPID_PRIVATE_KEY),
    subject: normalizedEnvironmentValue(process.env.VAPID_SUBJECT) ?? DEFAULT_SUBJECT,
  };
}

export function getPushConfigurationStatus(): PushConfigurationStatus {
  const vapid = getVapidConfig();
  const storage = getPushStorageStatus();
  const missing: string[] = [];

  if (!vapid.publicKey) missing.push("VAPID_PUBLIC_KEY");
  if (!vapid.privateKey) missing.push("VAPID_PRIVATE_KEY");
  if (!vapid.subject) missing.push("VAPID_SUBJECT");
  missing.push(...storage.missing);

  return {
    enabled: missing.length === 0,
    publicKey: vapid.publicKey,
    missing,
  };
}

function notificationBody(payload: PushPayload) {
  return JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/",
    tag: payload.tag ?? "tempo-pelotas",
    icon: "/brand/tempo-pelotas-icon.svg",
    badge: "/brand/tempo-pelotas-icon.svg",
    urgency: payload.urgency ?? "normal",
    requireInteraction: payload.requireInteraction ?? false,
    renotify: payload.renotify ?? false,
  });
}

function toLibrarySubscription(subscription: StoredPushSubscription) {
  return {
    endpoint: subscription.endpoint,
    keys: subscription.keys,
  };
}

function deliveryStatusCode(error: unknown) {
  if (!error || typeof error !== "object" || !("statusCode" in error)) return null;
  const value = Number((error as { statusCode?: unknown }).statusCode);
  return Number.isFinite(value) ? value : null;
}

export async function broadcastPushNotification(
  payload: PushPayload,
): Promise<PushDeliveryResult> {
  const status = getPushConfigurationStatus();
  if (!status.enabled) {
    throw new Error(`Notificações web push não configuradas: ${status.missing.join(", ")}`);
  }

  const vapid = getVapidConfig();
  const subscriptions = await listPushSubscriptions(payload.topic);
  const body = notificationBody(payload);
  const result: PushDeliveryResult = {
    total: subscriptions.length,
    sent: 0,
    failed: 0,
    removed: 0,
  };

  for (let index = 0; index < subscriptions.length; index += DELIVERY_BATCH_SIZE) {
    const batch = subscriptions.slice(index, index + DELIVERY_BATCH_SIZE);
    const outcomes = await Promise.allSettled(
      batch.map(async (subscription) => {
        try {
          await webpush.sendNotification(toLibrarySubscription(subscription), body, {
            vapidDetails: {
              subject: vapid.subject,
              publicKey: vapid.publicKey!,
              privateKey: vapid.privateKey!,
            },
            TTL: 60 * 60 * 6,
            urgency: payload.urgency ?? "normal",
            topic: (payload.tag ?? "tempo-pelotas")
              .replace(/[^A-Za-z0-9_-]/g, "-")
              .slice(0, 32),
            timeout: DELIVERY_TIMEOUT_MS,
          });
          result.sent += 1;
        } catch (error) {
          const statusCode = deliveryStatusCode(error);
          if (statusCode === 404 || statusCode === 410) {
            await deletePushSubscription(subscription.endpoint).catch(() => undefined);
            result.removed += 1;
            return;
          }

          result.failed += 1;
          console.error("[push] Falha ao entregar notificação", {
            statusCode,
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }),
    );

    void outcomes;
  }

  return result;
}
