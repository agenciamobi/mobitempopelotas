import type { CookieOptions } from "@supabase/ssr";

import {
  createSupabaseServerClient,
  type SupabaseCookie,
  type SupabaseCookieToSet,
} from "./server-client.server";

function decodeCookieValue(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseRequestCookies(request: Request): SupabaseCookie[] {
  const header = request.headers.get("cookie");
  if (!header) return [];

  return header.split(/;\s*/).flatMap((part) => {
    const separator = part.indexOf("=");
    if (separator <= 0) return [];

    return [
      {
        name: part.slice(0, separator),
        value: decodeCookieValue(part.slice(separator + 1)),
      },
    ];
  });
}

function sameSiteValue(value: unknown) {
  if (value === true) return "Strict";
  if (typeof value !== "string") return null;

  const normalized = value.toLowerCase();
  if (normalized === "lax") return "Lax";
  if (normalized === "strict") return "Strict";
  if (normalized === "none") return "None";
  return null;
}

function serializeResponseCookie(cookie: SupabaseCookieToSet) {
  const options = cookie.options as CookieOptions & Record<string, unknown>;
  const encode = typeof options.encode === "function" ? options.encode : encodeURIComponent;
  const parts = [`${cookie.name}=${encode(cookie.value)}`];

  if (typeof options.maxAge === "number" && Number.isFinite(options.maxAge)) {
    parts.push(`Max-Age=${Math.trunc(options.maxAge)}`);
  }
  if (options.domain) parts.push(`Domain=${options.domain}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.expires instanceof Date) parts.push(`Expires=${options.expires.toUTCString()}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.partitioned) parts.push("Partitioned");

  const sameSite = sameSiteValue(options.sameSite);
  if (sameSite) parts.push(`SameSite=${sameSite}`);

  if (typeof options.priority === "string") {
    const priority = options.priority.toLowerCase();
    if (priority === "low" || priority === "medium" || priority === "high") {
      parts.push(`Priority=${priority.charAt(0).toUpperCase()}${priority.slice(1)}`);
    }
  }

  return parts.join("; ");
}

export function createSupabaseRequestClient(request: Request) {
  const cookieJar = new Map(parseRequestCookies(request).map((cookie) => [cookie.name, cookie.value]));
  const responseHeaders = new Headers();

  const client = createSupabaseServerClient({
    getAll() {
      return Array.from(cookieJar, ([name, value]) => ({ name, value }));
    },
    setAll(cookies) {
      for (const cookie of cookies) {
        cookieJar.set(cookie.name, cookie.value);
        responseHeaders.append("Set-Cookie", serializeResponseCookie(cookie));
      }
    },
  });

  return { client, responseHeaders };
}
