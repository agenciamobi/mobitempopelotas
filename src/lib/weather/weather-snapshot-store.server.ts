import type { Database } from "@/lib/supabase/database.types";
import {
  createSupabaseAdminClient,
  getSupabaseServerConfig,
} from "@/lib/supabase/server-client.server";

import type { HistoricalWeatherDay } from "./history.types";

const LOCATION_SLUG = "pelotas-rs";
const TIMEZONE = "America/Sao_Paulo";
const PELOTAS = {
  city: "Pelotas",
  state: "RS",
  latitude: -31.7654,
  longitude: -52.3376,
} as const;

type WeatherSnapshotRow = Database["public"]["Tables"]["weather_daily_snapshots"]["Row"];
type WeatherSnapshotInsert = Database["public"]["Tables"]["weather_daily_snapshots"]["Insert"];

export type WeatherSnapshotStorageStatus = {
  configured: boolean;
  mode: "mock" | "external";
  missing: string[];
};

function formatStoredDay(date: string) {
  const value = new Date(`${date}T12:00:00-03:00`);
  const label = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: TIMEZONE,
  })
    .format(value)
    .replace(" de ", " ")
    .replace(".", "");
  const weekday = new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    timeZone: TIMEZONE,
  })
    .format(value)
    .replace(".", "")
    .replace(/^./, (letter) => letter.toUpperCase());

  return { label, weekday };
}

function rowToHistoricalDay(row: WeatherSnapshotRow): HistoricalWeatherDay {
  const { label, weekday } = formatStoredDay(row.observed_date);

  return {
    date: row.observed_date,
    label,
    weekday,
    temperatureMax: Number(row.temperature_max),
    temperatureMin: Number(row.temperature_min),
    precipitation: row.precipitation === null ? null : Number(row.precipitation),
    windGust: row.wind_gust === null ? null : Number(row.wind_gust),
  };
}

function dayToSnapshotRow(
  day: HistoricalWeatherDay,
  sourceName: string,
  sourceUpdatedAt: string,
): WeatherSnapshotInsert {
  return {
    location_slug: LOCATION_SLUG,
    observed_date: day.date,
    city: PELOTAS.city,
    state: PELOTAS.state,
    latitude: PELOTAS.latitude,
    longitude: PELOTAS.longitude,
    temperature_max: day.temperatureMax,
    temperature_min: day.temperatureMin,
    precipitation: day.precipitation,
    wind_gust: day.windGust,
    source_name: sourceName,
    source_updated_at: sourceUpdatedAt,
  };
}

export function getWeatherSnapshotStorageStatus(): WeatherSnapshotStorageStatus {
  const config = getSupabaseServerConfig();
  const missing: string[] = [];

  if (config.mode !== "external") missing.push("SUPABASE_MODE=external");
  if (!config.url) missing.push("SUPABASE_URL");
  if (!config.secretKey) missing.push("SUPABASE_SECRET_KEY");

  return {
    configured: config.isAdminConfigured,
    mode: config.mode,
    missing,
  };
}

export async function listWeatherSnapshots(limit = 30): Promise<HistoricalWeatherDay[]> {
  const status = getWeatherSnapshotStorageStatus();
  if (!status.configured) return [];

  const client = createSupabaseAdminClient();
  const safeLimit = Math.max(1, Math.min(Math.trunc(limit), 3650));
  const { data, error } = await client
    .from("weather_daily_snapshots")
    .select("*")
    .eq("location_slug", LOCATION_SLUG)
    .order("observed_date", { ascending: false })
    .limit(safeLimit);

  if (error) {
    throw new Error(`Falha ao consultar o arquivo meteorológico: ${error.message}`);
  }

  return (data ?? []).reverse().map(rowToHistoricalDay);
}

export async function upsertWeatherSnapshots(
  days: HistoricalWeatherDay[],
  sourceName: string,
): Promise<HistoricalWeatherDay[]> {
  const status = getWeatherSnapshotStorageStatus();
  if (!status.configured) {
    throw new Error(
      `O arquivo meteorológico não está configurado: ${status.missing.join(", ") || "configuração incompleta"}.`,
    );
  }

  if (days.length === 0) return [];

  const sourceUpdatedAt = new Date().toISOString();
  const rows = days.map((day) => dayToSnapshotRow(day, sourceName, sourceUpdatedAt));
  const client = createSupabaseAdminClient();
  const { data, error } = await client
    .from("weather_daily_snapshots")
    .upsert(rows, { onConflict: "location_slug,observed_date" })
    .select("*");

  if (error) {
    throw new Error(`Falha ao persistir o arquivo meteorológico: ${error.message}`);
  }

  return (data ?? [])
    .map(rowToHistoricalDay)
    .sort((first, second) => first.date.localeCompare(second.date));
}

export async function upsertWeatherSnapshot(
  day: HistoricalWeatherDay,
  sourceName: string,
): Promise<HistoricalWeatherDay> {
  const snapshots = await upsertWeatherSnapshots([day], sourceName);
  return snapshots[0] ?? day;
}
