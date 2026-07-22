"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

let browserClient: SupabaseClient<Database> | null = null;

export function isSupabaseBrowserConfigured() {
  const { url, key } = getSupabasePublicConfig();
  return Boolean(url && key);
}

export function createClient() {
  const { url, key } = getSupabasePublicConfig();

  if (!browserClient) {
    browserClient = createBrowserClient<Database>(url, key, {
      cookieOptions: {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    });
  }

  return browserClient;
}
