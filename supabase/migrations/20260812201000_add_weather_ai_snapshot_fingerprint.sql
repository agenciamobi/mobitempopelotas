alter table public.weather_ai_snapshots
  add column if not exists source_fingerprint text,
  add column if not exists reused_from_slot text;

alter table public.weather_ai_snapshots
  drop constraint if exists weather_ai_source_fingerprint_format;

alter table public.weather_ai_snapshots
  add constraint weather_ai_source_fingerprint_format check (
    source_fingerprint is null or source_fingerprint ~ '^[a-f0-9]{64}$'
  );

alter table public.weather_ai_snapshots
  drop constraint if exists weather_ai_completion_consistent;

alter table public.weather_ai_snapshots
  add constraint weather_ai_completion_consistent check (
    (status = 'claimed' and completed_at is null and generated_at is null and brief is null and source_fingerprint is null)
    or
    (status = 'generated' and completed_at is not null and generated_at is not null and brief is not null and source_fingerprint is not null)
    or
    (status = 'failed' and completed_at is not null and brief is null and source_fingerprint is null)
  ) not valid;

create index if not exists weather_ai_snapshots_fingerprint_idx
  on public.weather_ai_snapshots (source_fingerprint, generated_at desc)
  where status = 'generated' and source_fingerprint is not null;

-- Registros gerados antes da adoção do fingerprint continuam legíveis no histórico,
-- mas não são usados pelo runtime atual até que um novo ciclo produza source_fingerprint.
