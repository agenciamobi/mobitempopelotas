import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "supabase/migrations/20260729071500_create_open_meteo_payload_cache.sql",
  "utf8",
);
const edgeFunction = readFileSync("supabase/functions/open-meteo-forecast/index.ts", "utf8");
const edgeClient = readFileSync("src/lib/weather/open-meteo-edge.server.ts", "utf8");
const resilient = readFileSync("src/lib/weather/open-meteo-resilient.server.ts", "utf8");
const baseline = readFileSync("src/lib/weather/weather-baseline.server.ts", "utf8");
const publicFunction = readFileSync("src/lib/weather/weather.functions.ts", "utf8");


test("cache completo do Open-Meteo é privado e controla concorrência", () => {
  assert.match(migration, /create table if not exists public\.weather_provider_payload_cache/);
  assert.match(migration, /payload jsonb not null default '\{\}'::jsonb/);
  assert.match(migration, /alter table public\.weather_provider_payload_cache enable row level security/);
  assert.match(migration, /for all to service_role/);
  assert.match(
    migration,
    /revoke all on table public\.weather_provider_payload_cache from public, anon, authenticated/,
  );
  assert.match(migration, /create or replace function public\.claim_weather_provider_refresh/);
  assert.match(migration, /refresh_lease_token = p_lease_token/);
  assert.match(migration, /last_success_at < now\(\) - make_interval/);
  assert.match(
    migration,
    /grant execute on function public\.claim_weather_provider_refresh\(text, uuid, integer, integer\) to service_role/,
  );
});


test("Edge Function exige token e preserva último payload válido", () => {
  assert.match(edgeFunction, /constantTimeEqual/);
  assert.match(edgeFunction, /x-collector-token/);
  assert.match(edgeFunction, /weather_forecast_accuracy_settings/);
  assert.match(edgeFunction, /claim_weather_provider_refresh/);
  assert.match(edgeFunction, /cacheStatus: "fresh"/);
  assert.match(edgeFunction, /cacheStatus:[\s\S]*\? "shared"[\s\S]*: "stale"/);
  assert.match(edgeFunction, /cacheStatus: "stale"/);
  assert.match(edgeFunction, /cacheStatus: "refreshed"/);
  assert.match(edgeFunction, /hasForecastPayload\(cached\.payload\)/);
  assert.match(edgeFunction, /status: cached && hasForecastPayload\(cached\.payload\) \? "stale" : "unavailable"/);
  assert.match(edgeFunction, /forecast_days: "7"/);
  assert.match(edgeFunction, /precipitation_probability/);
  assert.match(edgeFunction, /wind_gusts_10m/);
  assert.doesNotMatch(edgeFunction, /Access-Control-Allow-Origin/);
});


test("cliente server-only chama a Edge Function sem expor o token", () => {
  assert.match(edgeClient, /createSupabaseAdminClient/);
  assert.match(edgeClient, /weather_forecast_accuracy_settings/);
  assert.match(edgeClient, /\/functions\/v1\/\$\{EDGE_FUNCTION_NAME\}/);
  assert.match(edgeClient, /"X-Collector-Token": settings\.collector_token/);
  assert.match(edgeClient, /AbortSignal\.timeout/);
  assert.doesNotMatch(edgeClient, /VITE_/);
  assert.doesNotMatch(edgeClient, /export const collectorToken/);
});


test("agregação usa Edge Function e mantém consulta direta apenas como contingência", () => {
  assert.match(resilient, /fetchOpenMeteoPayloadViaEdge/);
  assert.match(resilient, /normalizeOpenMeteoWeather/);
  assert.match(resilient, /return fetchOpenMeteoDirect\(\)/);
  assert.match(resilient, /edge\.cacheStatus === "stale"/);
  assert.match(
    baseline,
    /from "\.\/open-meteo-resilient\.server"/,
  );
  assert.doesNotMatch(baseline, /from "\.\/open-meteo\.server"/);
  assert.match(publicFunction, /from "\.\/open-meteo-resilient\.server"/);
});