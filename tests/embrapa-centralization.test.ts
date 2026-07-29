import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "supabase/migrations/20260729013000_centralize_embrapa_observations.sql",
  "utf8",
);
const centralStore = readFileSync("src/lib/weather/embrapa-central.server.ts", "utf8");
const officialSources = readFileSync("src/lib/weather/official-sources.server.ts", "utf8");
const sourceCollector = readFileSync("src/lib/weather/embrapa.server.ts", "utf8");
const cronRoute = readFileSync("src/routes/api/cron/embrapa.ts", "utf8");
const publicRoute = readFileSync("src/routes/api/weather/embrapa.ts", "utf8");
const minuteRefresh = readFileSync("src/components/weather/WeatherMinuteRefresh.tsx", "utf8");
const weatherFunction = readFileSync("src/lib/weather/weather-intelligence.functions.ts", "utf8");

test("centralizador persiste leitura atual, histórico deduplicado e agenda coleta por minuto", () => {
  assert.match(migration, /create table if not exists public\.weather_station_current/);
  assert.match(migration, /create table if not exists public\.weather_station_observations/);
  assert.match(migration, /unique \(station_id, source_hash\)/);
  assert.match(migration, /create table if not exists public\.weather_collector_settings/);
  assert.match(migration, /alter table public\.weather_station_current enable row level security/);
  assert.match(migration, /revoke all on table public\.weather_station_current from anon, authenticated/);
  assert.match(migration, /grant select, insert, update, delete on table public\.weather_station_current to service_role/);
  assert.match(migration, /create or replace function public\.claim_weather_station_refresh/);
  assert.match(migration, /create or replace function public\.invoke_embrapa_collector/);
  assert.match(migration, /tempo-pelotas-embrapa-every-minute/);
  assert.match(migration, /'\* \* \* \* \*'/);
});

test("agregador usa exclusivamente a leitura central e mantém coleta direta isolada", () => {
  assert.match(officialSources, /getCentralEmbrapaObservation/);
  assert.match(officialSources, /getCentralEmbrapaObservation\(\)/);
  assert.doesNotMatch(officialSources, /fetchEmbrapaObservation\(\)/);
  assert.match(centralStore, /import \{ fetchEmbrapaObservation \} from "\.\/embrapa\.server"/);
  assert.match(sourceCollector, /cache: "no-store"/);
});

test("centralizador controla concorrência, preserva última leitura e deduplica histórico", () => {
  assert.match(centralStore, /claim_weather_station_refresh/);
  assert.match(centralStore, /crypto\.randomUUID\(\)/);
  assert.match(centralStore, /createHash\("sha256"\)/);
  assert.match(centralStore, /onConflict: "station_id,source_hash"/);
  assert.match(centralStore, /fallback: "last-known"/);
  assert.match(centralStore, /CENTRAL_READING_MAX_AGE_MS = 75_000/);
});

test("rotas pública e de coleta leem a mesma fonte central", () => {
  assert.match(cronRoute, /authorizeEmbrapaCollectorRequest/);
  assert.match(cronRoute, /refreshCentralEmbrapaObservation/);
  assert.match(cronRoute, /createFileRoute\("\/api\/cron\/embrapa"\)/);
  assert.match(publicRoute, /getCentralEmbrapaObservation/);
  assert.match(publicRoute, /createFileRoute\("\/api\/weather\/embrapa"\)/);
  assert.match(publicRoute, /max-age=30, stale-while-revalidate=30/);
});

test("páginas meteorológicas revalidam o snapshot coerente a cada minuto", () => {
  assert.match(minuteRefresh, /REFRESH_INTERVAL_MS = 60_000/);
  assert.match(minuteRefresh, /await router\.invalidate\(\)/);
  assert.match(minuteRefresh, /document\.visibilityState !== "visible"/);
  assert.match(weatherFunction, /max-age=45, stale-while-revalidate=15/);
  assert.doesNotMatch(weatherFunction, /max-age=300/);
});
