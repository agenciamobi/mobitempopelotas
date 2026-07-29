create table if not exists public.weather_forecast_predictions (
  id bigint generated always as identity primary key,
  location_slug text not null default 'pelotas-rs',
  provider_key text not null,
  provider_name text not null,
  model text,
  model_run text,
  issued_at timestamptz not null,
  issued_local_date date not null,
  cycle_hour smallint not null,
  target_date date not null,
  lead_hours integer not null,
  lead_days smallint not null,
  temperature_min numeric(5, 2) not null,
  temperature_max numeric(5, 2) not null,
  precipitation_mm numeric(9, 2) not null,
  rain_chance numeric(5, 2),
  wind_gust numeric(7, 2),
  created_at timestamptz not null default now(),
  constraint weather_forecast_predictions_provider_check
    check (provider_key in ('open-meteo', 'met-norway')),
  constraint weather_forecast_predictions_cycle_check
    check (cycle_hour in (0, 6, 12, 18)),
  constraint weather_forecast_predictions_lead_check
    check (lead_hours between 0 and 240 and lead_days between 0 and 10),
  constraint weather_forecast_predictions_temperature_check
    check (temperature_max >= temperature_min),
  constraint weather_forecast_predictions_precipitation_check
    check (precipitation_mm >= 0),
  constraint weather_forecast_predictions_rain_chance_check
    check (rain_chance is null or rain_chance between 0 and 100),
  constraint weather_forecast_predictions_cycle_target_key
    unique (location_slug, provider_key, issued_local_date, cycle_hour, target_date)
);

create table if not exists public.weather_forecast_verifications (
  id bigint generated always as identity primary key,
  prediction_id bigint not null unique
    references public.weather_forecast_predictions(id) on delete cascade,
  station_id text not null
    references public.weather_station_current(station_id) on delete restrict,
  target_date date not null,
  sample_count integer not null,
  coverage_minutes numeric(8, 2) not null,
  observed_temperature_min numeric(5, 2) not null,
  observed_temperature_max numeric(5, 2) not null,
  observed_rain_mm numeric(9, 2),
  minimum_abs_error numeric(6, 2) not null,
  maximum_abs_error numeric(6, 2) not null,
  mean_temperature_abs_error numeric(6, 2) not null,
  rain_abs_error numeric(9, 2),
  rain_event_predicted boolean not null,
  rain_event_observed boolean,
  rain_event_correct boolean,
  verified_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weather_forecast_verifications_coverage_check
    check (sample_count > 0 and coverage_minutes >= 0),
  constraint weather_forecast_verifications_errors_check
    check (
      minimum_abs_error >= 0
      and maximum_abs_error >= 0
      and mean_temperature_abs_error >= 0
      and (rain_abs_error is null or rain_abs_error >= 0)
    )
);

create table if not exists public.weather_forecast_accuracy_settings (
  location_slug text primary key,
  endpoint text not null,
  collector_token text not null default encode(extensions.gen_random_bytes(32), 'hex'),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weather_forecast_accuracy_settings_endpoint_check
    check (endpoint ~ '^https://'),
  constraint weather_forecast_accuracy_settings_token_check
    check (length(collector_token) >= 32)
);

comment on table public.weather_forecast_predictions is
  'Arquivo imutável das previsões emitidas antes de cada data-alvo, separado por provedor, ciclo e antecedência.';
comment on table public.weather_forecast_verifications is
  'Comparação entre previsões arquivadas e observações completas da Estação Embrapa.';
comment on table public.weather_forecast_accuracy_settings is
  'Configuração privada dos ciclos automáticos de captura e verificação da precisão.';

alter table public.weather_forecast_predictions enable row level security;
alter table public.weather_forecast_verifications enable row level security;
alter table public.weather_forecast_accuracy_settings enable row level security;

create policy "forecast predictions private"
  on public.weather_forecast_predictions
  for all to service_role
  using (true) with check (true);
create policy "forecast verifications private"
  on public.weather_forecast_verifications
  for all to service_role
  using (true) with check (true);
create policy "forecast accuracy settings private"
  on public.weather_forecast_accuracy_settings
  for all to service_role
  using (true) with check (true);

create index if not exists weather_forecast_predictions_target_idx
  on public.weather_forecast_predictions (target_date desc, provider_key, lead_days);
create index if not exists weather_forecast_predictions_issued_idx
  on public.weather_forecast_predictions (issued_at desc, provider_key);
create index if not exists weather_forecast_verifications_target_idx
  on public.weather_forecast_verifications (target_date desc);

create or replace function public.set_forecast_accuracy_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger weather_forecast_verifications_set_updated_at
before update on public.weather_forecast_verifications
for each row execute function public.set_forecast_accuracy_updated_at();

create trigger weather_forecast_accuracy_settings_set_updated_at
before update on public.weather_forecast_accuracy_settings
for each row execute function public.set_forecast_accuracy_updated_at();

create or replace function public.score_weather_forecasts(
  p_target_date date default ((now() at time zone 'America/Sao_Paulo')::date - 1)
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  observation record;
  scored_count integer := 0;
begin
  select
    count(*)::integer as sample_count,
    extract(epoch from (max(fetched_at) - min(fetched_at))) / 60 as coverage_minutes,
    min(temperature) as temperature_min,
    max(temperature) as temperature_max,
    max(rain_daily) as rain_total
  into observation
  from public.weather_station_observations
  where station_id = 'embrapa-cpact-sede-pelotas'
    and status in ('live', 'partial')
    and (fetched_at at time zone 'America/Sao_Paulo')::date = p_target_date
    and temperature is not null;

  if observation.sample_count < 60
    or coalesce(observation.coverage_minutes, 0) < 1080
    or observation.temperature_min is null
    or observation.temperature_max is null
  then
    return jsonb_build_object(
      'status', 'insufficient-observation',
      'targetDate', p_target_date,
      'sampleCount', coalesce(observation.sample_count, 0),
      'coverageMinutes', coalesce(observation.coverage_minutes, 0),
      'scoredCount', 0
    );
  end if;

  insert into public.weather_forecast_verifications (
    prediction_id,
    station_id,
    target_date,
    sample_count,
    coverage_minutes,
    observed_temperature_min,
    observed_temperature_max,
    observed_rain_mm,
    minimum_abs_error,
    maximum_abs_error,
    mean_temperature_abs_error,
    rain_abs_error,
    rain_event_predicted,
    rain_event_observed,
    rain_event_correct,
    verified_at
  )
  select
    prediction.id,
    'embrapa-cpact-sede-pelotas',
    p_target_date,
    observation.sample_count,
    observation.coverage_minutes,
    observation.temperature_min,
    observation.temperature_max,
    observation.rain_total,
    abs(prediction.temperature_min - observation.temperature_min),
    abs(prediction.temperature_max - observation.temperature_max),
    (
      abs(prediction.temperature_min - observation.temperature_min)
      + abs(prediction.temperature_max - observation.temperature_max)
    ) / 2,
    case
      when observation.rain_total is null then null
      else abs(prediction.precipitation_mm - observation.rain_total)
    end,
    prediction.precipitation_mm >= 0.2 or coalesce(prediction.rain_chance, 0) >= 50,
    case when observation.rain_total is null then null else observation.rain_total >= 0.2 end,
    case
      when observation.rain_total is null then null
      else
        (prediction.precipitation_mm >= 0.2 or coalesce(prediction.rain_chance, 0) >= 50)
        = (observation.rain_total >= 0.2)
    end,
    now()
  from public.weather_forecast_predictions prediction
  where prediction.location_slug = 'pelotas-rs'
    and prediction.target_date = p_target_date
  on conflict (prediction_id) do update
  set
    sample_count = excluded.sample_count,
    coverage_minutes = excluded.coverage_minutes,
    observed_temperature_min = excluded.observed_temperature_min,
    observed_temperature_max = excluded.observed_temperature_max,
    observed_rain_mm = excluded.observed_rain_mm,
    minimum_abs_error = excluded.minimum_abs_error,
    maximum_abs_error = excluded.maximum_abs_error,
    mean_temperature_abs_error = excluded.mean_temperature_abs_error,
    rain_abs_error = excluded.rain_abs_error,
    rain_event_predicted = excluded.rain_event_predicted,
    rain_event_observed = excluded.rain_event_observed,
    rain_event_correct = excluded.rain_event_correct,
    verified_at = now();

  get diagnostics scored_count = row_count;

  return jsonb_build_object(
    'status', case when scored_count > 0 then 'scored' else 'no-predictions' end,
    'targetDate', p_target_date,
    'sampleCount', observation.sample_count,
    'coverageMinutes', observation.coverage_minutes,
    'scoredCount', scored_count
  );
end;
$$;

create or replace function public.get_forecast_accuracy_summary(p_days integer default 30)
returns jsonb
language sql
security definer
set search_path = ''
stable
as $$
  with scoped as (
    select
      prediction.provider_key,
      prediction.provider_name,
      prediction.model,
      prediction.lead_days,
      verification.target_date,
      verification.mean_temperature_abs_error,
      verification.minimum_abs_error,
      verification.maximum_abs_error,
      verification.rain_abs_error,
      verification.rain_event_correct
    from public.weather_forecast_verifications verification
    join public.weather_forecast_predictions prediction
      on prediction.id = verification.prediction_id
    where verification.target_date >=
      ((now() at time zone 'America/Sao_Paulo')::date - greatest(1, least(p_days, 365)))
  ),
  lead_stats as (
    select
      provider_key,
      lead_days,
      count(*)::integer as evaluation_count,
      round(avg(mean_temperature_abs_error), 2) as mean_temperature_error,
      round(avg(rain_abs_error) filter (where rain_abs_error is not null), 2) as rain_error,
      round(
        avg(case when rain_event_correct then 100.0 else 0.0 end)
          filter (where rain_event_correct is not null),
        1
      ) as rain_event_accuracy
    from scoped
    group by provider_key, lead_days
  ),
  provider_stats as (
    select
      provider_key,
      max(provider_name) as provider_name,
      max(model) as model,
      count(*)::integer as evaluation_count,
      round(avg(mean_temperature_abs_error), 2) as mean_temperature_error,
      round(avg(minimum_abs_error), 2) as minimum_error,
      round(avg(maximum_abs_error), 2) as maximum_error,
      round(avg(rain_abs_error) filter (where rain_abs_error is not null), 2) as rain_error,
      round(
        avg(case when rain_event_correct then 100.0 else 0.0 end)
          filter (where rain_event_correct is not null),
        1
      ) as rain_event_accuracy,
      min(target_date) as first_date,
      max(target_date) as last_date
    from scoped
    group by provider_key
  ),
  providers as (
    select jsonb_agg(
      jsonb_build_object(
        'key', provider.provider_key,
        'name', provider.provider_name,
        'model', provider.model,
        'evaluationCount', provider.evaluation_count,
        'meanTemperatureError', provider.mean_temperature_error,
        'minimumError', provider.minimum_error,
        'maximumError', provider.maximum_error,
        'rainError', provider.rain_error,
        'rainEventAccuracy', provider.rain_event_accuracy,
        'firstDate', provider.first_date,
        'lastDate', provider.last_date,
        'leadDays', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'leadDays', lead.lead_days,
              'evaluationCount', lead.evaluation_count,
              'meanTemperatureError', lead.mean_temperature_error,
              'rainError', lead.rain_error,
              'rainEventAccuracy', lead.rain_event_accuracy
            ) order by lead.lead_days
          )
          from lead_stats lead
          where lead.provider_key = provider.provider_key
        ), '[]'::jsonb)
      ) order by provider.mean_temperature_error nulls last
    ) as items
    from provider_stats provider
  ),
  totals as (
    select
      count(*)::integer as evaluation_count,
      count(distinct target_date)::integer as verified_days,
      min(target_date) as first_date,
      max(target_date) as last_date
    from scoped
  )
  select jsonb_build_object(
    'status', case
      when totals.evaluation_count = 0 then 'collecting'
      when totals.verified_days < 5 then 'building'
      else 'ready'
    end,
    'windowDays', greatest(1, least(p_days, 365)),
    'evaluationCount', totals.evaluation_count,
    'verifiedDays', totals.verified_days,
    'firstDate', totals.first_date,
    'lastDate', totals.last_date,
    'providers', coalesce(providers.items, '[]'::jsonb),
    'generatedAt', now()
  )
  from totals cross join providers;
$$;

create or replace function public.invoke_forecast_accuracy_job(p_action text)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  settings public.weather_forecast_accuracy_settings%rowtype;
  request_id bigint;
begin
  if p_action not in ('capture', 'verify') then
    raise exception 'Ação de precisão meteorológica inválida.';
  end if;

  select * into settings
  from public.weather_forecast_accuracy_settings
  where location_slug = 'pelotas-rs'
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
    body := jsonb_build_object('action', p_action),
    timeout_milliseconds := 50000
  ) into request_id;

  return request_id;
end;
$$;

insert into public.weather_forecast_accuracy_settings (
  location_slug,
  endpoint,
  enabled
)
values (
  'pelotas-rs',
  'https://tempopelotas.com.br/api/cron/forecast-accuracy',
  true
)
on conflict (location_slug) do update
set endpoint = excluded.endpoint,
    enabled = excluded.enabled;

revoke all on table public.weather_forecast_predictions from anon, authenticated;
revoke all on table public.weather_forecast_verifications from anon, authenticated;
revoke all on table public.weather_forecast_accuracy_settings from anon, authenticated;
grant select, insert, update, delete on table public.weather_forecast_predictions to service_role;
grant select, insert, update, delete on table public.weather_forecast_verifications to service_role;
grant select, insert, update, delete on table public.weather_forecast_accuracy_settings to service_role;
grant usage, select on sequence public.weather_forecast_predictions_id_seq to service_role;
grant usage, select on sequence public.weather_forecast_verifications_id_seq to service_role;

revoke execute on function public.set_forecast_accuracy_updated_at() from public, anon, authenticated;
revoke execute on function public.score_weather_forecasts(date) from public, anon, authenticated;
revoke execute on function public.get_forecast_accuracy_summary(integer) from public, anon, authenticated;
revoke execute on function public.invoke_forecast_accuracy_job(text) from public, anon, authenticated;
grant execute on function public.score_weather_forecasts(date) to service_role;
grant execute on function public.get_forecast_accuracy_summary(integer) to service_role;
grant execute on function public.invoke_forecast_accuracy_job(text) to service_role;

do $$
declare
  existing_job record;
begin
  for existing_job in
    select jobid from cron.job
    where jobname in (
      'tempo-pelotas-forecast-capture',
      'tempo-pelotas-forecast-verification'
    )
  loop
    perform cron.unschedule(existing_job.jobid);
  end loop;

  perform cron.schedule(
    'tempo-pelotas-forecast-capture',
    '5 3,9,15,21 * * *',
    $command$select public.invoke_forecast_accuracy_job('capture')$command$
  );

  perform cron.schedule(
    'tempo-pelotas-forecast-verification',
    '20 3 * * *',
    $command$select public.invoke_forecast_accuracy_job('verify')$command$
  );
end;
$$;
