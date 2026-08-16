import { z } from "zod";

import {
  createSupabaseAdminClient,
  getSupabaseServerConfig,
} from "@/lib/supabase/server-client.server";

const LOCATION_SLUG = "pelotas-rs";
const EDGE_FUNCTION_NAME = "open-meteo-forecast";
const REQUEST_TIMEOUT_MS = 35_000;

type ForecastAccuracySettings = {
  collector_token: string;
  enabled: boolean;
};

type ForecastAccuracySettingsClient = {
  from(table: "weather_forecast_accuracy_settings"): {
    select(columns: "collector_token,enabled"): {
      eq(column: "location_slug", value: string): {
        maybeSingle(): Promise<{
          data: ForecastAccuracySettings | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

const edgeResponseSchema = z.object({
  success: z.literal(true),
  provider: z.literal("open-meteo"),
  cacheStatus: z.enum(["fresh", "shared", "refreshed", "stale"]),
  fetchedAt: z.string().nullable().optional(),
  warning: z.string().nullable().optional(),
  payload: z.unknown(),
});

export type OpenMeteoEdgePayload = {
  payload: unknown;
  fetchedAt: string | null;
  cacheStatus: "fresh" | "shared" | "refreshed" | "stale";
  warning: string | null;
};

export async function fetchOpenMeteoPayloadViaEdge(): Promise<OpenMeteoEdgePayload> {
  const config = getSupabaseServerConfig();
  if (!config.isAdminConfigured || !config.url) {
    throw new Error("Supabase administrativo não configurado para a previsão Open-Meteo.");
  }

  // A migration de precisão meteorológica já está versionada, mas database.types.ts só deve ser
  // regenerado depois de confirmar sua aplicação no Supabase oficial. Mantemos o cast restrito a
  // esta tabela até essa reconciliação, sem afrouxar a tipagem do restante do cliente administrativo.
  const admin = createSupabaseAdminClient() as unknown as ForecastAccuracySettingsClient;
  const { data: settings, error: settingsError } = await admin
    .from("weather_forecast_accuracy_settings")
    .select("collector_token,enabled")
    .eq("location_slug", LOCATION_SLUG)
    .maybeSingle();

  if (settingsError || !settings?.enabled) {
    throw new Error(settingsError?.message ?? "Coletor meteorológico desativado.");
  }

  const response = await fetch(`${config.url}/functions/v1/${EDGE_FUNCTION_NAME}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Collector-Token": settings.collector_token,
    },
    body: "{}",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body && typeof body.error === "string"
        ? body.error
        : `Edge Function Open-Meteo respondeu com status ${response.status}`;
    throw new Error(message);
  }

  const parsed = edgeResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error("A Edge Function Open-Meteo respondeu em formato inválido.");
  }

  return {
    payload: parsed.data.payload,
    fetchedAt: parsed.data.fetchedAt ?? null,
    cacheStatus: parsed.data.cacheStatus,
    warning: parsed.data.warning ?? null,
  };
}
