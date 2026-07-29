import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getObservationAgeMinutes } from "../src/lib/weather/current-observation.ts";
import type { EmbrapaObservation } from "../src/lib/weather/official-sources.types.ts";

const migration = readFileSync(
  "supabase/migrations/20260729013000_centralize_embrapa_observations.sql",
  "utf8",
);
const healthSchemaMigration = readFileSync(
  "supabase/migrations/20260729030000_weather_data_health.sql",
  "utf8",
);
const healthLogicMigration = readFileSync(
  "supabase/migrations/20260729031500_weather_data_health_logic.sql",
  "utf8",
);
const healthDurationFixMigration = readFileSync(
  "supabase/migrations/20260729033000_fix_weather_failure_duration.sql",
  "utf8",
);
const centralStore = readFileSync("src/lib/weather/embrapa-central.server.ts", "utf8");
const healthServer = readFileSync("src/lib/weather/embrapa-health.server.ts", "utf8");
const healthFunction = readFileSync("src/lib/weather/embrapa-health.functions.ts", "utf8");
const historyServer = readFileSync("src/lib/weather/embrapa-history.server.ts", "utf8");
const historyFunction = readFileSync("src/lib/weather/embrapa-history.functions.ts", "utf8");
const healthPanel = readFileSync("src/components/embrapa/EmbrapaDataHealthPanel.tsx", "utf8");
const historyCharts = readFileSync("src/components/embrapa/EmbrapaHistoryCharts.tsx", "utf8");
const stationRoute = readFileSync("src/routes/estacao-embrapa-pelotas.tsx", "utf8");
const officialSources = readFileSync("src/lib/weather/official-sources.server.ts", "utf8");
const sourceCollector = readFileSync("src/lib/weather/embrapa.server.ts", "utf8");
const cronRoute = readFileSync("src/routes/api/cron/embrapa.ts", "utf8");
const publicRoute = readFileSync("src/routes/api/weather/embrapa.ts", "utf8");
const minuteRefresh = readFileSync("src/components/weather/WeatherMinuteRefresh.tsx", "utf8");
const weatherFunction = readFileSync("src/lib/weather/weather-intelligence.functions.ts", "utf8");

function observationWithoutPublishedTime(fetchedAt: string): EmbrapaObservation {
  return {
    status: "live",
    current: {
      temperature: 18,
      humidity: 80,
      feelsLike: 18,
      dewPoint: 14,
      pressure: 1015,
      pressureTrend: "estável",
      windDirection: "SE",
      windSpeed: 8,
      sunrise: "07:10",
      sunset: "17:50",
    },
    extremes: {
      temperatureMin: { value: 12, time: "06:00" },
      temperatureMax: { value: 19, time: "14:00" },
      humidityMin: { value: 70, time: "14:00" },
      humidityMax: { value: 95, time: "06:00" },
      windSpeedMax: { value: 20, time: "13:00" },
    },
    accumulated: { rainDaily: 0, rainMonthly: 40, rainAnnual: 500 },
    source: {
      name: "Embrapa Clima Temperado",
      station: "Posto Meteorológico da Sede",
      url: "https://agromet.cpact.embrapa.br/online/Current_Monitor.htm",
      latitude: -31.7,
      longitude: -52.4,
      altitude: 57,
      fetchedAt,
      observationTime: null,
    },
    error: null,
  };
}

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

test("última leitura sem horário publicado envelhece pelo fetchedAt", () => {
  const now = new Date("2026-07-29T03:00:00.000Z");
  const observation = observationWithoutPublishedTime("2026-07-29T02:20:00.000Z");
  assert.equal(getObservationAgeMinutes(observation, now), 40);
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

test("saúde operacional registra métricas e mantém incidentes privados", () => {
  assert.match(healthSchemaMigration, /add column if not exists consecutive_failures/);
  assert.match(healthSchemaMigration, /add column if not exists last_duration_ms/);
  assert.match(healthSchemaMigration, /add column if not exists successful_collects/);
  assert.match(healthSchemaMigration, /create table if not exists public\.weather_data_alerts/);
  assert.match(healthSchemaMigration, /alter table public\.weather_data_alerts enable row level security/);
  assert.match(healthSchemaMigration, /revoke all on table public\.weather_data_alerts from anon, authenticated/);
  assert.match(healthSchemaMigration, /create policy "weather alerts private"/);
});

test("coletor abre e resolve alertas por falha, atraso, lentidão e leitura incompleta", () => {
  assert.match(healthLogicMigration, /create or replace function public\.track_weather_station_health/);
  assert.match(healthLogicMigration, /new\.consecutive_failures := old\.consecutive_failures \+ 1/);
  assert.match(healthLogicMigration, /new\.last_duration_ms := duration_ms/);
  assert.match(healthLogicMigration, /'consecutive-failures'/);
  assert.match(healthLogicMigration, /new\.consecutive_failures >= 3/);
  assert.match(healthLogicMigration, /'stale-reading'/);
  assert.match(healthLogicMigration, /success_age_minutes > 5/);
  assert.match(healthLogicMigration, /'slow-response'/);
  assert.match(healthLogicMigration, /new\.last_duration_ms > 15000/);
  assert.match(healthLogicMigration, /'incomplete-reading'/);
});

test("duração usa o fim da tentativa correspondente em sucesso e falha", () => {
  assert.match(healthDurationFixMigration, /succeeded := new\.last_success_at is distinct from old\.last_success_at/);
  assert.match(healthDurationFixMigration, /failed := new\.error is not null/);
  assert.match(healthDurationFixMigration, /finished_at := coalesce\(new\.last_success_at, now\(\)\)/);
  assert.match(healthDurationFixMigration, /finished_at := coalesce\(new\.last_attempt_at, now\(\)\)/);
  assert.match(healthDurationFixMigration, /new\.last_duration_ms := duration_ms/);
});

test("snapshot de saúde é sanitizado e acessível apenas pelo backend", () => {
  assert.match(healthLogicMigration, /create or replace function public\.get_embrapa_health_snapshot/);
  assert.match(healthLogicMigration, /revoke execute on function public\.get_embrapa_health_snapshot\(\) from public, anon, authenticated/);
  assert.match(healthLogicMigration, /grant execute on function public\.get_embrapa_health_snapshot\(\) to service_role/);
  assert.match(healthServer, /get_embrapa_health_snapshot/);
  assert.match(healthServer, /isAdminConfigured/);
  assert.doesNotMatch(healthPanel, /collector_token|refresh_lease_token|error:/);
  assert.match(healthFunction, /max-age=15, stale-while-revalidate=45/);
});

test("histórico de 24 horas usa apenas observações centrais e limita o volume enviado", () => {
  assert.match(historyServer, /HISTORY_WINDOW_HOURS = 24/);
  assert.match(historyServer, /BUCKET_MINUTES = 10/);
  assert.match(historyServer, /MAX_QUERY_ROWS = 2_000/);
  assert.match(historyServer, /from\("weather_station_observations"\)/);
  assert.match(historyServer, /\.eq\("station_id", EMBRAPA_STATION_ID\)/);
  assert.match(historyServer, /\.gte\("fetched_at", from\)/);
  assert.match(historyServer, /Math\.floor\(timestamp \/ BUCKET_MS\) \* BUCKET_MS/);
  assert.doesNotMatch(historyServer, /fetchEmbrapaObservation/);
  assert.match(historyFunction, /max-age=45, stale-while-revalidate=15/);
});

test("chuva histórica é derivada por incremento e trata reinício do acumulado diário", () => {
  assert.match(historyServer, /rainDaily >= previousRainDaily \? rainDaily - previousRainDaily : rainDaily/);
  assert.match(historyServer, /bucket\.rainIncrement \+= Math\.max\(0, increment\)/);
  assert.match(historyServer, /rainTotal: rainValues\.length/);
});

test("página da estação carrega medições, gráficos e saúde no mesmo ciclo", () => {
  assert.match(stationRoute, /Promise\.all/);
  assert.match(stationRoute, /getWeatherIntelligence\(\)/);
  assert.match(stationRoute, /getEmbrapaHealthSnapshot\(\)/);
  assert.match(stationRoute, /getEmbrapaHistory24h\(\)/);
  assert.match(stationRoute, /<EmbrapaHistoryCharts snapshot=\{history\} \/>/);
  assert.match(stationRoute, /<EmbrapaDataHealthPanel snapshot=\{health\} \/>/);
  assert.match(historyCharts, /id="historico-24-horas"/);
  assert.match(historyCharts, /Temperatura e sensação térmica/);
  assert.match(historyCharts, /Umidade relativa/);
  assert.match(historyCharts, /Pressão atmosférica/);
  assert.match(historyCharts, /Velocidade do vento/);
  assert.match(historyCharts, /Chuva por intervalo/);
  assert.match(historyCharts, /ResponsiveContainer/);
  assert.match(healthPanel, /id="saude-dos-dados"/);
  assert.match(healthPanel, /Incidentes automáticos/);
});
