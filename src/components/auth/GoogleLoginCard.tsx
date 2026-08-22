import { useEffect, useRef, useState } from "react";

import {
  createGoogleIdentityNonce,
  getGoogleWebClientId,
  loadGoogleIdentityServices,
  type GoogleCredentialResponse,
} from "@/lib/auth/google-identity";
import { safeNextPath } from "@/lib/auth/paths";
import { getSupabaseBrowserClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

const AUTH_ERRORS: Record<string, string> = {
  configuracao: "A autenticação está temporariamente indisponível neste ambiente.",
  codigo: "O Google não devolveu uma credencial de autenticação válida.",
  oauth: "Não foi possível concluir o acesso. Tente novamente.",
};

export function GoogleLoginCard({ nextPath, errorCode }: { nextPath: string; errorCode?: string }) {
  const buttonHostRef = useRef<HTMLDivElement>(null);
  const supabaseConfigured = isSupabaseBrowserConfigured();
  const googleClientId = getGoogleWebClientId();
  const googleConfigured = googleClientId.length > 0;
  const configured = supabaseConfigured && googleConfigured;
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    errorCode ? (AUTH_ERRORS[errorCode] ?? null) : null,
  );

  useEffect(() => {
    if (!configured || !buttonHostRef.current) return;

    let active = true;
    const host = buttonHostRef.current;

    async function initializeGoogleIdentity() {
      try {
        const [google, nonce] = await Promise.all([
          loadGoogleIdentityServices(),
          createGoogleIdentityNonce(),
        ]);

        if (!active) return;

        google.accounts.id.initialize({
          client_id: googleClientId,
          nonce: nonce.hashedNonce,
          auto_select: false,
          context: "signin",
          ux_mode: "popup",
          use_fedcm_for_prompt: true,
          itp_support: true,
          callback: async (response: GoogleCredentialResponse) => {
            if (!active) return;

            const client = getSupabaseBrowserClient();
            if (!client || !response.credential) {
              setError(AUTH_ERRORS.codigo);
              return;
            }

            setLoading(true);
            setError(null);

            const { error: signInError } = await client.auth.signInWithIdToken({
              provider: "google",
              token: response.credential,
              nonce: nonce.rawNonce,
            });

            if (!active) return;

            if (signInError) {
              setLoading(false);
              setError("Não foi possível validar o acesso com Google.");
              return;
            }

            window.location.replace(safeNextPath(nextPath, "/conta"));
          },
        });

        host.replaceChildren();
        google.accounts.id.renderButton(host, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "pill",
          logo_alignment: "left",
          width: Math.max(240, Math.min(400, Math.round(host.clientWidth || 320))),
          locale: "pt-BR",
        });
        setReady(true);
      } catch (cause) {
        if (!active) return;
        setReady(false);
        setError(
          cause instanceof Error
            ? cause.message
            : "Não foi possível preparar o acesso seguro com Google.",
        );
      }
    }

    void initializeGoogleIdentity();

    return () => {
      active = false;
      host.replaceChildren();
    };
  }, [configured, googleClientId, nextPath]);

  return (
    <section className="login-card" aria-labelledby="login-card-title">
      <span className="eyebrow">Conta Tempo Pelotas</span>
      <h1 id="login-card-title">Personalize alertas sem perder o acesso público</h1>
      <p>
        A conta serve apenas para preferências opcionais. Previsão, imagens de satélite, câmeras,
        níveis das águas e avisos oficiais continuam disponíveis para todos.
      </p>

      <div
        className={`login-card__google${loading ? " is-loading" : ""}`}
        aria-busy={loading || (configured && !ready)}
      >
        <div ref={buttonHostRef} className="login-card__google-host" />
        {configured && !ready && !error ? (
          <span className="login-card__google-loading" role="status">
            Carregando acesso seguro com Google…
          </span>
        ) : null}
        {loading ? (
          <span className="login-card__google-loading" role="status">
            Validando sua conta…
          </span>
        ) : null}
      </div>

      {!supabaseConfigured ? (
        <p className="login-card__notice" role="status">
          A autenticação ainda não foi habilitada neste ambiente.
        </p>
      ) : null}
      {supabaseConfigured && !googleConfigured ? (
        <p className="login-card__notice" role="status">
          O Client ID público do Google ainda não foi configurado neste ambiente.
        </p>
      ) : null}
      {error ? (
        <p className="login-card__error" role="alert">
          {error}
        </p>
      ) : null}
      <small>
        O Google autentica diretamente no Tempo Pelotas. Depois, a credencial é validada pelo
        Supabase para abrir sua sessão; o domínio técnico do banco não faz parte da escolha da conta.
      </small>
    </section>
  );
}
