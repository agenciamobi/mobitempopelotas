create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

create table if not exists public.weather_station_current (
  station_id text primary key,
  provider text not null,
  station_name text not null,
  status text not null default 'unavailable',
  observation_time text,
  fetched_at timestamptz,
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  source_hash text,
  temperature numeric(5, 2),
  humidity numeric(5, 2),
  feels_like numeric(5, 2),
  dew_point numeric(5, 2),
  pressure numeric(7, 2),
  pressure_trend text,
  wind_direction text,
  wind_speed numeric(7, 2),
  rain_daily numeric(9, 2),
  rain_monthly numeric(10, 2),
  rain_annual numeric(11, 2),
  payload jsonb not null default '{}'::jsonb,
  error text,
  refresh_started_at timestamptz,
  refresh_lease_token uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weather_station_current_station_id_check
    check (station_id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint weather_station_current_status_check
    check (status in ('live', 'partial', 'unavailable')),
  constraint weather_station_current_observation_time_check
    check (observation_time is null or observation_time ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$'),
  constraint weather_station_current_humidity_check
    check (humidity is null or humidity between 0 and 100),
  constraint weather_station_current_rain_check
    check (
      (rain_daily is null or rain_daily >= 0)
      and (rain_monthly is null or rain_monthly >= 0)
      and (rain_annual is null or rain_annual >= 0)
    )
);

create table if not exists public.weather_station_observations (
  id bigint generated always as identity primary key,
  station_id text not null,
  provider text not null,
  station_name text not null,
  status text not null,
  observation_time text,
  fetched_at timestamptz not null,
  source_hash text not null,
  temperature numeric(5, 2),
  humidity numeric(5, 2),
  feels_like numeric(5, 2),
  dew_point numeric(5, 2),
  pressure numeric(7, 2),
  pressure_trend text,
  wind_direction text,
  wind_speed numeric(7, 2),
  rain_daily numeric(9, 2),
  rain_monthly numeric(10, 2),
  rain_annual numeric(11, 2),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  constraint weather_station_observations_station_hash_key unique (station_id, source_hash),
  constraint weather_station_observations_station_id_check
    check (station_id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint weather_station_observations_status_check
    check (status in ('live', 'partial', 'unavailable')),
  constraint weather_station_observations_observation_time_check
    check (observation_time is null or observation_time ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$')
);

create table if not exists public.weather_collector_settings (
  station_id text primary key,
  endpoint text not null,
  collector_token text not null default encode(extensions.gen_random_bytes(32), 'hex'),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weather_collector_settings_station_id_check
    check (station_id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint weather_collector_settings_endpoint_check
    check (endpoint ~ '^https://'),
  constraint weather_collector_settings_token_check
    check (length(collector_token) >= 32)
);

comment on table public.weather_station_current is
  'Fonte única da observação meteorológica mais recente de cada estação integrada.';
comment on table public.weather_station_observations is
  'Histórico deduplicado das observações meteorológicas normalizadas por estação.';
comment on table public.weather_collector_settings is
  'Configuração privada utilizada pelo agendador para acionar coletores meteorológicos.';

alter table public.weather_station_current enable row level security;
alter table public.weather_station_observations enable row level security;
alter table public.weather_collector_settings enable row level security;

create index if not exists weather_station_observations_station_fetched_idx
  on public.weather_station_observations (station_id, fetched_at desc);
create index if not exists weather_station_current_fetched_idx
  on public.weather_station_current (fetched_at desc);

create or replace function public.set_weather_station_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists weather_station_current_set_updated_at
  on public.weather_station_current;
create trigger weather_station_current_set_updated_at
before update on public.weather_station_current
for each row execute function public.set_weather_station_updated_at();

drop trigger if exists weather_collector_settings_set_updated_at
  on public.weather_collector_settings;
create trigger weather_collector_settings_set_updated_at
before update on public.weather_collector_settings
for each row execute function public.set_weather_station_updated_at();

create or replace function public.claim_weather_station_refresh(
  p_station_id text,
  p_lease_token uuid,
  p_stale_after_seconds integer default 90
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.weather_station_current
  set
    refresh_started_at = now(),
    refresh_lease_token = p_lease_token,
    last_attempt_at = now()
  where station_id = p_station_id
    and (
      refresh_started_at is null
      or refresh_started_at < now() - make_interval(secs => greatest(p_stale_after_seconds, 30))
    );

  return found;
end;
$$;

create or replace function public.invoke_embrapa_collector()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  collector public.weather_collector_settings%rowtype;
  request_id bigint;
begin
  select *
  into collector
  from public.weather_collector_settings
  where station_id = 'embrapa-cpact-sede-pelotas'
    and enabled = true;

  if not found then
    return null;
  end if;

  select net.http_post(
    url := collector.endpoint,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Collector-Token', collector.collector_token,
      'User-Agent', 'Supabase-Cron/Tempo-Pelotas'
    ),
    body := jsonb_build_object('stationId', collector.station_id),
    timeout_milliseconds := 50000
  )
  into request_id;

  return request_id;
end;
$$;

insert into public.weather_station_current (
  station_id,
  provider,
  station_name,
  status,
  payload
)
values (
  'embrapa-cpact-sede-pelotas',
  'embrapa',
  'Posto Meteorológico da Sede',
  'unavailable',
  '{}'::jsonb
)
on conflict (station_id) do nothing;

insert into public.weather_collector_settings (
  station_id,
  endpoint,
  enabled
)
values (
  'embrapa-cpact-sede-pelotas',
  'https://tempopelotas.com.br/api/cron/embrapa',
  true
)
on conflict (station_id) do update
set endpoint = excluded.endpoint,
    enabled = excluded.enabled;

revoke all on table public.weather_station_current from anon, authenticated;
revoke all on table public.weather_station_observations from anon, authenticated;
revoke all on table public.weather_collector_settings from anon, authenticated;
grant select, insert, update, delete on table public.weather_station_current to service_role;
grant select, insert, update, delete on table public.weather_station_observations to service_role;
grant select, insert, update, delete on table public.weather_collector_settings to service_role;
grant usage, select on sequence public.weather_station_observations_id_seq to service_role;

revoke execute on function public.set_weather_station_updated_at() from public, anon, authenticated;
revoke execute on function public.claim_weather_station_refresh(text, uuid, integer) from public, anon, authenticated;
revoke execute on function public.invoke_embrapa_collector() from public, anon, authenticated;
grant execute on function public.claim_weather_station_refresh(text, uuid, integer) to service_role;
grant execute on function public.invoke_embrapa_collector() to service_role;

do $$
declare
  existing_job record;
begin
  for existing_job in
    select jobid from cron.job where jobname = 'tempo-pelotas-embrapa-every-minute'
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;

  perform cron.schedule(
    'tempo-pelotas-embrapa-every-minute',
    '* * * * *',
    'select public.invoke_embrapa_collector()'
  );
end;
$$;