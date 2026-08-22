import { Link } from "@tanstack/react-router";

import type { AccountSnapshot } from "@/lib/auth/account.functions";
import { SiteFooter } from "@/production/components/site-footer";
import { SiteHeader } from "@/production/components/site-header";
import type { WeatherData } from "@/production/lib/weather-data";

const dashboardFooterSource = {
  name: "Tempo Pelotas",
  url: "/metodologia",
  isFallback: false,
  observationName: "Fontes meteorológicas do portal",
  observationUrl: "/metodologia",
  forecastName: "Metodologia e transparência",
  forecastUrl: "/metodologia",
} satisfies WeatherData["source"];

type AuthenticatedAccount = Extract<AccountSnapshot, { status: "authenticated" }>;

type DashboardModule = {
  title: string;
  description: string;
  state: "available" | "preparing" | "pro";
  href?: string;
};

function moduleStateLabel(state: DashboardModule["state"]) {
  if (state === "available") return "Disponível";
  if (state === "pro") return "PRO";
  return "Em preparação";
}

export function AccountDashboard({ snapshot }: { snapshot: AuthenticatedAccount }) {
  const isPro = snapshot.access.tier === "pro";
  const historyLimit = snapshot.access.entitlements.historyAccessDays;
  const modules: DashboardModule[] = [
    {
      title: "Histórico",
      description:
        historyLimit === null
          ? "Acesso ao acervo histórico completo liberado para esta conta."
          : `Sua camada Free está preparada para históricos de até ${historyLimit} dias nos recursos definidos para o painel.`,
      state: "preparing",
    },
    {
      title: "Favoritos",
      description: "Estações, locais e ferramentas que você acompanha ficarão organizados aqui.",
      state: "preparing",
    },
    {
      title: "Situação das águas",
      description: "Acompanhe a visão pública atual enquanto preparamos os atalhos personalizados do painel.",
      state: "available",
      href: "/situacao-hidrologica-pelotas",
    },
    {
      title: "Radar e satélite",
      description: "A central pública segue aberta; recursos adicionais serão liberados conforme a camada da conta e as fontes permitirem.",
      state: "available",
      href: "/radar-e-satelite-pelotas",
    },
    {
      title: "Comparações avançadas",
      description: "Comparações entre períodos, estações e variáveis farão parte da evolução do Tempo Pelotas PRO.",
      state: isPro ? "preparing" : "pro",
    },
    {
      title: "Exportações e análises",
      description: "Ferramentas avançadas serão construídas sobre o acervo e os dados cuja utilização permita esse tipo de recurso.",
      state: isPro ? "preparing" : "pro",
    },
  ];

  return (
    <div className="site-shell site-shell--account">
      <SiteHeader advisoryLevel="normal" />

      <main className="account-page account-dashboard" id="conteudo-principal" tabIndex={-1}>
        <section className="account-dashboard__hero" aria-labelledby="dashboard-title">
          <div>
            <span className="eyebrow">Meu painel</span>
            <div className="account-dashboard__title-row">
              <h1 id="dashboard-title">Olá, {snapshot.identity.displayName}</h1>
              <span className={`account-tier-badge is-${snapshot.access.tier}`}>
                {snapshot.access.label}
              </span>
            </div>
            <p>
              Esta é a base da sua área pessoal no Tempo Pelotas. Os dados oficiais que já são
              públicos continuam no portal aberto; aqui entram personalização, históricos e
              ferramentas liberadas para sua conta.
            </p>
          </div>

          <div className="account-dashboard__actions">
            <Link className="account-dashboard__primary" to="/conta">
              Configurar minha conta
            </Link>
            <Link className="account-dashboard__secondary" to="/">
              Ver Tempo Pelotas
            </Link>
          </div>
        </section>

        <section className="account-dashboard__summary" aria-label="Resumo do acesso">
          <div>
            <small>Camada atual</small>
            <strong>{snapshot.access.label}</strong>
            <span>{isPro ? "Recursos PRO conforme entitlements" : "Conta gratuita autenticada"}</span>
          </div>
          <div>
            <small>Histórico no painel Free</small>
            <strong>{historyLimit === null ? "Completo" : `Até ${historyLimit} dias`}</strong>
            <span>Aplicado somente aos recursos definidos para esta camada</span>
          </div>
          <div>
            <small>Portal público</small>
            <strong>Continua aberto</strong>
            <span>Dados oficiais públicos não dependem da assinatura</span>
          </div>
        </section>

        <section className="account-dashboard__modules" aria-labelledby="dashboard-modules-title">
          <div className="account-dashboard__section-heading">
            <span className="eyebrow">Ferramentas</span>
            <h2 id="dashboard-modules-title">Sua área vai crescer por módulos</h2>
            <p>
              O shell já separa identidade de acesso. Agora cada ferramenta poderá ser adicionada
              sem espalhar regras de plano pela interface.
            </p>
          </div>

          <div className="account-dashboard__grid">
            {modules.map((module) => (
              <article className="account-dashboard__module" key={module.title}>
                <div className="account-dashboard__module-topline">
                  <span>{moduleStateLabel(module.state)}</span>
                </div>
                <h3>{module.title}</h3>
                <p>{module.description}</p>
                {module.href ? (
                  <Link to={module.href} className="account-dashboard__module-link">
                    Abrir recurso público →
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter source={dashboardFooterSource} />
    </div>
  );
}
