insert into public.historical_data_sources (
  source_key,
  name,
  category,
  homepage_url,
  attribution,
  retention_policy_status,
  paid_access_allowed,
  collection_enabled,
  coverage_start,
  collection_start,
  terms_url,
  notes
)
values (
  'open-meteo-forecast',
  'Open-Meteo Forecast',
  'forecast',
  'https://open-meteo.com/',
  'Open-Meteo',
  'pending_review',
  false,
  true,
  null,
  now(),
  'https://open-meteo.com/en/terms',
  'Arquivo interno de forecast runs. Uso PRO/exportação permanece bloqueado até revisão do plano/licença aplicável ao uso comercial.'
)
on conflict (source_key) do nothing;

insert into public.historical_stations (
  station_key,
  source_key,
  name,
  city,
  state,
  station_type,
  metadata
)
values (
  'open-meteo-pelotas-grid',
  'open-meteo-forecast',
  'Open-Meteo Best Match — Pelotas',
  'Pelotas',
  'RS',
  'forecast-grid',
  jsonb_build_object(
    'latitude', -31.7654,
    'longitude', -52.3376,
    'timezone', 'America/Sao_Paulo',
    'locationSlug', 'pelotas-rs'
  )
)
on conflict (station_key) do nothing;

create table if not exists public.weather_forecast_runs (
  id bigint generated always as identity primary key,
  source_key text not null default 'open-meteo-forecast'
    references public.historical_data_sources(source_key) on delete restrict,
  location_slug text not null,
  provider_key text not null,
  provider_name text not null,
  model text,
  model_run text,
  captured_at timestamptz not null,
  captured_local_date date not null,
  cycle_hour smallint not null,
  timezone text not null default 'America/Sao_Paulo',
  latitude double precision,
  longitude double precision,
  utc_offset_seconds integer,
  generation_time_ms double precision,
  forecast_hours integer not null default 0,
  first_valid_at timestamptz,
  last_valid_at timestamptz,
  capture_status text not null default 'pending',
  point_count integer not null default 0,
  payload_hash text,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weather_forecast_runs_location_check
    check (location_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint weather_forecast_runs_provider_check
    check (provider_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint weather_forecast_runs_cycle_check
    check (cycle_hour in (0, 6, 12, 18)),
  constraint weather_forecast_runs_hours_check
    check (forecast_hours between 0 and 384),
  constraint weather_forecast_runs_status_check
    check (capture_status in ('pending', 'complete', 'failed')),
  constraint weather_forecast_runs_point_count_check
    check (point_count >= 0),
  constraint weather_forecast_runs_hash_check
    check (payload_hash is null or payload_hash ~ '^[a-f0-9]{64}$'),
  constraint weather_forecast_runs_cycle_key
    unique (location_slug, provider_key, captured_local_date, cycle_hour)
);

create table if not exists public.weather_forecast_hourly_points (
  id bigint generated always as identity primary key,
  run_id bigint not null references public.weather_forecast_runs(id) on delete cascade,
  valid_at timestamptz not null,
  lead_hours integer not null,
  temperature_2m double precision,
  apparent_temperature double precision,
  relative_humidity_2m double precision,
  dew_point_2m double precision,
  precipitation_probability double precision,
  precipitation_mm double precision,
  pressure_msl double precision,
  cloud_cover double precision,
  cloud_cover_low double precision,
  cloud_cover_mid double precision,
  cloud_cover_high double precision,
  visibility_m double precision,
  cape double precision,
  boundary_layer_height_m double precision,
  wind_speed_10m double precision,
  wind_gusts_10m double precision,
  wind_direction_10m double precision,
  weather_code smallint,
  is_day boolean,
  created_at timestamptz not null default now(),
  constraint weather_forecast_hourly_points_lead_check
    check (lead_hours between 0 and 384),
  constraint weather_forecast_hourly_points_humidity_check
    check (relative_humidity_2m is null or relative_humidity_2m between 0 and 100),
  constraint weather_forecast_hourly_points_probability_check
    check (precipitation_probability is null or precipitation_probability between 0 and 100),
  constraint weather_forecast_hourly_points_precipitation_check
    check (precipitation_mm is null or precipitation_mm >= 0),
  constraint weather_forecast_hourly_points_cloud_check
    check (
      (cloud_cover is null or cloud_cover between 0 and 100)
      and (cloud_cover_low is null or cloud_cover_low between 0 and 100)
      and (cloud_cover_mid is null or cloud_cover_mid between 0 and 100)
      and (cloud_cover_high is null or cloud_cover_high between 0 and 100)
    ),
  constraint weather_forecast_hourly_points_visibility_check
    check (visibility_m is null or visibility_m >= 0),
  constraint weather_forecast_hourly_points_cape_check
    check (cape is null or cape >= 0),
  constraint weather_forecast_hourly_points_boundary_check
    check (boundary_layer_height_m is null or boundary_layer_height_m >= 0),
  constraint weather_forecast_hourly_points_wind_check
    check (
      (wind_speed_10m is null or wind_speed_10m >= 0)
      and (wind_gusts_10m is null or wind_gusts_10m >= 0)
      and (wind_direction_10m is null or wind_direction_10m between 0 and 360)
    ),
  constraint weather_forecast_hourly_points_run_time_key unique (run_id, valid_at)
);

comment on table public.weather_forecast_runs is
  'Um snapshot imutável por janela de captura de 6 h, preservando o que o provedor apresentava naquele ciclo de coleta do Tempo Pelotas.';
comment on column public.weather_forecast_runs.captured_at is
  'Horário da captura pelo Tempo Pelotas; não deve ser interpretado como horário oficial de emissão do modelo quando a fonte não o informar.';
comment on table public.weather_forecast_hourly_points is
  'Série horária rica vinculada a um forecast run, separada das observações e da tabela diária usada pela acurácia.';

create index if not exists weather_forecast_runs_captured_idx
  on public.weather_forecast_runs (provider_key, captured_at desc);
create index if not exists weather_forecast_hourly_points_valid_idx
  on public.weather_forecast_hourly_points (valid_at desc);
create index if not exists weather_forecast_hourly_points_run_valid_idx
  on public.weather_forecast_hourly_points (run_id, valid_at);

alter table public.weather_forecast_runs enable row level security;
alter table public.weather_forecast_hourly_points enable row level security;

revoke all on table public.weather_forecast_runs from public, anon, authenticated;
revoke all on table public.weather_forecast_hourly_points from public, anon, authenticated;
grant select, insert, update, delete on table public.weather_forecast_runs to service_role;
grant select, insert, update, delete on table public.weather_forecast_hourly_points to service_role;
grant usage, select on sequence public.weather_forecast_runs_id_seq to service_role;
grant usage, select on sequence public.weather_forecast_hourly_points_id_seq to service_role;

drop trigger if exists weather_forecast_runs_set_updated_at on public.weather_forecast_runs;
create trigger weather_forecast_runs_set_updated_at
before update on public.weather_forecast_runs
for each row execute function public.set_historical_updated_at();
