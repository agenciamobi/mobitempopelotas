import { createFileRoute } from "@tanstack/react-router";

import {
  authorizeHistoricalArchiveRequest,
  captureEnvironmentalHistory,
} from "@/lib/history/historical-archive.server";
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

type ArchiveAction =
  | "environmental-capture"
  | "environmental-backfill"
  | "weather-daily"
  | "weather-backfill";

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

async function authorizeSnapshotRequest(request: Request) {
  if (!(await authorizeHistoricalArchiveRequest(request))) {
    return jsonResponse({ success: false, error: "Não autorizado." }, 401);
  }
  return null;
}

function ensureWeatherSnapshotStorage() {
  const storage = getWeatherSnapshotStorageStatus();
  if (storage.configured) return null;

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

async function captureDailySnapshot() {
  const storageGuard = ensureWeatherSnapshotStorage();
  if (storageGuard) return storageGuard;

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
      action: "weather-daily",
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
        action: "weather-daily",
        stored: false,
        error: "Não foi possível persistir o snapshot meteorológico.",
      },
      500,
    );
  }
}

async function backfillSnapshots() {
  const storageGuard = ensureWeatherSnapshotStorage();
  if (storageGuard) return storageGuard;

  try {
    const history = await fetchPelotasWeatherHistory();
    if (history.status === "unavailable" || history.days.length === 0) {
      return jsonResponse(
        {
          success: false,
          action: "weather-backfill",
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
      action: "weather-backfill",
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
        action: "weather-backfill",
        backfill: false,
        error: "Não foi possível preencher o arquivo meteorológico.",
      },
      500,
    );
  }
}

async function environmentalArchive(backfill: boolean) {
  try {
    const result = await captureEnvironmentalHistory(backfill);
    return jsonResponse({ success: true, ...result });
  } catch (error) {
    console.error("[history/archive] Falha na captura ambiental", {
      backfill,
      message: error instanceof Error ? error.message : String(error),
    });
    return jsonResponse(
      {
        success: false,
        action: backfill ? "environmental-backfill" : "environmental-capture",
        error: "Não foi possível atualizar o arquivo histórico ambiental.",
      },
      500,
    );
  }
}

async function postAction(request: Request) {
  let action: ArchiveAction = "weather-backfill";

  try {
    const body = (await request.json()) as { action?: unknown };
    if (typeof body?.action === "string") action = body.action as ArchiveAction;
  } catch {
    // Compatibilidade com o POST histórico: sem corpo continua executando backfill meteorológico.
  }

  if (action === "weather-daily") return captureDailySnapshot();
  if (action === "weather-backfill") return backfillSnapshots();
  if (action === "environmental-capture") return environmentalArchive(false);
  if (action === "environmental-backfill") return environmentalArchive(true);

  return jsonResponse({ success: false, error: "Ação histórica inválida." }, 400);
}

async function handleAuthorized(request: Request, handler: () => Promise<Response>) {
  const guard = await authorizeSnapshotRequest(request);
  return guard ?? handler();
}

export const Route = createFileRoute("/api/cron/weather-snapshot")({
  server: {
    handlers: {
      GET: ({ request }) => handleAuthorized(request, captureDailySnapshot),
      POST: ({ request }) => handleAuthorized(request, () => postAction(request)),
    },
  },
});
