import { createSupabaseAdminClient, getSupabaseServerConfig } from "@/lib/supabase/server-client.server";
import type { WebPushSubscription } from "@/lib/supabase/database.types";

import { PUSH_TOPICS, type PushDeliveryResult, type PushTopic, type StoredPushSubscription } from "./push.types";

const QUERY_TIMEOUT_MS = 3_500;
const MAX_SUBSCRIPTIONS = 10_000;

export type PushStorageStatus = {
  configured: boolean;
  missing: Array<"SUPABASE_URL" | "SUPABASE_SECRET_KEY">;
};

function timeoutSignal() {
  return AbortSignal.timeout(QUERY_TIMEOUT_MS);
}

function normalizeTopics(topics: readonly string[] | null | undefined): PushTopic[] {
  const allowed = new Set<PushTopic>(PUSH_TOPICS);
  const normalized = Array.from(
    new Set((topics ?? []).filter((topic): topic is PushTopic => allowed.has(topic as PushTopic))),
  );

  return normalized.length > 0 ? normalized : [...PUSH_TOPICS];
}

function rowToSubscription(row: WebPushSubscription): StoredPushSubscription {
  return {
    endpoint: row.endpoint,
    expirationTime: row.expiration_time,
    keys: {
      p256dh: row.p256dh,
      auth: row.auth,
    },
    topics: normalizeTopics(row.topics),
  };
}

export function getPushStorageStatus(): PushStorageStatus {
  const config = getSupabaseServerConfig();
  const missing: PushStorageStatus["missing"] = [];

  if (!config.url) missing.push("SUPABASE_URL");
  if (!config.secretKey) missing.push("SUPABASE_SECRET_KEY");

  return {
    configured: config.isAdminConfigured,
    missing,
  };
}

function requirePushStorage() {
  const status = getPushStorageStatus();
  if (!status.configured) {
    throw new Error(`Armazenamento web push não configurado: ${status.missing.join(", ")}`);
  }

  return createSupabaseAdminClient();
}

export async function savePushSubscription(
  subscription: StoredPushSubscription,
  userAgent: string | null,
  topics: readonly PushTopic[],
) {
  const client = requirePushStorage();
  const now = new Date().toISOString();
  const { error } = await client
    .from("web_push_subscriptions")
    .upsert(
      {
        endpoint: subscription.endpoint,
        expiration_time: subscription.expirationTime,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        user_agent: userAgent?.slice(0, 500) ?? null,
        topics: normalizeTopics(topics),
        updated_at: now,
        last_seen_at: now,
      },
      { onConflict: "endpoint" },
    )
    .abortSignal(timeoutSignal());

  if (error) throw new Error(`Falha ao salvar inscrição web push: ${error.message}`);
}

export async function deletePushSubscription(endpoint: string) {
  const client = requirePushStorage();
  const { error } = await client
    .from("web_push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
    .abortSignal(timeoutSignal());

  if (error) throw new Error(`Falha ao remover inscrição web push: ${error.message}`);
}

export async function listPushSubscriptions(topic?: PushTopic): Promise<StoredPushSubscription[]> {
  const client = requirePushStorage();
  let query = client
    .from("web_push_subscriptions")
    .select("endpoint,expiration_time,p256dh,auth,user_agent,topics,created_at,updated_at,last_seen_at")
    .order("updated_at", { ascending: false })
    .limit(MAX_SUBSCRIPTIONS);

  if (topic) query = query.contains("topics", [topic]);

  const { data, error } = await query.abortSignal(timeoutSignal());
  if (error) throw new Error(`Falha ao consultar inscrições web push: ${error.message}`);

  return (data ?? []).map(rowToSubscription);
}

export async function hasPushDispatch(fingerprint: string) {
  const client = requirePushStorage();
  const { data, error } = await client
    .from("web_push_dispatches")
    .select("fingerprint")
    .eq("fingerprint", fingerprint)
    .maybeSingle()
    .abortSignal(timeoutSignal());

  if (error) throw new Error(`Falha ao consultar histórico de envios: ${error.message}`);
  return Boolean(data);
}

export async function recordPushDispatch(
  fingerprint: string,
  title: string,
  result: PushDeliveryResult,
) {
  const client = requirePushStorage();
  const { error } = await client
    .from("web_push_dispatches")
    .upsert(
      {
        fingerprint,
        title,
        sent_count: result.sent,
        failed_count: result.failed,
        removed_count: result.removed,
        sent_at: new Date().toISOString(),
      },
      { onConflict: "fingerprint" },
    )
    .abortSignal(timeoutSignal());

  if (error) throw new Error(`Falha ao registrar envio web push: ${error.message}`);
}
