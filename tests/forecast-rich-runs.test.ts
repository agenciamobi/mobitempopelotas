import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const richOpenMeteoMigration = readFileSync(
  "supabase/migrations/20260822073500_archive_rich_open_meteo_forecast_runs.sql",
  "utf8",
);
const metNorwayMigration = readFileSync(
  "supabase/migrations/20260822144000_archive_rich_met_norway_forecast_runs.sql",
  "utf8",
);
const openMeteoCollector = readFileSync(
  "supabase/functions/forecast-open-meteo-capture/index.ts",
  "utf8",
);
const metNorwayCollector = readFileSync(
  "supabase/functions/forecast-met-norway-capture/index.ts",
  "utf8",
);

test("forecast runs ricos permanecem privados, idempotentes e separados por provedor", () => {
  assert.match(richOpenMeteoMigration, /create table if not exists public\.weather_forecast_runs/);
  assert.match(richOpenMeteoMigration, /create table if not exists public\.weather_forecast_hourly_points/);
  assert.match(
    richOpenMeteoMigration,
    /unique \(location_slug, provider_key, captured_local_date, cycle_hour\)/,
  );
  assert.match(
    richOpenMeteoMigration,
    /revoke all on table public\.weather_forecast_runs from public, anon, authenticated/,
  );
  assert.match(openMeteoCollector, /provider_key: "open-meteo"/);
  assert.match(metNorwayCollector, /const PROVIDER_KEY = "met-norway"/);
  assert.match(metNorwayCollector, /capturePolicy: "first-complete-snapshot-per-6h-bucket"/);
  assert.match(metNorwayCollector, /capture_status === "complete"/);
});

test("MET Norway usa o mesmo arquivo rico sem confundir precipitação de 6h ou 12h com volume horário", () => {
  assert.match(metNorwayMigration, /'met-norway-forecast'/);
  assert.match(metNorwayMigration, /'forecast-met-norway'/);
  assert.match(metNorwayMigration, /tempo-pelotas-met-norway-rich-forecast/);
  assert.match(metNorwayMigration, /'7 3,9,15,21 \* \* \*'/);
  assert.match(metNorwayCollector, /data\.next_1_hours/);
  assert.match(metNorwayCollector, /precipitationStoredOnlyWhenNext1HoursAvailable: true/);
  assert.doesNotMatch(metNorwayCollector, /next_6_hours/);
  assert.doesNotMatch(metNorwayCollector, /next_12_hours/);
});

test("MET Norway normaliza unidades comparáveis antes de persistir", () => {
  assert.match(metNorwayCollector, /metersPerSecondToKilometersPerHour/);
  assert.match(metNorwayCollector, /air_temperature/);
  assert.match(metNorwayCollector, /relative_humidity/);
  assert.match(metNorwayCollector, /dew_point_temperature/);
  assert.match(metNorwayCollector, /air_pressure_at_sea_level/);
  assert.match(metNorwayCollector, /cloud_area_fraction_low/);
  assert.match(metNorwayCollector, /wind_from_direction/);
  assert.match(metNorwayCollector, /providerUpdatedAt/);
});

test("coletores ricos exigem token privado e não tornam o front público dependente do arquivo", () => {
  assert.match(openMeteoCollector, /constantTimeEqual/);
  assert.match(metNorwayCollector, /constantTimeEqual/);
  assert.match(metNorwayCollector, /historical_collector_settings/);
  assert.match(metNorwayCollector, /X-Content-Type-Options/);
  assert.match(metNorwayCollector, /Cache-Control/);
});
