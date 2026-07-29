create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;

create or replace function private.record_account_consent_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  current_policy_version constant text := '2026-07-23';
begin
  -- Criações automáticas feitas pelo gatilho do Auth não representam consentimento.
  -- Somente uma alteração executada na sessão do próprio titular gera histórico.
  if current_user_id is null or current_user_id is distinct from new.user_id then
    return new;
  end if;

  if tg_op = 'INSERT' or old.weather_alerts is distinct from new.weather_alerts then
    insert into public.account_consent_events (
      user_id,
      channel,
      granted,
      source,
      policy_version
    ) values (
      current_user_id,
      'weather_alerts',
      new.weather_alerts,
      'account',
      current_policy_version
    );
  end if;

  if tg_op = 'INSERT' or old.water_alerts is distinct from new.water_alerts then
    insert into public.account_consent_events (
      user_id,
      channel,
      granted,
      source,
      policy_version
    ) values (
      current_user_id,
      'water_alerts',
      new.water_alerts,
      'account',
      current_policy_version
    );
  end if;

  if tg_op = 'INSERT' or old.daily_summary is distinct from new.daily_summary then
    insert into public.account_consent_events (
      user_id,
      channel,
      granted,
      source,
      policy_version
    ) values (
      current_user_id,
      'daily_summary',
      new.daily_summary,
      'account',
      current_policy_version
    );
  end if;

  if tg_op = 'INSERT' or old.community_updates is distinct from new.community_updates then
    insert into public.account_consent_events (
      user_id,
      channel,
      granted,
      source,
      policy_version
    ) values (
      current_user_id,
      'community_updates',
      new.community_updates,
      'account',
      current_policy_version
    );
  end if;

  return new;
end;
$$;

revoke all on function private.record_account_consent_changes() from public;
revoke all on function private.record_account_consent_changes() from anon;
revoke all on function private.record_account_consent_changes() from authenticated;


drop trigger if exists user_preferences_record_consent_changes
  on public.user_preferences;
create trigger user_preferences_record_consent_changes
after insert or update of
  weather_alerts,
  water_alerts,
  daily_summary,
  community_updates
on public.user_preferences
for each row execute function private.record_account_consent_changes();

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
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  claims jsonb := coalesce((select auth.jwt()), '{}'::jsonb);
  metadata jsonb := coalesce(claims -> 'user_metadata', '{}'::jsonb);
  normalized_display_name text := nullif(btrim(p_display_name), '');
  canonical_email text := coalesce(
    nullif(btrim(claims ->> 'email'), ''),
    nullif(btrim(p_email), '')
  );
  canonical_avatar_url text := coalesce(
    nullif(btrim(metadata ->> 'avatar_url'), ''),
    nullif(btrim(metadata ->> 'picture'), ''),
    nullif(btrim(p_avatar_url), '')
  );
begin
  if current_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if normalized_display_name is not null and char_length(normalized_display_name) > 80 then
    raise exception 'display name is too long' using errcode = '22001';
  end if;

  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    current_user_id,
    canonical_email,
    normalized_display_name,
    canonical_avatar_url
  )
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
end;
$$;

revoke all on function public.update_account_preferences(
  text,
  text,
  text,
  boolean,
  boolean,
  boolean,
  boolean
) from public;
revoke all on function public.update_account_preferences(
  text,
  text,
  text,
  boolean,
  boolean,
  boolean,
  boolean
) from anon;
revoke all on function public.update_account_preferences(
  text,
  text,
  text,
  boolean,
  boolean,
  boolean,
  boolean
) from authenticated;
grant execute on function public.update_account_preferences(
  text,
  text,
  text,
  boolean,
  boolean,
  boolean,
  boolean
) to authenticated;

-- RLS continua delimitando as linhas, mas privilégios de tabela também seguem
-- o princípio do menor acesso. TRUNCATE, DELETE, REFERENCES e TRIGGER não são
-- necessários para a interface autenticada.
revoke all on table public.profiles from authenticated;
grant select, insert, update on table public.profiles to authenticated;

revoke all on table public.user_preferences from authenticated;
grant select, insert, update on table public.user_preferences to authenticated;

drop policy if exists "Users can delete own preferences"
  on public.user_preferences;

revoke all on table public.account_consent_events from authenticated;
grant select on table public.account_consent_events to authenticated;
