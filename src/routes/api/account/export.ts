import { createFileRoute } from "@tanstack/react-router";

import { getVerifiedRequestUser } from "@/lib/auth/request-user.server";
import { createSupabaseAdminClient } from "@/lib/supabase/server-client.server";

function jsonHeaders(base = new Headers()) {
  base.set("Cache-Control", "private, no-store, max-age=0");
  base.set("Content-Type", "application/json; charset=utf-8");
  base.set("Pragma", "no-cache");
  base.set("Vary", "Cookie, Authorization");
  base.set("X-Content-Type-Options", "nosniff");
  base.set("X-Robots-Tag", "noindex, nofollow");
  return base;
}

async function exportAccountData(request: Request) {
  try {
    const account = await getVerifiedRequestUser(request);
    const headers = jsonHeaders(account.responseHeaders);

    if (!account.configured) {
      return new Response(
        JSON.stringify({ success: false, error: "A área de conta não está disponível." }),
        { status: 503, headers },
      );
    }

    if (!account.user) {
      return new Response(JSON.stringify({ success: false, error: "Sessão não autenticada." }), {
        status: 401,
        headers,
      });
    }

    const admin = createSupabaseAdminClient();
    const [profileResult, preferencesResult, consentResult, pushResult] = await Promise.all([
      admin.from("profiles").select("email,display_name,avatar_url,created_at,updated_at").eq("id", account.user.id).maybeSingle(),
      admin
        .from("user_preferences")
        .select("weather_alerts,water_alerts,daily_summary,community_updates,created_at,updated_at")
        .eq("user_id", account.user.id)
        .maybeSingle(),
      admin
        .from("account_consent_events")
        .select("channel,granted,source,policy_version,created_at")
        .eq("user_id", account.user.id)
        .order("created_at", { ascending: true }),
      admin
        .from("web_push_subscriptions")
        .select("endpoint,user_agent,topics,created_at,updated_at,last_seen_at")
        .eq("user_id", account.user.id)
        .order("created_at", { ascending: true }),
    ]);

    const error =
      profileResult.error ?? preferencesResult.error ?? consentResult.error ?? pushResult.error;
    if (error) {
      console.error("[account/export] Falha ao consultar dados da conta", {
        code: error.code,
        message: error.message,
      });
      return new Response(
        JSON.stringify({ success: false, error: "Não foi possível preparar a exportação." }),
        { status: 500, headers },
      );
    }

    const exportedAt = new Date();
    const document = {
      export_version: "1.0",
      exported_at: exportedAt.toISOString(),
      portal: "Tempo Pelotas",
      account: {
        provider: "google",
        email: account.user.email ?? null,
        created_at: account.user.created_at,
        last_sign_in_at: account.user.last_sign_in_at ?? null,
        profile: profileResult.data,
        preferences: preferencesResult.data,
      },
      consent_history: consentResult.data ?? [],
      notification_devices: (pushResult.data ?? []).map((subscription) => ({
        endpoint: subscription.endpoint,
        user_agent: subscription.user_agent,
        topics: subscription.topics,
        created_at: subscription.created_at,
        updated_at: subscription.updated_at,
        last_seen_at: subscription.last_seen_at,
      })),
      security_note:
        "Chaves criptográficas de entrega e credenciais de sessão não fazem parte da exportação por segurança.",
    };

    const date = exportedAt.toISOString().slice(0, 10);
    headers.set(
      "Content-Disposition",
      `attachment; filename="tempo-pelotas-dados-${date}.json"`,
    );

    return new Response(`${JSON.stringify(document, null, 2)}\n`, { status: 200, headers });
  } catch (error) {
    console.error("[account/export] Falha inesperada", {
      message: error instanceof Error ? error.message : String(error),
    });
    return new Response(
      JSON.stringify({ success: false, error: "Não foi possível preparar a exportação." }),
      { status: 500, headers: jsonHeaders() },
    );
  }
}

export const Route = createFileRoute("/api/account/export")({
  server: {
    handlers: {
      GET: ({ request }) => exportAccountData(request),
    },
  },
});
