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
  'met-norway-forecast',
  'MET Norway Locationforecast',
  'forecast',
  'https://api.met.no/weatherapi/locationforecast/2.0/documentation',
  'MET Norway',
  'pending_review',
  false,
  true,
  null,
  now(),
  'Arquivo interno de forecast runs. Uso PRO/exportação permanece bloqueado até revisão documental específica.'
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
  'met-norway-pelotas-grid',
  'met-norway-forecast',
  'MET Norway Locationforecast — Pelotas',
  'Pelotas',
  'RS',
  'forecast-grid',
  jsonb_build_object(
    'latitude', -31.7654,
    'longitude', -52.3376,
    'altitude', 7,
    'timezone', 'America/Sao_Paulo',
    'locationSlug', 'pelotas-rs'
  )
)
on conflict (station_key) do nothing;

insert into public.historical_collector_settings (
  collector_key,
  endpoint,
  enabled
)
values (
  'forecast-met-norway',
  'https://ovcpgjyomwjteapbvfwk.supabase.co/functions/v1/forecast-met-norway-capture',
  true
)
on conflict (collector_key) do update
set endpoint = excluded.endpoint,
    enabled = excluded.enabled;

create or replace function public.invoke_met_norway_forecast_collector()
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
  where collector_key = 'forecast-met-norway'
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
    body := jsonb_build_object('locationSlug', 'pelotas-rs'),
    timeout_milliseconds := 50000
  ) into request_id;

  return request_id;
end;
$$;

revoke execute on function public.invoke_met_norway_forecast_collector() from public, anon, authenticated;
grant execute on function public.invoke_met_norway_forecast_collector() to service_role;

do $$
declare
  existing_job record;
begin
  for existing_job in
    select jobid from cron.job
    where jobname = 'tempo-pelotas-met-norway-rich-forecast'
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;

  perform cron.schedule(
    'tempo-pelotas-met-norway-rich-forecast',
    '7 3,9,15,21 * * *',
    $command$select public.invoke_met_norway_forecast_collector()$command$
  );
end;
$$;
