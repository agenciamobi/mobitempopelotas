import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const migrationsDirectory = new URL("../supabase/migrations/", import.meta.url);
const serverOnlyTables = new Set([
  "weather_daily_snapshots",
  "web_push_subscriptions",
  "web_push_dispatches",
]);

function normalizeSql(sql: string) {
  return sql
    .replace(/--.*$/gm, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

async function readMigrations() {
  const filenames = (await readdir(migrationsDirectory))
    .filter((filename) => filename.endsWith(".sql"))
    .sort();

  assert.ok(filenames.length > 0, "Nenhuma migration SQL foi encontrada.");

  const migrations = new Map<string, string>();
  for (const filename of filenames) {
    const sql = await readFile(new URL(filename, migrationsDirectory), "utf8");
    migrations.set(filename, normalizeSql(sql));
  }

  return migrations;
}

const migrationsPromise = readMigrations();

function migration(migrations: Map<string, string>, filename: string) {
  const sql = migrations.get(filename);
  assert.ok(sql, `Migration obrigatória ausente: ${filename}`);
  return sql;
}

function assertIncludes(sql: string, fragments: string[]) {
  for (const fragment of fragments) {
    assert.ok(sql.includes(fragment), `Contrato SQL ausente: ${fragment}`);
  }
}

function assertNoAnonymousPolicy(sql: string) {
  assert.doesNotMatch(sql, /create\s+policy\s+[^;]+\s+to\s+anon\b/);
}

function assertNoClientGrantOnServerOnlyTables(sql: string) {
  const grantPattern = new RegExp(
    String.raw`grant\s+[^;]+?\s+on\s+(?:table\s+)?public\.([a-z0-9_]+)\s+to\s+([^;]+);`,
    "g",
  );

  for (const match of sql.matchAll(grantPattern)) {
    const table = match[1] ?? "";
    const roles = match[2] ?? "";

    if (!serverOnlyTables.has(table)) {
      continue;
    }

    assert.doesNotMatch(
      roles,
      /\b(?:public|anon|authenticated)\b/,
      `A tabela server-only ${table} concedeu privilégio a cliente: ${roles}`,
    );
  }
}

test("descobre e examina todas as migrations SQL versionadas", async () => {
  const migrations = await migrationsPromise;
  const allSql = [...migrations.values()].join(" ");

  assert.ok(migrations.size >= 7, "O inventário de migrations ficou incompleto.");
  assertNoAnonymousPolicy(allSql);
  assertNoClientGrantOnServerOnlyTables(allSql);
  assert.doesNotMatch(
    allSql,
    /alter\s+table\s+public\.[a-z0-9_]+\s+disable\s+row\s+level\s+security/,
  );
  assert.doesNotMatch(allSql, /grant\s+execute\s+on\s+function\s+[^;]+\s+to\s+anon\b/);
});

test("perfis e preferências isolam cada conta com RLS e auth.uid", async () => {
  const migrations = await migrationsPromise;
  const profiles = migration(
    migrations,
    "20260721091214_create_user_profiles.sql",
  );
  const secureProfileTrigger = migration(
    migrations,
    "20260721091245_secure_user_profile_trigger.sql",
  );
  const preferences = migration(
    migrations,
    "20260721170503_create_user_preferences.sql",
  );

  assertIncludes(profiles, [
    "references auth.users(id) on delete cascade",
    "alter table public.profiles enable row level security",
    "using ((select auth.uid()) = id)",
    "with check ((select auth.uid()) = id)",
    "revoke all on table public.profiles from anon",
    "security definer set search_path = ''",
  ]);

  assertIncludes(secureProfileTrigger, [
    "revoke execute on function public.handle_new_user_profile() from public",
    "revoke execute on function public.handle_new_user_profile() from anon",
    "revoke execute on function public.handle_new_user_profile() from authenticated",
    "grant execute on function public.handle_new_user_profile() to supabase_auth_admin",
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
});

test("snapshots e web push permanecem exclusivos do servidor", async () => {
  const migrations = await migrationsPromise;
  const snapshots = migration(
    migrations,
    "20260723070000_create_weather_daily_snapshots.sql",
  );
  const push = migration(
    migrations,
    "20260723113000_create_web_push_subscriptions.sql",
  );

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

  assertNoClientGrantOnServerOnlyTables(`${snapshots} ${push}`);
});

test("RPCs de conta exigem sessão e privilégios explícitos", async () => {
  const migrations = await migrationsPromise;
  const atomicPreferences = migration(
    migrations,
    "20260723105000_update_account_preferences_atomically.sql",
  );
  const lgpd = migration(
    migrations,
    "20260723133000_add_account_lgpd_rights.sql",
  );

  assertIncludes(atomicPreferences, [
    "security invoker set search_path = ''",
    "current_user_id uuid := (select auth.uid())",
    "if current_user_id is null then raise exception 'authentication required'",
    "revoke all on function public.update_account_preferences( text, text, text, boolean, boolean, boolean, boolean ) from public",
    "revoke all on function public.update_account_preferences( text, text, text, boolean, boolean, boolean, boolean ) from anon",
    "grant execute on function public.update_account_preferences( text, text, text, boolean, boolean, boolean, boolean ) to authenticated",
  ]);

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
});
