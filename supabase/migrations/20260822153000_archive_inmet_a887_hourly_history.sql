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
  notes
)
values (
  'inmet-historical',
  'INMET — Dados Históricos de Estações Automáticas',
  'weather-station',
  'https://portal.inmet.gov.br/dadoshistoricos',
  'Instituto Nacional de Meteorologia — INMET',
  'approved',
  false,
  true,
  null,
  now(),
  'Arquivo oficial público. Dados automáticos são brutos; 9999, Null e campos vazios representam ausência. Horários de origem são UTC. Dados oficiais permanecem públicos no Tempo Pelotas.'
)
on conflict (source_key) do update
set name = excluded.name,
    category = excluded.category,
    homepage_url = excluded.homepage_url,
    attribution = excluded.attribution,
    retention_policy_status = excluded.retention_policy_status,
    paid_access_allowed = false,
    collection_enabled = true,
    notes = excluded.notes;

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
  'inmet-a887-capao-do-leao-pelotas',
  'inmet-historical',
  'A887 — Capão do Leão (Pelotas)',
  'Capão do Leão',
  'RS',
  'weather-station',
  jsonb_build_object(
    'stationCode', 'A887',
    'latitude', -31.8025,
    'longitude', -52.40722222,
    'referenceFor', 'Pelotas',
    'sourceTimezone', 'UTC'
  )
)
on conflict (station_key) do update
set name = excluded.name,
    city = excluded.city,
    state = excluded.state,
    metadata = excluded.metadata;

create table if not exists public.inmet_hourly_observations (
  id bigint generated always as identity primary key,
  station_key text not null references public.historical_stations(station_key) on delete restrict,
  station_code text not null,
  observed_at timestamptz not null,
  source_date date not null,
  source_hour_utc smallint not null,
  precipitation_mm double precision,
  pressure_hpa double precision,
  pressure_max_hpa double precision,
  pressure_min_hpa double precision,
  global_radiation_kj_m2 double precision,
  temperature_c double precision,
  dew_point_c double precision,
  temperature_max_c double precision,
  temperature_min_c double precision,
  dew_point_max_c double precision,
  dew_point_min_c double precision,
  humidity_max_percent double precision,
  humidity_min_percent double precision,
  humidity_percent double precision,
  wind_direction_deg double precision,
  wind_gust_ms double precision,
  wind_speed_ms double precision,
  quality_flag text not null default 'raw-unvalidated',
  source_file text not null,
  ingested_at timestamptz not null default now(),
  constraint inmet_hourly_observations_station_code_check check (station_code ~ '^[A-Z][0-9]{3}$'),
  constraint inmet_hourly_observations_hour_check check (source_hour_utc between 0 and 23),
  constraint inmet_hourly_observations_precipitation_check check (precipitation_mm is null or precipitation_mm >= 0),
  constraint inmet_hourly_observations_humidity_check check (
    (humidity_max_percent is null or humidity_max_percent between 0 and 100)
    and (humidity_min_percent is null or humidity_min_percent between 0 and 100)
    and (humidity_percent is null or humidity_percent between 0 and 100)
  ),
  constraint inmet_hourly_observations_radiation_check check (global_radiation_kj_m2 is null or global_radiation_kj_m2 >= 0),
  constraint inmet_hourly_observations_wind_check check (
    (wind_direction_deg is null or wind_direction_deg between 0 and 360)
    and (wind_gust_ms is null or wind_gust_ms >= 0)
    and (wind_speed_ms is null or wind_speed_ms >= 0)
  ),
  constraint inmet_hourly_observations_station_time_key unique (station_code, observed_at)
);

comment on table public.inmet_hourly_observations is
  'Arquivo horário compacto da estação automática INMET A887. Mantém unidades de origem para evitar conversões irreversíveis; dados são brutos/não consistidos segundo o INMET.';
comment on column public.inmet_hourly_observations.observed_at is
  'Timestamp normalizado como UTC a partir de Data + Hora UTC do arquivo anual do INMET.';
comment on column public.inmet_hourly_observations.global_radiation_kj_m2 is
  'Radiação global horária em kJ/m² conforme unidade publicada nos arquivos automáticos do INMET.';
comment on column public.inmet_hourly_observations.wind_speed_ms is
  'Velocidade horária do vento em m/s conforme fonte; converter apenas na camada de apresentação quando necessário.';

create index if not exists inmet_hourly_observations_time_idx
  on public.inmet_hourly_observations (observed_at desc);
create index if not exists inmet_hourly_observations_station_date_idx
  on public.inmet_hourly_observations (station_code, source_date desc);
create index if not exists inmet_hourly_observations_time_brin_idx
  on public.inmet_hourly_observations using brin (observed_at);

alter table public.inmet_hourly_observations enable row level security;
revoke all on table public.inmet_hourly_observations from public, anon, authenticated;
grant select, insert, update, delete on table public.inmet_hourly_observations to service_role;
grant usage, select on sequence public.inmet_hourly_observations_id_seq to service_role;

create table if not exists public.inmet_historical_backfill_runs (
  id bigint generated always as identity primary key,
  station_code text not null,
  year smallint not null,
  source_url text not null,
  source_file text,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  success boolean,
  stored_count integer not null default 0,
  first_observed_at timestamptz,
  last_observed_at timestamptz,
  error text,
  metadata jsonb not null default '{}'::jsonb,
  constraint inmet_historical_backfill_runs_year_check check (year between 2000 and 2100)
);

create index if not exists inmet_historical_backfill_runs_station_year_idx
  on public.inmet_historical_backfill_runs (station_code, year, started_at desc);

alter table public.inmet_historical_backfill_runs enable row level security;
revoke all on table public.inmet_historical_backfill_runs from public, anon, authenticated;
grant select, insert, update, delete on table public.inmet_historical_backfill_runs to service_role;
grant usage, select on sequence public.inmet_historical_backfill_runs_id_seq to service_role;

insert into public.historical_collector_settings (
  collector_key,
  endpoint,
  enabled
)
values (
  'inmet-historical-backfill',
  'https://ovcpgjyomwjteapbvfwk.supabase.co/functions/v1/inmet-historical-backfill',
  true
)
on conflict (collector_key) do update
set endpoint = excluded.endpoint,
    enabled = excluded.enabled;

create or replace function public.invoke_inmet_historical_backfill(p_year integer)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  settings public.historical_collector_settings%rowtype;
  request_id bigint;
  current_year integer := extract(year from now())::integer;
begin
  if p_year < 2000 or p_year > current_year then
    raise exception 'Ano INMET fora do intervalo suportado.';
  end if;

  select * into settings
  from public.historical_collector_settings
  where collector_key = 'inmet-historical-backfill'
    and enabled = true;

  if not found then
    return null;
  end if;

  select net.http_post(
    url := settings.endpoint,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Collector-Token', settings.collector_token,
      'User-Agent', 'Supabase-Backfill/Tempo-Pelotas'
    ),
    body := jsonb_build_object('year', p_year, 'stationCode', 'A887'),
    timeout_milliseconds := 55000
  ) into request_id;

  return request_id;
end;
$$;

revoke execute on function public.invoke_inmet_historical_backfill(integer) from public, anon, authenticated;
grant execute on function public.invoke_inmet_historical_backfill(integer) to service_role;
