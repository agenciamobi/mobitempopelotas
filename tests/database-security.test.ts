import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPaths = {
  profiles: "../supabase/migrations/20260721091214_create_user_profiles.sql",
  preferences: "../supabase/migrations/20260721170503_create_user_preferences.sql",
  snapshots: "../supabase/migrations/20260723070000_create_weather_daily_snapshots.sql",
  push: "../supabase/migrations/20260723113000_create_web_push_subscriptions.sql",
  lgpd: "../supabase/migrations/20260723133000_add_account_lgpd_rights.sql",
} as const;

async function readMigration(path: string) {
  const sql = await readFile(new URL(path, import.meta.url), "utf8");
  return sql
    .replace(/--.*$/gm, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function assertIncludes(sql: string, fragments: string[]) {
  for (const fragment of fragments) {
    assert.ok(sql.includes(fragment), `Contrato SQL ausente: ${fragment}`);
  }
}

function assertNoBroadClientGrant(sql: string) {
  assert.doesNotMatch(sql, /grant\s+all(?:\s+privileges)?\s+on\s+[^;]+\s+to\s+(?:public|anon|authenticated)/);
  assert.doesNotMatch(sql, /create\s+policy\s+[^;]+\s+to\s+anon\b/);
}

test("perfis e preferências isolam cada conta com RLS e auth.uid", async () => {
  const profiles = await readMigration(migrationPaths.profiles);
  const preferences = await readMigration(migrationPaths.preferences);

  assertIncludes(profiles, [
    "references auth.users(id) on delete cascade",
    "alter table public.profiles enable row level security",
    "using ((select auth.uid()) = id)",
    "with check ((select auth.uid()) = id)",
    "revoke all on table public.profiles from anon",
    "security definer set search_path = ''",
  ]);

  assertIncludes(preferences, [
    "references auth.users(id) on delete cascade",
    "alter table public.user_preferences enable row level security",
    "using ((select auth.uid()) = user_id)",
    "with check ((select auth.uid()) = user_id)",
    "revoke all on table public.user_preferences from anon",
    "revoke execute on function public.handle_new_user_preferences() from authenticated",
    "grant execute on function public.handle_new_user_preferences() to supabase_auth_admin",
    "security definer set search_path = ''",
  ]);

  assertNoBroadClientGrant(profiles);
  assertNoBroadClientGrant(preferences);
});

test("snapshots e web push permanecem exclusivos do servidor", async () => {
  const snapshots = await readMigration(migrationPaths.snapshots);
  const push = await readMigration(migrationPaths.push);

  assertIncludes(snapshots, [
    "alter table public.weather_daily_snapshots enable row level security",
    "revoke all on table public.weather_daily_snapshots from anon, authenticated",
    "grant select, insert, update, delete on table public.weather_daily_snapshots to service_role",
    "set search_path = ''",
  ]);

  assertIncludes(push, [
    "alter table public.web_push_subscriptions enable row level security",
    "alter table public.web_push_dispatches enable row level security",
    "revoke all on table public.web_push_subscriptions from public",
    "revoke all on table public.web_push_subscriptions from anon",
    "revoke all on table public.web_push_subscriptions from authenticated",
    "grant select, insert, update, delete on table public.web_push_subscriptions to service_role",
    "grant select, insert, update, delete on table public.web_push_dispatches to service_role",
    "security invoker set search_path = ''",
    "grant execute on function public.claim_web_push_dispatch(text, text, uuid, integer) to service_role",
  ]);

  assertNoBroadClientGrant(snapshots);
  assertNoBroadClientGrant(push);
});

test("direitos LGPD mantêm histórico próprio e RPC autenticada", async () => {
  const lgpd = await readMigration(migrationPaths.lgpd);

  assertIncludes(lgpd, [
    "add column if not exists user_id uuid references auth.users(id) on delete cascade",
    "alter table public.account_consent_events enable row level security",
    "using ((select auth.uid()) = user_id)",
    "revoke all on table public.account_consent_events from public",
    "revoke all on table public.account_consent_events from anon",
    "grant select on table public.account_consent_events to authenticated",
    "grant select, insert, update, delete on table public.account_consent_events to service_role",
    "revoke all on sequence public.account_consent_events_id_seq from authenticated",
    "security definer set search_path = ''",
    "current_user_id uuid := (select auth.uid())",
    "if current_user_id is null then raise exception 'authentication required'",
    "grant execute on function public.update_account_preferences( text, text, text, boolean, boolean, boolean, boolean ) to authenticated",
  ]);

  assertNoBroadClientGrant(lgpd);
});

test("migrations sensíveis não concedem privilégios totais aos clientes", async () => {
  const migrations = await Promise.all(Object.values(migrationPaths).map(readMigration));

  for (const sql of migrations) {
    assertNoBroadClientGrant(sql);
    assert.doesNotMatch(sql, /grant\s+execute\s+on\s+function\s+[^;]+\s+to\s+anon\b/);
  }
});
