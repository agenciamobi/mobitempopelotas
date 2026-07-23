import { createHash } from "node:crypto";

import { createFileRoute } from "@tanstack/react-router";

import { hasBearerSecret, pushJsonResponse } from "@/lib/push/push-http.server";
import {
  claimPushDispatch,
  recordPushDispatch,
  releasePushDispatch,
} from "@/lib/push/push-storage.server";
import { broadcastPushNotification, getPushConfigurationStatus } from "@/lib/push/web-push.server";
import type { InmetAlert } from "@/lib/weather/official-sources.types";
import { fetchWeatherIntelligence } from "@/lib/weather/weather-intelligence.server";

const TIMEZONE = "America/Sao_Paulo";

function localDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function normalizedSentence(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return /[.!?]$/.test(normalized) ? normalized : `${normalized}.`;
}

function formatAlertExpiry(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function buildWeatherSummary(weather: Awaited<ReturnType<typeof fetchWeatherIntelligence>>) {
  const parts: string[] = [];
  const current = weather.weather.current;
  const today = weather.weather.daily[0];

  if (current?.temperature !== null && current?.temperature !== undefined) {
    const condition = current.condition ? `, ${current.condition.toLowerCase()}` : "";
    parts.push(`Agora: ${formatNumber(current.temperature)} °C${condition}`);
  }

  if (today) {
    const rain =
      today.rainChance === null
        ? `${formatNumber(today.precipitationMm, 1)} mm de chuva previstos`
        : `${formatNumber(today.rainChance)}% de chance de chuva`;
    parts.push(
      `Hoje: mínima de ${formatNumber(today.min)} °C, máxima de ${formatNumber(today.max)} °C e ${rain}`,
    );
  }

  return parts.length > 0 ? `${parts.join(". ")}.`.slice(0, 240) : null;
}

function buildOfficialAlertBody(alerts: InmetAlert[]) {
  const primary = alerts[0];
  if (!primary) return "Consulte a vigência e as orientações do aviso oficial no portal.";

  const event = primary.event.trim() || primary.headline.trim() || "Aviso meteorológico";
  const expiresAt = formatAlertExpiry(primary.expiresAt);
  const parts = [normalizedSentence(`Aviso oficial do INMET — ${primary.severityLabel}: ${event}`)];

  if (expiresAt) parts.push(`Vigente até ${expiresAt}.`);
  const instruction = normalizedSentence(primary.instruction);
  if (instruction) parts.push(instruction);
  if (alerts.length > 1) {
    parts.push(`Há mais ${alerts.length - 1} aviso${alerts.length === 2 ? "" : "s"} para Pelotas.`);
  }

  return parts.join(" ").slice(0, 240);
}

function alertFingerprint(alerts: InmetAlert[]) {
  return createHash("sha256")
    .update(
      alerts
        .map((alert) => alert.id)
        .sort()
        .join("|"),
    )
    .digest("hex")
    .slice(0, 16);
}

async function sendDailySummary(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return pushJsonResponse(
      {
        success: false,
        configured: false,
        error: "A rotina de notificações ainda não foi configurada.",
      },
      503,
    );
  }

  if (!hasBearerSecret(request, cronSecret)) {
    return pushJsonResponse({ success: false, error: "Não autorizado." }, 401);
  }

  const configuration = getPushConfigurationStatus();
  if (!configuration.enabled) {
    return pushJsonResponse(
      {
        success: false,
        configured: false,
        error: "As notificações ainda não estão operacionais neste ambiente.",
        missing: configuration.missing,
      },
      503,
    );
  }

  const date = localDateKey();
  let fingerprint = `resumo-diario-${date}`;
  let leaseToken: string | null = null;
  let deliveryCompleted = false;

  try {
    const weather = await fetchWeatherIntelligence();
    const pelotasAlerts = weather.weather.alerts.filter(
      (alert) => alert.period === "active" && alert.relevance === "pelotas",
    );
    const hasOfficialAlert = pelotasAlerts.length > 0;
    const primaryAlert = pelotasAlerts[0];
    const event = primaryAlert?.event.trim() || primaryAlert?.headline.trim() || "aviso oficial";
    const title = hasOfficialAlert
      ? `INMET: ${event} em Pelotas`.slice(0, 90)
      : "Previsão de hoje em Pelotas";
    const body = hasOfficialAlert
      ? buildOfficialAlertBody(pelotasAlerts)
      : buildWeatherSummary(weather);

    if (!body) {
      return pushJsonResponse({
        success: true,
        skipped: true,
        reason: "no-usable-data",
      });
    }

    if (hasOfficialAlert) {
      fingerprint = `inmet-pelotas-${date}-${alertFingerprint(pelotasAlerts)}`;
    }

    leaseToken = await claimPushDispatch(fingerprint, title);
    if (!leaseToken) {
      return pushJsonResponse({ success: true, skipped: true, reason: "already-sent" });
    }

    const result = await broadcastPushNotification({
      title,
      body,
      url: hasOfficialAlert ? "/alertas" : "/",
      tag: hasOfficialAlert ? `inmet-pelotas-${date}` : `previsao-${date}`,
      urgency: hasOfficialAlert ? "high" : "normal",
      requireInteraction: hasOfficialAlert,
      renotify: hasOfficialAlert,
      topic: "weather",
    });
    deliveryCompleted = true;

    let dispatchRecorded = true;
    try {
      await recordPushDispatch(fingerprint, leaseToken, title, result);
    } catch (error) {
      dispatchRecorded = false;
      console.error("[push/cron] Entrega concluída, mas métricas não foram atualizadas", {
        message: error instanceof Error ? error.message : String(error),
      });
    }

    return pushJsonResponse({
      success: true,
      date,
      kind: hasOfficialAlert ? "official-alert" : "weather-summary",
      officialAlerts: pelotasAlerts.length,
      dispatchRecorded,
      ...result,
    });
  } catch (error) {
    if (leaseToken && !deliveryCompleted) {
      await releasePushDispatch(fingerprint, leaseToken).catch(() => undefined);
    }
    console.error("[push/cron] Falha no resumo diário", {
      message: error instanceof Error ? error.message : String(error),
    });
    return pushJsonResponse(
      { success: false, error: "Não foi possível enviar o resumo diário." },
      500,
    );
  }
}

export const Route = createFileRoute("/api/cron/push-daily")({
  server: {
    handlers: {
      GET: ({ request }) => sendDailySummary(request),
    },
  },
});
