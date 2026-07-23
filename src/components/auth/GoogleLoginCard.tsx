import { useState } from "react";

import { safeNextPath } from "@/lib/auth/paths";
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

const AUTH_ERRORS: Record<string, string> = {
  configuracao: "A autenticação está temporariamente indisponível neste ambiente.",
  codigo: "O Google não devolveu um código de autenticação válido.",
  oauth: "Não foi possível concluir o acesso. Tente novamente.",
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.3Z"
      />
      <path
        fill="currentColor"
        d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1a5.8 5.8 0 0 1-5.5-4H3.2v2.6A10 10 0 0 0 12 22Z"
      />
      <path fill="currentColor" d="M6.5 14a6 6 0 0 1 0-4V7.4H3.2a10 10 0 0 0 0 9.2L6.5 14Z" />
      <path
        fill="currentColor"
        d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 12 2a10 10 0 0 0-8.8 5.4L6.5 10A5.8 5.8 0 0 1 12 5.9Z"
      />
    </svg>
  );
}

export function GoogleLoginCard({ nextPath, errorCode }: { nextPath: string; errorCode?: string }) {
  const configured = isSupabaseBrowserConfigured();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    errorCode ? (AUTH_ERRORS[errorCode] ?? null) : null,
  );

  async function signIn() {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setError(AUTH_ERRORS.configuracao);
      return;
    }

    setLoading(true);
    setError(null);

    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", safeNextPath(nextPath, "/minha-conta"));

    const { error: signInError } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callback.toString(),
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (signInError) {
      setLoading(false);
      setError("Não foi possível abrir o acesso com Google.");
    }
  }

  return (
    <section className="login-card" aria-labelledby="login-card-title">
      <span className="eyebrow">Conta Tempo Pelotas</span>
      <h1 id="login-card-title">Personalize alertas sem perder o acesso público</h1>
      <p>
        A conta serve apenas para preferências opcionais. Previsão, imagens de satélite, câmeras,
        níveis das águas e avisos oficiais continuam disponíveis para todos.
      </p>
      <button type="button" onClick={signIn} disabled={loading || !configured}>
        <GoogleIcon />
        <span>{loading ? "Abrindo o Google…" : "Continuar com Google"}</span>
      </button>
      {!configured ? (
        <p className="login-card__notice" role="status">
          A autenticação ainda não foi habilitada neste ambiente.
        </p>
      ) : null}
      {error ? (
        <p className="login-card__error" role="alert">
          {error}
        </p>
      ) : null}
      <small>
        O portal solicita somente identificação básica fornecida pelo Google. Nenhuma previsão ou
        informação pública depende da criação de uma conta.
      </small>
    </section>
  );
}
