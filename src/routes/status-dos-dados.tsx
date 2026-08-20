import { createFileRoute, Link } from "@tanstack/react-router";

import { createPageHead } from "@/lib/page-meta";
import { getDataStatusPageData } from "@/lib/status/data-status.functions";
import type { ServiceCategory, ServiceState } from "@/lib/status/data-status.types";
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
  const data = Route.useLoaderData();
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
    <div className="site-shell site-shell--home-editorial data-status-shell">
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

          <aside className={`data-status-overview is-${data.overall}`} aria-label="Estado geral dos dados">
            <span aria-hidden="true" />
            <div>
              <small>Estado geral</small>
              <strong>{overallLabel}</strong>
              <p>Última verificação: {formatCheckedAt(data.checkedAt)}</p>
            </div>
          </aside>
        </header>

        <section className="data-status-summary" aria-label="Resumo da disponibilidade">
          <div><strong>{counts.operational}</strong><span>Ativos</span></div>
          <div><strong>{counts.partial}</strong><span>Atualização parcial</span></div>
          <div><strong>{counts.maintenance}</strong><span>Em manutenção</span></div>
          <div><strong>{counts.offline}</strong><span>Offline</span></div>
          <div><strong>{counts.implementation}</strong><span>Em implantação</span></div>
        </section>

        <div className="data-status-groups">
          {categories.map((category) => {
            const headingId = categoryId(category);
            const categoryServices = data.services.filter((service) => service.category === category);
            return (
              <section className="data-status-group" key={category} aria-labelledby={headingId}>
                <header><h2 id={headingId}>{category}</h2><strong>{categoryServices.length} integrações</strong></header>
                <div className="data-status-services">
                  {categoryServices.map((service) => (
                    <article className={`data-status-service is-${service.state}`} key={service.id}>
                      <div className="data-status-service__heading">
                        <span className="data-status-service__dot" aria-hidden="true" />
                        <div><p>{service.provider}</p><h3>{service.name}</h3></div>
                        <strong>{labelForState(service.state)}</strong>
                      </div>
                      <p className="data-status-service__detail">{service.detail}</p>
                      <footer>
                        <span>Verificado em {formatCheckedAt(service.checkedAt)}</span>
                        {service.sourceUrl ? <a href={service.sourceUrl} target="_blank" rel="noopener noreferrer">Fonte</a> : null}
                      </footer>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        <section className="data-status-history" aria-labelledby="data-status-history-title">
          <header className="data-status-history__header">
            <div><span className="data-status-eyebrow">Histórico operacional</span><h2 id="data-status-history-title">Incidentes e disponibilidade</h2></div>
            <p>O monitor automático registra uma amostra aproximadamente a cada 10 minutos. O horário de um incidente representa quando a alteração foi detectada pelo monitor, não necessariamente o instante exato em que o serviço externo mudou de estado.</p>
          </header>

          {data.history.available ? (
            <>
              <div className="data-status-availability-summary" aria-label="Disponibilidade recente">
                <article><span>Últimas 24 horas</span><strong>{formatAvailability(data.history.summary24h.availabilityPercent)}</strong><p>{data.history.summary24h.measuredChecks} verificações válidas</p></article>
                <article><span>Até 7 dias</span><strong>{formatAvailability(data.history.summary7d.availabilityPercent)}</strong><p>{data.history.summary7d.measuredChecks} verificações válidas</p></article>
                <article><span>Incidentes em andamento</span><strong>{data.history.incidents.filter((incident) => incident.status === "open").length}</strong><p>{data.history.startedAt ? `Histórico desde ${formatCheckedAt(data.history.startedAt)}` : "Aguardando a primeira amostra"}</p></article>
              </div>

              {data.history.maintenance.length > 0 ? (
                <section className="data-status-maintenance" aria-labelledby="data-status-maintenance-title">
                  <header><h3 id="data-status-maintenance-title">Manutenções programadas</h3><span>{data.history.maintenance.length} janela(s)</span></header>
                  <div>{data.history.maintenance.map((maintenance) => <article key={maintenance.id}><strong>{maintenance.title}</strong><p>{maintenance.message}</p><span>{formatCheckedAt(maintenance.startsAt)} → {formatCheckedAt(maintenance.endsAt)}</span></article>)}</div>
                </section>
              ) : null}

              <section className="data-status-incidents" aria-labelledby="data-status-incidents-title">
                <header><div><h3 id="data-status-incidents-title">Incidentes recentes</h3><p>Falhas, atrasos relevantes e restabelecimentos registrados pelo monitor.</p></div></header>
                {data.history.incidents.length > 0 ? (
                  <div className="data-status-incident-list">
                    {data.history.incidents.map((incident) => {
                      const incidentEnd = incident.resolvedAt ?? incident.lastSeenAt;
                      return (
                        <article className={`data-status-incident is-${incident.status} is-${incident.worstState}`} key={incident.id}>
                          <span className="data-status-incident__marker" aria-hidden="true" />
                          <div className="data-status-incident__content">
                            <div className="data-status-incident__heading"><div><span>{incident.provider}</span><h4>{incident.title}</h4></div><strong>{incident.status === "open" ? "Em andamento" : "Resolvido"}</strong></div>
                            <p>{incident.detail}</p>
                            <dl>
                              <div><dt>Detectado</dt><dd>{formatCheckedAt(incident.openedAt)}</dd></div>
                              <div><dt>{incident.status === "open" ? "Última confirmação" : "Restabelecido"}</dt><dd>{formatCheckedAt(incidentEnd)}</dd></div>
                              <div><dt>Duração monitorada</dt><dd>{formatDuration(incident.openedAt, incidentEnd)}</dd></div>
                              <div><dt>Pior estado</dt><dd>{labelForState(incident.worstState)}</dd></div>
                            </dl>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : <div className="data-status-history-empty"><strong>Nenhum incidente registrado até agora.</strong><p>O histórico será preenchido automaticamente quando o monitor detectar uma alteração.</p></div>}
              </section>

              {data.history.availability7d.length > 0 ? (
                <section className="data-status-availability" aria-labelledby="data-status-availability-title">
                  <header><h3 id="data-status-availability-title">Disponibilidade por integração</h3><span>Janela de até 7 dias</span></header>
                  <div className="data-status-availability__table" role="table" aria-label="Disponibilidade por integração">
                    <div className="data-status-availability__row data-status-availability__row--header" role="row"><span role="columnheader">Integração</span><span role="columnheader">Disponibilidade</span><span role="columnheader">Parcial</span><span role="columnheader">Offline</span></div>
                    {data.history.availability7d.map((service) => <div className="data-status-availability__row" role="row" key={service.serviceId}><span role="cell"><strong>{service.serviceName}</strong><small>{service.provider}</small></span><span role="cell">{formatAvailability(service.availabilityPercent)}</span><span role="cell">{service.partialChecks}</span><span role="cell">{service.offlineChecks}</span></div>)}
                  </div>
                </section>
              ) : null}
            </>
          ) : <div className="data-status-history-empty"><strong>O histórico está sendo preparado.</strong><p>{data.history.error ?? "Assim que a primeira coleta automática for persistida, incidentes e disponibilidade aparecerão aqui."}</p></div>}
        </section>

        <section className="data-status-explainer" aria-labelledby="data-status-explainer-title">
          <div><span className="data-status-eyebrow">Como interpretar</span><h2 id="data-status-explainer-title">Uma fonte offline não significa que todo o portal parou</h2></div>
          <div><p>O Tempo Pelotas combina fontes independentes. Quando uma delas falha, outras áreas podem continuar funcionando normalmente. “Atualização parcial” indica atraso ou perda de apenas parte do conteúdo; “offline” indica que a consulta daquela integração não respondeu na última verificação.</p><p>Manutenções programadas são registradas separadamente. Integrações em implantação, como ANA/RHN, não são contabilizadas como falha operacional nem entram no cálculo de disponibilidade.</p><Link to="/metodologia">Entenda como cada fonte é utilizada</Link></div>
        </section>
      </main>

      <SiteFooter source={footerSource} />
    </div>
  );
}
