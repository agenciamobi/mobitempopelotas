import { createSupabaseAdminClient } from "@/lib/supabase/server-client.server";

const QUERY_TIMEOUT_MS = 3_500;

export async function linkPushSubscriptionToAccount(endpoint: string, userId: string | null) {
  const client = createSupabaseAdminClient();
  const { error } = await client
    .from("web_push_subscriptions")
    .update({ user_id: userId })
    .eq("endpoint", endpoint)
    .abortSignal(AbortSignal.timeout(QUERY_TIMEOUT_MS));

  if (error) {
    throw new Error(`Falha ao vincular inscrição web push à conta: ${error.message}`);
  }
}
