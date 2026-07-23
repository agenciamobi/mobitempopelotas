import { randomUUID } from "node:crypto";

import {
  createSupabaseAdminClient,
  getSupabaseServerConfig,
} from "@/lib/supabase/server-client.server";
import type { UserPreferences, WebPushSubscription } from "@/lib/supabase/database.types";

import {
  PUSH_TOPICS,
  type PushDeliveryResult,
  type PushTopic,
  type StoredPushSubscription,
} from "./push.types";

const QUERY_TIMEOUT_MS = 3_500;
const PUSH_SUBSCRIPTION_PAGE_SIZE = 500;
const PREFERENCE_QUERY_BATCH_SIZE = 100;
const CLAIM_LEASE_SECONDS = 15 * 60;

export type PushStorageStatus = {
  configured: boolean;
  missing: Array<"SUPABASE_URL" | "SUPABASE_SECRET_KEY">;
};

export type PushConsentPreference =
  | "weather_alerts"
  | "water_alerts"
  | "daily_summary"
  | "community_updates";

type PushPreferenceSnapshot = Pick<
  UserPreferences,
  | "user_id"
  | "weather_alerts"
  | "water_alerts"
  | "daily_summary"
  | "community_updates"
>;

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

function isConsentGranted(
  preference: PushPreferenceSnapshot | undefined,
  consentPreference: PushConsentPreference,
) {
  if (!preference) return false;

  switch (consentPreference) {
    case "weather_alerts":
      return preference.weather_alerts;
    case "water_alerts":
      return preference.water_alerts;
    case "daily_summary":
      return preference.daily_summary;
    case "community_updates":
      return preference.community_updates;
  }
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

async function loadPushPreferences(
  client: ReturnType<typeof requirePushStorage>,
  userIds: string[],
) {
  const preferences = new Map<string, PushPreferenceSnapshot>();

  for (let index = 0; index < userIds.length; index += PREFERENCE_QUERY_BATCH_SIZE) {
    const batch = userIds.slice(index, index + PREFERENCE_QUERY_BATCH_SIZE);
    const { data, error } = await client
      .from("user_preferences")
      .select("user_id,weather_alerts,water_alerts,daily_summary,community_updates")
      .in("user_id", batch)
      .abortSignal(timeoutSignal());

    if (error) throw new Error(`Falha ao consultar preferências de comunicação: ${error.message}`);

    for (const preference of data ?? []) {
      preferences.set(preference.user_id, preference);
    }
  }

  return preferences;
}

export async function savePushSubscription(
  subscription: StoredPushSubscription,
  userAgent: string | null,
  topics: readonly PushTopic[],
  userId?: string | null,
) {
  const client = requirePushStorage();
  const now = new Date().toISOString();
  const accountFields = userId === undefined ? {} : { user_id: userId };
  const { error } = await client
    .from("web_push_subscriptions")
    .upsert(
      {
        endpoint: subscription.endpoint,
        expiration_time: subscription.expirationTime,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        user_agent: userAgent?.slice(0, 500) ?? null,
        ...accountFields,
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

export async function* iteratePushSubscriptionPages(
  topic?: PushTopic,
  consentPreference?: PushConsentPreference,
): AsyncGenerator<StoredPushSubscription[]> {
  const client = requirePushStorage();
  let endpointCursor: string | null = null;

  while (true) {
    let query = client
      .from("web_push_subscriptions")
      .select(
        "endpoint,expiration_time,p256dh,auth,user_agent,user_id,topics,created_at,updated_at,last_seen_at",
      )
      .order("endpoint", { ascending: true })
      .limit(PUSH_SUBSCRIPTION_PAGE_SIZE);

    if (topic) query = query.contains("topics", [topic]);
    if (endpointCursor) query = query.gt("endpoint", endpointCursor);

    const { data, error } = await query.abortSignal(timeoutSignal());
    if (error) throw new Error(`Falha ao consultar inscrições web push: ${error.message}`);

    const rows = data ?? [];
    if (rows.length === 0) return;

    let eligibleRows = rows;
    if (consentPreference) {
      const userIds = Array.from(
        new Set(rows.flatMap((row) => (row.user_id ? [row.user_id] : []))),
      );
      const preferences = await loadPushPreferences(client, userIds);
      eligibleRows = rows.filter(
        (row) =>
          !row.user_id || isConsentGranted(preferences.get(row.user_id), consentPreference),
      );
    }

    const page = eligibleRows.map(rowToSubscription);
    if (page.length > 0) yield page;

    endpointCursor = rows.at(-1)?.endpoint ?? null;
    if (!endpointCursor || rows.length < PUSH_SUBSCRIPTION_PAGE_SIZE) return;
  }
}

export async function claimPushDispatch(fingerprint: string, title: string) {
  const client = requirePushStorage();
  const leaseToken = randomUUID();
  const { data, error } = await client
    .rpc("claim_web_push_dispatch", {
      p_fingerprint: fingerprint,
      p_title: title,
      p_lease_token: leaseToken,
      p_stale_after_seconds: CLAIM_LEASE_SECONDS,
    })
    .abortSignal(timeoutSignal());

  if (error) throw new Error(`Falha ao reservar envio web push: ${error.message}`);
  return data ? leaseToken : null;
}

export async function renewPushDispatch(fingerprint: string, leaseToken: string) {
  const client = requirePushStorage();
  const { data, error } = await client
    .from("web_push_dispatches")
    .update({ claimed_at: new Date().toISOString() })
    .eq("fingerprint", fingerprint)
    .eq("lease_token", leaseToken)
    .eq("status", "claimed")
    .select("fingerprint")
    .abortSignal(timeoutSignal())
    .maybeSingle();

  if (error) throw new Error(`Falha ao renovar a reserva do envio web push: ${error.message}`);
  if (!data) throw new Error("A reserva do envio web push não está mais ativa.");
}

export async function releasePushDispatch(fingerprint: string, leaseToken: string) {
  const client = requirePushStorage();
  const { error } = await client
    .from("web_push_dispatches")
    .delete()
    .eq("fingerprint", fingerprint)
    .eq("lease_token", leaseToken)
    .eq("status", "claimed")
    .abortSignal(timeoutSignal());

  if (error) throw new Error(`Falha ao liberar envio web push: ${error.message}`);
}

export async function recordPushDispatch(
  fingerprint: string,
  leaseToken: string,
  title: string,
  result: PushDeliveryResult,
) {
  const client = requirePushStorage();
  const completedAt = new Date().toISOString();
  const { data, error } = await client
    .from("web_push_dispatches")
    .update({
      title,
      status: "completed",
      completed_at: completedAt,
      sent_count: result.sent,
      failed_count: result.failed,
      removed_count: result.removed,
      sent_at: completedAt,
    })
    .eq("fingerprint", fingerprint)
    .eq("lease_token", leaseToken)
    .eq("status", "claimed")
    .select("fingerprint")
    .abortSignal(timeoutSignal())
    .maybeSingle();

  if (error) throw new Error(`Falha ao registrar envio web push: ${error.message}`);
  if (!data) throw new Error("A reserva do envio web push expirou antes da conclusão.");
}
