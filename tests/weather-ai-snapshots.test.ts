import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  GEMINI_WEATHER_DEFAULT_MODEL,
  resolveGeminiWeatherModel,
} from "../src/lib/weather/gemini-weather.server.ts";

function read(relativePath: string) {
  return readFileSync(path.resolve(relativePath), "utf8");
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const absolute = path.join(directory, entry);
    if (statSync(absolute).isDirectory()) return sourceFiles(absolute);
    return /\.(?:ts|tsx)$/.test(entry) ? [absolute] : [];
  });
}

test("requisições públicas não chamam Gemini diretamente", () => {
  const intelligence = read("src/lib/weather/weather-intelligence.server.ts");
  assert.doesNotMatch(intelligence, /generateGeminiWeatherBrief/);
  assert.doesNotMatch(intelligence, /gemini-weather\.server/);
  assert.match(intelligence, /fetchLatestWeatherAiSnapshot/);
  assert.match(intelligence, /computeWeatherAiFingerprint/);
  assert.match(intelligence, /aiSnapshot\?\.sourceFingerprint === currentFingerprint/);
});

test("Gemini fica isolado no gerador persistente do código ativo", () => {
  const files = sourceFiles(path.resolve("src"));
  const imports = files.filter((file) => {
    if (file.endsWith("gemini-weather.server.ts")) return false;
    return readFileSync(file, "utf8").includes("gemini-weather.server");
  });

  assert.deepEqual(
    imports.map((file) => path.relative(process.cwd(), file).replaceAll("\\", "/")),
    ["src/lib/weather/weather-ai-snapshot.server.ts"],
  );

  const snapshot = read("src/lib/weather/weather-ai-snapshot.server.ts");
  assert.match(snapshot, /generateGeminiWeatherBrief/);
  assert.match(snapshot, /resolution=ignore-duplicates/);
  assert.match(snapshot, /computeWeatherAiFingerprint/);
  assert.match(snapshot, /source_fingerprint/);
  assert.match(snapshot, /reusableSnapshot/);
  assert.match(snapshot, /status: "reused"/);
  assert.match(snapshot, /SNAPSHOT_MAX_AGE_MS = 8 \* 60 \* 60 \* 1_000/);
});

test("modelo Gemini inválido não substitui o modelo estável do Weather AI", () => {
  assert.equal(GEMINI_WEATHER_DEFAULT_MODEL, "gemini-3.5-flash-lite");
  assert.equal(resolveGeminiWeatherModel(undefined), GEMINI_WEATHER_DEFAULT_MODEL);
  assert.equal(resolveGeminiWeatherModel(""), GEMINI_WEATHER_DEFAULT_MODEL);
  assert.equal(resolveGeminiWeatherModel("gemini-3.5-flas"), GEMINI_WEATHER_DEFAULT_MODEL);
  assert.equal(
    resolveGeminiWeatherModel("gemini-3.5-flash-lite"),
    GEMINI_WEATHER_DEFAULT_MODEL,
  );

  const gemini = read("src/lib/weather/gemini-weather.server.ts");
  assert.match(gemini, /REQUEST_TIMEOUT_MS = 15_000/);
  assert.doesNotMatch(gemini, /temperature\s*:/);
});

test("workflow agenda 23h, 05h, 11h e 17h em Brasília com OIDC", () => {
  const workflow = read(".github/workflows/weather-ai-snapshots.yml");
  assert.match(workflow, /0 2,8,14,20 \* \* \*/);
  assert.match(workflow, /23:00, 05:00, 11:00 e 17:00/);
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /ACTIONS_ID_TOKEN_REQUEST_URL/);
  assert.match(workflow, /tempo-pelotas-weather-ai/);
  assert.doesNotMatch(workflow, /TEMPO_PELOTAS_CRON_SECRET/);
  assert.match(workflow, /https:\/\/tempopelotas\.com\.br\/api\/cron\/push-daily\?task=weather-ai/);
  assert.doesNotMatch(workflow, /lovable\.app/);
});

test("banco impede duplicidade por período e indexa fingerprint material", () => {
  const migration = read("supabase/migrations/20260802170000_create_weather_ai_snapshots.sql");
  assert.match(migration, /slot_key text primary key/);
  assert.match(migration, /source_fingerprint text/);
  assert.match(migration, /reused_from_slot text/);
  assert.match(migration, /weather_ai_snapshots_fingerprint_idx/);
  assert.match(migration, /overnight\|morning\|afternoon\|evening/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /grant select, insert, update, delete.*service_role/s);
  assert.match(migration, /revoke all.*anon/s);
  assert.match(migration, /revoke all.*authenticated/s);
});

test("teto mensal é atômico, auditável e falha fechado", () => {
  const migration = read("supabase/migrations/20260813023000_add_weather_ai_monthly_budget.sql");
  const budget = read("src/lib/weather/weather-ai-budget.server.ts");
  const snapshot = read("src/lib/weather/weather-ai-snapshot.server.ts");
  const route = read("src/routes/api/cron/push-daily.ts");
  const env = read(".env.example");

  assert.match(migration, /create table if not exists public\.weather_ai_monthly_usage/);
  assert.match(migration, /create table if not exists public\.weather_ai_calls/);
  assert.match(migration, /claim_weather_ai_monthly_call/);
  assert.match(migration, /weather_ai_monthly_usage\.calls \+ 1/);
  assert.match(migration, /weather_ai_monthly_usage\.calls < p_call_limit/);
  assert.match(migration, /insert into public\.weather_ai_calls/);
  assert.match(migration, /security definer/);
  assert.match(migration, /revoke all on function.*anon/s);
  assert.match(migration, /grant execute on function.*service_role/s);

  assert.match(budget, /DEFAULT_MONTHLY_CALL_LIMIT = 150/);
  assert.match(budget, /GEMINI_WEATHER_MONTHLY_CALL_LIMIT/);
  assert.match(budget, /rest\/v1\/rpc\/\$\{BUDGET_RPC\}/);
  assert.match(budget, /throw new Error\(`Contador mensal da IA respondeu com HTTP/);
  assert.match(budget, /completeWeatherAiCall/);

  const reuseIndex = snapshot.indexOf("if (reusableSnapshot)");
  const budgetIndex = snapshot.indexOf("budget = await claimWeatherAiMonthlyBudget");
  const geminiIndex = snapshot.indexOf("const gemini = await generateGeminiWeatherBrief");
  assert.ok(reuseIndex >= 0 && budgetIndex > reuseIndex);
  assert.ok(geminiIndex > budgetIndex);
  assert.match(snapshot, /status: "budget-blocked"/);
  assert.match(snapshot, /Proteção financeira da IA indisponível; chamada bloqueada/);
  assert.match(route, /reason: "monthly-ai-budget"/);
  assert.match(route, /aiCalled: false/);
  assert.match(env, /GEMINI_WEATHER_MONTHLY_CALL_LIMIT=150/);
});

test("endpoint compartilhado separa IA e push e informa quando não houve chamada", () => {
  const route = read("src/routes/api/cron/push-daily.ts");
  assert.match(route, /process\.env\.CRON_SECRET/);
  assert.match(route, /verifyWeatherAiGithubActionsRequest/);
  assert.match(route, /generateScheduledWeatherAiSnapshot/);
  assert.match(route, /result\.status === "generated" \|\| result\.status === "reused"/);
  assert.match(route, /aiCalled: result\.status === "generated"/);
  assert.match(route, /searchParams\.get\("task"\) === "weather-ai"/);
  assert.match(route, /sendDailySummary/);
});

test("refresh, feed, JSON e push não possuem caminho direto até Gemini", () => {
  for (const file of [
    "src/components/weather/WeatherMinuteRefresh.tsx",
    "src/routes/feed.ts",
    "src/routes/pelotas[.]json.ts",
    "src/routes/api/cron/push-daily.ts",
  ]) {
    const source = read(file);
    assert.doesNotMatch(source, /generateGeminiWeatherBrief/);
    assert.doesNotMatch(source, /gemini-weather\.server/);
  }
});

test("código ativo não importa o snapshot histórico de _legacy", () => {
  for (const file of sourceFiles(path.resolve("src"))) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /(?:from|import\()\s*["'][^"']*_legacy\//);
  }
});
