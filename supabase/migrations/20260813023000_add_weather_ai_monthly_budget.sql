create table if not exists public.weather_ai_monthly_usage (
  month_key date primary key,
  calls integer not null default 0,
  call_limit integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weather_ai_monthly_usage_month_start check (
    month_key = date_trunc('month', month_key)::date
  ),
  constraint weather_ai_monthly_usage_calls_nonnegative check (calls >= 0),
  constraint weather_ai_monthly_usage_limit_positive check (call_limit > 0 and call_limit <= 10000)
);

alter table public.weather_ai_monthly_usage enable row level security;

revoke all on table public.weather_ai_monthly_usage from public;
revoke all on table public.weather_ai_monthly_usage from anon;
revoke all on table public.weather_ai_monthly_usage from authenticated;
grant select, insert, update on table public.weather_ai_monthly_usage to service_role;

create or replace function public.claim_weather_ai_monthly_call(
  p_month_key date,
  p_call_limit integer
)
returns table (
  allowed boolean,
  calls integer,
  call_limit integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_calls integer;
  v_limit integer;
begin
  if p_month_key is null or p_month_key <> date_trunc('month', p_month_key)::date then
    raise exception 'p_month_key must be the first day of a month';
  end if;

  if p_call_limit is null or p_call_limit < 1 or p_call_limit > 10000 then
    raise exception 'p_call_limit must be between 1 and 10000';
  end if;

  insert into public.weather_ai_monthly_usage (month_key, calls, call_limit)
  values (p_month_key, 0, p_call_limit)
  on conflict (month_key) do nothing;

  update public.weather_ai_monthly_usage
  set
    calls = weather_ai_monthly_usage.calls + 1,
    call_limit = p_call_limit,
    updated_at = now()
  where
    month_key = p_month_key
    and weather_ai_monthly_usage.calls < p_call_limit
  returning weather_ai_monthly_usage.calls, weather_ai_monthly_usage.call_limit
  into v_calls, v_limit;

  if found then
    return query select true, v_calls, v_limit;
    return;
  end if;

  select usage.calls, usage.call_limit
  into v_calls, v_limit
  from public.weather_ai_monthly_usage as usage
  where usage.month_key = p_month_key;

  return query select false, coalesce(v_calls, 0), coalesce(v_limit, p_call_limit);
end;
$$;

revoke all on function public.claim_weather_ai_monthly_call(date, integer) from public;
revoke all on function public.claim_weather_ai_monthly_call(date, integer) from anon;
revoke all on function public.claim_weather_ai_monthly_call(date, integer) from authenticated;
grant execute on function public.claim_weather_ai_monthly_call(date, integer) to service_role;
