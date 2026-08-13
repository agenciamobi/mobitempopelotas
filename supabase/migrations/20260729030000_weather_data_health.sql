alter table public.weather_station_current
  add column if not exists consecutive_failures integer not null default 0,
  add column if not exists last_duration_ms integer,
  add column if not exists last_outcome text,
  add column if not exists last_error_at timestamptz,
  add column if not exists last_data_change_at timestamptz,
  add column if not exists successful_collects bigint not null default 0,
  add column if not exists failed_collects bigint not null default 0;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'weather_station_current_consecutive_failures_check'
  ) then
    alter table public.weather_station_current
      add constraint weather_station_current_consecutive_failures_check
      check (consecutive_failures >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'weather_station_current_last_duration_ms_check'
  ) then
    alter table public.weather_station_current
      add constraint weather_station_current_last_duration_ms_check
      check (last_duration_ms is null or last_duration_ms >= 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'weather_station_current_last_outcome_check'
  ) then
    alter table public.weather_station_current
      add constraint weather_station_current_last_outcome_check
      check (last_outcome is null or last_outcome in ('success', 'failure'));
  end if;
end;
$$;

create table if not exists public.weather_data_alerts (
  id bigint generated always as identity primary key,
  station_id text not null references public.weather_station_current(station_id) on delete cascade,
  code text not null,
  severity text not null,
  status text not null default 'open',
  title text not null,
  message text not null,
  first_detected_at timestamptz not null default now(),
  last_detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  occurrence_count integer not null default 1,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weather_data_alerts_station_code_key unique (station_id, code),
  constraint weather_data_alerts_code_check check (code ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint weather_data_alerts_severity_check check (severity in ('warning', 'critical')),
  constraint weather_data_alerts_status_check check (status in ('open', 'resolved')),
  constraint weather_data_alerts_occurrence_count_check check (occurrence_count > 0)
);

comment on table public.weather_data_alerts is
  'Incidentes operacionais abertos e resolvidos automaticamente pelos coletores meteorológicos.';

alter table public.weather_data_alerts enable row level security;

create index if not exists weather_data_alerts_open_idx
  on public.weather_data_alerts (status, severity, last_detected_at desc);
create index if not exists weather_data_alerts_station_idx
  on public.weather_data_alerts (station_id, last_detected_at desc);

create trigger weather_data_alerts_set_updated_at
before update on public.weather_data_alerts
for each row execute function public.set_weather_station_updated_at();

revoke all on table public.weather_data_alerts from anon, authenticated;
grant select, insert, update, delete on table public.weather_data_alerts to service_role;
grant usage, select on sequence public.weather_data_alerts_id_seq to service_role;

-- As tabelas meteorológicas server-only usam RLS com default deny e privilégios revogados
-- para anon/authenticated. Não são necessárias policies de cliente com USING (false).
