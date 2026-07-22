import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = safeNextPath(url.searchParams.get("next"));
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.redirect(new URL("/entrar?erro=configuracao", url.origin));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/entrar?erro=codigo", url.origin));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.warn("[supabase-auth] falha ao trocar código OAuth", {
      message: error.message,
      status: error.status,
    });
    return NextResponse.redirect(new URL("/entrar?erro=oauth", url.origin));
  }

  const response = NextResponse.redirect(new URL(next, url.origin));
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
