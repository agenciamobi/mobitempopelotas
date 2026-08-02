import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

function read(relativePath: string) {
  return readFileSync(path.resolve(relativePath), "utf8");
}

test("requisições públicas não chamam Gemini diretamente", () => {
  const intelligence = read("src/lib/weather/weather-intelligence.server.ts");
  assert.doesNotMatch(intelligence, /generateGeminiWeatherBrief/);
  assert.doesNotMatch(intelligence, /gemini-weather\.server/);
  assert.match(intelligence, /fetchLatestWeatherAiSnapshot/);
});

test("Gemini fica isolado no gerador persistente", () => {
  const snapshot = read("src/lib/weather/weather-ai-snapshot.server.ts");
  assert.match(snapshot, /generateGeminiWeatherBrief/);
  assert.match(snapshot, /resolution=ignore-duplicates/);
  assert.match(snapshot, /slot_key/);
  assert.match(snapshot, /SNAPSHOT_MAX_AGE_MS = 8 \* 60 \* 60 \* 1_000/);
});

test("workflow agenda quatro janelas diárias em Brasília", () => {
  const workflow = read(".github/workflows/weather-ai-snapshots.yml");
  assert.match(workflow, /15 3,9,15,21 \* \* \*/);
  assert.match(workflow, /TEMPO_PELOTAS_CRON_SECRET/);
  assert.match(workflow, /\/api\/cron\/weather-ai/);
  assert.doesNotMatch(workflow, /--retry\s+[1-9]/);
});

test("banco impede mais de uma tentativa por período", () => {
  const migration = read("supabase/migrations/20260802170000_create_weather_ai_snapshots.sql");
  assert.match(migration, /slot_key text primary key/);
  assert.match(migration, /overnight\|morning\|afternoon\|evening/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /grant select, insert, update, delete.*service_role/s);
  assert.match(migration, /revoke all.*anon/s);
  assert.match(migration, /revoke all.*authenticated/s);
});

test("endpoint de geração exige CRON_SECRET", () => {
  const route = read("src/routes/api/cron/weather-ai.ts");
  assert.match(route, /process\.env\.CRON_SECRET/);
  assert.match(route, /hasBearerSecret/);
  assert.match(route, /generateScheduledWeatherAiSnapshot/);
});
