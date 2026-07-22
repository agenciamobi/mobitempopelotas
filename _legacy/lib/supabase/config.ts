const PUBLIC_SUPABASE_URL = "https://ovcpgjyomwjteapbvfwk.supabase.co";
const PUBLIC_SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_ULiZKZfckr7yM1wERyo8HA_Ynp5jqY0";

export function getSupabasePublicConfig() {
  const url = (
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    PUBLIC_SUPABASE_URL
  ).trim();
  const key = (
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ).trim();

  return { url, key };
}
