create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

create table if not exists public.historical_data_sources (
  source_key text primary key,
  name text not null,
  category text not null,
  provider text,
  homepage_url text,
  terms_url text,
  attribution text,
  retention_policy_status text not null default 'pending_review',
  paid_access_allowed boolean not null default false,
  collection_enabled boolean not null default true,
  coverage_start timestamptz,
  collection_start timestamptz not null default now(),
  terms_checked_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint historical_data_sources_key_check
    check (source_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint historical_data_sources_category_check
    check (category in ('weather-station', 'hydrology', 'forecast-model', 'reanalysis', 'radar', 'satellite', 'other')),
  constraint historical_data_sources_retention_check
    check (retention_policy_status in ('approved', 'pending_review', 'restricted')),
  constraint historical_data_sources_homepage_check
    check (homepage_url is null or homepage_url ~ '^https://'),
  constraint historical_data_sources_terms_check
    check (terms_url is null or terms_url ~ '^https://')
);

comment on table public.historical_data_sources is
  'Governança das fontes que alimentam o arquivo histórico próprio do Tempo Pelotas.';
comment on column public.historical_data_sources.paid_access_allowed is
  'Somente true após revisão de termos/licença para uso em recursos pagos ou exportáveis.';
comment on column public.historical_data_sources.collection_start is
  'Início da coleta própria do Tempo Pelotas para esta fonte.';
comment on column public.historical_data_sources.coverage_start is
  'Início conhecido da série disponível, incluindo eventual backfill anterior à coleta própria.';

create table if not exists public.historical_stations (
  station_key text primary key,
  source_key text not null references public.historical_data_sources(source_key) on delete restrict,
  name text not null,
  city text,
  state text,
  country text not null default 'BR',
  latitude double precision,
  longitude double precision,
  station_type text not null default 'station',
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint historical_stations_key_check
    check (station_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint historical_stations_latitude_check
    check (latitude is null or latitude between -90 and 90),
  constraint historical_stations_longitude_check
    check (longitude is null or longitude between -180 and 180)
);

comment on table public.historical_stations is
  'Catálogo canônico de estações e pontos monitorados do arquivo histórico.';

create table if not exists public.historical_measurements (
  id bigint generated always as identity primary key,
  source_key text not null references public.historical_data_sources(source_key) on delete restrict,
  station_key text not null references public.historical_stations(station_key) on delete restrict,
  variable_key text not null,
  data_class text not null default 'observation',
  observed_at timestamptz not null,
  value_numeric double precision,
  value_text text,
  unit text not null,
  quality_flag text not null default 'raw',
  source_record_id text,
  metadata jsonb not null default '{}'::jsonb,
  ingested_at timestamptz not null default now(),
  constraint historical_measurements_variable_check
    check (variable_key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  constraint historical_measurements_class_check
    check (data_class in ('observation', 'forecast', 'reanalysis', 'derived')),
  constraint historical_measurements_value_check
    check (value_numeric is not null or value_text is not null),
  constraint historical_measurements_unique_point
    unique (source_key, station_key, variable_key, data_class, observed_at)
);

comment on table public.historical_measurements is
  'Série temporal canônica de medições e valores históricos normalizados do Tempo Pelotas.';

create index if not exists historical_measurements_station_variable_time_idx
  on public.historical_measurements (station_key, variable_key, observed_at desc);
create index if not exists historical_measurements_source_time_idx
  on public.historical_measurements (source_key, observed_at desc);
create index if not exists historical_measurements_variable_time_idx
  on public.historical_measurements (variable_key, observed_at desc);
create index if not exists historical_measurements_observed_brin_idx
  on public.historical_measurements using brin (observed_at);

create table if not exists public.historical_collector_settings (
  collector_key text primary key,
  endpoint text not null,
  collector_token text not null default encode(extensions.gen_random_bytes(32), 'hex'),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint historical_collector_settings_key_check
    check (collector_key ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint historical_collector_settings_endpoint_check
    check (endpoint ~ '^https://'),
  constraint historical_collector_settings_token_check
    check (length(collector_token) >= 32)
);

comment on table public.historical_collector_settings is
  'Configuração privada para rotinas automáticas que alimentam o Historical Data Layer.';

create table if not exists public.historical_collection_runs (
  id bigint generated always as identity primary key,
  action text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  success boolean,
  stored_count integer not null default 0,
  details jsonb not null default '{}'::jsonb,
  error text,
  constraint historical_collection_runs_action_check
    check (char_length(action) between 1 and 80),
  constraint historical_collection_runs_stored_check
    check (stored_count >= 0)
);

create index if not exists historical_collection_runs_started_idx
  on public.historical_collection_runs (started_at desc);

alter table public.historical_data_sources enable row level security;
alter table public.historical_stations enable row level security;
alter table public.historical_measurements enable row level security;
alter table public.historical_collector_settings enable row level security;
alter table public.historical_collection_runs enable row level security;

revoke all on table public.historical_data_sources from public, anon, authenticated;
revoke all on table public.historical_stations from public, anon, authenticated;
revoke all on table public.historical_measurements from public, anon, authenticated;
revoke all on table public.historical_collector_settings from public, anon, authenticated;
revoke all on table public.historical_collection_runs from public, anon, authenticated;
grant select, insert, update, delete on table public.historical_data_sources to service_role;
grant select, insert, update, delete on table public.historical_stations to service_role;
grant select, insert, update, delete on table public.historical_measurements to service_role;
grant select, insert, update, delete on table public.historical_collector_settings to service_role;
grant select, insert, update, delete on table public.historical_collection_runs to service_role;
grant usage, select on sequence public.historical_measurements_id_seq to service_role;
grant usage, select on sequence public.historical_collection_runs_id_seq to service_role;

create or replace function public.set_historical_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger historical_data_sources_set_updated_at
before update on public.historical_data_sources
for each row execute function public.set_historical_updated_at();

create trigger historical_stations_set_updated_at
before update on public.historical_stations
for each row execute function public.set_historical_updated_at();

create trigger historical_collector_settings_set_updated_at
before update on public.historical_collector_settings
for each row execute function public.set_historical_updated_at();

insert into public.historical_data_sources (
  source_key, name, category, provider, homepage_url, attribution,
  retention_policy_status, paid_access_allowed, collection_enabled,
  coverage_start, collection_start, notes
)
values
  (
    'embrapa-cpact', 'Embrapa Clima Temperado', 'weather-station', 'Embrapa',
    'https://agromet.cpact.embrapa.br/', 'Embrapa Clima Temperado',
    'pending_review', false, true,
    (select min(fetched_at) from public.weather_station_observations where station_id = 'embrapa-cpact-sede-pelotas'),
    coalesce((select min(fetched_at) from public.weather_station_observations where station_id = 'embrapa-cpact-sede-pelotas'), now()),
    'Coleta já existente antes do Historical Data Layer. Uso PRO/exportação permanece bloqueado até revisão documental.'
  ),
  (
    'labhidrosens-ufpel', 'LabHidroSens / UFPel', 'hydrology', 'UFPel',
    'https://tb.labhidrosens.com/', 'LabHidroSens / UFPel',
    'pending_review', false, true, null, now(),
    'Arquivo operacional interno iniciado para evitar perda temporal. Revisar termos antes de exposição PRO/exportação.'
  ),
  (
    'lagoa-monitoramento', 'Monitoramento Lagoa dos Patos', 'hydrology', 'Rede Lagoa dos Patos',
    'https://monitoramentolagoadospatos.com.br/', 'Monitoramento Lagoa dos Patos',
    'pending_review', false, true, null, now(),
    'Arquivo operacional interno iniciado para evitar perda temporal. Revisar termos antes de exposição PRO/exportação.'
  ),
  (
    'metsul-tidesat', 'MetSul / TideSat Global', 'hydrology', 'TideSat Global',
    'https://metsul.com/nivel-do-guaiba/', 'MetSul / TideSat Global',
    'pending_review', false, true, null, now(),
    'Arquivo operacional interno iniciado para continuidade técnica. Uso PRO/exportação bloqueado até revisão de termos.'
  ),
  (
    'nivel-guaiba', 'Nível Guaíba', 'hydrology', 'ANA / SGB',
    'https://nivelguaiba.com.br/', 'Nível Guaíba / ANA / SGB',
    'pending_review', false, true, null, now(),
    'Arquivo operacional interno iniciado para continuidade técnica. Uso PRO/exportação bloqueado até revisão de termos.'
  )
on conflict (source_key) do nothing;

insert into public.historical_stations (
  station_key, source_key, name, city, state, station_type, metadata
)
values
  ('embrapa-cpact-sede-pelotas', 'embrapa-cpact', 'Posto Meteorológico da Sede', 'Pelotas', 'RS', 'weather-station', '{}'::jsonb),
  ('labhidrosens-laranjal', 'labhidrosens-ufpel', 'Estação Laranjal', 'Pelotas', 'RS', 'water-level', '{}'::jsonb),
  ('lagoon-furg-ccmar', 'lagoa-monitoramento', 'FURG CCMAR', 'Rio Grande', 'RS', 'water-level', jsonb_build_object('sensorId', 'sensor_1')),
  ('lagoon-sao-lourenco-do-sul', 'lagoa-monitoramento', 'São Lourenço do Sul', 'São Lourenço do Sul', 'RS', 'water-level', jsonb_build_object('sensorId', 'sensor_2')),
  ('lagoon-arambare', 'lagoa-monitoramento', 'Arambaré', 'Arambaré', 'RS', 'water-level', jsonb_build_object('sensorId', 'sensor_3')),
  ('lagoon-sao-jose-do-norte', 'lagoa-monitoramento', 'São José do Norte', 'São José do Norte', 'RS', 'water-level', jsonb_build_object('sensorId', 'sensor_4')),
  ('lagoon-itapua', 'lagoa-monitoramento', 'Itapuã', 'Viamão', 'RS', 'water-level', jsonb_build_object('sensorId', 'sensor_5')),
  ('guaiba-gasometro', 'nivel-guaiba', 'Usina do Gasômetro', 'Porto Alegre', 'RS', 'water-level', '{}'::jsonb),
  ('guaiba-cais-maua', 'metsul-tidesat', 'Régua do Cais Mauá', 'Porto Alegre', 'RS', 'water-level', '{}'::jsonb)
on conflict (station_key) do nothing;

insert into public.historical_collector_settings (collector_key, endpoint, enabled)
values ('primary', 'https://tempopelotas.com.br/api/cron/weather-snapshot', true)
on conflict (collector_key) do update
set endpoint = excluded.endpoint,
    enabled = excluded.enabled;

create or replace function public.mirror_weather_station_observation_to_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.historical_measurements (
    source_key,
    station_key,
    variable_key,
    data_class,
    observed_at,
    value_numeric,
    value_text,
    unit,
    quality_flag,
    source_record_id,
    metadata
  )
  select
    'embrapa-cpact',
    new.station_id,
    point.variable_key,
    'observation',
    new.fetched_at,
    point.value_numeric,
    point.value_text,
    point.unit,
    new.status,
    new.source_hash,
    jsonb_build_object(
      'stationName', new.station_name,
      'observationTime', new.observation_time,
      'originalFetchedAt', new.fetched_at
    )
  from (
    values
      ('temperature', new.temperature::double precision, null::text, 'celsius'),
      ('humidity', new.humidity::double precision, null::text, 'percent'),
      ('feels_like', new.feels_like::double precision, null::text, 'celsius'),
      ('dew_point', new.dew_point::double precision, null::text, 'celsius'),
      ('pressure', new.pressure::double precision, null::text, 'hpa'),
      ('wind_speed', new.wind_speed::double precision, null::text, 'km_h'),
      ('rain_daily', new.rain_daily::double precision, null::text, 'mm'),
      ('rain_monthly', new.rain_monthly::double precision, null::text, 'mm'),
      ('rain_annual', new.rain_annual::double precision, null::text, 'mm'),
      ('wind_direction', null::double precision, new.wind_direction, 'cardinal'),
      ('pressure_trend', null::double precision, new.pressure_trend, 'text'),
      (
        'evapotranspiration_daily',
        case when jsonb_typeof(new.payload #> '{accumulated,evapotranspirationDaily}') = 'number'
          then (new.payload #>> '{accumulated,evapotranspirationDaily}')::double precision else null end,
        null::text,
        'mm'
      ),
      (
        'evapotranspiration_monthly',
        case when jsonb_typeof(new.payload #> '{accumulated,evapotranspirationMonthly}') = 'number'
          then (new.payload #>> '{accumulated,evapotranspirationMonthly}')::double precision else null end,
        null::text,
        'mm'
      ),
      (
        'evapotranspiration_annual',
        case when jsonb_typeof(new.payload #> '{accumulated,evapotranspirationAnnual}') = 'number'
          then (new.payload #>> '{accumulated,evapotranspirationAnnual}')::double precision else null end,
        null::text,
        'mm'
      )
  ) as point(variable_key, value_numeric, value_text, unit)
  where point.value_numeric is not null or point.value_text is not null
  on conflict (source_key, station_key, variable_key, data_class, observed_at) do nothing;

  return new;
end;
$$;

revoke execute on function public.mirror_weather_station_observation_to_history() from public, anon, authenticated;
grant execute on function public.mirror_weather_station_observation_to_history() to service_role;

drop trigger if exists weather_station_observations_mirror_history
  on public.weather_station_observations;
create trigger weather_station_observations_mirror_history
after insert on public.weather_station_observations
for each row execute function public.mirror_weather_station_observation_to_history();

insert into public.historical_measurements (
  source_key,
  station_key,
  variable_key,
  data_class,
  observed_at,
  value_numeric,
  value_text,
  unit,
  quality_flag,
  source_record_id,
  metadata
)
select
  'embrapa-cpact',
  observation.station_id,
  point.variable_key,
  'observation',
  observation.fetched_at,
  point.value_numeric,
  point.value_text,
  point.unit,
  observation.status,
  observation.source_hash,
  jsonb_build_object(
    'stationName', observation.station_name,
    'observationTime', observation.observation_time,
    'originalFetchedAt', observation.fetched_at
  )
from public.weather_station_observations observation
cross join lateral (
  values
    ('temperature', observation.temperature::double precision, null::text, 'celsius'),
    ('humidity', observation.humidity::double precision, null::text, 'percent'),
    ('feels_like', observation.feels_like::double precision, null::text, 'celsius'),
    ('dew_point', observation.dew_point::double precision, null::text, 'celsius'),
    ('pressure', observation.pressure::double precision, null::text, 'hpa'),
    ('wind_speed', observation.wind_speed::double precision, null::text, 'km_h'),
    ('rain_daily', observation.rain_daily::double precision, null::text, 'mm'),
    ('rain_monthly', observation.rain_monthly::double precision, null::text, 'mm'),
    ('rain_annual', observation.rain_annual::double precision, null::text, 'mm'),
    ('wind_direction', null::double precision, observation.wind_direction, 'cardinal'),
    ('pressure_trend', null::double precision, observation.pressure_trend, 'text'),
    (
      'evapotranspiration_daily',
      case when jsonb_typeof(observation.payload #> '{accumulated,evapotranspirationDaily}') = 'number'
        then (observation.payload #>> '{accumulated,evapotranspirationDaily}')::double precision else null end,
      null::text,
      'mm'
    ),
    (
      'evapotranspiration_monthly',
      case when jsonb_typeof(observation.payload #> '{accumulated,evapotranspirationMonthly}') = 'number'
        then (observation.payload #>> '{accumulated,evapotranspirationMonthly}')::double precision else null end,
      null::text,
      'mm'
    ),
    (
      'evapotranspiration_annual',
      case when jsonb_typeof(observation.payload #> '{accumulated,evapotranspirationAnnual}') = 'number'
        then (observation.payload #>> '{accumulated,evapotranspirationAnnual}')::double precision else null end,
      null::text,
      'mm'
    )
) as point(variable_key, value_numeric, value_text, unit)
where point.value_numeric is not null or point.value_text is not null
on conflict (source_key, station_key, variable_key, data_class, observed_at) do nothing;

create or replace function public.invoke_historical_archive_job(p_action text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  settings public.historical_collector_settings%rowtype;
  request_id bigint;
begin
  if p_action not in (
    'environmental-capture',
    'environmental-backfill',
    'weather-daily',
    'weather-backfill'
  ) then
    raise exception 'Ação do arquivo histórico inválida.';
  end if;

  select * into settings
  from public.historical_collector_settings
  where collector_key = 'primary'
    and enabled = true;

  if not found then
    return null;
  end if;

  select net.http_post(
    url := settings.endpoint,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Collector-Token', settings.collector_token,
      'User-Agent', 'Supabase-Cron/Tempo-Pelotas-History'
    ),
    body := jsonb_build_object('action', p_action),
    timeout_milliseconds := 50000
  ) into request_id;

  return request_id;
end;
$$;

revoke execute on function public.set_historical_updated_at() from public, anon, authenticated;
revoke execute on function public.invoke_historical_archive_job(text) from public, anon, authenticated;
grant execute on function public.invoke_historical_archive_job(text) to service_role;

do $$
declare
  existing_job record;
begin
  for existing_job in
    select jobid from cron.job
    where jobname in (
      'tempo-pelotas-historical-environmental-5min',
      'tempo-pelotas-historical-environmental-backfill-daily',
      'tempo-pelotas-weather-daily-snapshot'
    )
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;

  perform cron.schedule(
    'tempo-pelotas-historical-environmental-5min',
    '*/5 * * * *',
    $$select public.invoke_historical_archive_job('environmental-capture')$$
  );

  perform cron.schedule(
    'tempo-pelotas-historical-environmental-backfill-daily',
    '10 6 * * *',
    $$select public.invoke_historical_archive_job('environmental-backfill')$$
  );

  perform cron.schedule(
    'tempo-pelotas-weather-daily-snapshot',
    '25 6 * * *',
    $$select public.invoke_historical_archive_job('weather-daily')$$
  );
end;
$$;
