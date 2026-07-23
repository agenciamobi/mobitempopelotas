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
  return !origin || origin === new URL(request.url).origin;
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
