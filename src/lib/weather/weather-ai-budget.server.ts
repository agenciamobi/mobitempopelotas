import { z } from "zod";

import { getSupabaseServerConfig } from "../supabase/server-client.server";

const TIMEZONE = "America/Sao_Paulo";
const DEFAULT_MONTHLY_CALL_LIMIT = 150;
const MAX_MONTHLY_CALL_LIMIT = 10_000;
const BUDGET_RPC = "claim_weather_ai_monthly_call";
const BUDGET_TIMEOUT_MS = 2_000;
const CALL_LOG_TABLE = "weather_ai_calls";

const budgetClaimSchema = z
  .array(
    z.object({
      allowed: z.boolean(),
      calls: z.number().int().nonnegative(),
      call_limit: z.number().int().positive(),
      call_id: z.string().uuid().nullable(),
    }),
  )
  .min(1);

export type WeatherAiBudgetClaim = {
  allowed: boolean;
  calls: number;
  callLimit: number;
  monthKey: string;
  callId: string | null;
};

type CompletedCall = {
  status: "generated" | "failed";
  model: string | null;
  error: string | null;
};

function configuredMonthlyCallLimit() {
  const raw = process.env.GEMINI_WEATHER_MONTHLY_CALL_LIMIT?.trim();
  if (!raw) return DEFAULT_MONTHLY_CALL_LIMIT;

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > MAX_MONTHLY_CALL_LIMIT) {
    console.warn("[weather-ai] GEMINI_WEATHER_MONTHLY_CALL_LIMIT inválido; usando limite seguro", {
      configured: raw,
      fallback: DEFAULT_MONTHLY_CALL_LIMIT,
    });
    return DEFAULT_MONTHLY_CALL_LIMIT;
  }

  return parsed;
}

function adminConfig() {
  const config = getSupabaseServerConfig();
  if (!config.isAdminConfigured || !config.url || !config.secretKey) {
    throw new Error("Supabase administrativo indisponível para validar o teto mensal da IA.");
  }
  return {
    url: config.url.replace(/\/$/, ""),
    secretKey: config.secretKey,
  };
}

function headers(secretKey: string) {
  return {
    Accept: "application/json",
    apikey: secretKey,
    Authorization: `Bearer ${secretKey}`,
    "Content-Type": "application/json",
  };
}

export function resolveWeatherAiMonthKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-01`;
}

export async function claimWeatherAiMonthlyBudget(
  slotKey: string,
  date = new Date(),
): Promise<WeatherAiBudgetClaim> {
  const config = adminConfig();
  const monthKey = resolveWeatherAiMonthKey(date);
  const callLimit = configuredMonthlyCallLimit();
  const response = await fetch(`${config.url}/rest/v1/rpc/${BUDGET_RPC}`, {
    method: "POST",
    headers: headers(config.secretKey),
    body: JSON.stringify({
      p_month_key: monthKey,
      p_call_limit: callLimit,
      p_slot_key: slotKey,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(BUDGET_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Contador mensal da IA respondeu com HTTP ${response.status}.`);
  }

  const [claim] = budgetClaimSchema.parse(await response.json());
  return {
    allowed: claim.allowed,
    calls: claim.calls,
    callLimit: claim.call_limit,
    monthKey,
    callId: claim.call_id,
  };
}

export async function completeWeatherAiCall(callId: string, result: CompletedCall) {
  const config = adminConfig();
  const query = new URLSearchParams({
    id: `eq.${callId}`,
    status: "eq.claimed",
  });
  const response = await fetch(`${config.url}/rest/v1/${CALL_LOG_TABLE}?${query.toString()}`, {
    method: "PATCH",
    headers: headers(config.secretKey),
    body: JSON.stringify({
      status: result.status,
      model: result.model,
      error: result.error?.slice(0, 800) ?? null,
      completed_at: new Date().toISOString(),
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(BUDGET_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Log de chamadas da IA respondeu com HTTP ${response.status}.`);
  }
}
