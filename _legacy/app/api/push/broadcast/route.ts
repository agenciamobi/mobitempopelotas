import { NextRequest, NextResponse } from "next/server";
import { broadcastPushNotification } from "@/lib/web-push-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(request: NextRequest) {
  const secret = process.env.PUSH_ADMIN_SECRET || process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 90) : "";
  const message = typeof body?.body === "string" ? body.body.trim().slice(0, 240) : "";
  const url = typeof body?.url === "string" && body.url.startsWith("/")
    ? body.url.slice(0, 300)
    : "/";
  const tag = typeof body?.tag === "string"
    ? body.tag.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 32)
    : "comunicado";
  const urgency =
    body?.urgency === "very-low" ||
    body?.urgency === "low" ||
    body?.urgency === "normal" ||
    body?.urgency === "high"
      ? body.urgency
      : "normal";

  if (!title || !message) {
    return NextResponse.json(
      { error: "Informe título e mensagem." },
      { status: 400 },
    );
  }

  const result = await broadcastPushNotification({
    title,
    body: message,
    url,
    tag,
    urgency,
    requireInteraction: urgency === "high",
    renotify: urgency === "high",
  });

  return NextResponse.json({ success: true, ...result });
}
