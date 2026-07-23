export type SupabaseRuntimeMode = "mock" | "external";

function normalizeEnvironmentValue(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

const requestedMode: SupabaseRuntimeMode =
  import.meta.env.VITE_SUPABASE_MODE === "external" ? "external" : "mock";

const url = normalizeEnvironmentValue(import.meta.env.VITE_SUPABASE_URL);
const publishableKey = normalizeEnvironmentValue(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY,
);
const usesLegacyAnonKey = Boolean(
  !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY,
);
const isConfigured = Boolean(url && publishableKey);

export const supabaseConfig = Object.freeze({
  mode: requestedMode,
  url,
  publishableKey,
  isConfigured,
  usesLegacyAnonKey,
  networkEnabled: requestedMode === "external" && isConfigured,
});

export type SupabaseConfig = typeof supabaseConfig;

export function getSupabasePublicConfig() {
  if (!supabaseConfig.url || !supabaseConfig.publishableKey) {
    throw new Error(
      "Supabase externo não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.",
    );
  }

  return {
    url: supabaseConfig.url,
    publishableKey: supabaseConfig.publishableKey,
  } as const;
}

export function getSupabaseConfigStatus() {
  if (supabaseConfig.mode === "mock") {
    return "Supabase está em modo mock e não realizará conexões externas.";
  }

  if (!supabaseConfig.isConfigured) {
    return "O modo externo foi solicitado, mas as variáveis públicas do Supabase ainda não estão completas.";
  }

  if (supabaseConfig.usesLegacyAnonKey) {
    return "Supabase externo está habilitado com a anon key legada. Migre para a publishable key quando possível.";
  }

  return "Supabase externo está configurado com publishable key e acesso sujeito às políticas RLS.";
}
