import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(
  "supabase/migrations/20260729060000_forecast_accuracy.sql",
  "utf8",
);
const richArchiveMigration = readFileSync(
  "supabase/migrations/20260822073500_archive_rich_open_meteo_forecast_runs.sql",
  "utf8",
);
const server = readFileSync("src/lib/weather/forecast-accuracy.server.ts", "utf8");
const openMeteoDaily = readFileSync("src/lib/weather/open-meteo-daily.server.ts", "utf8");
const openMeteoEdge = readFileSync(
  "supabase/functions/forecast-open-meteo-capture/index.ts",
  "utf8",
);
const functions = readFileSync("src/lib/weather/forecast-accuracy.functions.ts", "utf8");
const cronRoute = readFileSync("src/routes/api/cron/forecast-accuracy.ts", "utf8");
const panel = readFileSync("src/components/methodology/ForecastAccuracyPanel.tsx", "utf8");
const methodologyRoute = readFileSync("src/routes/metodologia.tsx", "utf8");
const weatherTypes = readFileSync("src/lib/weather/types.ts", "utf8");

test("arquiva previsões por provedor, ciclo, data alvo e antecedência", () => {
  assert.match(migration, /create table if not exists public\.weather_forecast_predictions/);
  assert.match(migration, /provider_key in \('open-meteo', 'met-norway'\)/);
  assert.match(migration, /cycle_hour in \(0, 6, 12, 18\)/);
  assert.match(
    migration,
    /unique \(location_slug, provider_key, issued_local_date, cycle_hour, target_date\)/,
  );
  assert.match(server, /fetchOpenMeteoDailyForecast\(\)/);
  assert.match(server, /fetchMetNorwayWeather\(\)/);
  assert.match(server, /FORECAST_CYCLE_HOURS = 6/);
  assert.match(
    server,
    /onConflict: "location_slug,provider_key,issued_local_date,cycle_hour,target_date"/,
  );
  assert.match(weatherTypes, /dateIso\?: string/);
});

test("Open-Meteo preserva previsão diária e um forecast run horário rico por ciclo", () => {
  assert.match(openMeteoDaily, /functions\/v1\/\$\{EDGE_FUNCTION_NAME\}/);
  assert.match(openMeteoDaily, /X-Collector-Token/);
  assert.match(openMeteoDaily, /readCapturedRows/);
  assert.doesNotMatch(openMeteoDaily, /api\.open-meteo\.com/);
  assert.match(openMeteoEdge, /api\.open-meteo\.com\/v1\/forecast/);
  assert.match(openMeteoEdge, /forecast_days: String\(FORECAST_DAYS\)/);
  assert.match(openMeteoEdge, /temperature_2m_max/);
  assert.match(openMeteoEdge, /precipitation_sum/);
  assert.match(openMeteoEdge, /boundary_layer_height/);
  assert.match(openMeteoEdge, /cloud_cover_low/);
  assert.match(openMeteoEdge, /wind_direction_10m/);
  assert.match(openMeteoEdge, /archiveRichForecastRun/);
  assert.match(openMeteoEdge, /first-complete-snapshot-per-6h-bucket/);
  assert.match(openMeteoEdge, /capture_status === "complete"/);
  assert.match(openMeteoEdge, /weather_forecast_hourly_points/);
  assert.match(openMeteoEdge, /onConflict: "run_id,valid_at"/);
  assert.match(openMeteoEdge, /MAX_ATTEMPTS = 2/);
  assert.match(
    openMeteoEdge,
    /onConflict: "location_slug,provider_key,issued_local_date,cycle_hour,target_date"/,
  );
});

test("arquivo rico separa run e pontos horários e permanece privado", () => {
  assert.match(richArchiveMigration, /create table if not exists public\.weather_forecast_runs/);
  assert.match(
    richArchiveMigration,
    /create table if not exists public\.weather_forecast_hourly_points/,
  );
  assert.match(
    richArchiveMigration,
    /unique \(location_slug, provider_key, captured_local_date, cycle_hour\)/,
  );
  assert.match(richArchiveMigration, /unique \(run_id, valid_at\)/);
  assert.match(richArchiveMigration, /captured_at.*não deve ser interpretado/s);
  assert.match(richArchiveMigration, /paid_access_allowed[\s\S]*false/);
  assert.match(richArchiveMigration, /retention_policy_status[\s\S]*pending_review/);
  assert.match(
    richArchiveMigration,
    /revoke all on table public\.weather_forecast_runs from public, anon, authenticated/,
  );
  assert.match(
    richArchiveMigration,
    /revoke all on table public\.weather_forecast_hourly_points from public, anon, authenticated/,
  );
});

test("verificação usa somente dia completo observado pela Embrapa", () => {
  assert.match(migration, /create table if not exists public\.weather_forecast_verifications/);
  assert.match(migration, /create or replace function public\.score_weather_forecasts/);
  assert.match(migration, /weather_station_observations/);
  assert.match(migration, /station_id = 'embrapa-cpact-sede-pelotas'/);
  assert.match(migration, /coverage_minutes, 0\) < 1080/);
  assert.match(migration, /observation\.sample_count < 60/);
  assert.match(migration, /mean_temperature_abs_error/);
  assert.match(migration, /rain_event_correct/);
  assert.doesNotMatch(server, /weather_daily_snapshots/);
});

test("captura e verificação são privadas e executadas por cron", () => {
  assert.match(migration, /create table if not exists public\.weather_forecast_accuracy_settings/);
  assert.match(
    migration,
    /revoke all on table public\.weather_forecast_predictions from anon, authenticated/,
  );
  assert.match(
    migration,
    /revoke execute on function public\.score_weather_forecasts\(date\) from public, anon, authenticated/,
  );
  assert.match(migration, /tempo-pelotas-forecast-capture/);
  assert.match(migration, /'5 3,9,15,21 \* \* \*'/);
  assert.match(migration, /tempo-pelotas-forecast-verification/);
  assert.match(migration, /'20 3 \* \* \*'/);
  assert.match(cronRoute, /authorizeForecastAccuracyRequest/);
  assert.match(cronRoute, /action === "capture"/);
  assert.match(cronRoute, /action === "verify"/);
  assert.match(cronRoute, /createFileRoute\("\/api\/cron\/forecast-accuracy"\)/);
  assert.match(openMeteoEdge, /constantTimeEqual/);
  assert.match(openMeteoEdge, /Não autorizado/);
});

test("resumo público separa provedor e antecedência sem expor credenciais", () => {
  assert.match(migration, /create or replace function public\.get_forecast_accuracy_summary/);
  assert.match(migration, /group by provider_key, lead_days/);
  assert.match(server, /get_forecast_accuracy_summary/);
  assert.match(functions, /max-age=300, stale-while-revalidate=600/);
  assert.match(panel, /id="precisao-das-previsoes"/);
  assert.match(panel, /Erro médio de temperatura/);
  assert.match(panel, /Acerto de ocorrência/);
  assert.match(panel, /Dias incompletos são descartados/);
  assert.doesNotMatch(panel, /collector_token|collectorToken|CRON_SECRET/);
  assert.match(methodologyRoute, /getForecastAccuracySummary\(\)/);
  assert.match(methodologyRoute, /<ForecastAccuracyPanel summary=\{data\.accuracy\} \/>/);
});
