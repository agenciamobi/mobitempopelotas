const MAX_PUSH_JSON_BYTES = 16_384;

const PUSH_ENDPOINT_HOSTS = new Set([
  "fcm.googleapis.com",
  "android.googleapis.com",
  "updates.push.services.mozilla.com",
  "push.services.mozilla.com",
  "web.push.apple.com",
  "notify.windows.com",
]);

export const PUSH_RESPONSE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  "Content-Type": "application/json; charset=utf-8",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow",
} as const;

export function pushJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: PUSH_RESPONSE_HEADERS,
  });
}

export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function isReasonableJsonRequest(request: Request) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) return false;

  const contentLength = Number(request.headers.get("content-length"));
  return !Number.isFinite(contentLength) || contentLength <= MAX_PUSH_JSON_BYTES;
}

export function isAllowedPushEndpoint(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return false;
    if (url.port && url.port !== "443") return false;

    const hostname = url.hostname.toLowerCase();
    return (
      PUSH_ENDPOINT_HOSTS.has(hostname) ||
      hostname.endsWith(".push.apple.com") ||
      hostname.endsWith(".notify.windows.com")
    );
  } catch {
    return false;
  }
}

export function hasBearerSecret(request: Request, secret: string | undefined) {
  const normalized = secret?.trim();
  return Boolean(normalized) && request.headers.get("authorization") === `Bearer ${normalized}`;
}

export function safeInternalPath(value: unknown, fallback = "/") {
  if (typeof value !== "string") return fallback;
  const candidate = value.trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.includes("\\")) {
    return fallback;
  }

  return candidate.slice(0, 300);
}
