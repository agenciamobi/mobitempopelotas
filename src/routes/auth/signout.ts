import { createFileRoute } from "@tanstack/react-router";

import { createSupabaseRequestClient } from "@/lib/supabase/request-client.server";
import { getSupabaseServerConfig } from "@/lib/supabase/server-client.server";

function isSameOriginRequest(request: Request) {
  const expectedOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin) return origin === expectedOrigin;

  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin === expectedOrigin;
    } catch {
      return false;
    }
  }

  return request.headers.get("sec-fetch-site") === "same-origin";
}

function homeRedirect(headers = new Headers()) {
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Location", "/");
  headers.set("Pragma", "no-cache");
  headers.set("Vary", "Cookie");

  return new Response(null, { status: 303, headers });
}

async function signOut(request: Request) {
  if (!isSameOriginRequest(request)) {
    return new Response("Origem da solicitação não autorizada.", {
      status: 403,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  }

  const config = getSupabaseServerConfig();
  if (!config.isPublicConfigured) return homeRedirect();

  try {
    const { client, responseHeaders } = createSupabaseRequestClient(request);
    const { error } = await client.auth.signOut({ scope: "local" });

    if (error) {
      console.warn("[supabase-auth] Falha ao encerrar a sessão local", {
        message: error.message,
        status: error.status,
      });
    }

    return homeRedirect(responseHeaders);
  } catch (error) {
    console.error("[supabase-auth] Falha inesperada no logout", {
      message: error instanceof Error ? error.message : String(error),
    });
    return homeRedirect();
  }
}

export const Route = createFileRoute("/auth/signout")({
  server: {
    handlers: {
      POST: ({ request }) => signOut(request),
    },
  },
});
