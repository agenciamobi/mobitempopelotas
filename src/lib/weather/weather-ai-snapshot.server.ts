import { randomUUID } from "node:crypto";

import { z } from "zod";

import { getSupabaseServerConfig } from "../supabase/server-client.server";
import { fetchAggregatedPelotasWeather } from "./aggregated-weather.server";
import type { AggregatedWeatherData } from "./aggregated-weather.types";
import { reconcileDailyTemperatures } from "./daily-temperature-reconciliation";
import { generateGeminiWeatherBrief } from "./gemini-weather.server";
import type { WeatherBrief } from "./weather-intelligence.types";

const TIMEZONE = "America/Sao_Paulo";
const SNAPSHOT_MAX_AGE_MS = 8 * 60 * 60 * 1_000;
const TABLE_NAME = "weather_ai_snapshots";

type WeatherAiPeriod = "overnight" | "morning" | "afternoon" | "evening";

type RestConfig = {
  url: string;
  secretKey: string;
};

const weatherBriefSchema = z.object({
  headline: z.string().trim().min(1).max(120),
  summary: z.string().trim().min(1).max(600),
  highlights: z.array(z.string().trim().min(1).max(180)).max(4),
  cautions: z.array(z.string().trim().min(1).max(220)).max(4),
});

const storedSnapshotSchema = z.object({
  slot_key: z.string(),
  period: z.enum(["overnight", "morning", "afternoon", "evening"]),
  brief: weatherBriefSchema,
  model: z.string().nullable(),
  generated_at: z.string(),
});

export type WeatherAiSnapshot = {
  slotKey: string;
  period: WeatherAiPeriod;
  brief: WeatherBrief;
  model: string | null;
  generatedAt: string;
};

export type WeatherAiGenerationResult = {
  status: "generated" | "already-claimed" | "not-configured" | "failed";
  slotKey: string;
  period: WeatherAiPeriod;
  generatedAt: string | null;
  model: string | null;
  error: string | null;
};

function getRestConfig(): RestConfig | null {
  const config = getSupabaseServerConfig();
  if (!config.isAdminConfigured || !config.url || !config.secretKey) return null;
  return { url: config.url.replace(/\/$/, ""), secretKey: config.secretKey };
}

function isGeminiConfigured() {
  const enabled = process.env.GEMINI_WEATHER_ENABLED?.trim().toLowerCase();
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  return Boolean(apiKey) && (enabled === "true" || enabled === "1" || enabled === "on");
}

function localDateAndHour(date = new Date()) {
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
    dateKey: `${values.year}-${values.month}-${values.day}`,
    hour: Number(values.hour),
  };
}

function resolvePeriod(hour: number): WeatherAiPeriod {
  if (hour < 6) return "overnight";
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export function resolveWeatherAiSlot(date = new Date()) {
  const { dateKey, hour } = localDateAndHour(date);
  const period = resolvePeriod(hour);
  return { slotKey: `${dateKey}-${period}`, period } as const;
}

function restHeaders(config: RestConfig, prefer?: string) {
  const headers = new Headers({
    Accept: "application/json",
    apikey: config.secretKey,
    Authorization: `Bearer ${config.secretKey}`,
    "Content-Type": "application/json",
  });
  if (prefer) headers.set("Prefer", prefer);
  return headers;
}

async function restRequest(
  config: RestConfig,
  query: string,
  init: RequestInit = {},
  prefer?: string,
) {
  const response = await fetch(`${config.url}/rest/v1/${TABLE_NAME}${query}`, {
    ...init,
    headers: restHeaders(config, prefer),
    cache: "no-store",
    signal: AbortSignal.timeout(5_000),
  });

  if (!response.ok) {
    throw new Error(`Supabase respondeu com HTTP ${response.status}.`);
  }

  return response;
}

async function claimSnapshot(config: RestConfig, slotKey: string, period: WeatherAiPeriod) {
  const leaseToken = randomUUID();
  const response = await restRequest(
    config,
    "?on_conflict=slot_key",
    {
      method: "POST",
      body: JSON.stringify({
        slot_key: slotKey,
        period,
        status: "claimed",
        lease_token: leaseToken,
      }),
    },
    "resolution=ignore-duplicates,return=representation",
  );
  const rows = z.array(z.object({ slot_key: z.string() })).parse(await response.json());
  return rows.length === 1 ? leaseToken : null;
}

async function completeSnapshot(
  config: RestConfig,
  options: {
    slotKey: string;
    leaseToken: string;
    status: "generated" | "failed";
    brief?: WeatherBrief;
    model?: string | null;
    error?: string | null;
    sourceFetchedAt?: string | null;
  },
) {
  const completedAt = new Date().toISOString();
  const params = new URLSearchParams({
    slot_key: `eq.${options.slotKey}`,
    lease_token: `eq.${options.leaseToken}`,
    status: "eq.claimed",
  });
  await restRequest(
    config,
    `?${params.toString()}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status: options.status,
        completed_at: completedAt,
        generated_at: options.status === "generated" ? completedAt : null,
        source_fetched_at: options.sourceFetchedAt ?? null,
        brief: options.status === "generated" ? options.brief : null,
        model: options.model ?? null,
        error: options.error?.slice(0, 800) ?? null,
        updated_at: completedAt,
      }),
    },
    "return=minimal",
  );
  return completedAt;
}

function reconciledWeather(weather: AggregatedWeatherData): AggregatedWeatherData {
  return {
    ...weather,
    daily: reconcileDailyTemperatures(weather.daily, weather.inmetForecast),
  };
}

export async function fetchLatestWeatherAiSnapshot(): Promise<WeatherAiSnapshot | null> {
  const config = getRestConfig();
  if (!config) return null;

  try {
    const params = new URLSearchParams({
      select: "slot_key,period,brief,model,generated_at",
      status: "eq.generated",
      order: "generated_at.desc",
      limit: "1",
    });
    const response = await restRequest(config, `?${params.toString()}`);
    const rows = z.array(storedSnapshotSchema).parse(await response.json());
    const snapshot = rows[0];
    if (!snapshot) return null;

    const generatedAt = new Date(snapshot.generated_at).getTime();
    if (!Number.isFinite(generatedAt) || Date.now() - generatedAt > SNAPSHOT_MAX_AGE_MS) {
      return null;
    }

    return {
      slotKey: snapshot.slot_key,
      period: snapshot.period,
      brief: snapshot.brief,
      model: snapshot.model,
      generatedAt: snapshot.generated_at,
    };
  } catch (error) {
    console.warn("[weather-ai] Snapshot persistido indisponível", {
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export async function generateScheduledWeatherAiSnapshot(
  date = new Date(),
): Promise<WeatherAiGenerationResult> {
  const { slotKey, period } = resolveWeatherAiSlot(date);
  const config = getRestConfig();

  if (!config || !isGeminiConfigured()) {
    return {
      status: "not-configured",
      slotKey,
      period,
      generatedAt: null,
      model: null,
      error: "Supabase administrativo ou Gemini não configurado.",
    };
  }

  let leaseToken: string | null = null;

  try {
    leaseToken = await claimSnapshot(config, slotKey, period);
    if (!leaseToken) {
      return {
        status: "already-claimed",
        slotKey,
        period,
        generatedAt: null,
        model: null,
        error: null,
      };
    }

    const weather = reconciledWeather(await fetchAggregatedPelotasWeather());
    const gemini = await generateGeminiWeatherBrief(weather);

    if (gemini.status !== "generated" || !gemini.brief) {
      const error = gemini.error ?? `Gemini não gerou o snapshot: ${gemini.status}.`;
      await completeSnapshot(config, {
        slotKey,
        leaseToken,
        status: "failed",
        model: gemini.model,
        error,
        sourceFetchedAt: weather.source.fetchedAt,
      });
      return {
        status: "failed",
        slotKey,
        period,
        generatedAt: null,
        model: gemini.model,
        error,
      };
    }

    const generatedAt = await completeSnapshot(config, {
      slotKey,
      leaseToken,
      status: "generated",
      brief: gemini.brief,
      model: gemini.model,
      sourceFetchedAt: weather.source.fetchedAt,
    });

    return {
      status: "generated",
      slotKey,
      period,
      generatedAt,
      model: gemini.model,
      error: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida.";
    if (leaseToken) {
      await completeSnapshot(config, {
        slotKey,
        leaseToken,
        status: "failed",
        error: message,
      }).catch(() => undefined);
    }
    return {
      status: "failed",
      slotKey,
      period,
      generatedAt: null,
      model: null,
      error: message,
    };
  }
}
