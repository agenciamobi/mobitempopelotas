import "server-only";
import webpush from "web-push";
import {
  deletePushSubscription,
  getPushStorageStatus,
  listPushSubscriptions,
  type StoredPushSubscription,
} from "@/lib/push-subscription-store";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  icon?: string;
  badge?: string;
  urgency?: "very-low" | "low" | "normal" | "high";
  requireInteraction?: boolean;
  renotify?: boolean;
};

export type PushConfigurationStatus = {
  enabled: boolean;
  publicKey: string | null;
  missing: string[];
};

type LibraryPushSubscription = Parameters<typeof webpush.sendNotification>[0];

function getVapidConfig() {
  return {
    publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim(),
    privateKey: process.env.VAPID_PRIVATE_KEY?.trim(),
    subject:
      process.env.VAPID_SUBJECT?.trim() ||
      "mailto:contato@agenciamobi.com.br",
  };
}

export function getPushConfigurationStatus(): PushConfigurationStatus {
  const { publicKey, privateKey, subject } = getVapidConfig();
  const storage = getPushStorageStatus();
  const missing: string[] = [];

  if (!publicKey) missing.push("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
  if (!privateKey) missing.push("VAPID_PRIVATE_KEY");
  if (!subject) missing.push("VAPID_SUBJECT");
  missing.push(...storage.missing);

  return {
    enabled: missing.length === 0,
    publicKey: publicKey || null,
    missing,
  };
}

function toWebPushSubscription(
  subscription: StoredPushSubscription,
): LibraryPushSubscription {
  return {
    endpoint: subscription.endpoint,
    keys: subscription.keys,
  };
}

export async function broadcastPushNotification(payload: PushPayload) {
  const status = getPushConfigurationStatus();

  if (!status.enabled) {
    throw new Error(`Notificações não configuradas: ${status.missing.join(", ")}`);
  }

  const { publicKey, privateKey, subject } = getVapidConfig();
  const subscriptions = await listPushSubscriptions();
  const body = JSON.stringify({
    ...payload,
    url: payload.url || "/",
    icon: payload.icon || "/pwa-icons/192",
    badge: payload.badge || "/pwa-icons/192",
  });
  let sent = 0;
  let failed = 0;
  let removed = 0;

  const results = await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(toWebPushSubscription(subscription), body, {
          vapidDetails: {
            subject: subject!,
            publicKey: publicKey!,
            privateKey: privateKey!,
          },
          TTL: 60 * 60 * 6,
          urgency: payload.urgency || "normal",
          topic: (payload.tag || "tempo-pelotas")
            .replace(/[^A-Za-z0-9_-]/g, "-")
            .slice(0, 32),
          timeout: 12_000,
        });
        sent += 1;
      } catch (error) {
        const statusCode =
          error && typeof error === "object" && "statusCode" in error
            ? Number((error as { statusCode?: unknown }).statusCode)
            : null;

        if (statusCode === 404 || statusCode === 410) {
          await deletePushSubscription(subscription.endpoint).catch(() => undefined);
          removed += 1;
          return;
        }

        failed += 1;
        console.error("Falha ao enviar notificação web push:", error);
      }
    }),
  );

  return {
    total: subscriptions.length,
    sent,
    failed,
    removed,
    settled: results.length,
  };
}
