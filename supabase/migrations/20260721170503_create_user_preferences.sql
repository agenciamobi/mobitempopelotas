create table public.user_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  weather_alerts boolean not null default true,
  water_alerts boolean not null default true,
  daily_summary boolean not null default false,
  community_updates boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "Users can read own preferences"
on public.user_preferences
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert own preferences"
on public.user_preferences
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update own preferences"
on public.user_preferences
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete own preferences"
on public.user_preferences
for delete
to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.user_preferences from anon;
grant select, insert, update, delete on table public.user_preferences to authenticated;

create or replace function public.set_user_preferences_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_preferences_set_updated_at
before update on public.user_preferences
for each row execute function public.set_user_preferences_updated_at();

create or replace function public.handle_new_user_preferences()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke execute on function public.handle_new_user_preferences() from public;
revoke execute on function public.handle_new_user_preferences() from anon;
revoke execute on function public.handle_new_user_preferences() from authenticated;
grant execute on function public.handle_new_user_preferences() to supabase_auth_admin;

create trigger on_auth_user_created_create_preferences
after insert on auth.users
for each row execute function public.handle_new_user_preferences();

insert into public.user_preferences (user_id)
select id from auth.users
on conflict (user_id) do nothing;
