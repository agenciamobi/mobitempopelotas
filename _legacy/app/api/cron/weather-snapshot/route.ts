import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  getPelotasHistoricalDay,
  getPelotasWeatherHistory,
} from "@/lib/weather-history-service";
import {
  getWeatherSnapshotStorageStatus,
  upsertWeatherSnapshot,
  upsertWeatherSnapshots,
} from "@/lib/weather-snapshot-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function noStoreJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function guardSnapshotRequest(request: NextRequest) {
  const storage = getWeatherSnapshotStorageStatus();

  if (!storage.configured) {
    return noStoreJson({
      success: true,
      skipped: true,
      reason: "Armazenamento de snapshots ainda não configurado",
      missing: storage.missing,
    });
  }

  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return noStoreJson({ success: false, error: "Não autorizado" }, 401);
  }

  return null;
}

export async function GET(request: NextRequest) {
  const guardResponse = guardSnapshotRequest(request);
  if (guardResponse) return guardResponse;

  try {
    const day = await getPelotasHistoricalDay();
    const snapshot = await upsertWeatherSnapshot(
      day,
      "Open-Meteo Historical Forecast",
    );

    return noStoreJson({
      success: true,
      stored: true,
      snapshot,
    });
  } catch (error) {
    console.error("Falha na captura diária do snapshot meteorológico:", error);

    return noStoreJson(
      {
        success: false,
        error: "Não foi possível persistir o snapshot meteorológico",
      },
      500,
    );
  }
}

export async function POST(request: NextRequest) {
  const guardResponse = guardSnapshotRequest(request);
  if (guardResponse) return guardResponse;

  try {
    const history = await getPelotasWeatherHistory();

    if (history.source.isFallback) {
      return noStoreJson(
        {
          success: false,
          error: "A fonte histórica está em contingência; o backfill foi interrompido",
        },
        503,
      );
    }

    const snapshots = await upsertWeatherSnapshots(
      history.days,
      "Open-Meteo Historical Forecast",
    );

    return noStoreJson({
      success: true,
      backfill: true,
      storedCount: snapshots.length,
      firstDate: snapshots[0]?.date ?? null,
      lastDate: snapshots.at(-1)?.date ?? null,
    });
  } catch (error) {
    console.error("Falha no backfill do arquivo meteorológico:", error);

    return noStoreJson(
      {
        success: false,
        error: "Não foi possível preencher o arquivo meteorológico",
      },
      500,
    );
  }
}
