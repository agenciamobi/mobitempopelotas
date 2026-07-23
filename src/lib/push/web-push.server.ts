import {
  createCipheriv,
  createECDH,
  createHmac,
  createPrivateKey,
  randomBytes,
  sign,
} from "node:crypto";

import { isAllowedPushEndpoint } from "./push-http.server";
import {
  deletePushSubscription,
  getPushStorageStatus,
  iteratePushSubscriptionPages,
} from "./push-storage.server";
import type { PushDeliveryResult, PushPayload, StoredPushSubscription } from "./push.types";

const DELIVERY_BATCH_SIZE = 50;
const DELIVERY_TIMEOUT_MS = 12_000;
const DEFAULT_SUBJECT = "mailto:contato@agenciamobi.com.br";
const RECORD_SIZE = 4_096;
const MAX_VAPID_AGE_SECONDS = 12 * 60 * 60;

export type PushConfigurationStatus = {
  enabled: boolean;
  publicKey: string | null;
  missing: string[];
};

export type PushBroadcastOptions = {
  beforeBatch?: (context: { processed: number; batchSize: number }) => Promise<void>;
};

type VapidConfiguration = {
  publicKey: string | null;
  privateKey: string | null;
  subject: string;
};

type ActiveVapidConfiguration = {
  publicKey: string;
  privateKey: string;
  subject: string;
};

function normalizedEnvironmentValue(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function getVapidConfig(): VapidConfiguration {
  return {
    publicKey:
      normalizedEnvironmentValue(process.env.VAPID_PUBLIC_KEY) ??
      normalizedEnvironmentValue(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
    privateKey: normalizedEnvironmentValue(process.env.VAPID_PRIVATE_KEY),
    subject: normalizedEnvironmentValue(process.env.VAPID_SUBJECT) ?? DEFAULT_SUBJECT,
  };
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(`${normalized}${padding}`, "base64");
}

function encodeBase64Url(value: Buffer | Uint8Array | string) {
  const buffer = typeof value === "string" ? Buffer.from(value) : Buffer.from(value);
  return buffer.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function validateVapidSubject(subject: string) {
  return subject.startsWith("mailto:") || subject.startsWith("https://");
}

function validateVapidKeys(publicKey: string | null, privateKey: string | null) {
  if (!publicKey || !privateKey) return false;

  try {
    const publicBytes = decodeBase64Url(publicKey);
    const privateBytes = decodeBase64Url(privateKey);
    return publicBytes.length === 65 && publicBytes[0] === 4 && privateBytes.length === 32;
  } catch {
    return false;
  }
}

function getActiveVapidConfig(): ActiveVapidConfiguration {
  const vapid = getVapidConfig();
  if (
    !vapid.publicKey ||
    !vapid.privateKey ||
    !validateVapidSubject(vapid.subject) ||
    !validateVapidKeys(vapid.publicKey, vapid.privateKey)
  ) {
    throw new Error("A configuração VAPID não é válida.");
  }

  return {
    publicKey: vapid.publicKey,
    privateKey: vapid.privateKey,
    subject: vapid.subject,
  };
}

export function getPushConfigurationStatus(): PushConfigurationStatus {
  const vapid = getVapidConfig();
  const storage = getPushStorageStatus();
  const missing: string[] = [];

  if (!vapid.publicKey) missing.push("VAPID_PUBLIC_KEY");
  if (!vapid.privateKey) missing.push("VAPID_PRIVATE_KEY");
  if (!validateVapidSubject(vapid.subject)) missing.push("VAPID_SUBJECT");
  if (!validateVapidKeys(vapid.publicKey, vapid.privateKey)) missing.push("VAPID_KEY_PAIR");
  missing.push(...storage.missing);

  return {
    enabled: missing.length === 0,
    publicKey: vapid.publicKey,
    missing: Array.from(new Set(missing)),
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

function hkdfExtract(salt: Buffer, inputKeyMaterial: Buffer) {
  return createHmac("sha256", salt).update(inputKeyMaterial).digest();
}

function hkdfExpand(pseudoRandomKey: Buffer, info: Buffer, length: number) {
  const blocks: Buffer[] = [];
  let previous = Buffer.alloc(0);
  let currentLength = 0;
  let counter = 1;

  while (currentLength < length) {
    previous = createHmac("sha256", pseudoRandomKey)
      .update(Buffer.concat([previous, info, Buffer.from([counter])]))
      .digest();
    blocks.push(previous);
    currentLength += previous.length;
    counter += 1;
  }

  return Buffer.concat(blocks).subarray(0, length);
}

function createEncryptionMaterial(subscription: StoredPushSubscription, payload: string) {
  const userPublicKey = decodeBase64Url(subscription.keys.p256dh);
  const authSecret = decodeBase64Url(subscription.keys.auth);

  if (userPublicKey.length !== 65 || userPublicKey[0] !== 4) {
    throw new Error("A chave pública da inscrição web push é inválida.");
  }
  if (authSecret.length < 8) {
    throw new Error("O segredo de autenticação da inscrição web push é inválido.");
  }

  const serverKey = createECDH("prime256v1");
  serverKey.generateKeys();
  const serverPublicKey = serverKey.getPublicKey();
  const sharedSecret = serverKey.computeSecret(userPublicKey);

  const authPseudoRandomKey = hkdfExtract(authSecret, sharedSecret);
  const keyInfo = Buffer.concat([
    Buffer.from("WebPush: info\0", "utf8"),
    userPublicKey,
    serverPublicKey,
  ]);
  const inputKeyMaterial = hkdfExpand(authPseudoRandomKey, keyInfo, 32);
  const salt = randomBytes(16);
  const pseudoRandomKey = hkdfExtract(salt, inputKeyMaterial);
  const contentEncryptionKey = hkdfExpand(
    pseudoRandomKey,
    Buffer.from("Content-Encoding: aes128gcm\0", "utf8"),
    16,
  );
  const nonce = hkdfExpand(pseudoRandomKey, Buffer.from("Content-Encoding: nonce\0", "utf8"), 12);
  const plaintext = Buffer.concat([Buffer.from(payload, "utf8"), Buffer.from([2])]);
  const cipher = createCipheriv("aes-128-gcm", contentEncryptionKey, nonce);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final(), cipher.getAuthTag()]);
  const recordSize = Buffer.alloc(4);
  recordSize.writeUInt32BE(RECORD_SIZE, 0);

  return Buffer.concat([
    salt,
    recordSize,
    Buffer.from([serverPublicKey.length]),
    serverPublicKey,
    ciphertext,
  ]);
}

function createVapidAuthorization(endpoint: string, vapid: ActiveVapidConfiguration) {
  const publicBytes = decodeBase64Url(vapid.publicKey);
  const privateBytes = decodeBase64Url(vapid.privateKey);
  const audience = new URL(endpoint).origin;
  const header = encodeBase64Url(JSON.stringify({ typ: "JWT", alg: "ES256" }));
  const claims = encodeBase64Url(
    JSON.stringify({
      aud: audience,
      exp: Math.floor(Date.now() / 1_000) + MAX_VAPID_AGE_SECONDS,
      sub: vapid.subject,
    }),
  );
  const unsignedToken = `${header}.${claims}`;
  const privateKey = createPrivateKey({
    key: {
      kty: "EC",
      crv: "P-256",
      x: encodeBase64Url(publicBytes.subarray(1, 33)),
      y: encodeBase64Url(publicBytes.subarray(33, 65)),
      d: encodeBase64Url(privateBytes),
    },
    format: "jwk",
  });
  const signature = sign("sha256", Buffer.from(unsignedToken), {
    key: privateKey,
    dsaEncoding: "ieee-p1363",
  });

  return `vapid t=${unsignedToken}.${encodeBase64Url(signature)}, k=${vapid.publicKey}`;
}

function normalizedTopic(value: string) {
  return value.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 32) || "tempo-pelotas";
}

function pushDeliveryError(message: string, statusCode: number) {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = statusCode;
  return error;
}

async function sendNotification(
  subscription: StoredPushSubscription,
  payload: PushPayload,
  body: string,
  vapid: ActiveVapidConfiguration,
) {
  if (!isAllowedPushEndpoint(subscription.endpoint)) {
    throw pushDeliveryError("Destino de web push não permitido.", 410);
  }

  const encryptedBody = createEncryptionMaterial(subscription, body);
  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      Authorization: createVapidAuthorization(subscription.endpoint, vapid),
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: String(60 * 60 * 6),
      Urgency: payload.urgency ?? "normal",
      Topic: normalizedTopic(payload.tag ?? "tempo-pelotas"),
    },
    body: encryptedBody,
    signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw pushDeliveryError(
      `Serviço push respondeu com status ${response.status}`,
      response.status,
    );
  }
}

function deliveryStatusCode(error: unknown) {
  if (!error || typeof error !== "object" || !("statusCode" in error)) return null;
  const value = Number((error as { statusCode?: unknown }).statusCode);
  return Number.isFinite(value) ? value : null;
}

export async function broadcastPushNotification(
  payload: PushPayload,
  options: PushBroadcastOptions = {},
): Promise<PushDeliveryResult> {
  const status = getPushConfigurationStatus();
  if (!status.enabled) {
    throw new Error(`Notificações web push não configuradas: ${status.missing.join(", ")}`);
  }

  const vapid = getActiveVapidConfig();
  const body = notificationBody(payload);
  const result: PushDeliveryResult = {
    total: 0,
    sent: 0,
    failed: 0,
    removed: 0,
  };
  let processed = 0;

  for await (const subscriptions of iteratePushSubscriptionPages(payload.topic)) {
    result.total += subscriptions.length;

    for (let index = 0; index < subscriptions.length; index += DELIVERY_BATCH_SIZE) {
      const batch = subscriptions.slice(index, index + DELIVERY_BATCH_SIZE);
      await options.beforeBatch?.({ processed, batchSize: batch.length });

      await Promise.all(
        batch.map(async (subscription) => {
          try {
            await sendNotification(subscription, payload, body, vapid);
            result.sent += 1;
          } catch (error) {
            const statusCode = deliveryStatusCode(error);
            if (statusCode === 404 || statusCode === 410) {
              try {
                await deletePushSubscription(subscription.endpoint);
                result.removed += 1;
              } catch (cleanupError) {
                result.failed += 1;
                console.error("[push] Endpoint expirado, mas a inscrição não foi removida", {
                  statusCode,
                  message:
                    cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
                });
              }
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

      processed += batch.length;
    }
  }

  return result;
}
