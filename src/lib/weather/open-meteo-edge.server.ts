import { z } from "zod";

import { getSupabaseServerConfig } from "@/lib/supabase/server-client.server";

const LOCATION_SLUG = "pelotas-rs";
const EDGE_FUNCTION_NAME = "open-meteo-forecast";
const REQUEST_TIMEOUT_MS = 35_000;
const SETTINGS_TIMEOUT_MS = 5_000;

const edgeResponseSchema = z.object({
  success: z.literal(true),
  provider: z.literal("open-meteo"),
  cacheStatus: z.enum(["fresh", "shared", "refreshed", "stale"]),
  fetchedAt: z.string().nullable().optional(),
  warning: z.string().nullable().optional(),
  payload: z.unknown(),
});

const collectorSettingsSchema = z.object({
  collector_token: z.string().min(1),
  enabled: z.boolean(),
});

export type OpenMeteoEdgePayload = {
  payload: unknown;
  fetchedAt: string | null;
  cacheStatus: "fresh" | "shared" | "refreshed" | "stale";
  warning: string | null;
};

async function fetchCollectorSettings(config: { url: string; secretKey: string }) {
  const params = new URLSearchParams({
    select: "collector_token,enabled",
    location_slug: `eq.${LOCATION_SLUG}`,
    limit: "1",
  });
  const response = await fetch(
    `${config.url.replace(/\/$/, "")}/rest/v1/weather_forecast_accuracy_settings?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
        apikey: config.secretKey,
        Authorization: `Bearer ${config.secretKey}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(SETTINGS_TIMEOUT_MS),
    },
  );

  if (!response.ok) {
    throw new Error(`Supabase respondeu com HTTP ${response.status} ao consultar o coletor.`);
  }

  const rows = z.array(collectorSettingsSchema).parse(await response.json());
  return rows[0] ?? null;
}

export async function fetchOpenMeteoPayloadViaEdge(): Promise<OpenMeteoEdgePayload> {
  const config = getSupabaseServerConfig();
  if (!config.isAdminConfigured || !config.url || !config.secretKey) {
    throw new Error("Supabase administrativo não configurado para a previsão Open-Meteo.");
  }

  const settings = await fetchCollectorSettings({ url: config.url, secretKey: config.secretKey });
  if (!settings?.enabled) {
    throw new Error("Coletor meteorológico desativado.");
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
