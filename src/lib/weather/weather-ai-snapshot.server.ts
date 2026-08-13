import { createHash, randomUUID } from "node:crypto";

import { z } from "zod";

import { getSupabaseServerConfig } from "../supabase/server-client.server";
import { fetchAggregatedPelotasWeather } from "./aggregated-weather.server";
import type { AggregatedWeatherData } from "./aggregated-weather.types";
import { reconcileDailyTemperatures } from "./daily-temperature-reconciliation";
import { generateGeminiWeatherBrief } from "./gemini-weather.server";
import {
  claimWeatherAiMonthlyBudget,
  completeWeatherAiCall,
} from "./weather-ai-budget.server";
import type { WeatherBrief } from "./weather-intelligence.types";

const TIMEZONE = "America/Sao_Paulo";
const SNAPSHOT_MAX_AGE_MS = 8 * 60 * 60 * 1_000;
const SNAPSHOT_CACHE_MS = 5 * 60 * 1_000;
const SNAPSHOT_FAILURE_CACHE_MS = 30 * 1_000;
const SNAPSHOT_READ_TIMEOUT_MS = 1_200;
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
  source_fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  reused_from_slot: z.string().nullable().optional(),
});

export type WeatherAiSnapshot = {
  slotKey: string;
  period: WeatherAiPeriod;
  brief: WeatherBrief;
  model: string | null;
  generatedAt: string;
  sourceFingerprint: string;
  reusedFromSlot: string | null;
};

export type WeatherAiGenerationResult = {
  status:
    | "generated"
    | "reused"
    | "already-claimed"
    | "not-configured"
    | "budget-blocked"
    | "failed";
  slotKey: string;
  period: WeatherAiPeriod;
  generatedAt: string | null;
  model: string | null;
  sourceFingerprint: string | null;
  reusedFromSlot: string | null;
  error: string | null;
  budgetMonth?: string;
  monthlyCalls?: number;
  monthlyCallLimit?: number;
};

type SnapshotCache = {
  value: WeatherAiSnapshot | null;
  expiresAt: number;
};

let snapshotCache: SnapshotCache | null = null;
let snapshotReadPromise: Promise<WeatherAiSnapshot | null> | null = null;

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
  if (hour < 5) return "overnight";
  if (hour < 11) return "morning";
  if (hour < 17) return "afternoon";
  if (hour < 23) return "evening";
  return "overnight";
}

export function resolveWeatherAiSlot(date = new Date()) {
  const { dateKey, hour } = localDateAndHour(date);
  const period = resolvePeriod(hour);
  return { slotKey: `${dateKey}-${period}`, period } as const;
}

function bucket(value: number | null | undefined, size: number) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return Math.round(value / size) * size;
}

function normalizedText(value: string | null | undefined) {
  return value?.trim().toLowerCase().replace(/\s+/g, " ") || null;
}

export function computeWeatherAiFingerprint(weather: AggregatedWeatherData) {
  const current = weather.current;
  const materialState = {
    status: weather.status,
    current: current
      ? {
          temperature: bucket(current.temperature, 2),
          feelsLike: bucket(current.feelsLike, 2),
          condition: normalizedText(current.condition),
          humidity: bucket(current.humidity, 10),
          windSpeed: bucket(current.windSpeed, 5),
          windGust: bucket(current.windGust, 5),
          windDirection: normalizedText(current.windDirection),
        }
      : null,
    daily: weather.daily.slice(0, 2).map((day) => ({
      date: day.dateIso ?? day.date,
      min: bucket(day.min, 1),
      max: bucket(day.max, 1),
      rainChance: bucket(day.rainChance, 10),
      precipitationMm: bucket(day.precipitationMm, 1),
      windGust: bucket(day.windGust, 5),
      icon: day.icon,
    })),
    alerts: weather.alerts
      .filter((alert) => alert.period === "active" || alert.period === "upcoming")
      .map((alert) => ({
        id: alert.id,
        event: normalizedText(alert.event),
        severity: alert.severity,
        relevance: alert.relevance,
        period: alert.period,
        startsAt: alert.startsAt,
        expiresAt: alert.expiresAt,
      }))
      .sort((left, right) => left.id.localeCompare(right.id)),
    quality: {
      confidence: weather.quality.confidence,
      currentSource: weather.quality.currentSource,
      forecastSource: weather.quality.forecastSource,
      degradedSources: [...weather.quality.degradedSources].sort(),
      significantDiscrepancies: weather.quality.discrepancies
        .filter((item) => item.severity === "significant")
        .map((item) => ({
          scope: item.scope,
          field: item.field,
          referenceSource: item.referenceSource,
          comparisonSource: item.comparisonSource,
          day: item.day,
        }))
        .sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right))),
    },
  };

  return createHash("sha256").update(JSON.stringify(materialState)).digest("hex");
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
  timeoutMs = 5_000,
) {
  const response = await fetch(`${config.url}/rest/v1/${TABLE_NAME}${query}`, {
    ...init,
    headers: restHeaders(config, prefer),
    cache: "no-store",
    signal: AbortSignal.timeout(timeoutMs),
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
    sourceFingerprint?: string | null;
    reusedFromSlot?: string | null;
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
        source_fingerprint: options.status === "generated" ? options.sourceFingerprint : null,
        reused_from_slot: options.status === "generated" ? (options.reusedFromSlot ?? null) : null,
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

function cacheSnapshot(value: WeatherAiSnapshot | null, ttlMs: number) {
  snapshotCache = { value, expiresAt: Date.now() + ttlMs };
  return value;
}

function mapStoredSnapshot(snapshot: z.infer<typeof storedSnapshotSchema>): WeatherAiSnapshot {
  return {
    slotKey: snapshot.slot_key,
    period: snapshot.period,
    brief: snapshot.brief,
    model: snapshot.model,
    generatedAt: snapshot.generated_at,
    sourceFingerprint: snapshot.source_fingerprint,
    reusedFromSlot: snapshot.reused_from_slot ?? null,
  };
}

async function readGeneratedSnapshot(
  config: RestConfig,
  sourceFingerprint?: string,
): Promise<WeatherAiSnapshot | null> {
  const params = new URLSearchParams({
    select: "slot_key,period,brief,model,generated_at,source_fingerprint,reused_from_slot",
    status: "eq.generated",
    order: "generated_at.desc",
    limit: "1",
  });
  if (sourceFingerprint) params.set("source_fingerprint", `eq.${sourceFingerprint}`);

  const response = await restRequest(
    config,
    `?${params.toString()}`,
    {},
    undefined,
    SNAPSHOT_READ_TIMEOUT_MS,
  );
  const rows = z.array(storedSnapshotSchema).parse(await response.json());
  return rows[0] ? mapStoredSnapshot(rows[0]) : null;
}

async function readLatestWeatherAiSnapshot(): Promise<WeatherAiSnapshot | null> {
  const config = getRestConfig();
  if (!config) return cacheSnapshot(null, SNAPSHOT_FAILURE_CACHE_MS);

  try {
    const snapshot = await readGeneratedSnapshot(config);
    if (!snapshot) return cacheSnapshot(null, SNAPSHOT_FAILURE_CACHE_MS);

    const generatedAt = new Date(snapshot.generatedAt).getTime();
    if (!Number.isFinite(generatedAt) || Date.now() - generatedAt > SNAPSHOT_MAX_AGE_MS) {
      return cacheSnapshot(null, SNAPSHOT_FAILURE_CACHE_MS);
    }

    return cacheSnapshot(snapshot, SNAPSHOT_CACHE_MS);
  } catch (error) {
    console.warn("[weather-ai] Snapshot persistido indisponível", {
      message: error instanceof Error ? error.message : String(error),
    });
    return cacheSnapshot(null, SNAPSHOT_FAILURE_CACHE_MS);
  }
}

export async function fetchLatestWeatherAiSnapshot(): Promise<WeatherAiSnapshot | null> {
  if (snapshotCache && snapshotCache.expiresAt > Date.now()) return snapshotCache.value;
  if (snapshotReadPromise) return snapshotReadPromise;

  snapshotReadPromise = readLatestWeatherAiSnapshot().finally(() => {
    snapshotReadPromise = null;
  });
  return snapshotReadPromise;
}

function emptyGenerationResult(
  status: WeatherAiGenerationResult["status"],
  slotKey: string,
  period: WeatherAiPeriod,
  error: string | null,
): WeatherAiGenerationResult {
  return {
    status,
    slotKey,
    period,
    generatedAt: null,
    model: null,
    sourceFingerprint: null,
    reusedFromSlot: null,
    error,
  };
}

export async function generateScheduledWeatherAiSnapshot(
  date = new Date(),
): Promise<WeatherAiGenerationResult> {
  const { slotKey, period } = resolveWeatherAiSlot(date);
  const config = getRestConfig();

  if (!config || !isGeminiConfigured()) {
    return emptyGenerationResult(
      "not-configured",
      slotKey,
      period,
      "Supabase administrativo ou Gemini não configurado.",
    );
  }

  let leaseToken: string | null = null;
  let sourceFingerprint: string | null = null;
  let budgetCallId: string | null = null;

  try {
    leaseToken = await claimSnapshot(config, slotKey, period);
    if (!leaseToken) return emptyGenerationResult("already-claimed", slotKey, period, null);

    const weather = reconciledWeather(await fetchAggregatedPelotasWeather());
    sourceFingerprint = computeWeatherAiFingerprint(weather);
    const reusableSnapshot = await readGeneratedSnapshot(config, sourceFingerprint);

    if (reusableSnapshot) {
      const generatedAt = await completeSnapshot(config, {
        slotKey,
        leaseToken,
        status: "generated",
        brief: reusableSnapshot.brief,
        model: reusableSnapshot.model,
        sourceFetchedAt: weather.source.fetchedAt,
        sourceFingerprint,
        reusedFromSlot: reusableSnapshot.slotKey,
      });
      const snapshot: WeatherAiSnapshot = {
        slotKey,
        period,
        brief: reusableSnapshot.brief,
        model: reusableSnapshot.model,
        generatedAt,
        sourceFingerprint,
        reusedFromSlot: reusableSnapshot.slotKey,
      };
      cacheSnapshot(snapshot, SNAPSHOT_CACHE_MS);
      return {
        status: "reused",
        slotKey,
        period,
        generatedAt,
        model: reusableSnapshot.model,
        sourceFingerprint,
        reusedFromSlot: reusableSnapshot.slotKey,
        error: null,
      };
    }

    if (weather.status === "unavailable" || (!weather.current && weather.daily.length === 0)) {
      const error = "Não há dados meteorológicos suficientes para sintetizar.";
      await completeSnapshot(config, {
        slotKey,
        leaseToken,
        status: "failed",
        error,
        sourceFetchedAt: weather.source.fetchedAt,
      });
      return {
        status: "failed",
        slotKey,
        period,
        generatedAt: null,
        model: null,
        sourceFingerprint,
        reusedFromSlot: null,
        error,
      };
    }

    let budget;
    try {
      budget = await claimWeatherAiMonthlyBudget(slotKey, date);
    } catch (error) {
      const message = `Proteção financeira da IA indisponível; chamada bloqueada. ${
        error instanceof Error ? error.message : String(error)
      }`;
      await completeSnapshot(config, {
        slotKey,
        leaseToken,
        status: "failed",
        error: message,
        sourceFetchedAt: weather.source.fetchedAt,
      });
      return {
        status: "budget-blocked",
        slotKey,
        period,
        generatedAt: null,
        model: null,
        sourceFingerprint,
        reusedFromSlot: null,
        error: message,
      };
    }

    if (!budget.allowed || !budget.callId) {
      const error = `Teto mensal de ${budget.callLimit} chamadas ao Gemini atingido; geração bloqueada.`;
      await completeSnapshot(config, {
        slotKey,
        leaseToken,
        status: "failed",
        error,
        sourceFetchedAt: weather.source.fetchedAt,
      });
      return {
        status: "budget-blocked",
        slotKey,
        period,
        generatedAt: null,
        model: null,
        sourceFingerprint,
        reusedFromSlot: null,
        error,
        budgetMonth: budget.monthKey,
        monthlyCalls: budget.calls,
        monthlyCallLimit: budget.callLimit,
      };
    }

    budgetCallId = budget.callId;
    const gemini = await generateGeminiWeatherBrief(weather);
    await completeWeatherAiCall(budgetCallId, {
      status: gemini.status === "generated" && gemini.brief ? "generated" : "failed",
      model: gemini.model,
      error: gemini.error,
    }).catch((error) => {
      console.error("[weather-ai] Não foi possível fechar o log individual da chamada", {
        callId: budgetCallId,
        message: error instanceof Error ? error.message : String(error),
      });
    });
    budgetCallId = null;

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
        sourceFingerprint,
        reusedFromSlot: null,
        error,
        budgetMonth: budget.monthKey,
        monthlyCalls: budget.calls,
        monthlyCallLimit: budget.callLimit,
      };
    }

    const generatedAt = await completeSnapshot(config, {
      slotKey,
      leaseToken,
      status: "generated",
      brief: gemini.brief,
      model: gemini.model,
      sourceFetchedAt: weather.source.fetchedAt,
      sourceFingerprint,
    });
    const snapshot: WeatherAiSnapshot = {
      slotKey,
      period,
      brief: gemini.brief,
      model: gemini.model,
      generatedAt,
      sourceFingerprint,
      reusedFromSlot: null,
    };
    cacheSnapshot(snapshot, SNAPSHOT_CACHE_MS);

    return {
      status: "generated",
      slotKey,
      period,
      generatedAt,
      model: gemini.model,
      sourceFingerprint,
      reusedFromSlot: null,
      error: null,
      budgetMonth: budget.monthKey,
      monthlyCalls: budget.calls,
      monthlyCallLimit: budget.callLimit,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha desconhecida.";
    if (budgetCallId) {
      await completeWeatherAiCall(budgetCallId, {
        status: "failed",
        model: null,
        error: message,
      }).catch(() => undefined);
    }
    if (leaseToken) {
      await completeSnapshot(config, {
        slotKey,
        leaseToken,
        status: "failed",
        error: message,
        sourceFingerprint,
      }).catch(() => undefined);
    }
    return {
      status: "failed",
      slotKey,
      period,
      generatedAt: null,
      model: null,
      sourceFingerprint,
      reusedFromSlot: null,
      error: message,
    };
  }
}
