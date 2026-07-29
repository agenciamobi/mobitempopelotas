import { timingSafeEqual } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Json } from "@/lib/supabase/database.types";
import {
  createSupabaseAdminClient,
  getSupabaseServerConfig,
} from "@/lib/supabase/server-client.server";

import { fetchMetNorwayWeather } from "./met-norway.server";
import { fetchPelotasWeather as fetchOpenMeteoWeather } from "./open-meteo.server";
import type { DailyForecast, WeatherHomeData } from "./types";

const LOCATION_SLUG = "pelotas-rs";
const TIMEZONE = "America/Sao_Paulo";
const FORECAST_CYCLE_HOURS = 6;
const RECENT_VERIFICATION_DAYS = 7;

type ForecastPredictionInsert = {
  location_slug: string;
  provider_key: string;
  provider_name: string;
  model: string | null;
  model_run: string | null;
  issued_at: string;
  issued_local_date: string;
  cycle_hour: number;
  target_date: string;
  lead_hours: number;
  lead_days: number;
  temperature_min: number;
  temperature_max: number;
  precipitation_mm: number;
  rain_chance: number | null;
  wind_gust: number | null;
};

type ForecastPredictionRow = ForecastPredictionInsert & {
  id: number;
  created_at: string;
};

type ForecastAccuracySettingsRow = {
  location_slug: string;
  endpoint: string;
  collector_token: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

type ForecastAccuracyDatabase = {
  public: {
    Tables: {
      weather_forecast_predictions: {
        Row: ForecastPredictionRow;
        Insert: ForecastPredictionInsert;
        Update: Partial<ForecastPredictionInsert>;
        Relationships: [];
      };
      weather_forecast_accuracy_settings: {
        Row: ForecastAccuracySettingsRow;
        Insert: {
          location_slug: string;
          endpoint: string;
          collector_token?: string;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<ForecastAccuracySettingsRow>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      score_weather_forecasts: {
        Args: { p_target_date?: string };
        Returns: Json;
      };
      get_forecast_accuracy_summary: {
        Args: { p_days?: number };
        Returns: Json;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type ForecastAccuracyLead = {
  leadDays: number;
  evaluationCount: number;
  meanTemperatureError: number | null;
  rainError: number | null;
  rainEventAccuracy: number | null;
};

export type ForecastAccuracyProvider = {
  key: "open-meteo" | "met-norway";
  name: string;
  model: string | null;
  evaluationCount: number;
  meanTemperatureError: number | null;
  minimumError: number | null;
  maximumError: number | null;
  rainError: number | null;
  rainEventAccuracy: number | null;
  firstDate: string | null;
  lastDate: string | null;
  leadDays: ForecastAccuracyLead[];
};

export type ForecastAccuracySummary = {
  status: "collecting" | "building" | "ready" | "unavailable";
  windowDays: number;
  evaluationCount: number;
  verifiedDays: number;
  firstDate: string | null;
  lastDate: string | null;
  providers: ForecastAccuracyProvider[];
  generatedAt: string;
};

export type ForecastCaptureResult = {
  capturedAt: string;
  issuedLocalDate: string;
  cycleHour: number;
  storedCount: number;
  providers: Array<{
    key: string;
    name: string;
    status: WeatherHomeData["status"];
    storedCount: number;
    message: string | null;
  }>;
};

function storageConfigured() {
  return getSupabaseServerConfig().isAdminConfigured;
}

function forecastAccuracyClient() {
  return createSupabaseAdminClient() as unknown as SupabaseClient<ForecastAccuracyDatabase>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function nullableText(value: unknown) {
  return typeof value === "string" && value ? value : null;
}

function finiteNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function nullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function localDateTimeParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    hour: Number(values.hour),
  };
}

function shiftDate(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function dateDistanceDays(from: string, to: string) {
  const fromTime = new Date(`${from}T12:00:00Z`).getTime();
  const toTime = new Date(`${to}T12:00:00Z`).getTime();
  return Math.max(0, Math.round((toTime - fromTime) / 86_400_000));
}

function leadHours(issuedAt: Date, targetDate: string) {
  const targetStart = new Date(`${targetDate}T00:00:00-03:00`).getTime();
  return Math.max(0, Math.round((targetStart - issuedAt.getTime()) / 3_600_000));
}

function targetDateForDay(day: DailyForecast, issuedLocalDate: string, index: number) {
  return day.dateIso && /^\d{4}-\d{2}-\d{2}$/.test(day.dateIso)
    ? day.dateIso
    : shiftDate(issuedLocalDate, index);
}

function predictionRows(
  forecast: WeatherHomeData,
  issuedAt: Date,
  issuedLocalDate: string,
  cycleHour: number,
): ForecastPredictionInsert[] {
  if (forecast.status !== "live") return [];

  return forecast.daily.flatMap((day, index) => {
    const targetDate = targetDateForDay(day, issuedLocalDate, index);
    const daysAhead = dateDistanceDays(issuedLocalDate, targetDate);
    if (daysAhead > 10) return [];

    return [
      {
        location_slug: LOCATION_SLUG,
        provider_key: forecast.source.key,
        provider_name: forecast.source.name,
        model: forecast.source.model ?? null,
        model_run: forecast.source.modelRun ?? null,
        issued_at: issuedAt.toISOString(),
        issued_local_date: issuedLocalDate,
        cycle_hour: cycleHour,
        target_date: targetDate,
        lead_hours: leadHours(issuedAt, targetDate),
        lead_days: daysAhead,
        temperature_min: day.min,
        temperature_max: day.max,
        precipitation_mm: Math.max(0, day.precipitationMm),
        rain_chance: day.rainChance,
        wind_gust: day.windGust,
      },
    ];
  });
}

export async function captureForecastPredictions(): Promise<ForecastCaptureResult> {
  if (!storageConfigured()) {
    throw new Error("O armazenamento de precisão das previsões não está configurado.");
  }

  const issuedAt = new Date();
  const local = localDateTimeParts(issuedAt);
  const cycleHour = Math.floor(local.hour / FORECAST_CYCLE_HOURS) * FORECAST_CYCLE_HOURS;
  const forecasts = await Promise.all([fetchOpenMeteoWeather(), fetchMetNorwayWeather()]);
  const client = forecastAccuracyClient();
  const providers: ForecastCaptureResult["providers"] = [];
  let storedCount = 0;

  for (const forecast of forecasts) {
    const rows = predictionRows(forecast, issuedAt, local.date, cycleHour);
    if (rows.length > 0) {
      const { data, error } = await client
        .from("weather_forecast_predictions")
        .upsert(rows, {
          onConflict: "location_slug,provider_key,issued_local_date,cycle_hour,target_date",
        })
        .select("id");
      if (error) {
        throw new Error(
          `Falha ao arquivar previsão de ${forecast.source.name}: ${error.message}`,
        );
      }
      storedCount += data?.length ?? rows.length;
    }

    providers.push({
      key: forecast.source.key,
      name: forecast.source.name,
      status: forecast.status,
      storedCount: rows.length,
      message: forecast.message,
    });
  }

  return {
    capturedAt: issuedAt.toISOString(),
    issuedLocalDate: local.date,
    cycleHour,
    storedCount,
    providers,
  };
}

export async function verifyRecentForecasts() {
  if (!storageConfigured()) {
    throw new Error("O armazenamento de precisão das previsões não está configurado.");
  }

  const client = forecastAccuracyClient();
  const today = localDateTimeParts().date;
  const results: Json[] = [];

  for (let offset = 1; offset <= RECENT_VERIFICATION_DAYS; offset += 1) {
    const targetDate = shiftDate(today, -offset);
    const { data, error } = await client.rpc("score_weather_forecasts", {
      p_target_date: targetDate,
    });
    if (error) {
      throw new Error(`Falha ao avaliar previsões de ${targetDate}: ${error.message}`);
    }
    results.push(data);
  }

  return { verifiedAt: new Date().toISOString(), results };
}

function parseLead(value: unknown): ForecastAccuracyLead | null {
  if (!isRecord(value)) return null;
  return {
    leadDays: finiteNumber(value.leadDays),
    evaluationCount: finiteNumber(value.evaluationCount),
    meanTemperatureError: nullableNumber(value.meanTemperatureError),
    rainError: nullableNumber(value.rainError),
    rainEventAccuracy: nullableNumber(value.rainEventAccuracy),
  };
}

function parseProvider(value: unknown): ForecastAccuracyProvider | null {
  if (!isRecord(value)) return null;
  const key = value.key;
  if (key !== "open-meteo" && key !== "met-norway") return null;
  const leads = Array.isArray(value.leadDays)
    ? value.leadDays.flatMap((item) => {
        const parsed = parseLead(item);
        return parsed ? [parsed] : [];
      })
    : [];

  return {
    key,
    name: text(value.name, key === "open-meteo" ? "Open-Meteo" : "MET Norway"),
    model: nullableText(value.model),
    evaluationCount: finiteNumber(value.evaluationCount),
    meanTemperatureError: nullableNumber(value.meanTemperatureError),
    minimumError: nullableNumber(value.minimumError),
    maximumError: nullableNumber(value.maximumError),
    rainError: nullableNumber(value.rainError),
    rainEventAccuracy: nullableNumber(value.rainEventAccuracy),
    firstDate: nullableText(value.firstDate),
    lastDate: nullableText(value.lastDate),
    leadDays: leads.sort((left, right) => left.leadDays - right.leadDays),
  };
}

function unavailableSummary(): ForecastAccuracySummary {
  return {
    status: "unavailable",
    windowDays: 30,
    evaluationCount: 0,
    verifiedDays: 0,
    firstDate: null,
    lastDate: null,
    providers: [],
    generatedAt: new Date().toISOString(),
  };
}

function parseSummary(value: unknown): ForecastAccuracySummary {
  if (!isRecord(value)) return unavailableSummary();
  const status =
    value.status === "collecting" || value.status === "building" || value.status === "ready"
      ? value.status
      : "unavailable";
  const providers = Array.isArray(value.providers)
    ? value.providers.flatMap((item) => {
        const parsed = parseProvider(item);
        return parsed ? [parsed] : [];
      })
    : [];

  return {
    status,
    windowDays: finiteNumber(value.windowDays, 30),
    evaluationCount: finiteNumber(value.evaluationCount),
    verifiedDays: finiteNumber(value.verifiedDays),
    firstDate: nullableText(value.firstDate),
    lastDate: nullableText(value.lastDate),
    providers,
    generatedAt: text(value.generatedAt, new Date().toISOString()),
  };
}

export async function getForecastAccuracySummaryServer(): Promise<ForecastAccuracySummary> {
  if (!storageConfigured()) return unavailableSummary();

  try {
    const client = forecastAccuracyClient();
    const { data, error } = await client.rpc("get_forecast_accuracy_summary", { p_days: 30 });
    if (error) throw new Error(error.message);
    return parseSummary(data);
  } catch (error) {
    console.error("[forecast/accuracy] Falha ao consultar resumo de precisão", {
      message: error instanceof Error ? error.message : String(error),
    });
    return unavailableSummary();
  }
}

function safeTokenEqual(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

export async function authorizeForecastAccuracyRequest(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");
  if (cronSecret && authorization === `Bearer ${cronSecret}`) return true;

  const receivedToken = request.headers.get("x-collector-token")?.trim();
  if (!receivedToken || !storageConfigured()) return false;

  const client = forecastAccuracyClient();
  const { data, error } = await client
    .from("weather_forecast_accuracy_settings")
    .select("collector_token,enabled")
    .eq("location_slug", LOCATION_SLUG)
    .maybeSingle();

  if (error || !data?.enabled) return false;
  return safeTokenEqual(receivedToken, data.collector_token);
}
