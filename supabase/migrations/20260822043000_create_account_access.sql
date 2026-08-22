create table if not exists public.account_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  tier text not null default 'free',
  status text not null default 'active',
  source text not null default 'system',
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_access_tier_check check (tier in ('free', 'pro')),
  constraint account_access_status_check check (status in ('active', 'suspended', 'expired'))
);

comment on table public.account_access is 'Camada de acesso da conta Tempo Pelotas. Billing futuro deve conceder/revogar acesso por integração server-side, sem tornar esta tabela fonte financeira.';
comment on column public.account_access.tier is 'Camada de produto efetiva: free ou pro.';
comment on column public.account_access.source is 'Origem da concessão, por exemplo system, admin ou billing.';
comment on column public.account_access.valid_until is 'Validade opcional da concessão. NULL significa sem expiração definida nesta camada.';

alter table public.account_access enable row level security;

revoke all on table public.account_access from public, anon, authenticated;
grant select on table public.account_access to authenticated;
grant select, insert, update, delete on table public.account_access to service_role;

drop policy if exists account_access_select_own on public.account_access;
create policy account_access_select_own
on public.account_access
for select
to authenticated
using ((select auth.uid()) = user_id);

create or replace function public.set_account_access_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_account_access_updated_at() from public, anon, authenticated;
grant execute on function public.set_account_access_updated_at() to service_role;

drop trigger if exists account_access_set_updated_at on public.account_access;
create trigger account_access_set_updated_at
before update on public.account_access
for each row execute function public.set_account_access_updated_at();

create or replace function public.handle_new_user_account_access()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.account_access (user_id, tier, status, source)
  values (new.id, 'free', 'active', 'system')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke execute on function public.handle_new_user_account_access() from public, anon, authenticated;
grant execute on function public.handle_new_user_account_access() to service_role;

drop trigger if exists on_auth_user_created_account_access on auth.users;
create trigger on_auth_user_created_account_access
after insert on auth.users
for each row execute function public.handle_new_user_account_access();

insert into public.account_access (user_id, tier, status, source)
select id, 'free', 'active', 'system'
from auth.users
on conflict (user_id) do nothing;
