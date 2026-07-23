import { createFileRoute } from "@tanstack/react-router";

import { fetchLaranjalLevelData } from "@/lib/hydrology/laranjal-level.server";
import { hasBearerSecret, pushJsonResponse } from "@/lib/push/push-http.server";
import {
  claimPushDispatch,
  recordPushDispatch,
  releasePushDispatch,
} from "@/lib/push/push-storage.server";
import { broadcastPushNotification, getPushConfigurationStatus } from "@/lib/push/web-push.server";
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

function buildWeatherSummary(
  weather: Awaited<ReturnType<typeof fetchWeatherIntelligence>>,
  laranjal: Awaited<ReturnType<typeof fetchLaranjalLevelData>>,
) {
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

  if (laranjal.currentLevel !== null) {
    parts.push(`Nível observado no Laranjal: ${formatNumber(laranjal.currentLevel, 2)} m`);
  }

  return parts.length > 0 ? `${parts.join(". ")}.`.slice(0, 240) : null;
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
  const fingerprint = `resumo-diario-${date}`;
  let claimed = false;
  let deliveryCompleted = false;

  try {
    const [weather, laranjal] = await Promise.all([
      fetchWeatherIntelligence(),
      fetchLaranjalLevelData(),
    ]);
    const activeAlerts = weather.weather.alerts.filter((alert) => alert.period === "active");
    const title =
      activeAlerts.length > 0
        ? "INMET: aviso oficial para Pelotas"
        : "Previsão de hoje em Pelotas";
    const summary = buildWeatherSummary(weather, laranjal);

    if (!summary && activeAlerts.length === 0) {
      return pushJsonResponse({
        success: true,
        skipped: true,
        reason: "no-usable-data",
      });
    }

    claimed = await claimPushDispatch(fingerprint, title);
    if (!claimed) {
      return pushJsonResponse({ success: true, skipped: true, reason: "already-sent" });
    }

    const alertContext =
      activeAlerts.length === 1
        ? "Há 1 aviso oficial ativo. "
        : activeAlerts.length > 1
          ? `Há ${activeAlerts.length} avisos oficiais ativos. `
          : "";
    const result = await broadcastPushNotification({
      title,
      body: `${alertContext}${summary ?? "Consulte os detalhes no portal."}`.slice(0, 240),
      url: activeAlerts.length > 0 ? "/alertas" : "/",
      tag: `previsao-${date}`,
      urgency: activeAlerts.length > 0 ? "high" : "normal",
      requireInteraction: activeAlerts.length > 0,
      renotify: activeAlerts.length > 0,
      topic: "weather",
    });
    deliveryCompleted = true;

    let dispatchRecorded = true;
    try {
      await recordPushDispatch(fingerprint, title, result);
    } catch (error) {
      dispatchRecorded = false;
      console.error("[push/cron] Entrega concluída, mas métricas não foram atualizadas", {
        message: error instanceof Error ? error.message : String(error),
      });
    }

    return pushJsonResponse({
      success: true,
      date,
      officialAlerts: activeAlerts.length,
      dispatchRecorded,
      ...result,
    });
  } catch (error) {
    if (claimed && !deliveryCompleted) {
      await releasePushDispatch(fingerprint).catch(() => undefined);
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
