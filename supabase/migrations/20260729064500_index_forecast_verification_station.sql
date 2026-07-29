create index if not exists weather_forecast_verifications_station_idx
  on public.weather_forecast_verifications (station_id, target_date desc);
