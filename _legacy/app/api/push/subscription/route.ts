import { NextRequest, NextResponse } from "next/server";
import {
  deletePushSubscription,
  getPushStorageStatus,
  savePushSubscription,
  type StoredPushSubscription,
} from "@/lib/push-subscription-store";
import { getPushConfigurationStatus } from "@/lib/web-push-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return !origin || origin === request.nextUrl.origin;
}

function parseSubscription(value: unknown): StoredPushSubscription | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const candidate = value as Record<string, unknown>;
  const keys = candidate.keys;
  if (!keys || typeof keys !== "object" || Array.isArray(keys)) return null;

  const keyRecord = keys as Record<string, unknown>;
  const endpoint = typeof candidate.endpoint === "string" ? candidate.endpoint.trim() : "";
  const p256dh = typeof keyRecord.p256dh === "string" ? keyRecord.p256dh.trim() : "";
  const auth = typeof keyRecord.auth === "string" ? keyRecord.auth.trim() : "";
  const expirationTime =
    candidate.expirationTime === null || candidate.expirationTime === undefined
      ? null
      : Number(candidate.expirationTime);

  if (!endpoint.startsWith("https://") || endpoint.length > 2048) return null;
  if (!p256dh || !auth || p256dh.length > 512 || auth.length > 256) return null;
  if (expirationTime !== null && !Number.isFinite(expirationTime)) return null;

  return {
    endpoint,
    expirationTime,
    keys: { p256dh, auth },
  };
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  }

  const configuration = getPushConfigurationStatus();
  if (!configuration.enabled) {
    return NextResponse.json(
      { error: "As notificações ainda não estão disponíveis." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { subscription?: unknown; topics?: unknown }
    | null;
  const subscription = parseSubscription(body?.subscription);

  if (!subscription) {
    return NextResponse.json({ error: "Inscrição inválida." }, { status: 400 });
  }

  const topics = Array.isArray(body?.topics)
    ? body.topics.filter((topic): topic is string => typeof topic === "string")
    : undefined;

  await savePushSubscription(
    subscription,
    request.headers.get("user-agent"),
    topics,
  );

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Origem não permitida." }, { status: 403 });
  }

  if (!getPushStorageStatus().configured) {
    return NextResponse.json(
      { error: "As notificações ainda não estão disponíveis." },
      { status: 503 },
    );
  }

  const body = (await request.json().catch(() => null)) as { endpoint?: unknown } | null;
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint.trim() : "";

  if (!endpoint.startsWith("https://") || endpoint.length > 2048) {
    return NextResponse.json({ error: "Inscrição inválida." }, { status: 400 });
  }

  await deletePushSubscription(endpoint);
  return NextResponse.json({ success: true });
}
