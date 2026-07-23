create table if not exists public.web_push_subscriptions (
  endpoint text primary key,
  expiration_time bigint,
  p256dh text not null,
  auth text not null,
  user_agent text,
  topics text[] not null default array['weather', 'water', 'community']::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  constraint web_push_endpoint_https check (endpoint like 'https://%'),
  constraint web_push_endpoint_length check (char_length(endpoint) <= 2048),
  constraint web_push_p256dh_length check (char_length(p256dh) between 16 and 512),
  constraint web_push_auth_length check (char_length(auth) between 8 and 256),
  constraint web_push_topics_allowed check (
    topics <@ array['weather', 'water', 'community']::text[]
    and cardinality(topics) between 1 and 3
  )
);

create index if not exists web_push_subscriptions_updated_at_idx
  on public.web_push_subscriptions (updated_at desc);

alter table public.web_push_subscriptions enable row level security;

revoke all on table public.web_push_subscriptions from public;
revoke all on table public.web_push_subscriptions from anon;
revoke all on table public.web_push_subscriptions from authenticated;
grant select, insert, update, delete on table public.web_push_subscriptions to service_role;

create table if not exists public.web_push_dispatches (
  fingerprint text primary key,
  title text not null,
  status text not null default 'claimed',
  lease_token uuid not null,
  claimed_at timestamptz not null default now(),
  completed_at timestamptz,
  sent_count integer not null default 0,
  failed_count integer not null default 0,
  removed_count integer not null default 0,
  sent_at timestamptz not null default now(),
  constraint web_push_dispatch_fingerprint_length check (char_length(fingerprint) <= 160),
  constraint web_push_dispatch_title_length check (char_length(title) <= 160),
  constraint web_push_dispatch_status_allowed check (status in ('claimed', 'completed')),
  constraint web_push_dispatch_completion_consistent check (
    (status = 'claimed' and completed_at is null)
    or (status = 'completed' and completed_at is not null)
  ),
  constraint web_push_dispatch_counts_nonnegative check (
    sent_count >= 0 and failed_count >= 0 and removed_count >= 0
  )
);

create index if not exists web_push_dispatches_sent_at_idx
  on public.web_push_dispatches (sent_at desc);
create index if not exists web_push_dispatches_claimed_at_idx
  on public.web_push_dispatches (status, claimed_at)
  where status = 'claimed';

alter table public.web_push_dispatches enable row level security;

revoke all on table public.web_push_dispatches from public;
revoke all on table public.web_push_dispatches from anon;
revoke all on table public.web_push_dispatches from authenticated;
grant select, insert, update, delete on table public.web_push_dispatches to service_role;

create or replace function public.claim_web_push_dispatch(
  p_fingerprint text,
  p_title text,
  p_lease_token uuid,
  p_stale_after_seconds integer default 900
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  affected_rows integer;
begin
  if p_stale_after_seconds < 60 or p_stale_after_seconds > 86400 then
    raise exception 'invalid lease duration';
  end if;

  insert into public.web_push_dispatches (
    fingerprint,
    title,
    status,
    lease_token,
    claimed_at,
    completed_at,
    sent_count,
    failed_count,
    removed_count,
    sent_at
  )
  values (
    p_fingerprint,
    p_title,
    'claimed',
    p_lease_token,
    now(),
    null,
    0,
    0,
    0,
    now()
  )
  on conflict (fingerprint) do update
  set
    title = excluded.title,
    status = 'claimed',
    lease_token = excluded.lease_token,
    claimed_at = excluded.claimed_at,
    completed_at = null,
    sent_count = 0,
    failed_count = 0,
    removed_count = 0,
    sent_at = excluded.sent_at
  where public.web_push_dispatches.status = 'claimed'
    and public.web_push_dispatches.claimed_at <=
      now() - (p_stale_after_seconds * interval '1 second');

  get diagnostics affected_rows = row_count;
  return affected_rows = 1;
end;
$$;

revoke execute on function public.claim_web_push_dispatch(text, text, uuid, integer) from public;
revoke execute on function public.claim_web_push_dispatch(text, text, uuid, integer) from anon;
revoke execute on function public.claim_web_push_dispatch(text, text, uuid, integer) from authenticated;
grant execute on function public.claim_web_push_dispatch(text, text, uuid, integer) to service_role;
