import { NextRequest, NextResponse } from "next/server";
import { getLaranjalLevelData } from "@/lib/laranjal-level";
import {
  hasPushDispatch,
  recordPushDispatch,
} from "@/lib/push-subscription-store";
import { getWeatherAdvisory } from "@/lib/weather-insights";
import { getPelotasWeather } from "@/lib/weather-service";
import {
  broadcastPushNotification,
  getPushConfigurationStatus,
} from "@/lib/web-push-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}

function localDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatLevel(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const configuration = getPushConfigurationStatus();
  if (!configuration.enabled) {
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: "push-not-configured",
    });
  }

  const fingerprint = `previsao-diaria-${localDateKey()}`;
  if (await hasPushDispatch(fingerprint)) {
    return NextResponse.json({ success: true, skipped: true, reason: "already-sent" });
  }

  const [weather, laranjal] = await Promise.all([
    getPelotasWeather(),
    getLaranjalLevelData(),
  ]);
  const today = weather.daily[0];
  const advisory = getWeatherAdvisory(weather);
  const maxGust = Math.max(
    weather.current.windGust,
    ...weather.hourly.map((hour) => hour.windGust),
  );
  const weatherSummary = `${weather.current.condition}, ${weather.current.temperature}°. Máxima de ${today?.max ?? weather.current.temperature}° e mínima de ${today?.min ?? weather.current.temperature}°. Chuva ${today?.rainChance ?? 0}% e rajadas de até ${maxGust} km/h.`;
  const waterSummary =
    laranjal.currentLevel !== null
      ? ` Lagoa no Laranjal: ${formatLevel(laranjal.currentLevel)} m.`
      : "";
  const title =
    advisory.level === "warning"
      ? "Atenção redobrada para o tempo em Pelotas"
      : advisory.level === "attention"
        ? "Acompanhe chuva e vento em Pelotas"
        : "Previsão de hoje em Pelotas";
  const url = advisory.level === "normal" ? "/" : "/alertas";
  const result = await broadcastPushNotification({
    title,
    body: `${weatherSummary}${waterSummary}`.slice(0, 240),
    url,
    tag: `previsao-${localDateKey()}`,
    urgency: advisory.level === "warning" ? "high" : "normal",
    requireInteraction: advisory.level === "warning",
    renotify: advisory.level === "warning",
  });

  await recordPushDispatch(fingerprint, title, result.sent);

  return NextResponse.json({
    success: true,
    advisory: advisory.level,
    ...result,
  });
}
