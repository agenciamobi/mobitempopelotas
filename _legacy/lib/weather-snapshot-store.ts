import type { HistoricalWeatherDay } from "@/lib/weather-history";

const TABLE_NAME = "weather_daily_snapshots";
const LOCATION_SLUG = "pelotas-rs";
const TIMEZONE = "America/Sao_Paulo";

export type WeatherSnapshotStorageStatus = {
  configured: boolean;
  missing: Array<"SUPABASE_URL" | "SUPABASE_SERVICE_ROLE_KEY">;
};

type WeatherSnapshotRow = {
  location_slug: string;
  observed_date: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  temperature_max: number;
  temperature_min: number;
  precipitation: number;
  wind_gust: number;
  source_name: string;
  source_updated_at: string | null;
};

function getStorageConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return { url, serviceRoleKey };
}

export function getWeatherSnapshotStorageStatus(): WeatherSnapshotStorageStatus {
  const { url, serviceRoleKey } = getStorageConfig();
  const missing: WeatherSnapshotStorageStatus["missing"] = [];

  if (!url) missing.push("SUPABASE_URL");
  if (!serviceRoleKey) missing.push("SUPABASE_SERVICE_ROLE_KEY");

  return {
    configured: missing.length === 0,
    missing,
  };
}

function requestHeaders(serviceRoleKey: string, prefer?: string): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (prefer) headers.Prefer = prefer;

  return headers;
}

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
    temperatureMax: Math.round(Number(row.temperature_max)),
    temperatureMin: Math.round(Number(row.temperature_min)),
    precipitation: Number(Number(row.precipitation).toFixed(1)),
    windGust: Math.round(Number(row.wind_gust)),
  };
}

function dayToSnapshotRow(
  day: HistoricalWeatherDay,
  sourceName: string,
  sourceUpdatedAt: string,
): WeatherSnapshotRow {
  return {
    location_slug: LOCATION_SLUG,
    observed_date: day.date,
    city: "Pelotas",
    state: "RS",
    latitude: -31.7654,
    longitude: -52.3376,
    temperature_max: day.temperatureMax,
    temperature_min: day.temperatureMin,
    precipitation: day.precipitation,
    wind_gust: day.windGust,
    source_name: sourceName,
    source_updated_at: sourceUpdatedAt,
  };
}

export async function listWeatherSnapshots(limit = 30): Promise<HistoricalWeatherDay[]> {
  const { url, serviceRoleKey } = getStorageConfig();

  if (!url || !serviceRoleKey) return [];

  const params = new URLSearchParams({
    select:
      "location_slug,observed_date,city,state,latitude,longitude,temperature_max,temperature_min,precipitation,wind_gust,source_name,source_updated_at",
    location_slug: `eq.${LOCATION_SLUG}`,
    order: "observed_date.desc",
    limit: String(Math.max(1, Math.min(limit, 3650))),
  });
  const response = await fetch(`${url}/rest/v1/${TABLE_NAME}?${params}`, {
    headers: requestHeaders(serviceRoleKey),
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Falha ao consultar snapshots meteorológicos (${response.status}): ${details.slice(0, 240)}`,
    );
  }

  const rows = (await response.json()) as WeatherSnapshotRow[];

  return rows.reverse().map(rowToHistoricalDay);
}

export async function upsertWeatherSnapshots(
  days: HistoricalWeatherDay[],
  sourceName: string,
): Promise<HistoricalWeatherDay[]> {
  const { url, serviceRoleKey } = getStorageConfig();

  if (!url || !serviceRoleKey) {
    throw new Error("O armazenamento de snapshots meteorológicos não está configurado");
  }

  if (!days.length) return [];

  const sourceUpdatedAt = new Date().toISOString();
  const rows = days.map((day) =>
    dayToSnapshotRow(day, sourceName, sourceUpdatedAt),
  );
  const params = new URLSearchParams({
    on_conflict: "location_slug,observed_date",
  });
  const response = await fetch(`${url}/rest/v1/${TABLE_NAME}?${params}`, {
    method: "POST",
    headers: requestHeaders(
      serviceRoleKey,
      "resolution=merge-duplicates,return=representation",
    ),
    body: JSON.stringify(rows),
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(
      `Falha ao persistir snapshots meteorológicos (${response.status}): ${details.slice(0, 240)}`,
    );
  }

  const storedRows = (await response.json()) as WeatherSnapshotRow[];

  return storedRows
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
