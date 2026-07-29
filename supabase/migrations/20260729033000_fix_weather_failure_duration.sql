create or replace function public.track_weather_station_health()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  finished_attempt boolean;
  finished_at timestamptz;
  duration_ms integer;
  succeeded boolean;
  failed boolean;
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

  succeeded := new.last_success_at is distinct from old.last_success_at and new.error is null;
  failed := new.error is not null;

  if succeeded then
    finished_at := coalesce(new.last_success_at, now());
  elsif failed then
    finished_at := coalesce(new.last_attempt_at, now());
  else
    finished_at := now();
  end if;

  duration_ms := greatest(
    0,
    round(extract(epoch from (finished_at - old.refresh_started_at)) * 1000)::integer
  );

  new.last_duration_ms := duration_ms;

  if succeeded then
    new.consecutive_failures := 0;
    new.last_outcome := 'success';
    new.successful_collects := old.successful_collects + 1;

    if new.source_hash is distinct from old.source_hash then
      new.last_data_change_at := new.last_success_at;
    else
      new.last_data_change_at := old.last_data_change_at;
    end if;
  elsif failed then
    new.consecutive_failures := old.consecutive_failures + 1;
    new.last_outcome := 'failure';
    new.last_error_at := coalesce(new.last_attempt_at, now());
    new.failed_collects := old.failed_collects + 1;
  end if;

  return new;
end;
$$;
