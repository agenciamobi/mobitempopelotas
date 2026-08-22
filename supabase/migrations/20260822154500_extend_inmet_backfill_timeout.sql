create or replace function public.invoke_inmet_historical_backfill(p_year integer)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  settings public.historical_collector_settings%rowtype;
  request_id bigint;
  current_year integer := extract(year from now())::integer;
begin
  if p_year < 2000 or p_year > current_year then
    raise exception 'Ano INMET fora do intervalo suportado.';
  end if;

  select * into settings
  from public.historical_collector_settings
  where collector_key = 'inmet-historical-backfill'
    and enabled = true;

  if not found then
    return null;
  end if;

  select net.http_post(
    url := settings.endpoint,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Collector-Token', settings.collector_token,
      'User-Agent', 'Supabase-Backfill/Tempo-Pelotas'
    ),
    body := jsonb_build_object('year', p_year, 'stationCode', 'A887'),
    timeout_milliseconds := 120000
  ) into request_id;

  return request_id;
end;
$$;

revoke execute on function public.invoke_inmet_historical_backfill(integer) from public, anon, authenticated;
grant execute on function public.invoke_inmet_historical_backfill(integer) to service_role;
