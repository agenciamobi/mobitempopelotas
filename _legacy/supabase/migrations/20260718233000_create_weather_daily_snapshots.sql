create table if not exists public.weather_daily_snapshots (
  location_slug text not null,
  observed_date date not null,
  city text not null,
  state text not null,
  latitude double precision not null,
  longitude double precision not null,
  temperature_max numeric(5, 2) not null,
  temperature_min numeric(5, 2) not null,
  precipitation numeric(8, 2) not null default 0,
  wind_gust numeric(6, 2) not null default 0,
  source_name text not null,
  source_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (location_slug, observed_date)
);

comment on table public.weather_daily_snapshots is
  'Arquivo diário próprio de condições meteorológicas normalizadas por localidade.';

comment on column public.weather_daily_snapshots.observed_date is
  'Data local completa à qual os indicadores meteorológicos se referem.';

alter table public.weather_daily_snapshots enable row level security;

create index if not exists weather_daily_snapshots_observed_date_idx
  on public.weather_daily_snapshots (observed_date desc);

create or replace function public.set_weather_daily_snapshots_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_weather_daily_snapshots_updated_at
  on public.weather_daily_snapshots;

create trigger set_weather_daily_snapshots_updated_at
before update on public.weather_daily_snapshots
for each row
execute function public.set_weather_daily_snapshots_updated_at();

revoke all on public.weather_daily_snapshots from anon, authenticated;
grant select, insert, update on public.weather_daily_snapshots to service_role;
