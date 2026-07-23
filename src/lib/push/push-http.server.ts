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

export type LimitedJsonResult =
  { ok: true; value: unknown } | { ok: false; status: 400 | 413 | 415; error: string };

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

export async function readLimitedJson(request: Request): Promise<LimitedJsonResult> {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    return { ok: false, status: 415, error: "O corpo deve ser enviado como JSON." };
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    const declaredBytes = Number(contentLength);
    if (!Number.isFinite(declaredBytes) || declaredBytes < 0) {
      return { ok: false, status: 400, error: "O tamanho declarado do corpo é inválido." };
    }
    if (declaredBytes > MAX_PUSH_JSON_BYTES) {
      return { ok: false, status: 413, error: "O corpo JSON excede o limite permitido." };
    }
  }

  if (!request.body) return { ok: true, value: null };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;

      totalBytes += value.byteLength;
      if (totalBytes > MAX_PUSH_JSON_BYTES) {
        await reader.cancel("Corpo JSON acima do limite.").catch(() => undefined);
        return { ok: false, status: 413, error: "O corpo JSON excede o limite permitido." };
      }

      chunks.push(value);
    }

    const bytes = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }

    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { ok: true, value: text.trim() ? JSON.parse(text) : null };
  } catch {
    return { ok: false, status: 400, error: "O corpo JSON é inválido." };
  } finally {
    reader.releaseLock();
  }
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
