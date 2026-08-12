import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

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

test("workflow agenda 23h, 05h, 11h e 17h em Brasília", () => {
  const workflow = read(".github/workflows/weather-ai-snapshots.yml");
  assert.match(workflow, /0 2,8,14,20 \* \* \*/);
  assert.match(workflow, /23:00, 05:00, 11:00 e 17:00/);
  assert.match(workflow, /TEMPO_PELOTAS_CRON_SECRET/);
  assert.match(workflow, /https:\/\/tempopelotas\.com\.br\/api\/cron\/push-daily\?task=weather-ai/);
  assert.doesNotMatch(workflow, /lovable\.app/);
  assert.doesNotMatch(workflow, /--retry\s+[1-9]/);
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

test("endpoint compartilhado separa IA e push e informa quando não houve chamada", () => {
  const route = read("src/routes/api/cron/push-daily.ts");
  assert.match(route, /process\.env\.CRON_SECRET/);
  assert.match(route, /hasBearerSecret/);
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
