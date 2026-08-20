create table if not exists public.data_source_status_checks (
  id bigint generated always as identity primary key,
  service_id text not null,
  service_name text not null,
  provider text not null,
  category text not null,
  state text not null,
  detail text not null,
  checked_at timestamptz not null,
  source_checked_at timestamptz,
  source_url text,
  created_at timestamptz not null default now(),
  constraint data_source_status_checks_service_id_check
    check (service_id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint data_source_status_checks_state_check
    check (state in ('operational', 'partial', 'maintenance', 'offline', 'implementation'))
);

comment on table public.data_source_status_checks is
  'Amostras periódicas do estado das fontes e integrações exibidas em /status-dos-dados.';

create unique index if not exists data_source_status_checks_service_checked_key
  on public.data_source_status_checks (service_id, checked_at);
create index if not exists data_source_status_checks_checked_at_idx
  on public.data_source_status_checks (checked_at desc);
create index if not exists data_source_status_checks_service_history_idx
  on public.data_source_status_checks (service_id, checked_at desc);

create table if not exists public.data_source_incidents (
  id bigint generated always as identity primary key,
  service_id text not null,
  service_name text not null,
  provider text not null,
  category text not null,
  incident_kind text not null,
  status text not null default 'open',
  opened_state text not null,
  current_state text not null,
  worst_state text not null,
  title text not null,
  detail text not null,
  opened_at timestamptz not null,
  last_seen_at timestamptz not null,
  resolved_at timestamptz,
  occurrence_count integer not null default 1,
  source_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint data_source_incidents_service_id_check
    check (service_id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint data_source_incidents_kind_check
    check (incident_kind in ('partial', 'offline', 'maintenance')),
  constraint data_source_incidents_status_check
    check (status in ('open', 'resolved')),
  constraint data_source_incidents_opened_state_check
    check (opened_state in ('partial', 'offline', 'maintenance')),
  constraint data_source_incidents_current_state_check
    check (current_state in ('operational', 'partial', 'maintenance', 'offline', 'implementation')),
  constraint data_source_incidents_worst_state_check
    check (worst_state in ('partial', 'offline', 'maintenance')),
  constraint data_source_incidents_occurrence_count_check
    check (occurrence_count > 0),
  constraint data_source_incidents_resolution_check
    check ((status = 'open' and resolved_at is null) or (status = 'resolved' and resolved_at is not null))
);

comment on table public.data_source_incidents is
  'Incidentes derivados das verificações automáticas das fontes de dados do Tempo Pelotas.';

create unique index if not exists data_source_incidents_one_open_per_service_idx
  on public.data_source_incidents (service_id)
  where status = 'open';
create index if not exists data_source_incidents_recent_idx
  on public.data_source_incidents (opened_at desc);
create index if not exists data_source_incidents_status_idx
  on public.data_source_incidents (status, last_seen_at desc);

create table if not exists public.data_source_maintenance_windows (
  id bigint generated always as identity primary key,
  service_id text not null,
  title text not null,
  message text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint data_source_maintenance_windows_service_id_check
    check (service_id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint data_source_maintenance_windows_period_check
    check (ends_at > starts_at)
);

comment on table public.data_source_maintenance_windows is
  'Janelas de manutenção programada que podem substituir temporariamente o estado automático de uma integração.';

create index if not exists data_source_maintenance_windows_period_idx
  on public.data_source_maintenance_windows (starts_at, ends_at)
  where cancelled_at is null;

create or replace function public.set_data_source_status_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists data_source_incidents_set_updated_at on public.data_source_incidents;
create trigger data_source_incidents_set_updated_at
before update on public.data_source_incidents
for each row execute function public.set_data_source_status_updated_at();

drop trigger if exists data_source_maintenance_windows_set_updated_at on public.data_source_maintenance_windows;
create trigger data_source_maintenance_windows_set_updated_at
before update on public.data_source_maintenance_windows
for each row execute function public.set_data_source_status_updated_at();

alter table public.data_source_status_checks enable row level security;
alter table public.data_source_incidents enable row level security;
alter table public.data_source_maintenance_windows enable row level security;

revoke all on table public.data_source_status_checks from anon, authenticated;
revoke all on table public.data_source_incidents from anon, authenticated;
revoke all on table public.data_source_maintenance_windows from anon, authenticated;

grant select, insert, update, delete on table public.data_source_status_checks to service_role;
grant select, insert, update, delete on table public.data_source_incidents to service_role;
grant select, insert, update, delete on table public.data_source_maintenance_windows to service_role;
grant usage, select on sequence public.data_source_status_checks_id_seq to service_role;
grant usage, select on sequence public.data_source_incidents_id_seq to service_role;
grant usage, select on sequence public.data_source_maintenance_windows_id_seq to service_role;

create policy "data source status checks private"
on public.data_source_status_checks
for all
to anon, authenticated
using (false)
with check (false);

create policy "data source incidents private"
on public.data_source_incidents
for all
to anon, authenticated
using (false)
with check (false);

create policy "data source maintenance private"
on public.data_source_maintenance_windows
for all
to anon, authenticated
using (false)
with check (false);

create or replace function public.record_data_source_status(
  p_checked_at timestamptz,
  p_services jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_service jsonb;
  v_service_id text;
  v_service_name text;
  v_provider text;
  v_category text;
  v_state text;
  v_detail text;
  v_source_checked_at timestamptz;
  v_source_url text;
  v_incident_id bigint;
  v_worst_state text;
  v_title text;
  v_affected integer;
  v_checks integer := 0;
  v_opened integer := 0;
  v_updated integer := 0;
  v_resolved integer := 0;
begin
  if p_checked_at is null then
    raise exception 'p_checked_at is required';
  end if;
  if jsonb_typeof(p_services) <> 'array' then
    raise exception 'p_services must be a JSON array';
  end if;

  for v_service in select value from jsonb_array_elements(p_services)
  loop
    v_service_id := nullif(trim(v_service ->> 'id'), '');
    v_service_name := nullif(trim(v_service ->> 'name'), '');
    v_provider := nullif(trim(v_service ->> 'provider'), '');
    v_category := nullif(trim(v_service ->> 'category'), '');
    v_state := nullif(trim(v_service ->> 'state'), '');
    v_detail := coalesce(nullif(trim(v_service ->> 'detail'), ''), 'Sem detalhe adicional.');
    v_source_url := nullif(trim(v_service ->> 'sourceUrl'), '');

    if v_service_id is null or v_service_name is null or v_provider is null or v_category is null then
      raise exception 'service payload is missing required identity fields';
    end if;
    if v_state not in ('operational', 'partial', 'maintenance', 'offline', 'implementation') then
      raise exception 'invalid service state: %', v_state;
    end if;

    begin
      v_source_checked_at := nullif(trim(v_service ->> 'checkedAt'), '')::timestamptz;
    exception when others then
      v_source_checked_at := null;
    end;

    insert into public.data_source_status_checks (
      service_id,
      service_name,
      provider,
      category,
      state,
      detail,
      checked_at,
      source_checked_at,
      source_url
    ) values (
      v_service_id,
      v_service_name,
      v_provider,
      v_category,
      v_state,
      v_detail,
      p_checked_at,
      v_source_checked_at,
      v_source_url
    )
    on conflict (service_id, checked_at) do nothing;

    get diagnostics v_affected = row_count;
    v_checks := v_checks + v_affected;

    if v_state in ('operational', 'implementation') then
      update public.data_source_incidents
      set status = 'resolved',
          current_state = v_state,
          last_seen_at = p_checked_at,
          resolved_at = p_checked_at,
          detail = v_detail,
          source_url = coalesce(v_source_url, source_url)
      where service_id = v_service_id
        and status = 'open';

      get diagnostics v_affected = row_count;
      v_resolved := v_resolved + v_affected;
      continue;
    end if;

    v_incident_id := null;
    v_worst_state := null;
    select id, worst_state
      into v_incident_id, v_worst_state
    from public.data_source_incidents
    where service_id = v_service_id
      and status = 'open'
    for update;

    v_title := case v_state
      when 'offline' then v_service_name || ': integração indisponível'
      when 'partial' then v_service_name || ': atualização parcial'
      else v_service_name || ': manutenção programada'
    end;

    if v_incident_id is null then
      insert into public.data_source_incidents (
        service_id,
        service_name,
        provider,
        category,
        incident_kind,
        status,
        opened_state,
        current_state,
        worst_state,
        title,
        detail,
        opened_at,
        last_seen_at,
        occurrence_count,
        source_url
      ) values (
        v_service_id,
        v_service_name,
        v_provider,
        v_category,
        v_state,
        'open',
        v_state,
        v_state,
        v_state,
        v_title,
        v_detail,
        p_checked_at,
        p_checked_at,
        1,
        v_source_url
      );
      v_opened := v_opened + 1;
    else
      update public.data_source_incidents
      set service_name = v_service_name,
          provider = v_provider,
          category = v_category,
          current_state = v_state,
          worst_state = case
            when v_worst_state = 'offline' or v_state = 'offline' then 'offline'
            when v_worst_state = 'partial' or v_state = 'partial' then 'partial'
            else 'maintenance'
          end,
          title = v_title,
          detail = v_detail,
          last_seen_at = p_checked_at,
          occurrence_count = occurrence_count + 1,
          source_url = coalesce(v_source_url, source_url)
      where id = v_incident_id;
      v_updated := v_updated + 1;
    end if;
  end loop;

  delete from public.data_source_status_checks
  where checked_at < p_checked_at - interval '180 days';

  return jsonb_build_object(
    'checksInserted', v_checks,
    'incidentsOpened', v_opened,
    'incidentsUpdated', v_updated,
    'incidentsResolved', v_resolved
  );
end;
$$;

revoke all on function public.record_data_source_status(timestamptz, jsonb) from public, anon, authenticated;
grant execute on function public.record_data_source_status(timestamptz, jsonb) to service_role;

create or replace function public.get_data_source_availability(p_since timestamptz)
returns table (
  service_id text,
  service_name text,
  provider text,
  measured_checks bigint,
  operational_checks bigint,
  partial_checks bigint,
  offline_checks bigint,
  availability_percent numeric
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    checks.service_id,
    max(checks.service_name) as service_name,
    max(checks.provider) as provider,
    count(*) filter (where checks.state in ('operational', 'partial', 'offline')) as measured_checks,
    count(*) filter (where checks.state = 'operational') as operational_checks,
    count(*) filter (where checks.state = 'partial') as partial_checks,
    count(*) filter (where checks.state = 'offline') as offline_checks,
    round(
      100.0 * count(*) filter (where checks.state = 'operational') /
      nullif(count(*) filter (where checks.state in ('operational', 'partial', 'offline')), 0),
      1
    ) as availability_percent
  from public.data_source_status_checks as checks
  where checks.checked_at >= p_since
  group by checks.service_id
  having count(*) filter (where checks.state in ('operational', 'partial', 'offline')) > 0
  order by checks.service_id;
$$;

revoke all on function public.get_data_source_availability(timestamptz) from public, anon, authenticated;
grant execute on function public.get_data_source_availability(timestamptz) to service_role;
