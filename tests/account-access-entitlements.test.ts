import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { resolveAccountAccess } from "../src/lib/auth/account-access.ts";

const migration = readFileSync(
  "supabase/migrations/20260822043000_create_account_access.sql",
  "utf8",
);
const repairMigration = readFileSync(
  "supabase/migrations/20260822045500_repair_authenticated_account_foundation.sql",
  "utf8",
);
const accountFunctions = readFileSync("src/lib/auth/account.functions.ts", "utf8");

test("authenticated account defaults safely to Free", () => {
  const access = resolveAccountAccess(null);
  assert.equal(access.tier, "free");
  assert.equal(access.label, "Free");
  assert.equal(access.entitlements.panelAccess, true);
  assert.equal(access.entitlements.historyAccessDays, 60);
  assert.equal(access.entitlements.historyFull, false);
  assert.equal(access.entitlements.dataExport, false);
});

test("active PRO receives advanced entitlements without changing public data policy", () => {
  const access = resolveAccountAccess({ tier: "pro", status: "active", source: "admin" });
  assert.equal(access.tier, "pro");
  assert.equal(access.label, "PRO");
  assert.equal(access.entitlements.historyAccessDays, null);
  assert.equal(access.entitlements.historyFull, true);
  assert.equal(access.entitlements.stationCompare, true);
  assert.equal(access.entitlements.dataExport, true);
});

test("expired or suspended PRO fails closed to Free entitlements", () => {
  const suspended = resolveAccountAccess({ tier: "pro", status: "suspended" });
  assert.equal(suspended.tier, "free");
  assert.equal(suspended.entitlements.historyAccessDays, 60);

  const expired = resolveAccountAccess(
    { tier: "pro", status: "active", validUntil: "2026-08-01T00:00:00.000Z" },
    new Date("2026-08-22T00:00:00.000Z"),
  );
  assert.equal(expired.tier, "free");
  assert.equal(expired.status, "expired");
});

test("account_access is private, user-readable and automatically created as Free", () => {
  assert.match(migration, /create table if not exists public\.account_access/);
  assert.match(migration, /tier text not null default 'free'/);
  assert.match(migration, /alter table public\.account_access enable row level security/);
  assert.match(migration, /grant select on table public\.account_access to authenticated/);
  assert.match(migration, /using \(\(select auth\.uid\(\)\) = user_id\)/);
  assert.match(migration, /after insert on auth\.users/);
  assert.match(migration, /values \(new\.id, 'free', 'active', 'system'\)/);
  assert.match(migration, /select id, 'free', 'active', 'system'\s+from auth\.users/s);
  assert.doesNotMatch(migration, /grant (?:insert|update|delete).*authenticated/i);
});

test("authenticated self-repair can only recreate the account foundation as Free", () => {
  assert.match(repairMigration, /security definer/i);
  assert.match(repairMigration, /set search_path = ''/);
  assert.match(repairMigration, /v_user_id uuid := auth\.uid\(\)/);
  assert.match(repairMigration, /insert into public\.profiles/);
  assert.match(repairMigration, /insert into public\.user_preferences/);
  assert.match(repairMigration, /insert into public\.account_access/);
  assert.match(repairMigration, /values \(v_user_id, 'free', 'active', 'system'\)/);
  assert.match(repairMigration, /on conflict \(user_id\) do nothing/);
  assert.match(repairMigration, /revoke all on function public\.ensure_current_user_account_foundation\(\) from public, anon/);
  assert.match(repairMigration, /grant execute on function public\.ensure_current_user_account_foundation\(\) to authenticated/);
  assert.doesNotMatch(repairMigration, /values\s*\([^)]*'pro'/i);
  assert.doesNotMatch(repairMigration, /update\s+public\.account_access[\s\S]*tier\s*=/i);
});

test("backend resolves and repairs the authenticated account foundation", () => {
  assert.match(accountFunctions, /\.from\("account_access"\)/);
  assert.match(accountFunctions, /\.select\("tier,status,source,valid_until"\)/);
  assert.match(accountFunctions, /rpc\("ensure_current_user_account_foundation"\)/);
  assert.match(accountFunctions, /!profileResult\.data \|\| !preferencesResult\.data \|\| !accessResult\.data/);
  assert.match(accountFunctions, /profile &&\s*preferences &&\s*accountAccess/s);
  assert.match(accountFunctions, /resolveAccountAccess/);
  assert.match(accountFunctions, /Cache-Control", "private, no-store, max-age=0"/);
});
