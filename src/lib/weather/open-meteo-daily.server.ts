import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createSupabaseAdminClient,
  getSupabaseServerConfig,
} from "@/lib/supabase/server-client.server";

import type { DailyForecast, WeatherHomeData, WeatherIconName } from "./types";

const SOURCE_URL = "https://open-meteo.com/";
const EDGE_FUNCTION_NAME = "forecast-open-meteo-capture";
const REQUEST_TIMEOUT_MS = 35_000;
const LOCATION_SLUG = "pelotas-rs";

type PredictionRow = {
  id: number;
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
  created_at: string;
};

type SettingsRow = {
  location_slug: string;
  endpoint: string;
  collector_token: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

type OpenMeteoEdgeDatabase = {
  public: {
    Tables: {
      weather_forecast_predictions: {
        Row: PredictionRow;
        Insert: Omit<PredictionRow, "id" | "created_at">;
        Update: Partial<Omit<PredictionRow, "id" | "created_at">>;
        Relationships: [];
      };
      weather_forecast_accuracy_settings: {
        Row: SettingsRow;
        Insert: Omit<SettingsRow, "created_at" | "updated_at"> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<SettingsRow>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

type EdgeCaptureResponse = {
  success: boolean;
  provider?: string;
  issuedLocalDate?: string;
  cycleHour?: number;
  storedCount?: number;
  error?: string;
};

function client() {
  return createSupabaseAdminClient() as unknown as SupabaseClient<OpenMeteoEdgeDatabase>;
}

function unavailable(message: string): WeatherHomeData {
  return {
    status: "unavailable",
    current: null,
    hourly: [],
    daily: [],
    source: {
      name: "Open-Meteo",
      url: SOURCE_URL,
      kind: "forecast",
      key: "open-meteo",
      fetchedAt: new Date().toISOString(),
      isFallback: false,
      model: "Open-Meteo Best Match",
      modelRun: null,
      temporalResolutionMinutes: 60,
    },
    message,
  };
}

function formatDay(date: string, index: number) {
  if (index === 0) return "Hoje";
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    timeZone: "UTC",
  })
    .format(new Date(`${date}T12:00:00Z`))
    .replace(".", "")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  })
    .format(new Date(`${date}T12:00:00Z`))
    .replace(" de ", " ")
    .replace(".", "");
}

function iconForPrediction(precipitation: number, rainChance: number | null): WeatherIconName {
  if (precipitation >= 5 || (rainChance ?? 0) >= 70) return "rain";
  if (precipitation >= 0.2 || (rainChance ?? 0) >= 35) return "partly-cloudy";
  return "sun";
}

function normalizeRows(rows: PredictionRow[]): DailyForecast[] {
  return rows.map((row, index) => ({
    weekday: formatDay(row.target_date, index),
    date: formatDate(row.target_date),
    dateIso: row.target_date,
    min: row.temperature_min,
    max: row.temperature_max,
    rainChance: row.rain_chance,
    precipitationMm: row.precipitation_mm,
    windGust: row.wind_gust,
    icon: iconForPrediction(row.precipitation_mm, row.rain_chance),
  }));
}

async function readCapturedRows(issuedLocalDate: string, cycleHour: number) {
  const { data, error } = await client()
    .from("weather_forecast_predictions")
    .select("*")
    .eq("location_slug", LOCATION_SLUG)
    .eq("provider_key", "open-meteo")
    .eq("issued_local_date", issuedLocalDate)
    .eq("cycle_hour", cycleHour)
    .order("target_date", { ascending: true });

  if (error) throw new Error(`Falha ao ler previsões do Open-Meteo: ${error.message}`);
  return data ?? [];
}

export async function fetchOpenMeteoDailyForecast(): Promise<WeatherHomeData> {
  const config = getSupabaseServerConfig();
  if (!config.isAdminConfigured || !config.url) {
    return unavailable("O coletor diário do Open-Meteo não está configurado neste ambiente.");
  }

  try {
    const database = client();
    const { data: settings, error: settingsError } = await database
      .from("weather_forecast_accuracy_settings")
      .select("collector_token,enabled")
      .eq("location_slug", LOCATION_SLUG)
      .maybeSingle();

    if (settingsError || !settings?.enabled) {
      throw new Error(settingsError?.message ?? "Coletor de precisão desativado.");
    }

    const response = await fetch(`${config.url}/functions/v1/${EDGE_FUNCTION_NAME}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Collector-Token": settings.collector_token,
      },
      body: JSON.stringify({ locationSlug: LOCATION_SLUG }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    const result = (await response.json().catch(() => ({}))) as EdgeCaptureResponse;
    if (!response.ok || !result.success) {
      throw new Error(result.error ?? `Coletor Open-Meteo respondeu com status ${response.status}`);
    }
    if (
      typeof result.issuedLocalDate !== "string" ||
      typeof result.cycleHour !== "number"
    ) {
      throw new Error("O coletor Open-Meteo não informou o ciclo arquivado.");
    }

    const rows = await readCapturedRows(result.issuedLocalDate, result.cycleHour);
    const daily = normalizeRows(rows);
    if (!daily.length) {
      throw new Error("O coletor Open-Meteo concluiu sem previsões disponíveis.");
    }

    return {
      status: "live",
      current: null,
      hourly: [],
      daily,
      source: {
        name: "Open-Meteo",
        url: SOURCE_URL,
        kind: "forecast",
        key: "open-meteo",
        fetchedAt: new Date().toISOString(),
        isFallback: false,
        model: "Open-Meteo Best Match",
        modelRun: null,
        temporalResolutionMinutes: 60,
      },
      message: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[weather/open-meteo-daily] Falha na Edge Function", { message });
    return unavailable(message);
  }
}
