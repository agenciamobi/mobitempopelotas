import { z } from "zod";

import { getSupabaseServerConfig } from "../supabase/server-client.server";

const TIMEZONE = "America/Sao_Paulo";
const DEFAULT_MONTHLY_CALL_LIMIT = 150;
const MAX_MONTHLY_CALL_LIMIT = 10_000;
const BUDGET_RPC = "claim_weather_ai_monthly_call";
const BUDGET_TIMEOUT_MS = 2_000;

const budgetClaimSchema = z
  .array(
    z.object({
      allowed: z.boolean(),
      calls: z.number().int().nonnegative(),
      call_limit: z.number().int().positive(),
    }),
  )
  .min(1);

export type WeatherAiBudgetClaim = {
  allowed: boolean;
  calls: number;
  callLimit: number;
  monthKey: string;
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
  date = new Date(),
): Promise<WeatherAiBudgetClaim> {
  const config = getSupabaseServerConfig();
  if (!config.isAdminConfigured || !config.url || !config.secretKey) {
    throw new Error("Supabase administrativo indisponível para validar o teto mensal da IA.");
  }

  const monthKey = resolveWeatherAiMonthKey(date);
  const callLimit = configuredMonthlyCallLimit();
  const response = await fetch(`${config.url.replace(/\/$/, "")}/rest/v1/rpc/${BUDGET_RPC}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      apikey: config.secretKey,
      Authorization: `Bearer ${config.secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_month_key: monthKey,
      p_call_limit: callLimit,
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
  };
}
