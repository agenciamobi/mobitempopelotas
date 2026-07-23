import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabaseConfigStatus, getSupabasePublicConfig, supabaseConfig } from "./config";
import type { Database } from "./database.types";
import { createMockSupabaseClient } from "./mock";

let browserClient: SupabaseClient<Database> | null = null;

const mockClient = createMockSupabaseClient({
  isConfigured: supabaseConfig.isConfigured,
  reason: getSupabaseConfigStatus(),
});

export function isSupabaseBrowserConfigured() {
  return supabaseConfig.networkEnabled;
}

export function getSupabaseBrowserClient() {
  if (!supabaseConfig.networkEnabled) return null;

  if (!browserClient) {
    const { url, publishableKey } = getSupabasePublicConfig();
    browserClient = createBrowserClient<Database>(url, publishableKey, {
      auth: {
        flowType: "pkce",
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}

export function requireSupabaseBrowserClient() {
  const client = getSupabaseBrowserClient();
  if (!client) {
    throw new Error(getSupabaseConfigStatus());
  }

  return client;
}

export function getSupabaseClient() {
  return getSupabaseBrowserClient() ?? mockClient;
}

export function resetSupabaseBrowserClientForTests() {
  browserClient = null;
}
