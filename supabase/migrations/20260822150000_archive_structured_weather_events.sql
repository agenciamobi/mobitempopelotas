create table if not exists public.historical_events (
  id bigint generated always as identity primary key,
  source_key text not null references public.historical_data_sources(source_key) on delete restrict,
  event_type text not null,
  source_record_id text not null,
  event_at timestamptz not null,
  starts_at timestamptz,
  ends_at timestamptz,
  severity text,
  latitude double precision,
  longitude double precision,
  title text,
  description text,
  payload_hash text,
  metadata jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint historical_events_type_check check (event_type ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint historical_events_hash_check check (payload_hash is null or payload_hash ~ '^[a-f0-9]{64}$'),
  constraint historical_events_coordinates_check check (
    (latitude is null and longitude is null)
    or (
      latitude between -90 and 90
      and longitude between -180 and 180
    )
  ),
  constraint historical_events_period_check check (ends_at is null or starts_at is null or ends_at >= starts_at),
  constraint historical_events_source_record_key unique (source_key, event_type, source_record_id)
);

comment on table public.historical_events is
  'Arquivo de eventos meteorológicos/hidrometeorológicos estruturados, separado das séries numéricas.';
comment on column public.historical_events.event_at is
  'Timestamp principal do evento conforme semântica documentada por cada fonte; não deve ser reinterpretado como instante exato quando a fonte fornece apenas horário do quadro.';

create index if not exists historical_events_source_time_idx
  on public.historical_events (source_key, event_at desc);
create index if not exists historical_events_type_time_idx
  on public.historical_events (event_type, event_at desc);
create index if not exists historical_events_active_period_idx
  on public.historical_events (starts_at, ends_at);

alter table public.historical_events enable row level security;
revoke all on table public.historical_events from public, anon, authenticated;
grant select, insert, update, delete on table public.historical_events to service_role;
grant usage, select on sequence public.historical_events_id_seq to service_role;

drop trigger if exists historical_events_set_updated_at on public.historical_events;
create trigger historical_events_set_updated_at
before update on public.historical_events
for each row execute function public.set_historical_updated_at();

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
values
  (
    'redemet-stsc',
    'REDEMET / DECEA — STSC',
    'event-monitoring',
    'https://www.redemet.aer.mil.br/',
    'REDEMET / DECEA',
    'pending_review',
    false,
    true,
    null,
    now(),
    'Arquivo interno das ocorrências estruturadas de trovoada já expostas no portal. O timestamp representa o quadro/ultima_ocorrencia informado pela fonte.'
  ),
  (
    'inmet-alerts',
    'INMET — Avisos Meteorológicos',
    'official-alert',
    'https://avisos.inmet.gov.br/',
    'Instituto Nacional de Meteorologia — INMET',
    'pending_review',
    false,
    true,
    null,
    now(),
    'Arquivo interno de avisos oficiais normalizados. Dados oficiais permanecem públicos conforme a política de acesso do projeto.'
  )
on conflict (source_key) do nothing;

insert into public.historical_collector_settings (
  collector_key,
  endpoint,
  enabled
)
values (
  'historical-events',
  'https://ovcpgjyomwjteapbvfwk.supabase.co/functions/v1/historical-events-capture',
  true
)
on conflict (collector_key) do update
set endpoint = excluded.endpoint,
    enabled = excluded.enabled;

create or replace function public.invoke_historical_events_collector()
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  settings public.historical_collector_settings%rowtype;
  request_id bigint;
begin
  select * into settings
  from public.historical_collector_settings
  where collector_key = 'historical-events'
    and enabled = true;

  if not found then
    return null;
  end if;

  select net.http_post(
    url := settings.endpoint,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Collector-Token', settings.collector_token,
      'User-Agent', 'Supabase-Cron/Tempo-Pelotas'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 50000
  ) into request_id;

  return request_id;
end;
$$;

revoke execute on function public.invoke_historical_events_collector() from public, anon, authenticated;
grant execute on function public.invoke_historical_events_collector() to service_role;

do $$
declare
  existing_job record;
begin
  for existing_job in
    select jobid from cron.job
    where jobname = 'tempo-pelotas-historical-events'
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;

  perform cron.schedule(
    'tempo-pelotas-historical-events',
    '*/10 * * * *',
    $command$select public.invoke_historical_events_collector()$command$
  );
end;
$$;
