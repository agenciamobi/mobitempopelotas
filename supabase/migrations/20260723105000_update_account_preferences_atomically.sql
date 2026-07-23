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
  normalized_display_name text := nullif(btrim(p_display_name), '');
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
    p_email,
    normalized_display_name,
    p_avatar_url
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
grant execute on function public.update_account_preferences(
  text,
  text,
  text,
  boolean,
  boolean,
  boolean,
  boolean
) to authenticated;
