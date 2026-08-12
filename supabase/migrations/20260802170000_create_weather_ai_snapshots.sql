create table if not exists public.weather_ai_snapshots (
  slot_key text primary key,
  period text not null,
  status text not null default 'claimed',
  lease_token uuid not null,
  claimed_at timestamptz not null default now(),
  completed_at timestamptz,
  generated_at timestamptz,
  source_fetched_at timestamptz,
  source_fingerprint text,
  reused_from_slot text,
  brief jsonb,
  model text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weather_ai_slot_key_format check (
    slot_key ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}-(overnight|morning|afternoon|evening)$'
  ),
  constraint weather_ai_period_allowed check (
    period in ('overnight', 'morning', 'afternoon', 'evening')
  ),
  constraint weather_ai_status_allowed check (
    status in ('claimed', 'generated', 'failed')
  ),
  constraint weather_ai_source_fingerprint_format check (
    source_fingerprint is null or source_fingerprint ~ '^[a-f0-9]{64}$'
  ),
  constraint weather_ai_model_length check (
    model is null or char_length(model) <= 120
  ),
  constraint weather_ai_error_length check (
    error is null or char_length(error) <= 800
  ),
  constraint weather_ai_completion_consistent check (
    (status = 'claimed' and completed_at is null and generated_at is null and brief is null and source_fingerprint is null)
    or
    (status = 'generated' and completed_at is not null and generated_at is not null and brief is not null and source_fingerprint is not null)
    or
    (status = 'failed' and completed_at is not null and brief is null and source_fingerprint is null)
  )
);

create index if not exists weather_ai_snapshots_generated_at_idx
  on public.weather_ai_snapshots (generated_at desc)
  where status = 'generated';

create index if not exists weather_ai_snapshots_fingerprint_idx
  on public.weather_ai_snapshots (source_fingerprint, generated_at desc)
  where status = 'generated' and source_fingerprint is not null;

create index if not exists weather_ai_snapshots_status_claimed_at_idx
  on public.weather_ai_snapshots (status, claimed_at desc);

alter table public.weather_ai_snapshots enable row level security;

revoke all on table public.weather_ai_snapshots from public;
revoke all on table public.weather_ai_snapshots from anon;
revoke all on table public.weather_ai_snapshots from authenticated;
grant select, insert, update, delete on table public.weather_ai_snapshots to service_role;
