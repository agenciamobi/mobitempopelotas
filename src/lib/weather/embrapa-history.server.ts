import type { Database } from "@/lib/supabase/database.types";
import {
  createSupabaseAdminClient,
  getSupabaseServerConfig,
} from "@/lib/supabase/server-client.server";

import { EMBRAPA_STATION_ID } from "./embrapa-central.server";

const HISTORY_WINDOW_HOURS = 24;
const HISTORY_WINDOW_MS = HISTORY_WINDOW_HOURS * 60 * 60 * 1_000;
const BUCKET_MINUTES = 10;
const BUCKET_MS = BUCKET_MINUTES * 60 * 1_000;
const MAX_QUERY_ROWS = 2_000;

type HistoryRow = Pick<
  Database["public"]["Tables"]["weather_station_observations"]["Row"],
  | "fetched_at"
  | "temperature"
  | "feels_like"
  | "humidity"
  | "pressure"
  | "wind_speed"
  | "wind_direction"
  | "rain_daily"
>;

type MetricAccumulator = {
  sum: number;
  count: number;
};

type HistoryBucket = {
  timestamp: number;
  lastTimestamp: number;
  temperature: MetricAccumulator;
  feelsLike: MetricAccumulator;
  humidity: MetricAccumulator;
  pressure: MetricAccumulator;
  windSpeed: MetricAccumulator;
  windDirection: string | null;
  rainDaily: number | null;
  rainIncrement: number;
};

export type EmbrapaHistoryPoint = {
  timestamp: string;
  temperature: number | null;
  feelsLike: number | null;
  humidity: number | null;
  pressure: number | null;
  windSpeed: number | null;
  windDirection: string | null;
  rainDaily: number | null;
  rainIncrement: number;
};

export type EmbrapaHistorySnapshot = {
  status: "ready" | "building" | "unavailable";
  windowHours: number;
  bucketMinutes: number;
  sampleCount: number;
  pointCount: number;
  coverageMinutes: number;
  from: string | null;
  to: string | null;
  generatedAt: string;
  points: EmbrapaHistoryPoint[];
  summary: {
    temperatureMin: number | null;
    temperatureMax: number | null;
    humidityMin: number | null;
    humidityMax: number | null;
    pressureMin: number | null;
    pressureMax: number | null;
    windMax: number | null;
    rainTotal: number | null;
  };
};

function emptyMetric(): MetricAccumulator {
  return { sum: 0, count: 0 };
}

function finiteNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function addMetric(metric: MetricAccumulator, value: number | null | undefined) {
  const normalized = finiteNumber(value);
  if (normalized === null) return;
  metric.sum += normalized;
  metric.count += 1;
}

function average(metric: MetricAccumulator, digits = 1) {
  if (!metric.count) return null;
  return Number((metric.sum / metric.count).toFixed(digits));
}

function round(value: number, digits = 1) {
  return Number(value.toFixed(digits));
}

function numericExtent(points: EmbrapaHistoryPoint[], key: keyof EmbrapaHistoryPoint) {
  const values = points.flatMap((point) => {
    const value = point[key];
    return typeof value === "number" && Number.isFinite(value) ? [value] : [];
  });
  if (!values.length) return { min: null, max: null };
  return { min: Math.min(...values), max: Math.max(...values) };
}

function unavailableSnapshot(): EmbrapaHistorySnapshot {
  return {
    status: "unavailable",
    windowHours: HISTORY_WINDOW_HOURS,
    bucketMinutes: BUCKET_MINUTES,
    sampleCount: 0,
    pointCount: 0,
    coverageMinutes: 0,
    from: null,
    to: null,
    generatedAt: new Date().toISOString(),
    points: [],
    summary: {
      temperatureMin: null,
      temperatureMax: null,
      humidityMin: null,
      humidityMax: null,
      pressureMin: null,
      pressureMax: null,
      windMax: null,
      rainTotal: null,
    },
  };
}

function buildSnapshot(rows: HistoryRow[]): EmbrapaHistorySnapshot {
  const buckets = new Map<number, HistoryBucket>();
  let previousRainDaily: number | null = null;
  let firstTimestamp: number | null = null;
  let lastTimestamp: number | null = null;

  for (const row of rows) {
    const timestamp = new Date(row.fetched_at).getTime();
    if (!Number.isFinite(timestamp)) continue;

    firstTimestamp ??= timestamp;
    lastTimestamp = timestamp;

    const bucketTimestamp = Math.floor(timestamp / BUCKET_MS) * BUCKET_MS;
    let bucket = buckets.get(bucketTimestamp);
    if (!bucket) {
      bucket = {
        timestamp: bucketTimestamp,
        lastTimestamp: timestamp,
        temperature: emptyMetric(),
        feelsLike: emptyMetric(),
        humidity: emptyMetric(),
        pressure: emptyMetric(),
        windSpeed: emptyMetric(),
        windDirection: null,
        rainDaily: null,
        rainIncrement: 0,
      };
      buckets.set(bucketTimestamp, bucket);
    }

    addMetric(bucket.temperature, row.temperature);
    addMetric(bucket.feelsLike, row.feels_like);
    addMetric(bucket.humidity, row.humidity);
    addMetric(bucket.pressure, row.pressure);
    addMetric(bucket.windSpeed, row.wind_speed);

    const rainDaily = finiteNumber(row.rain_daily);
    if (rainDaily !== null) {
      if (previousRainDaily !== null) {
        const increment = rainDaily >= previousRainDaily ? rainDaily - previousRainDaily : rainDaily;
        bucket.rainIncrement += Math.max(0, increment);
      }
      previousRainDaily = rainDaily;
    }

    if (timestamp >= bucket.lastTimestamp) {
      bucket.lastTimestamp = timestamp;
      bucket.windDirection = row.wind_direction;
      bucket.rainDaily = rainDaily;
    }
  }

  const points = [...buckets.values()]
    .sort((left, right) => left.timestamp - right.timestamp)
    .map<EmbrapaHistoryPoint>((bucket) => ({
      timestamp: new Date(bucket.timestamp).toISOString(),
      temperature: average(bucket.temperature),
      feelsLike: average(bucket.feelsLike),
      humidity: average(bucket.humidity, 0),
      pressure: average(bucket.pressure),
      windSpeed: average(bucket.windSpeed),
      windDirection: bucket.windDirection,
      rainDaily: bucket.rainDaily,
      rainIncrement: round(bucket.rainIncrement, 2),
    }));

  if (!points.length || firstTimestamp === null || lastTimestamp === null) {
    return unavailableSnapshot();
  }

  const coverageMinutes = Math.max(0, (lastTimestamp - firstTimestamp) / 60_000);
  const temperature = numericExtent(points, "temperature");
  const humidity = numericExtent(points, "humidity");
  const pressure = numericExtent(points, "pressure");
  const wind = numericExtent(points, "windSpeed");
  const rainValues = points.map((point) => point.rainIncrement).filter(Number.isFinite);

  return {
    status: coverageMinutes >= 18 * 60 ? "ready" : "building",
    windowHours: HISTORY_WINDOW_HOURS,
    bucketMinutes: BUCKET_MINUTES,
    sampleCount: rows.length,
    pointCount: points.length,
    coverageMinutes: round(coverageMinutes, 1),
    from: new Date(firstTimestamp).toISOString(),
    to: new Date(lastTimestamp).toISOString(),
    generatedAt: new Date().toISOString(),
    points,
    summary: {
      temperatureMin: temperature.min,
      temperatureMax: temperature.max,
      humidityMin: humidity.min,
      humidityMax: humidity.max,
      pressureMin: pressure.min,
      pressureMax: pressure.max,
      windMax: wind.max,
      rainTotal: rainValues.length ? round(rainValues.reduce((sum, value) => sum + value, 0), 2) : null,
    },
  };
}

export async function getEmbrapaHistory24hServer(): Promise<EmbrapaHistorySnapshot> {
  if (!getSupabaseServerConfig().isAdminConfigured) return unavailableSnapshot();

  try {
    const client = createSupabaseAdminClient();
    const from = new Date(Date.now() - HISTORY_WINDOW_MS).toISOString();
    const { data, error } = await client
      .from("weather_station_observations")
      .select(
        "fetched_at,temperature,feels_like,humidity,pressure,wind_speed,wind_direction,rain_daily",
      )
      .eq("station_id", EMBRAPA_STATION_ID)
      .gte("fetched_at", from)
      .order("fetched_at", { ascending: true })
      .limit(MAX_QUERY_ROWS);

    if (error) throw new Error(error.message);
    return buildSnapshot((data ?? []) as HistoryRow[]);
  } catch (error) {
    console.error("[embrapa/history] Falha ao preparar histórico de 24 horas", {
      message: error instanceof Error ? error.message : String(error),
    });
    return unavailableSnapshot();
  }
}
