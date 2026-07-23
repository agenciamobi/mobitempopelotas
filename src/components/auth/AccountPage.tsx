import { Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";

import { saveAccountPreferences, type AccountSnapshot } from "@/lib/auth/account.functions";
import { SiteFooter } from "@/production/components/site-footer";
import { SiteHeader } from "@/production/components/site-header";
import type { WeatherData } from "@/production/lib/weather-data";

const accountFooterSource = {
  name: "Tempo Pelotas",
  url: "/metodologia",
  isFallback: false,
  observationName: "Fontes meteorológicas do portal",
  observationUrl: "/metodologia",
  forecastName: "Metodologia e transparência",
  forecastUrl: "/metodologia",
} satisfies WeatherData["source"];

const DELETE_CONFIRMATION = "EXCLUIR MINHA CONTA";

type AuthenticatedAccount = Extract<AccountSnapshot, { status: "authenticated" }>;
type Feedback = { tone: "success" | "error"; text: string } | null;

async function unsubscribeCurrentBrowserPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) await subscription.unsubscribe();
}

export function AccountPage({ snapshot }: { snapshot: AuthenticatedAccount }) {
  const savePreferences = useServerFn(saveAccountPreferences);
  const [displayName, setDisplayName] = useState(snapshot.identity.displayName);
  const [preferences, setPreferences] = useState(snapshot.preferences);
  const [pending, setPending] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteFeedback, setDeleteFeedback] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(
    snapshot.storageReady
      ? null
      : {
          tone: "error",
          text: "Seu acesso está ativo, mas o armazenamento de preferências ainda não foi aplicado neste ambiente.",
        },
  );

  const initial = displayName.charAt(0).toUpperCase() || "U";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFeedback(null);

    try {
      const result = await savePreferences({
        data: {
          displayName,
          ...preferences,
        },
      });

      if (result.ok) {
        setFeedback({ tone: "success", text: "Suas preferências foram atualizadas." });
        return;
      }

      if (result.code === "unauthenticated") {
        window.location.assign("/entrar?next=/minha-conta");
        return;
      }

      setFeedback({
        tone: "error",
        text:
          result.code === "unavailable"
            ? "A conta está temporariamente indisponível neste ambiente."
            : "Não foi possível salvar as alterações. Tente novamente.",
      });
    } catch {
      setFeedback({
        tone: "error",
        text: "Não foi possível salvar as alterações. Tente novamente.",
      });
    } finally {
      setPending(false);
    }
  }

  async function handleDeleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDeleteFeedback(null);

    if (deleteConfirmation !== DELETE_CONFIRMATION) {
      setDeleteFeedback(`Digite exatamente ${DELETE_CONFIRMATION} para confirmar.`);
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch("/api/account/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: deleteConfirmation }),
      });
      const result = (await response.json()) as { success?: boolean; error?: string };

      if (response.status === 401) {
        window.location.assign("/entrar?next=/minha-conta");
        return;
      }

      if (!response.ok || !result.success) {
        setDeleteFeedback(result.error ?? "Não foi possível excluir a conta agora.");
        return;
      }

      try {
        await unsubscribeCurrentBrowserPush();
      } catch (error) {
        console.error("A conta foi excluída, mas o navegador não removeu a inscrição push:", error);
      }

      window.location.assign("/");
    } catch {
      setDeleteFeedback("Não foi possível excluir a conta agora.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="site-shell site-shell--account">
      <SiteHeader advisoryLevel="normal" />

      <main className="account-page" id="conteudo-principal" tabIndex={-1}>
        <section className="account-hero" aria-labelledby="account-title">
          <div>
            <span className="eyebrow">Conta Tempo Pelotas</span>
            <h1 id="account-title">Suas escolhas, sem restringir a informação pública</h1>
            <p>
              Ajuste sua identificação e escolha quais comunicações opcionais deseja receber. A
              previsão, os avisos oficiais, as imagens de satélite e a situação das águas continuam
              acessíveis sem depender dessas preferências.
            </p>
          </div>

          <div className="account-identity-card" aria-label={`Conta de ${displayName}`}>
            <span className="account-avatar" aria-hidden="true">
              {snapshot.identity.avatarUrl ? (
                <img src={snapshot.identity.avatarUrl} alt="" referrerPolicy="no-referrer" />
              ) : (
                initial
              )}
            </span>
            <div>
              <small>Conectado com Google</small>
              <strong>{displayName}</strong>
              <span>{snapshot.identity.email}</span>
            </div>
          </div>
        </section>

        {feedback ? (
          <p
            className={`account-feedback is-${feedback.tone}`}
            role={feedback.tone === "error" ? "alert" : "status"}
          >
            {feedback.text}
          </p>
        ) : null}

        <div className="account-layout">
          <form className="account-form" onSubmit={handleSubmit}>
            <section className="account-panel" aria-labelledby="profile-title">
              <div className="account-panel__heading">
                <div>
                  <span>01</span>
                  <h2 id="profile-title">Identificação</h2>
                </div>
                <p>
                  O e-mail vem da sua conta Google. O nome pode ser ajustado apenas para exibição
                  dentro do portal.
                </p>
              </div>

              <div className="account-fields">
                <label>
                  <span>Nome de exibição</span>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    maxLength={80}
                    autoComplete="name"
                  />
                </label>
                <label>
                  <span>E-mail</span>
                  <input
                    type="email"
                    value={snapshot.identity.email}
                    readOnly
                    aria-readonly="true"
                  />
                </label>
              </div>
            </section>

            <section className="account-panel" aria-labelledby="preferences-title">
              <div className="account-panel__heading">
                <div>
                  <span>02</span>
                  <h2 id="preferences-title">Preferências de comunicação</h2>
                </div>
                <p>
                  Cada alteração é registrada com data e versão da política. Nenhuma comunicação é
                  ativada fora das opções marcadas.
                </p>
              </div>

              <div className="account-preferences-grid">
                <PreferenceField
                  checked={preferences.weatherAlerts}
                  onChange={(checked) =>
                    setPreferences((current) => ({ ...current, weatherAlerts: checked }))
                  }
                  title="Alertas meteorológicos"
                  description="Avisos relevantes de chuva intensa, vento e condições severas."
                />
                <PreferenceField
                  checked={preferences.waterAlerts}
                  onChange={(checked) =>
                    setPreferences((current) => ({ ...current, waterAlerts: checked }))
                  }
                  title="Informações sobre as águas"
                  description="Atualizações importantes sobre níveis, tendências e fontes hidrológicas."
                />
                <PreferenceField
                  checked={preferences.dailySummary}
                  onChange={(checked) =>
                    setPreferences((current) => ({ ...current, dailySummary: checked }))
                  }
                  title="Resumo diário"
                  description="Síntese opcional das principais condições previstas para Pelotas."
                />
                <PreferenceField
                  checked={preferences.communityUpdates}
                  onChange={(checked) =>
                    setPreferences((current) => ({ ...current, communityUpdates: checked }))
                  }
                  title="Novidades do portal"
                  description="Comunicados sobre novas fontes, câmeras e recursos comunitários."
                />
              </div>
            </section>

            <div className="account-form__actions">
              <p>
                Você pode alterar estas opções a qualquer momento. O Tempo Pelotas não comercializa
                dados pessoais.
              </p>
              <button type="submit" disabled={pending || !snapshot.storageReady}>
                {pending ? "Salvando…" : "Salvar preferências"}
              </button>
            </div>
          </form>

          <aside className="account-sidebar" aria-label="Privacidade e sessão">
            <section>
              <span className="eyebrow">Seus dados</span>
              <h2>Consulte ou leve uma cópia</h2>
              <p>
                A exportação reúne perfil, preferências, histórico de consentimentos e aparelhos de
                notificação vinculados à conta.
              </p>
              <div className="account-data-actions">
                <a className="account-data-button" href="/api/account/export" download>
                  Baixar meus dados
                </a>
                <Link className="account-data-link" to="/privacidade-e-dados">
                  Ver política de privacidade
                </Link>
              </div>
            </section>

            <section>
              <span className="eyebrow">Sessão</span>
              <h2>Encerrar acesso neste dispositivo</h2>
              <p>
                Sair remove a sessão local. A previsão, os níveis das águas e os demais conteúdos
                públicos permanecem acessíveis normalmente.
              </p>
              <form action="/auth/signout" method="post">
                <button type="submit" className="account-signout-button">
                  Sair da conta
                </button>
              </form>
            </section>

            <section className="account-danger-zone">
              <span className="eyebrow">Exclusão definitiva</span>
              <h2>Remover conta e preferências</h2>
              <p id="delete-account-help">
                Esta ação remove perfil, preferências, consentimentos e inscrições push vinculadas.
                Os conteúdos públicos do portal continuam acessíveis sem conta.
              </p>
              <form onSubmit={handleDeleteAccount}>
                <label className="account-delete-confirmation">
                  <span>Digite {DELETE_CONFIRMATION}</span>
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(event) => setDeleteConfirmation(event.target.value)}
                    autoComplete="off"
                    aria-describedby="delete-account-help"
                  />
                </label>
                {deleteFeedback ? (
                  <p className="account-delete-feedback" role="alert">
                    {deleteFeedback}
                  </p>
                ) : null}
                <button
                  type="submit"
                  className="account-delete-button"
                  disabled={deleting || deleteConfirmation !== DELETE_CONFIRMATION}
                >
                  {deleting ? "Excluindo…" : "Excluir minha conta"}
                </button>
              </form>
            </section>
          </aside>
        </div>
      </main>

      <SiteFooter source={accountFooterSource} />
    </div>
  );
}

function PreferenceField({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label className="account-preference">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
    </label>
  );
}
