import { createFileRoute } from "@tanstack/react-router";

import { fetchPelotasWeatherHistory } from "@/lib/weather/history.server";
import {
  getWeatherSnapshotStorageStatus,
  upsertWeatherSnapshot,
  upsertWeatherSnapshots,
} from "@/lib/weather/weather-snapshot-store.server";

const TIMEZONE = "America/Sao_Paulo";
const RESPONSE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: RESPONSE_HEADERS,
  });
}

function localDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function shiftDate(date: string, amount: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

function authorizeSnapshotRequest(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return jsonResponse(
      {
        success: false,
        configured: false,
        error: "A rotina de arquivo meteorológico ainda não foi configurada.",
      },
      503,
    );
  }

  if (request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return jsonResponse({ success: false, error: "Não autorizado." }, 401);
  }

  const storage = getWeatherSnapshotStorageStatus();
  if (!storage.configured) {
    return jsonResponse(
      {
        success: false,
        configured: false,
        error: "O armazenamento de snapshots meteorológicos ainda não está disponível.",
        missing: storage.missing,
      },
      503,
    );
  }

  return null;
}

async function captureDailySnapshot(request: Request) {
  const guardResponse = authorizeSnapshotRequest(request);
  if (guardResponse) return guardResponse;

  try {
    const history = await fetchPelotasWeatherHistory();
    if (history.status === "unavailable") {
      return jsonResponse(
        {
          success: false,
          stored: false,
          error: "Nenhuma fonte histórica real está disponível para a captura diária.",
        },
        503,
      );
    }

    const targetDate = shiftDate(localDateString(), -1);
    const day = history.days.find((candidate) => candidate.date === targetDate);
    if (!day) {
      return jsonResponse(
        {
          success: false,
          stored: false,
          targetDate,
          error: "A fonte não publicou um dia completo para a data esperada.",
        },
        503,
      );
    }

    const snapshot = await upsertWeatherSnapshot(day, history.source.name);
    return jsonResponse({
      success: true,
      stored: true,
      targetDate,
      snapshot,
      source: history.source.name,
    });
  } catch (error) {
    console.error("[weather/snapshot] Falha na captura diária", {
      message: error instanceof Error ? error.message : String(error),
    });
    return jsonResponse(
      {
        success: false,
        stored: false,
        error: "Não foi possível persistir o snapshot meteorológico.",
      },
      500,
    );
  }
}

async function backfillSnapshots(request: Request) {
  const guardResponse = authorizeSnapshotRequest(request);
  if (guardResponse) return guardResponse;

  try {
    const history = await fetchPelotasWeatherHistory();
    if (history.status === "unavailable" || history.days.length === 0) {
      return jsonResponse(
        {
          success: false,
          backfill: false,
          error:
            "O preenchimento foi interrompido porque nenhuma série histórica real está disponível.",
        },
        503,
      );
    }

    const snapshots = await upsertWeatherSnapshots(history.days, history.source.name);
    return jsonResponse({
      success: true,
      backfill: true,
      storedCount: snapshots.length,
      firstDate: snapshots[0]?.date ?? null,
      lastDate: snapshots.at(-1)?.date ?? null,
      source: history.source.name,
    });
  } catch (error) {
    console.error("[weather/snapshot] Falha no preenchimento do arquivo meteorológico", {
      message: error instanceof Error ? error.message : String(error),
    });
    return jsonResponse(
      {
        success: false,
        backfill: false,
        error: "Não foi possível preencher o arquivo meteorológico.",
      },
      500,
    );
  }
}

export const Route = createFileRoute("/api/cron/weather-snapshot")({
  server: {
    handlers: {
      GET: ({ request }) => captureDailySnapshot(request),
      POST: ({ request }) => backfillSnapshots(request),
    },
  },
});
