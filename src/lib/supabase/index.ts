export {
  getSupabaseBrowserClient,
  getSupabaseClient,
  isSupabaseBrowserConfigured,
  requireSupabaseBrowserClient,
  resetSupabaseBrowserClientForTests,
} from "./client";
export { getSupabaseConfigStatus, getSupabasePublicConfig, supabaseConfig } from "./config";
export type { SupabaseConfig, SupabaseRuntimeMode } from "./config";
export type { Database, Json, Profile, UserPreferences } from "./database.types";
export type { SupabaseClientAdapter, SupabaseMockResult } from "./mock";
