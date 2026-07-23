import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";

const migrationsDirectory = new URL("../supabase/migrations/", import.meta.url);
const serverOnlyTables = new Set([
  "weather_daily_snapshots",
  "web_push_subscriptions",
  "web_push_dispatches",
]);
const accountTables = new Map([
  ["profiles", "id"],
  ["user_preferences", "user_id"],
  ["account_consent_events", "user_id"],
]);

function normalizeSql(sql: string) {
  return sql.replace(/--.*$/gm, " ").replace(/\s+/g, " ").trim().toLowerCase();
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

function statements(sql: string) {
  return sql
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function hasExpectedAccountGuard(statement: string, ownerColumn: string) {
  const compact = statement.replace(/\s+/g, "").replace(/\(selectauth\.uid\(\)\)/g, "auth.uid()");

  return (
    compact.includes(`auth.uid()=${ownerColumn}`) || compact.includes(`${ownerColumn}=auth.uid()`)
  );
}

function assertPoliciesRemainAccountScoped(sql: string) {
  for (const statement of statements(sql)) {
    if (!statement.startsWith("create policy ")) continue;

    const tableMatch = statement.match(
      /^create\s+policy\s+(?:"[^"]+"|[a-z0-9_]+)\s+on\s+(?:table\s+)?public\.([a-z0-9_]+)\b/,
    );
    assert.ok(tableMatch, `Policy sem tabela pública reconhecida: ${statement}`);

    const table = tableMatch[1] ?? "";
    assert.ok(
      !serverOnlyTables.has(table),
      `Tabela server-only não pode ter policy de cliente: ${table}`,
    );

    const ownerColumn = accountTables.get(table);
    if (!ownerColumn) continue;

    assert.match(
      statement,
      /\bto\s+authenticated\b/,
      `Policy de ${table} deve ser exclusiva de authenticated: ${statement}`,
    );
    assert.ok(
      hasExpectedAccountGuard(statement, ownerColumn),
      `Policy de ${table} não restringe o registro por auth.uid(): ${statement}`,
    );
    assert.doesNotMatch(
      statement,
      /\b(?:using|with\s+check)\s*\(\s*true\s*\)/,
      `Policy permissiva detectada em ${table}: ${statement}`,
    );
  }
}

function assertNoClientGrantOnServerOnlyTables(sql: string) {
  for (const statement of statements(sql)) {
    if (!statement.startsWith("grant ")) continue;

    const roles = statement.match(/\bto\s+(.+)$/)?.[1] ?? "";
    if (!/\b(?:public|anon|authenticated)\b/.test(roles)) continue;

    assert.doesNotMatch(
      statement,
      /\bon\s+all\s+tables\s+in\s+schema\s+public\b/,
      `Grant de schema expõe tabelas server-only: ${statement}`,
    );

    const targetClause = statement.match(/^grant\s+.+?\s+on\s+(?:table\s+)?(.+?)\s+to\s+/)?.[1];
    if (!targetClause || /^(?:function|sequence|schema)\b/.test(targetClause)) continue;

    const exposedTables = targetClause
      .split(",")
      .map((target) =>
        target
          .trim()
          .replace(/^public\./, "")
          .replaceAll('"', ""),
      )
      .filter((table) => serverOnlyTables.has(table));

    assert.deepEqual(exposedTables, [], `Grant de cliente expõe tabelas server-only: ${statement}`);
  }
}

function collectFunctionDefinitions(migrations: Map<string, string>, functionName: string) {
  const definitions: Array<{ filename: string; definition: string }> = [];
  const needle = `create or replace function public.${functionName}`;

  for (const [filename, sql] of migrations) {
    let start = sql.indexOf(needle);

    while (start >= 0) {
      const remainder = sql.slice(start);
      const delimiterMatch = remainder.match(/\bas\s+(\$[a-z0-9_]*\$)/);
      assert.ok(delimiterMatch, `Delimitador da função ${functionName} ausente em ${filename}`);

      const delimiter = delimiterMatch[1];
      assert.ok(delimiter);
      const opening =
        start + (delimiterMatch.index ?? 0) + delimiterMatch[0].lastIndexOf(delimiter);
      const closing = sql.indexOf(delimiter, opening + delimiter.length);
      assert.ok(closing >= 0, `Corpo da função ${functionName} incompleto em ${filename}`);

      definitions.push({
        filename,
        definition: sql.slice(start, closing + delimiter.length),
      });
      start = sql.indexOf(needle, closing + delimiter.length);
    }
  }

  return definitions;
}

function assertFunctionIsNotPublic(sql: string, functionName: string) {
  const grantPattern = new RegExp(
    String.raw`grant\s+execute\s+on\s+function\s+public\.${functionName}\s*\([^;]*\)\s+to\s+([^;]+);`,
    "g",
  );

  for (const match of sql.matchAll(grantPattern)) {
    const roles = match[1] ?? "";
    assert.doesNotMatch(
      roles,
      /\b(?:public|anon)\b/,
      `A função ${functionName} foi exposta a ${roles}`,
    );
  }
}

test("descobre e examina todas as migrations SQL versionadas", async () => {
  const migrations = await migrationsPromise;
  const allSql = [...migrations.values()].join(" ");

  assert.ok(migrations.size >= 7, "O inventário de migrations ficou incompleto.");
  assertPoliciesRemainAccountScoped(allSql);
  assertNoClientGrantOnServerOnlyTables(allSql);
  assert.doesNotMatch(
    allSql,
    /alter\s+table\s+public\.[a-z0-9_]+\s+disable\s+row\s+level\s+security/,
  );
  assertFunctionIsNotPublic(allSql, "update_account_preferences");
});

test("perfis e preferências isolam cada conta com RLS e auth.uid", async () => {
  const migrations = await migrationsPromise;
  const profiles = migration(migrations, "20260721091214_create_user_profiles.sql");
  const secureProfileTrigger = migration(
    migrations,
    "20260721091245_secure_user_profile_trigger.sql",
  );
  const preferences = migration(migrations, "20260721170503_create_user_preferences.sql");

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
  const snapshots = migration(migrations, "20260723070000_create_weather_daily_snapshots.sql");
  const push = migration(migrations, "20260723113000_create_web_push_subscriptions.sql");

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

test("a definição efetiva da RPC de conta exige sessão e search_path seguro", async () => {
  const migrations = await migrationsPromise;
  const allSql = [...migrations.values()].join(" ");
  const definitions = collectFunctionDefinitions(migrations, "update_account_preferences");
  const latest = definitions.at(-1);

  assert.ok(latest, "A função update_account_preferences não foi versionada.");
  assertIncludes(latest.definition, [
    "security definer",
    "set search_path = ''",
    "current_user_id uuid := (select auth.uid())",
    "if current_user_id is null then raise exception 'authentication required'",
  ]);
  assert.match(
    allSql,
    /grant\s+execute\s+on\s+function\s+public\.update_account_preferences\s*\([^;]*\)\s+to\s+authenticated;/,
  );
  assertFunctionIsNotPublic(allSql, "update_account_preferences");
});
