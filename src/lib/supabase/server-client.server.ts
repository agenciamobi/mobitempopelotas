import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

export type SupabaseCookie = {
  name: string;
  value: string;
};

export type SupabaseCookieToSet = SupabaseCookie & {
  options: CookieOptions;
};

export type SupabaseCookieAdapter = {
  getAll(): SupabaseCookie[] | Promise<SupabaseCookie[]>;
  setAll(cookies: SupabaseCookieToSet[]): void | Promise<void>;
};

type SupabaseServerConfig = {
  mode: "mock" | "external";
  url: string | null;
  publishableKey: string | null;
  secretKey: string | null;
  isPublicConfigured: boolean;
  isAdminConfigured: boolean;
};

function normalizeEnvironmentValue(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function firstEnvironmentValue(...values: Array<string | undefined>) {
  for (const value of values) {
    const normalized = normalizeEnvironmentValue(value);
    if (normalized) return normalized;
  }

  return null;
}

export function getSupabaseServerConfig(): SupabaseServerConfig {
  const mode =
    process.env.SUPABASE_MODE === "external" || process.env.VITE_SUPABASE_MODE === "external"
      ? "external"
      : "mock";
  const url = firstEnvironmentValue(process.env.SUPABASE_URL, process.env.VITE_SUPABASE_URL);
  const publishableKey = firstEnvironmentValue(
    process.env.SUPABASE_PUBLISHABLE_KEY,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    process.env.VITE_SUPABASE_ANON_KEY,
  );
  const secretKey = firstEnvironmentValue(
    process.env.SUPABASE_SECRET_KEY,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );

  return {
    mode,
    url,
    publishableKey,
    secretKey,
    isPublicConfigured: mode === "external" && Boolean(url && publishableKey),
    isAdminConfigured: mode === "external" && Boolean(url && secretKey),
  };
}

function requirePublicServerConfig() {
  const config = getSupabaseServerConfig();
  if (!config.isPublicConfigured || !config.url || !config.publishableKey) {
    throw new Error(
      "Supabase externo não configurado no servidor. Defina SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return {
    url: config.url,
    publishableKey: config.publishableKey,
  } as const;
}

export function createSupabaseServerClient(cookies: SupabaseCookieAdapter) {
  const { url, publishableKey } = requirePublicServerConfig();

  return createServerClient<Database>(url, publishableKey, {
    cookies,
    auth: {
      flowType: "pkce",
      autoRefreshToken: false,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export function createSupabasePublicServerClient(): SupabaseClient<Database> {
  const { url, publishableKey } = requirePublicServerConfig();

  return createClient<Database>(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export function createSupabaseAdminClient(): SupabaseClient<Database> {
  const config = getSupabaseServerConfig();
  if (!config.isAdminConfigured || !config.url || !config.secretKey) {
    throw new Error(
      "Cliente administrativo do Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SECRET_KEY somente no servidor.",
    );
  }

  return createClient<Database>(config.url, config.secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
