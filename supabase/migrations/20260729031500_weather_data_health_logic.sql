create or replace function public.track_weather_station_health()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  finished_attempt boolean;
  finished_at timestamptz;
  duration_ms integer;
begin
  new.updated_at = now();

  finished_attempt :=
    old.refresh_started_at is not null
    and old.refresh_lease_token is not null
    and new.refresh_started_at is null
    and new.refresh_lease_token is null;

  if not finished_attempt then
    return new;
  end if;

  finished_at := coalesce(new.last_success_at, new.last_attempt_at, now());
  duration_ms := greatest(
    0,
    round(extract(epoch from (finished_at - old.refresh_started_at)) * 1000)::integer
  );

  new.last_duration_ms := duration_ms;

  if new.last_success_at is distinct from old.last_success_at and new.error is null then
    new.consecutive_failures := 0;
    new.last_outcome := 'success';
    new.successful_collects := old.successful_collects + 1;

    if new.source_hash is distinct from old.source_hash then
      new.last_data_change_at := new.last_success_at;
    else
      new.last_data_change_at := old.last_data_change_at;
    end if;
  elsif new.error is not null then
    new.consecutive_failures := old.consecutive_failures + 1;
    new.last_outcome := 'failure';
    new.last_error_at := coalesce(new.last_attempt_at, now());
    new.failed_collects := old.failed_collects + 1;
  end if;

  return new;
end;
$$;

drop trigger if exists weather_station_current_set_updated_at
  on public.weather_station_current;
create trigger weather_station_current_track_health
before update on public.weather_station_current
for each row execute function public.track_weather_station_health();

create or replace function public.sync_weather_station_alerts()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  success_age_minutes numeric;
  failure_severity text;
  stale_severity text;
begin
  if new.last_success_at is null then
    success_age_minutes := null;
  else
    success_age_minutes := extract(epoch from (now() - new.last_success_at)) / 60;
  end if;

  if new.consecutive_failures >= 3 then
    failure_severity := case when new.consecutive_failures >= 5 then 'critical' else 'warning' end;

    insert into public.weather_data_alerts (
      station_id, code, severity, status, title, message,
      first_detected_at, last_detected_at, resolved_at, occurrence_count, details
    )
    values (
      new.station_id,
      'consecutive-failures',
      failure_severity,
      'open',
      'Falhas consecutivas na coleta',
      format('A fonte falhou em %s tentativas consecutivas.', new.consecutive_failures),
      now(), now(), null, 1,
      jsonb_build_object(
        'consecutiveFailures', new.consecutive_failures,
        'lastAttemptAt', new.last_attempt_at,
        'lastErrorAt', new.last_error_at
      )
    )
    on conflict (station_id, code) do update
    set severity = excluded.severity,
        status = 'open',
        title = excluded.title,
        message = excluded.message,
        last_detected_at = now(),
        resolved_at = null,
        occurrence_count = public.weather_data_alerts.occurrence_count + 1,
        details = excluded.details;
  else
    update public.weather_data_alerts
    set status = 'resolved', resolved_at = now()
    where station_id = new.station_id
      and code = 'consecutive-failures'
      and status = 'open';
  end if;

  if success_age_minutes is null or success_age_minutes > 5 then
    stale_severity := case
      when success_age_minutes is null or success_age_minutes > 30 then 'critical'
      else 'warning'
    end;

    insert into public.weather_data_alerts (
      station_id, code, severity, status, title, message,
      first_detected_at, last_detected_at, resolved_at, occurrence_count, details
    )
    values (
      new.station_id,
      'stale-reading',
      stale_severity,
      'open',
      'Leitura central atrasada',
      case
        when success_age_minutes is null then 'Ainda não existe uma coleta bem-sucedida registrada.'
        else format('A última coleta bem-sucedida ocorreu há aproximadamente %s minutos.', round(success_age_minutes))
      end,
      now(), now(), null, 1,
      jsonb_build_object(
        'ageMinutes', success_age_minutes,
        'lastSuccessAt', new.last_success_at
      )
    )
    on conflict (station_id, code) do update
    set severity = excluded.severity,
        status = 'open',
        title = excluded.title,
        message = excluded.message,
        last_detected_at = now(),
        resolved_at = null,
        occurrence_count = public.weather_data_alerts.occurrence_count + 1,
        details = excluded.details;
  else
    update public.weather_data_alerts
    set status = 'resolved', resolved_at = now()
    where station_id = new.station_id
      and code = 'stale-reading'
      and status = 'open';
  end if;

  if new.last_duration_ms is not null and new.last_duration_ms > 15000 then
    insert into public.weather_data_alerts (
      station_id, code, severity, status, title, message,
      first_detected_at, last_detected_at, resolved_at, occurrence_count, details
    )
    values (
      new.station_id,
      'slow-response',
      case when new.last_duration_ms > 30000 then 'critical' else 'warning' end,
      'open',
      'Resposta lenta da fonte',
      format('A última coleta levou aproximadamente %s segundos.', round(new.last_duration_ms / 1000.0, 1)),
      now(), now(), null, 1,
      jsonb_build_object('durationMs', new.last_duration_ms)
    )
    on conflict (station_id, code) do update
    set severity = excluded.severity,
        status = 'open',
        title = excluded.title,
        message = excluded.message,
        last_detected_at = now(),
        resolved_at = null,
        occurrence_count = public.weather_data_alerts.occurrence_count + 1,
        details = excluded.details;
  else
    update public.weather_data_alerts
    set status = 'resolved', resolved_at = now()
    where station_id = new.station_id
      and code = 'slow-response'
      and status = 'open';
  end if;

  if new.last_outcome = 'success' and (new.temperature is null or new.humidity is null) then
    insert into public.weather_data_alerts (
      station_id, code, severity, status, title, message,
      first_detected_at, last_detected_at, resolved_at, occurrence_count, details
    )
    values (
      new.station_id,
      'incomplete-reading',
      'warning',
      'open',
      'Leitura incompleta',
      'A fonte respondeu, mas temperatura ou umidade não foram reconhecidas.',
      now(), now(), null, 1,
      jsonb_build_object(
        'temperatureAvailable', new.temperature is not null,
        'humidityAvailable', new.humidity is not null
      )
    )
    on conflict (station_id, code) do update
    set severity = excluded.severity,
        status = 'open',
        title = excluded.title,
        message = excluded.message,
        last_detected_at = now(),
        resolved_at = null,
        occurrence_count = public.weather_data_alerts.occurrence_count + 1,
        details = excluded.details;
  else
    update public.weather_data_alerts
    set status = 'resolved', resolved_at = now()
    where station_id = new.station_id
      and code = 'incomplete-reading'
      and status = 'open';
  end if;

  return new;
end;
$$;

create trigger weather_station_current_sync_alerts
after update on public.weather_station_current
for each row
when (old.refresh_lease_token is not null and new.refresh_lease_token is null)
execute function public.sync_weather_station_alerts();

create or replace function public.get_embrapa_health_snapshot()
returns jsonb
language sql
security definer
set search_path = ''
stable
as $$
  with station as (
    select
      c.*,
      case
        when c.last_success_at is null then null
        else greatest(0, extract(epoch from (now() - c.last_success_at)) / 60)
      end as success_age_minutes,
      case
        when c.last_attempt_at is null then null
        else greatest(0, extract(epoch from (now() - c.last_attempt_at)) / 60)
      end as attempt_age_minutes
    from public.weather_station_current c
    where c.station_id = 'embrapa-cpact-sede-pelotas'
  ),
  history as (
    select
      count(*)::integer as total,
      count(*) filter (where fetched_at >= now() - interval '24 hours')::integer as last_24_hours,
      min(fetched_at) as first_at,
      max(fetched_at) as latest_at
    from public.weather_station_observations
    where station_id = 'embrapa-cpact-sede-pelotas'
  ),
  alerts as (
    select
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'code', code,
            'severity', severity,
            'title', title,
            'message', message,
            'firstDetectedAt', first_detected_at,
            'lastDetectedAt', last_detected_at,
            'occurrenceCount', occurrence_count
          ) order by
            case severity when 'critical' then 0 else 1 end,
            last_detected_at desc
        ) filter (where status = 'open'),
        '[]'::jsonb
      ) as items,
      count(*) filter (where status = 'open')::integer as open_count,
      count(*) filter (where status = 'open' and severity = 'critical')::integer as critical_count,
      count(*) filter (where status = 'open' and severity = 'warning')::integer as warning_count
    from public.weather_data_alerts
    where station_id = 'embrapa-cpact-sede-pelotas'
  ),
  settings as (
    select enabled
    from public.weather_collector_settings
    where station_id = 'embrapa-cpact-sede-pelotas'
  )
  select jsonb_build_object(
    'stationId', s.station_id,
    'stationName', s.station_name,
    'level', case
      when s.station_id is null or s.last_success_at is null then 'unavailable'
      when coalesce(s.attempt_age_minutes, 999) > 5 then 'critical'
      when s.consecutive_failures >= 5 or s.success_age_minutes > 30 or a.critical_count > 0 then 'critical'
      when s.consecutive_failures >= 3 or s.success_age_minutes > 5 or a.warning_count > 0 then 'degraded'
      else 'normal'
    end,
    'collector', jsonb_build_object(
      'enabled', coalesce(cfg.enabled, false),
      'lastAttemptAt', s.last_attempt_at,
      'lastSuccessAt', s.last_success_at,
      'attemptAgeMinutes', s.attempt_age_minutes,
      'successAgeMinutes', s.success_age_minutes,
      'consecutiveFailures', s.consecutive_failures,
      'lastDurationMs', s.last_duration_ms,
      'lastOutcome', s.last_outcome,
      'successfulCollects', s.successful_collects,
      'failedCollects', s.failed_collects
    ),
    'data', jsonb_build_object(
      'status', s.status,
      'fetchedAt', s.fetched_at,
      'observationTime', s.observation_time,
      'lastDataChangeAt', s.last_data_change_at,
      'temperatureAvailable', s.temperature is not null,
      'humidityAvailable', s.humidity is not null,
      'pressureAvailable', s.pressure is not null,
      'windAvailable', s.wind_speed is not null,
      'rainAvailable', s.rain_daily is not null
    ),
    'history', jsonb_build_object(
      'total', h.total,
      'last24Hours', h.last_24_hours,
      'firstAt', h.first_at,
      'latestAt', h.latest_at
    ),
    'alerts', jsonb_build_object(
      'openCount', a.open_count,
      'criticalCount', a.critical_count,
      'warningCount', a.warning_count,
      'items', a.items
    ),
    'generatedAt', now()
  )
  from station s
  cross join history h
  cross join alerts a
  left join settings cfg on true;
$$;

revoke execute on function public.track_weather_station_health() from public, anon, authenticated;
revoke execute on function public.sync_weather_station_alerts() from public, anon, authenticated;
revoke execute on function public.get_embrapa_health_snapshot() from public, anon, authenticated;
grant execute on function public.get_embrapa_health_snapshot() to service_role;
