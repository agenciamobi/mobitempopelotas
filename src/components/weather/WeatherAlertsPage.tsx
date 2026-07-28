import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Info,
  MapPin,
  ShieldAlert,
} from "lucide-react";

import type { InmetAlert } from "@/lib/weather/official-sources.types";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import { AlertMunicipalityMap } from "./AlertMunicipalityMap";

import "./WeatherAlertsPage.css";
import "./WeatherAlertsFeature.css";
import "./WeatherAlertsHomepageVisual.css";

const severityLabels: Record<InmetAlert["severity"], string> = {
  potential: "Perigo potencial",
  danger: "Perigo",
  "great-danger": "Grande perigo",
  unknown: "Nível não informado",
};

const alertColorLabels: Record<InmetAlert["severity"], string> = {
  potential: "Alerta amarelo",
  danger: "Alerta laranja",
  "great-danger": "Alerta vermelho",
  unknown: "Aviso meteorológico",
};

const severityPriority: Record<InmetAlert["severity"], number> = {
  "great-danger": 3,
  danger: 2,
  potential: 1,
  unknown: 0,
};

function formatDateTime(value: string | null) {
  if (!value) return "Horário não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function alertCountLabel(count: number) {
  return count === 1 ? "1 alerta" : `${count} alertas`;
}

function alertEpoch(alert: InmetAlert) {
  const value = alert.startsAt || alert.sentAt || alert.expiresAt;
  if (!value) return Number.POSITIVE_INFINITY;
  const epoch = new Date(value).getTime();
  return Number.isFinite(epoch) ? epoch : Number.POSITIVE_INFINITY;
}

function prioritizeAlerts(alerts: InmetAlert[]) {
  return [...alerts].sort((left, right) => {
    const severityDifference = severityPriority[right.severity] - severityPriority[left.severity];
    if (severityDifference !== 0) return severityDifference;

    const relevanceDifference =
      Number(right.relevance === "pelotas") - Number(left.relevance === "pelotas");
    if (relevanceDifference !== 0) return relevanceDifference;

    return alertEpoch(left) - alertEpoch(right);
  });
}

function alertAreaLabel(alert: InmetAlert) {
  const places = alert.municipalities.length > 0 ? alert.municipalities : alert.areas;
  const visible = places.slice(0, 6);
  const remaining = places.length - visible.length;

  if (visible.length === 0) return null;
  return remaining > 0 ? `${visible.join(", ")} e mais ${remaining}` : visible.join(", ");
}

function alertSchema(alert: InmetAlert) {
  return {
    "@context": "https://schema.org",
    "@type": "SpecialAnnouncement",
    name: `${alertColorLabels[alert.severity]}: ${alert.event}`,
    text: alert.description || alert.headline,
    datePosted: alert.sentAt || alert.startsAt || undefined,
    expires: alert.expiresAt || undefined,
    category: "https://www.wikidata.org/wiki/Q207548",
    spatialCoverage: {
      "@type": "Place",
      name: alert.municipalities.length > 0 ? alert.municipalities.join(", ") : "Pelotas, RS",
    },
    announcementLocation: {
      "@type": "CivicStructure",
      name: "Município de Pelotas",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Pelotas",
        addressRegion: "RS",
        addressCountry: "BR",
      },
    },
    url: alert.officialUrl,
  };
}

function AlertsHero({
  featured,
  activeCount,
  upcomingCount,
  source,
}: {
  featured: InmetAlert | null;
  activeCount: number;
  upcomingCount: number;
  source: WeatherIntelligenceData["weather"]["sources"]["inmet"];
}) {
  const sourceAvailable = source.usable;
  const severity = featured?.severity ?? "unknown";
  const label = featured
    ? alertColorLabels[severity]
    : sourceAvailable
      ? "Sem alerta listado"
      : "Consulta indisponível";
  const target = featured ? "#aviso-prioritario" : "#situacao-alertas";
  const targetLabel = featured
    ? "Ler alerta prioritário"
    : sourceAvailable
      ? "Conferir situação atual"
      : "Entender a indisponibilidade";
  const panelStatus = featured
    ? sourceAvailable
      ? featured.period === "active"
        ? "Em vigor agora"
        : "Aviso programado"
      : "Último aviso disponível"
    : sourceAvailable
      ? "Situação consultada"
      : "Fonte temporariamente indisponível";

  return (
    <header
      className={`alerts-editorial-hero alerts-editorial-hero-${severity}`}
      aria-labelledby="alerts-page-title"
    >
      <div className="alerts-editorial-copy">
        <Link className="alerts-editorial-back" to="/" aria-label="Voltar ao tempo agora em Pelotas">
          <ArrowLeft aria-hidden="true" /> Visão geral
        </Link>
        <span className="alerts-editorial-eyebrow">Avisos oficiais do INMET · Pelotas e região</span>
        <h1 id="alerts-page-title">Alertas meteorológicos em Pelotas</h1>
        <p>
          Consulte os avisos que incluem Pelotas ou áreas próximas, com nível de perigo, período de
          validade, municípios afetados e recomendações oficiais.
        </p>

        <div className="alerts-editorial-metrics" aria-label="Resumo dos alertas meteorológicos">
          <div>
            <span>Em vigor</span>
            <strong>{activeCount}</strong>
          </div>
          <div>
            <span>Programados</span>
            <strong>{upcomingCount}</strong>
          </div>
          <div>
            <span>Última consulta</span>
            <strong>{sourceAvailable ? formatDateTime(source.fetchedAt) : "Indisponível"}</strong>
          </div>
        </div>

        <div className="alerts-editorial-actions">
          <a href={target}>
            {targetLabel} <ArrowRight aria-hidden="true" />
          </a>
          <a href="#como-interpretar-alertas">Entenda os níveis de alerta</a>
        </div>
      </div>

      <aside className="alerts-editorial-panel" aria-label="Situação dos alertas meteorológicos">
        <div className="alerts-editorial-panel-line" aria-hidden="true" />
        <div className="alerts-editorial-panel-status">
          {featured ? (
            <ShieldAlert aria-hidden="true" />
          ) : sourceAvailable ? (
            <CheckCircle2 aria-hidden="true" />
          ) : (
            <AlertTriangle aria-hidden="true" />
          )}
          <span>{label}</span>
        </div>
        <p>{panelStatus}</p>
        {featured ? (
          <>
            <h2>{featured.event}</h2>
            <dl>
              <div>
                <dt>Até quando</dt>
                <dd>{formatDateTime(featured.expiresAt)}</dd>
              </div>
              <div>
                <dt>Abrangência</dt>
                <dd>{featured.relevance === "pelotas" ? "Inclui Pelotas" : "Regional ou estadual"}</dd>
              </div>
            </dl>
            <a
              href={featured.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir o aviso oficial “${featured.event}” no site do INMET, em nova aba`}
            >
              Abrir aviso oficial <ArrowUpRight aria-hidden="true" />
            </a>
          </>
        ) : sourceAvailable ? (
          <>
            <h2>Nenhum aviso ativo ou programado listado agora</h2>
            <span className="alerts-editorial-panel-note">
              Isso não elimina mudanças rápidas no tempo. Confira novamente antes de atividades ao ar
              livre.
            </span>
          </>
        ) : (
          <>
            <h2>Não foi possível confirmar os avisos do INMET</h2>
            <span className="alerts-editorial-panel-note">
              Indisponibilidade de dados não significa ausência de risco. Consulte também os canais
              oficiais.
            </span>
          </>
        )}
        <small>
          {sourceAvailable
            ? `Dados do INMET consultados em ${formatDateTime(source.fetchedAt)}.`
            : "Uma nova consulta será feita automaticamente quando a fonte estiver disponível."}
        </small>
      </aside>
    </header>
  );
}

function FeaturedAlert({ alert, sourceAvailable }: { alert: InmetAlert; sourceAvailable: boolean }) {
  const label = alertColorLabels[alert.severity];

  return (
    <section
      id="aviso-prioritario"
      className={`alerts-featured alerts-featured-${alert.severity}`}
      aria-labelledby="featured-alert-title"
    >
      <div className="alerts-featured-copy">
        <span className="alerts-featured-badge">
          <ShieldAlert aria-hidden="true" /> {label} · INMET
        </span>
        <p className="alerts-kicker">
          {sourceAvailable
            ? alert.period === "active"
              ? "Em vigor agora"
              : "Aviso programado"
            : "Último dado disponível"}
        </p>
        <h2 id="featured-alert-title">
          {label}: {alert.event}
        </h2>
        <p className="alerts-featured-description">
          {alert.description || "O INMET não forneceu uma descrição detalhada para este aviso."}
        </p>

        {!sourceAvailable ? (
          <p className="alerts-featured-source-warning">
            A consulta mais recente ao INMET falhou. Confirme a validade diretamente no aviso oficial.
          </p>
        ) : null}

        <dl className="alerts-featured-period">
          <div>
            <dt>Começa</dt>
            <dd>{formatDateTime(alert.startsAt)}</dd>
          </div>
          <div>
            <dt>Termina</dt>
            <dd>{formatDateTime(alert.expiresAt)}</dd>
          </div>
          <div>
            <dt>Abrangência</dt>
            <dd>{alert.relevance === "pelotas" ? "Inclui Pelotas" : "Regional ou estadual"}</dd>
          </div>
        </dl>

        {alert.instruction ? (
          <div className="alerts-featured-instruction">
            <strong>O que o INMET recomenda</strong>
            <p>{alert.instruction}</p>
          </div>
        ) : null}

        <div className="alerts-featured-actions">
          <a
            href={alert.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Abrir o aviso oficial “${alert.event}” no site do INMET, em nova aba`}
          >
            Abrir aviso oficial <ArrowUpRight aria-hidden="true" />
          </a>
          <a href="#como-interpretar-alertas">
            Entenda os níveis de alerta <ArrowRight aria-hidden="true" />
          </a>
        </div>
      </div>
      <AlertMunicipalityMap alert={alert} />
    </section>
  );
}

function AlertCard({ alert }: { alert: InmetAlert }) {
  const critical = alert.severity === "danger" || alert.severity === "great-danger";
  const Icon = critical ? ShieldAlert : AlertTriangle;
  const alertTitle = alert.headline || alert.event;
  const areaLabel = alertAreaLabel(alert);

  return (
    <article className={`alerts-card alerts-card-${alert.severity}`}>
      <div className="alerts-card-icon">
        <Icon aria-hidden="true" />
      </div>
      <div className="alerts-card-content">
        <div className="alerts-card-meta">
          <span>{alert.period === "active" ? "Em vigor" : "Programado"}</span>
          <span>{severityLabels[alert.severity]}</span>
          <span>{alert.relevance === "pelotas" ? "Inclui Pelotas" : "Área regional ou estadual"}</span>
        </div>
        <h3>{alertTitle}</h3>
        <p>{alert.description || "O INMET não forneceu uma descrição detalhada para este aviso."}</p>
        {alert.instruction ? (
          <div className="alerts-instruction">
            <strong>O que o INMET recomenda</strong>
            <p>{alert.instruction}</p>
          </div>
        ) : null}
        <dl className="alerts-period">
          <div>
            <dt>Começa</dt>
            <dd>{formatDateTime(alert.startsAt)}</dd>
          </div>
          <div>
            <dt>Termina</dt>
            <dd>{formatDateTime(alert.expiresAt)}</dd>
          </div>
        </dl>
        {areaLabel ? (
          <div className="alerts-areas">
            <MapPin aria-hidden="true" />
            <span>{areaLabel}</span>
          </div>
        ) : null}
      </div>
      <a
        className="alerts-official-link"
        href={alert.officialUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Abrir o aviso oficial “${alertTitle}” no site do INMET, em nova aba`}
      >
        Abrir no INMET <ArrowUpRight aria-hidden="true" />
      </a>
    </article>
  );
}

export function WeatherAlertsPage({ data }: { data: WeatherIntelligenceData }) {
  const weather = data.weather;
  const active = prioritizeAlerts(weather.alerts.filter((alert) => alert.period === "active"));
  const upcoming = prioritizeAlerts(weather.alerts.filter((alert) => alert.period === "upcoming"));
  const featured = active[0] ?? upcoming[0] ?? null;
  const remainingActive = featured ? active.filter((alert) => alert.id !== featured.id) : active;
  const remainingUpcoming = featured ? upcoming.filter((alert) => alert.id !== featured.id) : upcoming;
  const inmetSource = weather.sources.inmet;
  const sourceAvailable = inmetSource.usable;
  const hasAlerts = active.length > 0 || upcoming.length > 0;

  return (
    <div className="alerts-page">
      {featured ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(alertSchema(featured)) }}
        />
      ) : null}

      <AlertsHero
        featured={featured}
        activeCount={active.length}
        upcomingCount={upcoming.length}
        source={inmetSource}
      />

      <section
        id="resumo-alertas"
        className="alerts-overview"
        aria-label="Resumo dos avisos meteorológicos"
      >
        <article className={active.length > 0 ? "has-alert" : undefined}>
          <span>Em vigor</span>
          <strong>{active.length}</strong>
          <small>{active.length === 1 ? "aviso ativo" : "avisos ativos"}</small>
        </article>
        <article>
          <span>Programados</span>
          <strong>{upcoming.length}</strong>
          <small>{upcoming.length === 1 ? "aviso futuro" : "avisos futuros"}</small>
        </article>
        <article className={!sourceAvailable ? "is-unavailable" : undefined}>
          <span>Última consulta ao INMET</span>
          <strong>
            <Clock3 aria-hidden="true" />
            {sourceAvailable ? formatDateTime(inmetSource.fetchedAt) : "Indisponível"}
          </strong>
          <small>
            {sourceAvailable
              ? "A página verifica novos avisos automaticamente"
              : "Não interprete a falha como ausência de risco"}
          </small>
        </article>
      </section>

      {featured ? <FeaturedAlert alert={featured} sourceAvailable={sourceAvailable} /> : null}

      {!hasAlerts ? (
        <section
          id="situacao-alertas"
          className={`alerts-clear-state${sourceAvailable ? "" : " is-unavailable"}`}
          aria-labelledby="alerts-clear-title"
          aria-live="polite"
        >
          <span>
            {sourceAvailable ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
          </span>
          <div>
            <p className="alerts-kicker">{sourceAvailable ? "Situação consultada" : "Fonte indisponível"}</p>
            <h2 id="alerts-clear-title">
              {sourceAvailable
                ? "Nenhum alerta oficial listado para Pelotas"
                : "Não foi possível confirmar os alertas do INMET"}
            </h2>
            <p>
              {sourceAvailable
                ? "Não há avisos ativos ou programados identificados para Pelotas nos dados consultados. Continue acompanhando, porque novos alertas podem ser publicados a qualquer momento."
                : "A consulta ao INMET falhou nesta atualização. Isso não significa ausência de risco; tente novamente e acompanhe também os canais oficiais e a Defesa Civil."}
            </p>
          </div>
        </section>
      ) : null}

      {remainingActive.length > 0 ? (
        <section className="alerts-section" aria-labelledby="active-alerts-title">
          <div className="alerts-section-heading">
            <div>
              <p className="alerts-kicker">Também em vigor</p>
              <h2 id="active-alerts-title">Outros alertas ativos</h2>
            </div>
            <span>{alertCountLabel(remainingActive.length)}</span>
          </div>
          <div className="alerts-list">
            {remainingActive.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </section>
      ) : null}

      {remainingUpcoming.length > 0 ? (
        <section className="alerts-section" aria-labelledby="upcoming-alerts-title">
          <div className="alerts-section-heading">
            <div>
              <p className="alerts-kicker">Próximas horas</p>
              <h2 id="upcoming-alerts-title">Alertas programados</h2>
            </div>
            <span>{alertCountLabel(remainingUpcoming.length)}</span>
          </div>
          <div className="alerts-list">
            {remainingUpcoming.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="alerts-method" aria-labelledby="alerts-method-title">
        <Info aria-hidden="true" />
        <div>
          <h2 id="alerts-method-title">Informação oficial e tomada de decisão</h2>
          <p>
            O Tempo Pelotas não emite alertas. A página organiza dados publicados pelo INMET para
            facilitar a consulta. Em situações de risco, as orientações do INMET, da Defesa Civil e das
            autoridades locais têm prioridade.
          </p>
          <Link to="/metodologia">
            Ver como os dados são consultados <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
