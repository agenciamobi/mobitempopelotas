import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const accountArchitecture = readFileSync("docs/ACCOUNT_AND_PRO_ARCHITECTURE.md", "utf8");
const migration = readFileSync(
  "supabase/migrations/20260822025000_create_historical_data_layer.sql",
  "utf8",
);
const archiveServer = readFileSync("src/lib/history/historical-archive.server.ts", "utf8");
const snapshotRoute = readFileSync("src/routes/api/cron/weather-snapshot.ts", "utf8");

test("account architecture preserves public access and defines free 60-day history plus PRO", () => {
  assert.match(accountArchitecture, /portal público atual permanece público/i);
  assert.match(accountArchitecture, /histórico de dados de até \*\*60 dias\*\*/i);
  assert.match(accountArchitecture, /radares completos/i);
  assert.match(accountArchitecture, /satélites completos/i);
  assert.match(accountArchitecture, /entitlements/i);
});

test("historical schema separates source governance, stations and temporal measurements", () => {
  assert.match(migration, /create table if not exists public\.historical_data_sources/);
  assert.match(migration, /create table if not exists public\.historical_stations/);
  assert.match(migration, /create table if not exists public\.historical_measurements/);
  assert.match(migration, /data_class in \('observation', 'forecast', 'reanalysis', 'derived'\)/);
  assert.match(migration, /paid_access_allowed boolean not null default false/);
  assert.match(migration, /retention_policy_status text not null default 'pending_review'/);
  assert.match(migration, /enable row level security/);
});

test("existing Embrapa observations are mirrored and backfilled into the canonical history", () => {
  assert.match(migration, /mirror_weather_station_observation_to_history/);
  assert.match(migration, /after insert on public\.weather_station_observations/);
  assert.match(migration, /from public\.weather_station_observations observation/);
  assert.match(migration, /'temperature'/);
  assert.match(migration, /'rain_daily'/);
  assert.match(migration, /'wind_direction'/);
});

test("environmental archive captures water-level sources without depending on page visits", () => {
  assert.match(archiveServer, /fetchLaranjalLevelData/);
  assert.match(archiveServer, /fetchLagoonMonitoringNetwork/);
  assert.match(archiveServer, /fetchGuaibaObservation/);
  assert.match(archiveServer, /variable_key:\s*"water_level"/);
  assert.match(archiveServer, /ignoreDuplicates:\s*true/);
  assert.match(migration, /tempo-pelotas-historical-environmental-5min/);
  assert.match(migration, /'\*\/5 \* \* \* \*'/);
  assert.match(migration, /environmental-backfill/);
});

test("historical cron gateway accepts explicit archive actions and keeps legacy weather backfill", () => {
  assert.match(snapshotRoute, /authorizeHistoricalArchiveRequest/);
  assert.match(snapshotRoute, /"environmental-capture"/);
  assert.match(snapshotRoute, /"environmental-backfill"/);
  assert.match(snapshotRoute, /"weather-daily"/);
  assert.match(snapshotRoute, /"weather-backfill"/);
  assert.match(snapshotRoute, /Compatibilidade com o POST histórico/);
});
