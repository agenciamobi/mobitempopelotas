"use client";

import { useEffect, useState } from "react";
import { createClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

const AUTH_ERRORS: Record<string, string> = {
  configuracao: "A autenticação não está disponível neste ambiente.",
  codigo: "O Google não devolveu um código de autenticação válido.",
  oauth: "Não foi possível concluir o login. Tente novamente.",
};

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.3Z" />
      <path fill="currentColor" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1a5.8 5.8 0 0 1-5.5-4h-3.3v2.6A10 10 0 0 0 12 22Z" />
      <path fill="currentColor" d="M6.5 14a6 6 0 0 1 0-4V7.4H3.2a10 10 0 0 0 0 9.2L6.5 14Z" />
      <path fill="currentColor" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 12 2a10 10 0 0 0-8.8 5.4L6.5 10A5.8 5.8 0 0 1 12 5.9Z" />
    </svg>
  );
}

export function GoogleLoginCard() {
  const configured = isSupabaseBrowserConfigured();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("erro");
    if (code && AUTH_ERRORS[code]) {
      setError(AUTH_ERRORS[code]);
    }
  }, []);

  const signIn = async () => {
    const supabase = createClient();

    setLoading(true);
    setError(null);

    const params = new URLSearchParams(window.location.search);
    const nextPath = safeNextPath(params.get("next"));
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
        },
      },
    });

    if (signInError) {
      setLoading(false);
      setError("Não foi possível iniciar o login com Google.");
    }
  };

  return (
    <section className="login-card" aria-labelledby="login-card-title">
      <span className="eyebrow">Conta TEMPO Pelotas</span>
      <h1 id="login-card-title">Entre para personalizar sua experiência</h1>
      <p>
        O login é usado para preferências e alertas opcionais. A previsão e os
        dados públicos continuam acessíveis sem conta.
      </p>
      <button type="button" onClick={signIn} disabled={loading || !configured}>
        <GoogleIcon />
        <span>{loading ? "Abrindo Google…" : "Continuar com Google"}</span>
      </button>
      {!configured ? (
        <p className="login-card__notice" role="status">
          A autenticação está temporariamente indisponível.
        </p>
      ) : null}
      {error ? (
        <p className="login-card__error" role="alert">
          {error}
        </p>
      ) : null}
      <small>
        Ao continuar, você autoriza apenas os dados básicos de identificação
        fornecidos pelo Google.
      </small>
    </section>
  );
}
