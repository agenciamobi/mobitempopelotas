create or replace function public.prepare_weather_ai_failed_slot_retry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.weather_ai_snapshots
  where slot_key = new.slot_key
    and status = 'failed';

  return new;
end;
$$;

revoke all on function public.prepare_weather_ai_failed_slot_retry() from public;
revoke all on function public.prepare_weather_ai_failed_slot_retry() from anon;
revoke all on function public.prepare_weather_ai_failed_slot_retry() from authenticated;
grant execute on function public.prepare_weather_ai_failed_slot_retry() to service_role;

drop trigger if exists weather_ai_snapshots_retry_failed_before_insert
  on public.weather_ai_snapshots;

create trigger weather_ai_snapshots_retry_failed_before_insert
before insert on public.weather_ai_snapshots
for each row
execute function public.prepare_weather_ai_failed_slot_retry();
