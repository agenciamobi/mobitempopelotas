import { createFileRoute } from "@tanstack/react-router";

import { safeNextPath } from "@/lib/auth/paths";
import { createSupabaseRequestClient } from "@/lib/supabase/request-client.server";
import { getSupabaseServerConfig } from "@/lib/supabase/server-client.server";

function redirectResponse(location: URL, headers = new Headers()) {
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Location", location.toString());
  headers.set("Pragma", "no-cache");
  headers.set("Vary", "Cookie");

  return new Response(null, { status: 302, headers });
}

function loginErrorUrl(origin: string, code: "codigo" | "configuracao" | "oauth", next: string) {
  const target = new URL("/entrar", origin);
  target.searchParams.set("erro", code);
  target.searchParams.set("next", next);
  return target;
}

async function exchangeGoogleCode(request: Request) {
  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get("next"), "/minha-conta");
  const code = url.searchParams.get("code");
  const config = getSupabaseServerConfig();

  if (!config.isPublicConfigured) {
    return redirectResponse(loginErrorUrl(url.origin, "configuracao", next));
  }

  if (!code) {
    return redirectResponse(loginErrorUrl(url.origin, "codigo", next));
  }

  try {
    const { client, responseHeaders } = createSupabaseRequestClient(request);
    const { error } = await client.auth.exchangeCodeForSession(code);

    if (error) {
      console.warn("[supabase-auth] Falha ao trocar o código OAuth", {
        message: error.message,
        status: error.status,
      });
      return redirectResponse(loginErrorUrl(url.origin, "oauth", next), responseHeaders);
    }

    return redirectResponse(new URL(next, url.origin), responseHeaders);
  } catch (error) {
    console.error("[supabase-auth] Falha inesperada no callback OAuth", {
      message: error instanceof Error ? error.message : String(error),
    });
    return redirectResponse(loginErrorUrl(url.origin, "oauth", next));
  }
}

export const Route = createFileRoute("/auth/callback")({
  server: {
    handlers: {
      GET: ({ request }) => exchangeGoogleCode(request),
    },
  },
});
