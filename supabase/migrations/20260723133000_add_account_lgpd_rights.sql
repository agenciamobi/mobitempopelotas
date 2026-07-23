alter table public.web_push_subscriptions
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists web_push_subscriptions_user_id_idx
  on public.web_push_subscriptions (user_id)
  where user_id is not null;

create table if not exists public.account_consent_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null,
  granted boolean not null,
  source text not null default 'account',
  policy_version text not null,
  created_at timestamptz not null default now(),
  constraint account_consent_channel_allowed check (
    channel in ('weather_alerts', 'water_alerts', 'daily_summary', 'community_updates')
  ),
  constraint account_consent_source_length check (char_length(source) between 1 and 80),
  constraint account_consent_policy_version_length check (char_length(policy_version) between 1 and 80)
);

create index if not exists account_consent_events_user_created_idx
  on public.account_consent_events (user_id, created_at desc, id desc);

alter table public.account_consent_events enable row level security;

create policy "Users can read own consent history"
on public.account_consent_events
for select
to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.account_consent_events from public;
revoke all on table public.account_consent_events from anon;
revoke all on table public.account_consent_events from authenticated;
grant select on table public.account_consent_events to authenticated;
grant select, insert, update, delete on table public.account_consent_events to service_role;

revoke all on sequence public.account_consent_events_id_seq from public;
revoke all on sequence public.account_consent_events_id_seq from anon;
revoke all on sequence public.account_consent_events_id_seq from authenticated;
grant usage, select on sequence public.account_consent_events_id_seq to service_role;

create or replace function public.update_account_preferences(
  p_display_name text,
  p_email text,
  p_avatar_url text,
  p_weather_alerts boolean,
  p_water_alerts boolean,
  p_daily_summary boolean,
  p_community_updates boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  normalized_display_name text := nullif(btrim(p_display_name), '');
  current_policy_version constant text := '2026-07-23';
begin
  if current_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if normalized_display_name is not null and char_length(normalized_display_name) > 80 then
    raise exception 'display name is too long' using errcode = '22001';
  end if;

  insert into public.profiles (id, email, display_name, avatar_url)
  values (current_user_id, p_email, normalized_display_name, p_avatar_url)
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = excluded.display_name,
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();

  insert into public.user_preferences (
    user_id,
    weather_alerts,
    water_alerts,
    daily_summary,
    community_updates
  )
  values (
    current_user_id,
    p_weather_alerts,
    p_water_alerts,
    p_daily_summary,
    p_community_updates
  )
  on conflict (user_id) do update
  set
    weather_alerts = excluded.weather_alerts,
    water_alerts = excluded.water_alerts,
    daily_summary = excluded.daily_summary,
    community_updates = excluded.community_updates,
    updated_at = now();

  insert into public.account_consent_events (user_id, channel, granted, source, policy_version)
  select current_user_id, 'weather_alerts', p_weather_alerts, 'account', current_policy_version
  where (
    select granted from public.account_consent_events
    where user_id = current_user_id and channel = 'weather_alerts'
    order by created_at desc, id desc limit 1
  ) is distinct from p_weather_alerts;

  insert into public.account_consent_events (user_id, channel, granted, source, policy_version)
  select current_user_id, 'water_alerts', p_water_alerts, 'account', current_policy_version
  where (
    select granted from public.account_consent_events
    where user_id = current_user_id and channel = 'water_alerts'
    order by created_at desc, id desc limit 1
  ) is distinct from p_water_alerts;

  insert into public.account_consent_events (user_id, channel, granted, source, policy_version)
  select current_user_id, 'daily_summary', p_daily_summary, 'account', current_policy_version
  where (
    select granted from public.account_consent_events
    where user_id = current_user_id and channel = 'daily_summary'
    order by created_at desc, id desc limit 1
  ) is distinct from p_daily_summary;

  insert into public.account_consent_events (user_id, channel, granted, source, policy_version)
  select current_user_id, 'community_updates', p_community_updates, 'account', current_policy_version
  where (
    select granted from public.account_consent_events
    where user_id = current_user_id and channel = 'community_updates'
    order by created_at desc, id desc limit 1
  ) is distinct from p_community_updates;
end;
$$;

revoke all on function public.update_account_preferences(
  text, text, text, boolean, boolean, boolean, boolean
) from public;
revoke all on function public.update_account_preferences(
  text, text, text, boolean, boolean, boolean, boolean
) from anon;
grant execute on function public.update_account_preferences(
  text, text, text, boolean, boolean, boolean, boolean
) to authenticated;
