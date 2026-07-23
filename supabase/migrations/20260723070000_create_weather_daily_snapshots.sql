create table if not exists public.weather_daily_snapshots (
  location_slug text not null,
  observed_date date not null,
  city text not null,
  state text not null,
  latitude double precision not null,
  longitude double precision not null,
  temperature_max numeric(5, 2) not null,
  temperature_min numeric(5, 2) not null,
  precipitation numeric(8, 2),
  wind_gust numeric(6, 2),
  source_name text not null,
  source_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (location_slug, observed_date),
  constraint weather_daily_snapshots_location_slug_check
    check (location_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint weather_daily_snapshots_latitude_check
    check (latitude between -90 and 90),
  constraint weather_daily_snapshots_longitude_check
    check (longitude between -180 and 180),
  constraint weather_daily_snapshots_temperature_max_check
    check (temperature_max between -80 and 70),
  constraint weather_daily_snapshots_temperature_min_check
    check (temperature_min between -80 and 70),
  constraint weather_daily_snapshots_temperature_order_check
    check (temperature_min <= temperature_max),
  constraint weather_daily_snapshots_precipitation_check
    check (precipitation is null or precipitation >= 0),
  constraint weather_daily_snapshots_wind_gust_check
    check (wind_gust is null or wind_gust >= 0)
);

comment on table public.weather_daily_snapshots is
  'Arquivo diário próprio de indicadores meteorológicos normalizados por localidade.';

comment on column public.weather_daily_snapshots.observed_date is
  'Data local completa à qual os indicadores meteorológicos se referem.';

comment on column public.weather_daily_snapshots.source_updated_at is
  'Horário em que o portal consultou e normalizou a fonte de origem.';

alter table public.weather_daily_snapshots enable row level security;

create index if not exists weather_daily_snapshots_observed_date_idx
  on public.weather_daily_snapshots (observed_date desc);

create index if not exists weather_daily_snapshots_location_date_idx
  on public.weather_daily_snapshots (location_slug, observed_date desc);

create or replace function public.set_weather_daily_snapshots_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists weather_daily_snapshots_set_updated_at
  on public.weather_daily_snapshots;

create trigger weather_daily_snapshots_set_updated_at
before update on public.weather_daily_snapshots
for each row execute function public.set_weather_daily_snapshots_updated_at();

revoke all on table public.weather_daily_snapshots from anon, authenticated;
grant select, insert, update, delete on table public.weather_daily_snapshots to service_role;

revoke execute on function public.set_weather_daily_snapshots_updated_at() from public;
revoke execute on function public.set_weather_daily_snapshots_updated_at() from anon;
revoke execute on function public.set_weather_daily_snapshots_updated_at() from authenticated;
