import { createFileRoute, Link } from "@tanstack/react-router";

import { createPageHead } from "@/lib/page-meta";
import { getDataStatusPageData } from "@/lib/status/data-status.functions";
import type {
  DataStatusPageData,
  ServiceCategory,
  ServiceState,
} from "@/lib/status/data-status.types";
import { SiteFooter } from "@/production/components/site-footer";
import { SiteHeader } from "@/production/components/site-header";
import type { WeatherData } from "@/production/lib/weather-data";

import "./status-dos-dados.css";
import "./status-dos-dados-history.css";

const PAGE_TITLE = "Status dos dados e integrações — Tempo Pelotas";
const PAGE_DESCRIPTION =
  "Acompanhe a disponibilidade, o histórico de incidentes e as principais fontes meteorológicas e hidrológicas usadas pelo Tempo Pelotas.";
const PAGE_PATH = "/status-dos-dados";

function labelForState(state: ServiceState) {
  if (state === "operational") return "Ativo";
  if (state === "partial") return "Atualização parcial";
  if (state === "maintenance") return "Manutenção";
  if (state === "implementation") return "Em implantação";
  return "Offline";
}

function categoryId(category: ServiceCategory) {
  if (category === "Meteorologia e avisos") return "status-meteorologia";
  if (category === "Radar e satélite") return "status-radar-satelite";
  return "status-hidrologia";
}

function formatCheckedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "horário indisponível";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function formatAvailability(value: number | null) {
  if (value === null) return "—";
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}%`;
}

function formatDuration(start: string, end: string) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return "duração indisponível";

  const minutes = Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60_000));
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;

  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

export const Route = createFileRoute("/status-dos-dados")({
  head: () => createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH),
  loader: () => getDataStatusPageData(),
  staleTime: 60 * 1_000,
  component: DataStatusPage,
});

function DataStatusPage() {
  const data = Route.useLoaderData() as DataStatusPageData;
  const categories: ServiceCategory[] = ["Meteorologia e avisos", "Radar e satélite", "Hidrologia"];
  const counts = {
    operational: data.services.filter((service) => service.state === "operational").length,
    partial: data.services.filter((service) => service.state === "partial").length,
    maintenance: data.services.filter((service) => service.state === "maintenance").length,
    offline: data.services.filter((service) => service.state === "offline").length,
    implementation: data.services.filter((service) => service.state === "implementation").length,
  };
  const overallLabel =
    data.overall === "operational"
      ? "Fontes operando normalmente"
      : data.overall === "offline"
        ? "Fontes essenciais indisponíveis"
        : "Algumas fontes estão com atualização parcial";

  const footerSource = {
    name: "Tempo Pelotas — monitoramento de fontes",
    url: PAGE_PATH,
    isFallback: data.overall !== "operational",
    observationName: "Status das fontes",
    observationUrl: PAGE_PATH,
    forecastName: "Status das integrações",
    forecastUrl: PAGE_PATH,
  } satisfies WeatherData["source"];

  return (
    <div className="site-shell data-status-shell">
      <SiteHeader advisoryLevel="normal" />

      <main className="data-status-page" id="conteudo-principal" tabIndex={-1}>
        <header className="data-status-hero">
          <div>
            <span className="data-status-eyebrow">Transparência operacional</span>
            <h1>Status dos dados e integrações</h1>
            <p>
              Veja quais fontes estão respondendo agora e acompanhe o histórico de indisponibilidades,
              atualizações parciais e manutenções detectadas pelo Tempo Pelotas.
            </p>
          </div>
          <div className={`data-status-summary is-${data.overall}`} role="status">
            <span>Estado geral</span>
            <strong>{overallLabel}</strong>
            <small>Verificado em {formatCheckedAt(data.checkedAt)}</small>
          </div>
        </header>

        <section className="data-status-counts" aria-label="Resumo dos estados das fontes">
          <article>
            <span>Ativas</span>
            <strong>{counts.operational}</strong>
          </article>
          <article>
            <span>Parciais</span>
            <strong>{counts.partial}</strong>
          </article>
          <article>
            <span>Manutenção</span>
            <strong>{counts.maintenance}</strong>
          </article>
          <article>
            <span>Offline</span>
            <strong>{counts.offline}</strong>
          </article>
          <article>
            <span>Em implantação</span>
            <strong>{counts.implementation}</strong>
          </article>
        </section>

        <nav className="data-status-nav" aria-label="Categorias de integrações">
          {categories.map((category) => (
            <a href={`#${categoryId(category)}`} key={category}>
              {category}
            </a>
          ))}
          <a href="#historico-incidentes">Histórico</a>
        </nav>

        {categories.map((category) => {
          const services = data.services.filter((service) => service.category === category);
          if (!services.length) return null;

          return (
            <section
              className="data-status-category"
              id={categoryId(category)}
              key={category}
              aria-labelledby={`${categoryId(category)}-title`}
            >
              <header>
                <span>{category}</span>
                <h2 id={`${categoryId(category)}-title`}>{category}</h2>
              </header>

              <div className="data-status-services">
                {services.map((service) => (
                  <article className={`data-status-card is-${service.state}`} key={service.id}>
                    <div className="data-status-card__topline">
                      <span>{service.kind}</span>
                      <strong>{labelForState(service.state)}</strong>
                    </div>
                    <h3>{service.name}</h3>
                    <p>{service.summary}</p>
                    <dl>
                      <div>
                        <dt>Última verificação</dt>
                        <dd>{formatCheckedAt(service.checkedAt)}</dd>
                      </div>
                      <div>
                        <dt>Disponibilidade 24 h</dt>
                        <dd>{formatAvailability(service.availability24h)}</dd>
                      </div>
                    </dl>
                    {service.detail ? <small>{service.detail}</small> : null}
                  </article>
                ))}
              </div>
            </section>
          );
        })}

        <section className="data-status-history" id="historico-incidentes" aria-labelledby="historico-title">
          <header>
            <span>Histórico operacional</span>
            <h2 id="historico-title">Incidentes e manutenções recentes</h2>
            <p>
              Registros do monitoramento do próprio Tempo Pelotas. O histórico informa falhas e recuperações
              observadas pelo portal; ele não representa necessariamente um incidente oficial da instituição fonte.
            </p>
          </header>

          <div className="data-status-history__grid">
            <section aria-labelledby="incidentes-ativos-title">
              <header>
                <h3 id="incidentes-ativos-title">Incidentes em andamento</h3>
                <span>{data.history.activeIncidents.length}</span>
              </header>
              {data.history.activeIncidents.length ? (
                <div className="data-status-history__list">
                  {data.history.activeIncidents.map((incident) => (
                    <article key={incident.id} className={`is-${incident.severity}`}>
                      <strong>{incident.title}</strong>
                      <p>{incident.summary}</p>
                      <small>Aberto em {formatCheckedAt(incident.startedAt)}</small>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="data-status-history__empty">Nenhum incidente em andamento registrado.</p>
              )}
            </section>

            <section aria-labelledby="manutencoes-title">
              <header>
                <h3 id="manutencoes-title">Manutenções</h3>
                <span>{data.history.maintenance.length}</span>
              </header>
              {data.history.maintenance.length ? (
                <div className="data-status-history__list">
                  {data.history.maintenance.map((maintenance) => (
                    <article key={maintenance.id}>
                      <strong>{maintenance.title}</strong>
                      <p>{maintenance.summary}</p>
                      <small>
                        {formatCheckedAt(maintenance.startedAt)} — {formatCheckedAt(maintenance.endedAt)}
                      </small>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="data-status-history__empty">Nenhuma manutenção recente registrada.</p>
              )}
            </section>
          </div>

          <section className="data-status-resolved" aria-labelledby="resolvidos-title">
            <header>
              <h3 id="resolvidos-title">Incidentes resolvidos</h3>
              <span>{data.history.resolvedIncidents.length}</span>
            </header>
            {data.history.resolvedIncidents.length ? (
              <div className="data-status-resolved__table" role="region" aria-label="Incidentes resolvidos recentes">
                <table>
                  <thead>
                    <tr>
                      <th>Incidente</th>
                      <th>Início</th>
                      <th>Fim</th>
                      <th>Duração</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.history.resolvedIncidents.map((incident) => (
                      <tr key={incident.id}>
                        <td>
                          <strong>{incident.title}</strong>
                          <span>{incident.summary}</span>
                        </td>
                        <td>{formatCheckedAt(incident.startedAt)}</td>
                        <td>{formatCheckedAt(incident.endedAt)}</td>
                        <td>{formatDuration(incident.startedAt, incident.endedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="data-status-history__empty">Nenhum incidente resolvido registrado neste período.</p>
            )}
          </section>
        </section>

        <section className="data-status-method" aria-labelledby="status-method-title">
          <div>
            <span>Como interpretar</span>
            <h2 id="status-method-title">Status da fonte não é status do tempo</h2>
          </div>
          <p>
            Uma integração indisponível significa apenas que o Tempo Pelotas não conseguiu obter ou validar aquele
            dado no momento. Isso não significa ausência de chuva, vento forte, risco hidrológico ou alerta oficial.
          </p>
          <Link to="/metodologia">Entenda a metodologia do portal</Link>
        </section>
      </main>

      <SiteFooter dataSource={footerSource} />
    </div>
  );
}
