create or replace function public.mirror_embrapa_daily_extremes_to_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  local_day date;
  day_start timestamptz;
begin
  if new.station_id <> 'embrapa-cpact-sede-pelotas' then
    return new;
  end if;

  local_day := (new.fetched_at at time zone 'America/Sao_Paulo')::date;
  day_start := local_day::timestamp at time zone 'America/Sao_Paulo';

  insert into public.historical_measurements (
    source_key,
    station_key,
    variable_key,
    data_class,
    observed_at,
    value_numeric,
    value_text,
    unit,
    quality_flag,
    source_record_id,
    metadata
  )
  select
    'embrapa-cpact',
    new.station_id,
    point.variable_key,
    'observation',
    day_start,
    point.value_numeric,
    null,
    point.unit,
    new.status,
    new.source_hash,
    jsonb_strip_nulls(
      jsonb_build_object(
        'period', 'day',
        'localDate', local_day::text,
        'extremeTime', point.extreme_time,
        'stationName', new.station_name,
        'sourceSnapshotAt', new.fetched_at,
        'observationTime', new.observation_time
      )
    )
  from (
    values
      (
        'temperature_daily_min',
        case
          when jsonb_typeof(new.payload #> '{extremes,temperatureMin,value}') = 'number'
            then (new.payload #>> '{extremes,temperatureMin,value}')::double precision
          else null
        end,
        'celsius',
        new.payload #>> '{extremes,temperatureMin,time}'
      ),
      (
        'temperature_daily_max',
        case
          when jsonb_typeof(new.payload #> '{extremes,temperatureMax,value}') = 'number'
            then (new.payload #>> '{extremes,temperatureMax,value}')::double precision
          else null
        end,
        'celsius',
        new.payload #>> '{extremes,temperatureMax,time}'
      ),
      (
        'humidity_daily_min',
        case
          when jsonb_typeof(new.payload #> '{extremes,humidityMin,value}') = 'number'
            then (new.payload #>> '{extremes,humidityMin,value}')::double precision
          else null
        end,
        'percent',
        new.payload #>> '{extremes,humidityMin,time}'
      ),
      (
        'humidity_daily_max',
        case
          when jsonb_typeof(new.payload #> '{extremes,humidityMax,value}') = 'number'
            then (new.payload #>> '{extremes,humidityMax,value}')::double precision
          else null
        end,
        'percent',
        new.payload #>> '{extremes,humidityMax,time}'
      ),
      (
        'dew_point_daily_min',
        case
          when jsonb_typeof(new.payload #> '{extremes,dewPointMin,value}') = 'number'
            then (new.payload #>> '{extremes,dewPointMin,value}')::double precision
          else null
        end,
        'celsius',
        new.payload #>> '{extremes,dewPointMin,time}'
      ),
      (
        'dew_point_daily_max',
        case
          when jsonb_typeof(new.payload #> '{extremes,dewPointMax,value}') = 'number'
            then (new.payload #>> '{extremes,dewPointMax,value}')::double precision
          else null
        end,
        'celsius',
        new.payload #>> '{extremes,dewPointMax,time}'
      ),
      (
        'wind_speed_daily_max',
        case
          when jsonb_typeof(new.payload #> '{extremes,windSpeedMax,value}') = 'number'
            then (new.payload #>> '{extremes,windSpeedMax,value}')::double precision
          else null
        end,
        'km_h',
        new.payload #>> '{extremes,windSpeedMax,time}'
      )
  ) as point(variable_key, value_numeric, unit, extreme_time)
  where point.value_numeric is not null
  on conflict (source_key, station_key, variable_key, data_class, observed_at)
  do update set
    value_numeric = excluded.value_numeric,
    quality_flag = excluded.quality_flag,
    source_record_id = excluded.source_record_id,
    metadata = excluded.metadata,
    ingested_at = now();

  return new;
end;
$$;

revoke execute on function public.mirror_embrapa_daily_extremes_to_history() from public, anon, authenticated;
grant execute on function public.mirror_embrapa_daily_extremes_to_history() to service_role;

drop trigger if exists weather_station_observations_mirror_daily_extremes
  on public.weather_station_observations;

create trigger weather_station_observations_mirror_daily_extremes
after insert on public.weather_station_observations
for each row execute function public.mirror_embrapa_daily_extremes_to_history();

with latest_per_local_day as (
  select distinct on ((observation.fetched_at at time zone 'America/Sao_Paulo')::date)
    observation.*
  from public.weather_station_observations observation
  where observation.station_id = 'embrapa-cpact-sede-pelotas'
  order by
    (observation.fetched_at at time zone 'America/Sao_Paulo')::date,
    observation.fetched_at desc
),
backfill_points as (
  select
    'embrapa-cpact'::text as source_key,
    observation.station_id as station_key,
    point.variable_key,
    'observation'::text as data_class,
    (
      date_trunc('day', observation.fetched_at at time zone 'America/Sao_Paulo')
      at time zone 'America/Sao_Paulo'
    ) as observed_at,
    point.value_numeric,
    null::text as value_text,
    point.unit,
    observation.status as quality_flag,
    observation.source_hash as source_record_id,
    jsonb_strip_nulls(
      jsonb_build_object(
        'period', 'day',
        'localDate', ((observation.fetched_at at time zone 'America/Sao_Paulo')::date)::text,
        'extremeTime', point.extreme_time,
        'stationName', observation.station_name,
        'sourceSnapshotAt', observation.fetched_at,
        'observationTime', observation.observation_time,
        'backfilledFromOwnArchive', true
      )
    ) as metadata
  from latest_per_local_day observation
  cross join lateral (
    values
      (
        'temperature_daily_min',
        case
          when jsonb_typeof(observation.payload #> '{extremes,temperatureMin,value}') = 'number'
            then (observation.payload #>> '{extremes,temperatureMin,value}')::double precision
          else null
        end,
        'celsius',
        observation.payload #>> '{extremes,temperatureMin,time}'
      ),
      (
        'temperature_daily_max',
        case
          when jsonb_typeof(observation.payload #> '{extremes,temperatureMax,value}') = 'number'
            then (observation.payload #>> '{extremes,temperatureMax,value}')::double precision
          else null
        end,
        'celsius',
        observation.payload #>> '{extremes,temperatureMax,time}'
      ),
      (
        'humidity_daily_min',
        case
          when jsonb_typeof(observation.payload #> '{extremes,humidityMin,value}') = 'number'
            then (observation.payload #>> '{extremes,humidityMin,value}')::double precision
          else null
        end,
        'percent',
        observation.payload #>> '{extremes,humidityMin,time}'
      ),
      (
        'humidity_daily_max',
        case
          when jsonb_typeof(observation.payload #> '{extremes,humidityMax,value}') = 'number'
            then (observation.payload #>> '{extremes,humidityMax,value}')::double precision
          else null
        end,
        'percent',
        observation.payload #>> '{extremes,humidityMax,time}'
      ),
      (
        'dew_point_daily_min',
        case
          when jsonb_typeof(observation.payload #> '{extremes,dewPointMin,value}') = 'number'
            then (observation.payload #>> '{extremes,dewPointMin,value}')::double precision
          else null
        end,
        'celsius',
        observation.payload #>> '{extremes,dewPointMin,time}'
      ),
      (
        'dew_point_daily_max',
        case
          when jsonb_typeof(observation.payload #> '{extremes,dewPointMax,value}') = 'number'
            then (observation.payload #>> '{extremes,dewPointMax,value}')::double precision
          else null
        end,
        'celsius',
        observation.payload #>> '{extremes,dewPointMax,time}'
      ),
      (
        'wind_speed_daily_max',
        case
          when jsonb_typeof(observation.payload #> '{extremes,windSpeedMax,value}') = 'number'
            then (observation.payload #>> '{extremes,windSpeedMax,value}')::double precision
          else null
        end,
        'km_h',
        observation.payload #>> '{extremes,windSpeedMax,time}'
      )
  ) as point(variable_key, value_numeric, unit, extreme_time)
  where point.value_numeric is not null
)
insert into public.historical_measurements (
  source_key,
  station_key,
  variable_key,
  data_class,
  observed_at,
  value_numeric,
  value_text,
  unit,
  quality_flag,
  source_record_id,
  metadata
)
select
  source_key,
  station_key,
  variable_key,
  data_class,
  observed_at,
  value_numeric,
  value_text,
  unit,
  quality_flag,
  source_record_id,
  metadata
from backfill_points
on conflict (source_key, station_key, variable_key, data_class, observed_at)
do update set
  value_numeric = excluded.value_numeric,
  quality_flag = excluded.quality_flag,
  source_record_id = excluded.source_record_id,
  metadata = excluded.metadata,
  ingested_at = now();

comment on function public.mirror_embrapa_daily_extremes_to_history() is
  'Mantém um ponto canônico por dia local para extremos diários informados pela Embrapa; o ponto do dia corrente é atualizado até a última leitura disponível.';
