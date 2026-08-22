create or replace function public.ensure_current_user_account_foundation()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_email text;
  v_display_name text;
  v_avatar_url text;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select
    u.email,
    coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name'),
    coalesce(u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture')
  into v_email, v_display_name, v_avatar_url
  from auth.users u
  where u.id = v_user_id;

  if not found then
    raise exception 'authenticated user not found' using errcode = '42501';
  end if;

  insert into public.profiles (id, email, display_name, avatar_url)
  values (v_user_id, v_email, v_display_name, v_avatar_url)
  on conflict (id) do update
  set
    email = coalesce(excluded.email, public.profiles.email),
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    updated_at = now();

  insert into public.user_preferences (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;

  insert into public.account_access (user_id, tier, status, source)
  values (v_user_id, 'free', 'active', 'system')
  on conflict (user_id) do nothing;
end;
$$;

comment on function public.ensure_current_user_account_foundation() is
  'Repara somente a fundação da própria conta autenticada. Uma linha ausente de account_access sempre nasce Free; a função nunca concede PRO.';

revoke all on function public.ensure_current_user_account_foundation() from public, anon;
grant execute on function public.ensure_current_user_account_foundation() to authenticated;
