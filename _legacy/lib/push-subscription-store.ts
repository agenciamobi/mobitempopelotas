import "server-only";

const SUBSCRIPTIONS_TABLE = "web_push_subscriptions";
const DISPATCHES_TABLE = "web_push_dispatches";

export type StoredPushSubscription = {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type PushStorageStatus = {
  configured: boolean;
  missing: Array<"SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY">;
};

type PushSubscriptionRow = {
  endpoint: string;
  expiration_time: number | null;
  p256dh: string;
  auth: string;
  user_agent: string | null;
  topics: string[];
  created_at?: string;
  updated_at?: string;
  last_seen_at?: string;
};

function getStorageConfig() {
  return {
    url: process.env.SUPABASE_URL?.replace(/\/$/, ""),
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

export function getPushStorageStatus(): PushStorageStatus {
  const { url, serviceRoleKey } = getStorageConfig();
  const missing: PushStorageStatus["missing"] = [];

  if (!url) missing.push("SUPABASE_URL");
  if (!serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  return { configured: missing.length === 0, missing };
}

function requestHeaders(serviceRoleKey: string, prefer?: string): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (prefer) headers.Prefer = prefer;
  return headers;
}

function requireStorageConfig() {
  const { url, serviceRoleKey } = getStorageConfig();

  if (!url || !serviceRoleKey) {
    throw new Error("O armazenamento das notificações não está configurado.");
  }

  return { url, serviceRoleKey };
}

function rowToSubscription(row: PushSubscriptionRow): StoredPushSubscription {
  return {
    endpoint: row.endpoint,
    expirationTime: row.expiration_time,
    keys: {
      p256dh: row.p256dh,
      auth: row.auth,
    },
  };
}

export async function savePushSubscription(
  subscription: StoredPushSubscription,
  userAgent: string | null,
  topics: string[] = ["weather", "water", "community"],
) {
  const { url, serviceRoleKey } = requireStorageConfig();
  const now = new Date().toISOString();
  const row: PushSubscriptionRow = {
    endpoint: subscription.endpoint,
    expiration_time: subscription.expirationTime,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    user_agent: userAgent,
    topics: [...new Set(topics)].slice(0, 8),
    updated_at: now,
    last_seen_at: now,
  };
  const params = new URLSearchParams({ on_conflict: "endpoint" });
  const response = await fetch(`${url}/rest/v1/${SUBSCRIPTIONS_TABLE}?${params}`, {
    method: "POST",
    headers: requestHeaders(
      serviceRoleKey,
      "resolution=merge-duplicates,return=minimal",
    ),
    body: JSON.stringify(row),
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Falha ao salvar inscrição de notificações (${response.status}): ${details.slice(0, 240)}`,
    );
  }
}

export async function deletePushSubscription(endpoint: string) {
  const { url, serviceRoleKey } = requireStorageConfig();
  const params = new URLSearchParams({ endpoint: `eq.${endpoint}` });
  const response = await fetch(`${url}/rest/v1/${SUBSCRIPTIONS_TABLE}?${params}`, {
    method: "DELETE",
    headers: requestHeaders(serviceRoleKey, "return=minimal"),
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Falha ao remover inscrição de notificações (${response.status}): ${details.slice(0, 240)}`,
    );
  }
}

export async function listPushSubscriptions(): Promise<StoredPushSubscription[]> {
  const { url, serviceRoleKey } = requireStorageConfig();
  const params = new URLSearchParams({
    select: "endpoint,expiration_time,p256dh,auth,user_agent,topics",
    order: "updated_at.desc",
    limit: "10000",
  });
  const response = await fetch(`${url}/rest/v1/${SUBSCRIPTIONS_TABLE}?${params}`, {
    headers: requestHeaders(serviceRoleKey),
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Falha ao consultar inscrições de notificações (${response.status}): ${details.slice(0, 240)}`,
    );
  }

  const rows = (await response.json()) as PushSubscriptionRow[];
  return rows.map(rowToSubscription);
}

export async function hasPushDispatch(fingerprint: string) {
  const { url, serviceRoleKey } = requireStorageConfig();
  const params = new URLSearchParams({
    select: "fingerprint",
    fingerprint: `eq.${fingerprint}`,
    limit: "1",
  });
  const response = await fetch(`${url}/rest/v1/${DISPATCHES_TABLE}?${params}`, {
    headers: requestHeaders(serviceRoleKey),
    cache: "no-store",
  });

  if (!response.ok) return false;
  const rows = (await response.json()) as Array<{ fingerprint: string }>;
  return rows.length > 0;
}

export async function recordPushDispatch(
  fingerprint: string,
  title: string,
  sentCount: number,
) {
  const { url, serviceRoleKey } = requireStorageConfig();
  const params = new URLSearchParams({ on_conflict: "fingerprint" });
  const response = await fetch(`${url}/rest/v1/${DISPATCHES_TABLE}?${params}`, {
    method: "POST",
    headers: requestHeaders(
      serviceRoleKey,
      "resolution=merge-duplicates,return=minimal",
    ),
    body: JSON.stringify({
      fingerprint,
      title,
      sent_count: sentCount,
      sent_at: new Date().toISOString(),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Falha ao registrar envio de notificações (${response.status}): ${details.slice(0, 240)}`,
    );
  }
}
