export type SupabaseRuntimeMode = "mock" | "external";

function normalizeEnvironmentValue(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

const requestedMode: SupabaseRuntimeMode =
  import.meta.env.VITE_SUPABASE_MODE === "external" ? "external" : "mock";

const url = normalizeEnvironmentValue(import.meta.env.VITE_SUPABASE_URL);
const anonKey = normalizeEnvironmentValue(import.meta.env.VITE_SUPABASE_ANON_KEY);

export const supabaseConfig = Object.freeze({
  mode: requestedMode,
  url,
  anonKey,
  isConfigured: Boolean(url && anonKey),
  networkEnabled: false as const,
});

export type SupabaseConfig = typeof supabaseConfig;

export function getSupabaseConfigStatus() {
  if (supabaseConfig.mode === "mock") {
    return "Supabase está em modo mock e não realizará conexões externas.";
  }

  if (!supabaseConfig.isConfigured) {
    return "O modo externo foi solicitado, mas as variáveis do Supabase ainda não estão completas.";
  }

  return "As variáveis externas estão presentes, mas a conexão permanece desabilitada nesta etapa.";
}
