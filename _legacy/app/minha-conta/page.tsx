import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { createClient } from "@/lib/supabase/server";
import { getPelotasWeather } from "@/lib/weather-service";
import { getWeatherAdvisory } from "@/lib/weather-insights";
import { updateAccountPreferences } from "./actions";

export const metadata: Metadata = {
  title: "Minha conta",
  description: "Gerencie seu perfil e suas preferências no TEMPO Pelotas.",
  robots: { index: false, follow: false },
};

type AccountPageProps = {
  searchParams: Promise<{ status?: string | string[] }>;
};

const statusMessages: Record<string, { tone: "success" | "error"; text: string }> = {
  salvo: {
    tone: "success",
    text: "Suas preferências foram atualizadas.",
  },
  erro: {
    tone: "error",
    text: "Não foi possível salvar as alterações. Tente novamente.",
  },
  "nome-invalido": {
    tone: "error",
    text: "O nome deve ter no máximo 80 caracteres.",
  },
};

function metadataText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export default async function MinhaContaPage({ searchParams }: AccountPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar?next=/minha-conta");
  }

  const [{ data: profile }, { data: preferences }, weather, resolvedSearchParams] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("display_name,email,avatar_url")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("user_preferences")
        .select(
          "weather_alerts,water_alerts,daily_summary,community_updates",
        )
        .eq("user_id", user.id)
        .maybeSingle(),
      getPelotasWeather(),
      searchParams,
    ]);

  const displayName =
    profile?.display_name ??
    metadataText(user.user_metadata?.full_name) ??
    metadataText(user.user_metadata?.name) ??
    user.email?.split("@")[0] ??
    "Visitante";
  const email = profile?.email ?? user.email ?? "E-mail não informado";
  const avatarUrl =
    profile?.avatar_url ??
    metadataText(user.user_metadata?.avatar_url) ??
    metadataText(user.user_metadata?.picture);
  const initial = displayName.charAt(0).toUpperCase() || "U";
  const rawStatus = resolvedSearchParams.status;
  const status = Array.isArray(rawStatus) ? rawStatus[0] : rawStatus;
  const feedback = status ? statusMessages[status] : null;
  const advisoryLevel = getWeatherAdvisory(weather).level;

  return (
    <div className="site-shell site-shell--account">
      <SiteHeader advisoryLevel={advisoryLevel} />

      <main className="account-page" id="conteudo-principal" tabIndex={-1}>
        <section className="account-hero" aria-labelledby="account-title">
          <div>
            <span className="eyebrow">Conta TEMPO Pelotas</span>
            <h1 id="account-title">Sua experiência, sob seu controle</h1>
            <p>
              Atualize sua identificação e escolha quais comunicações deseja
              receber. Os dados públicos do portal continuam disponíveis sem
              depender dessas preferências.
            </p>
          </div>

          <div className="account-identity-card" aria-label={`Conta de ${displayName}`}>
            <span className="account-avatar" aria-hidden="true">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" referrerPolicy="no-referrer" />
              ) : (
                initial
              )}
            </span>
            <div>
              <small>Conectado com Google</small>
              <strong>{displayName}</strong>
              <span>{email}</span>
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
          <form action={updateAccountPreferences} className="account-form">
            <section className="account-panel" aria-labelledby="profile-title">
              <div className="account-panel__heading">
                <div>
                  <span>01</span>
                  <h2 id="profile-title">Identificação</h2>
                </div>
                <p>
                  O e-mail vem da sua conta Google. O nome pode ser ajustado
                  apenas para exibição dentro do portal.
                </p>
              </div>

              <div className="account-fields">
                <label>
                  <span>Nome de exibição</span>
                  <input
                    type="text"
                    name="displayName"
                    defaultValue={displayName}
                    maxLength={80}
                    autoComplete="name"
                  />
                </label>
                <label>
                  <span>E-mail</span>
                  <input type="email" value={email} readOnly aria-readonly="true" />
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
                  Estas escolhas preparam sua conta para os próximos recursos de
                  alertas. Nenhuma comunicação é ativada fora das opções marcadas.
                </p>
              </div>

              <div className="account-preferences-grid">
                <label className="account-preference">
                  <input
                    type="checkbox"
                    name="weatherAlerts"
                    defaultChecked={preferences?.weather_alerts ?? true}
                  />
                  <span>
                    <strong>Alertas meteorológicos</strong>
                    <small>
                      Avisos relevantes de chuva intensa, vento e condições severas.
                    </small>
                  </span>
                </label>

                <label className="account-preference">
                  <input
                    type="checkbox"
                    name="waterAlerts"
                    defaultChecked={preferences?.water_alerts ?? true}
                  />
                  <span>
                    <strong>Informações sobre as águas</strong>
                    <small>
                      Atualizações importantes relacionadas às fontes hidrológicas exibidas.
                    </small>
                  </span>
                </label>

                <label className="account-preference">
                  <input
                    type="checkbox"
                    name="dailySummary"
                    defaultChecked={preferences?.daily_summary ?? false}
                  />
                  <span>
                    <strong>Resumo diário</strong>
                    <small>
                      Síntese opcional com as principais condições previstas para Pelotas.
                    </small>
                  </span>
                </label>

                <label className="account-preference">
                  <input
                    type="checkbox"
                    name="communityUpdates"
                    defaultChecked={preferences?.community_updates ?? false}
                  />
                  <span>
                    <strong>Novidades do portal</strong>
                    <small>
                      Comunicados sobre novas fontes, câmeras e recursos comunitários.
                    </small>
                  </span>
                </label>
              </div>
            </section>

            <div className="account-form__actions">
              <p>
                Você pode alterar estas opções a qualquer momento. O portal não
                comercializa dados pessoais.
              </p>
              <button type="submit">Salvar preferências</button>
            </div>
          </form>

          <aside className="account-sidebar" aria-label="Privacidade e sessão">
            <section>
              <span className="eyebrow">Privacidade</span>
              <h2>Uso restrito ao funcionamento da conta</h2>
              <p>
                O login utiliza os dados básicos fornecidos pelo Google. As
                preferências são protegidas no Supabase por políticas que permitem
                acesso apenas ao próprio usuário autenticado.
              </p>
            </section>

            <section>
              <span className="eyebrow">Sessão</span>
              <h2>Encerrar acesso neste dispositivo</h2>
              <p>
                Sair remove a sessão local. A previsão e os demais conteúdos públicos
                permanecem acessíveis normalmente.
              </p>
              <form action="/auth/signout" method="post">
                <button type="submit" className="account-signout-button">
                  Sair da conta
                </button>
              </form>
            </section>
          </aside>
        </div>
      </main>

      <SiteFooter source={weather.source} />
    </div>
  );
}
