import { getSupabaseConfigStatus, supabaseConfig } from "./config";
import { createMockSupabaseClient } from "./mock";

export const supabaseClient = createMockSupabaseClient({
  isConfigured: supabaseConfig.isConfigured,
  reason: getSupabaseConfigStatus(),
});

export function getSupabaseClient() {
  return supabaseClient;
}
