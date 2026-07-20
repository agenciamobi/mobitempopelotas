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
  constraint web_push_auth_length check (char_length(auth) between 8 and 256)
);

create index if not exists web_push_subscriptions_updated_at_idx
  on public.web_push_subscriptions (updated_at desc);

alter table public.web_push_subscriptions enable row level security;

revoke all on table public.web_push_subscriptions from anon, authenticated;
grant select, insert, update, delete on table public.web_push_subscriptions to service_role;

create table if not exists public.web_push_dispatches (
  fingerprint text primary key,
  title text not null,
  sent_count integer not null default 0,
  sent_at timestamptz not null default now(),
  constraint web_push_dispatch_fingerprint_length check (char_length(fingerprint) <= 160),
  constraint web_push_dispatch_title_length check (char_length(title) <= 160)
);

create index if not exists web_push_dispatches_sent_at_idx
  on public.web_push_dispatches (sent_at desc);

alter table public.web_push_dispatches enable row level security;

revoke all on table public.web_push_dispatches from anon, authenticated;
grant select, insert, update, delete on table public.web_push_dispatches to service_role;
