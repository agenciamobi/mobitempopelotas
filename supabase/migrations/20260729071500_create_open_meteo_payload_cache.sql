create table if not exists public.weather_provider_payload_cache (
  provider_key text primary key,
  status text not null default 'unavailable',
  payload jsonb not null default '{}'::jsonb,
  fetched_at timestamptz,
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  error text,
  refresh_started_at timestamptz,
  refresh_lease_token uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weather_provider_payload_cache_provider_check
    check (provider_key in ('open-meteo')),
  constraint weather_provider_payload_cache_status_check
    check (status in ('live', 'stale', 'unavailable')),
  constraint weather_provider_payload_cache_payload_check
    check (jsonb_typeof(payload) = 'object')
);

comment on table public.weather_provider_payload_cache is
  'Último payload completo e validado de provedores meteorológicos consultados por Edge Function.';

alter table public.weather_provider_payload_cache enable row level security;

create policy "weather provider cache private"
  on public.weather_provider_payload_cache
  for all to service_role
  using (true)
  with check (true);

revoke all on table public.weather_provider_payload_cache from public, anon, authenticated;
grant select, insert, update, delete on table public.weather_provider_payload_cache to service_role;

create index if not exists weather_provider_payload_cache_success_idx
  on public.weather_provider_payload_cache (last_success_at desc);

create or replace function public.set_weather_provider_payload_cache_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_weather_provider_payload_cache_updated_at()
  from public, anon, authenticated;

drop trigger if exists weather_provider_payload_cache_set_updated_at
  on public.weather_provider_payload_cache;
create trigger weather_provider_payload_cache_set_updated_at
before update on public.weather_provider_payload_cache
for each row execute function public.set_weather_provider_payload_cache_updated_at();

create or replace function public.claim_weather_provider_refresh(
  p_provider_key text,
  p_lease_token uuid,
  p_fresh_seconds integer default 240,
  p_stale_lease_seconds integer default 45
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.weather_provider_payload_cache
  set
    refresh_started_at = now(),
    refresh_lease_token = p_lease_token,
    last_attempt_at = now()
  where provider_key = p_provider_key
    and (
      last_success_at is null
      or last_success_at < now() - make_interval(secs => greatest(p_fresh_seconds, 30))
    )
    and (
      refresh_started_at is null
      or refresh_started_at < now() - make_interval(secs => greatest(p_stale_lease_seconds, 15))
    );

  return found;
end;
$$;

revoke execute on function public.claim_weather_provider_refresh(text, uuid, integer, integer)
  from public, anon, authenticated;
grant execute on function public.claim_weather_provider_refresh(text, uuid, integer, integer)
  to service_role;

insert into public.weather_provider_payload_cache (provider_key)
values ('open-meteo')
on conflict (provider_key) do nothing;
