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
  const severity = featured?.severity ?? "unknown";
  const label = featured ? alertColorLabels[severity] : "Situação atual";
  const target = featured ? "#aviso-prioritario" : "#resumo-alertas";
  const targetLabel = featured ? "Ver situação prioritária" : "Ver resumo da consulta";

  return (
    <header className={`alerts-editorial-hero alerts-editorial-hero-${severity}`}>
      <div className="alerts-editorial-copy">
        <Link className="alerts-editorial-back" to="/" aria-label="Voltar ao tempo agora em Pelotas">
          <ArrowLeft aria-hidden="true" /> Visão geral
        </Link>
        <span className="alerts-editorial-eyebrow">Avisos oficiais · Pelotas</span>
        <h1>Alertas meteorológicos com contexto local.</h1>
        <p>
          Consulte os avisos emitidos pelo INMET, a vigência, a área informada e as orientações oficiais
          antes de tomar decisões relacionadas ao tempo severo.
        </p>

        <div className="alerts-editorial-metrics" aria-label="Resumo dos alertas">
          <div><span>Em vigor</span><strong>{activeCount}</strong></div>
          <div><span>Próximos</span><strong>{upcomingCount}</strong></div>
          <div><span>Fonte</span><strong>{source.usable ? "Disponível" : "Restrita"}</strong></div>
        </div>

        <div className="alerts-editorial-actions">
          <a href={target}>{targetLabel} <ArrowRight aria-hidden="true" /></a>
          <Link to="/metodologia">Entender a metodologia</Link>
        </div>
      </div>

      <aside className="alerts-editorial-panel" aria-label="Situação meteorológica prioritária">
        <div className="alerts-editorial-panel-line" aria-hidden="true" />
        <div className="alerts-editorial-panel-status">
          {featured ? <ShieldAlert aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
          <span>{label}</span>
        </div>
        {featured ? (
          <>
            <p>{featured.period === "active" ? "Em vigor agora" : "Aviso programado"}</p>
            <h2>{featured.event}</h2>
            <dl>
              <div><dt>Validade</dt><dd>{formatDateTime(featured.expiresAt)}</dd></div>
              <div><dt>Abrangência</dt><dd>{featured.relevance === "pelotas" ? "Inclui Pelotas" : "Regional"}</dd></div>
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
        ) : (
          <>
            <p>Consulta mais recente</p>
            <h2>Nenhum alerta ativo encontrado.</h2>
            <span className="alerts-editorial-panel-note">
              Continue acompanhando, pois novos avisos podem ser publicados pelo INMET.
            </span>
          </>
        )}
        <small>
          {source.usable
            ? `INMET consultado em ${formatDateTime(source.fetchedAt)}`
            : source.reason || "Nova consulta será realizada automaticamente."}
        </small>
      </aside>
    </header>
  );
}

function FeaturedAlert({ alert }: { alert: InmetAlert }) {
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
        <p className="alerts-kicker">{alert.period === "active" ? "Em vigor agora" : "Próximo aviso"}</p>
        <h2 id="featured-alert-title">{label}: {alert.event}</h2>
        <p className="alerts-featured-description">
          {alert.description || "O INMET não forneceu uma descrição detalhada para este aviso."}
        </p>

        <dl className="alerts-featured-period">
          <div><dt>Início</dt><dd>{formatDateTime(alert.startsAt)}</dd></div>
          <div><dt>Término</dt><dd>{formatDateTime(alert.expiresAt)}</dd></div>
          <div><dt>Abrangência</dt><dd>{alert.relevance === "pelotas" ? "Inclui Pelotas" : "Regional"}</dd></div>
        </dl>

        {alert.instruction ? (
          <div className="alerts-featured-instruction">
            <strong>Ações recomendadas pelo INMET</strong>
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
          <Link to="/metodologia">
            Como os alertas são usados <ArrowRight aria-hidden="true" />
          </Link>
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

  return (
    <article className={`alerts-card alerts-card-${alert.severity}`}>
      <div className="alerts-card-icon"><Icon aria-hidden="true" /></div>
      <div className="alerts-card-content">
        <div className="alerts-card-meta">
          <span>{alert.period === "active" ? "Ativo agora" : "Programado"}</span>
          <span>{severityLabels[alert.severity]}</span>
          <span>{alert.relevance === "pelotas" ? "Pelotas" : "Abrangência regional"}</span>
        </div>
        <h2>{alertTitle}</h2>
        <p>{alert.description || "O INMET não forneceu uma descrição detalhada para este aviso."}</p>
        {alert.instruction ? (
          <div className="alerts-instruction"><strong>Orientações oficiais</strong><p>{alert.instruction}</p></div>
        ) : null}
        <dl className="alerts-period">
          <div><dt>Início</dt><dd>{formatDateTime(alert.startsAt)}</dd></div>
          <div><dt>Término</dt><dd>{formatDateTime(alert.expiresAt)}</dd></div>
        </dl>
        {alert.areas.length > 0 || alert.municipalities.length > 0 ? (
          <div className="alerts-areas">
            <MapPin aria-hidden="true" />
            <span>
              {alert.municipalities.length > 0
                ? alert.municipalities.slice(0, 8).join(", ")
                : alert.areas.slice(0, 5).join(", ")}
            </span>
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

      <section id="resumo-alertas" className="alerts-overview" aria-label="Resumo dos avisos meteorológicos">
        <article className={active.length > 0 ? "has-alert" : undefined}>
          <span>Ativos agora</span><strong>{active.length}</strong>
          <small>{active.length === 1 ? "aviso em vigor" : "avisos em vigor"}</small>
        </article>
        <article>
          <span>Próximos</span><strong>{upcoming.length}</strong>
          <small>{upcoming.length === 1 ? "aviso programado" : "avisos programados"}</small>
        </article>
        <article>
          <span>Atualização</span><strong><Clock3 aria-hidden="true" /> Automática</strong>
          <small>A cada nova consulta meteorológica</small>
        </article>
      </section>

      {featured ? <FeaturedAlert alert={featured} /> : null}

      {active.length === 0 && upcoming.length === 0 ? (
        <section className="alerts-clear-state" aria-labelledby="alerts-clear-title">
          <span><CheckCircle2 aria-hidden="true" /></span>
          <div>
            <p className="alerts-kicker">Situação atual</p>
            <h2 id="alerts-clear-title">Nenhum alerta oficial encontrado</h2>
            <p>
              Não há avisos ativos ou programados do INMET com relevância identificada para Pelotas
              nas informações disponíveis nesta consulta.
            </p>
          </div>
        </section>
      ) : null}

      {remainingActive.length > 0 ? (
        <section className="alerts-section" aria-labelledby="active-alerts-title">
          <div className="alerts-section-heading">
            <div><p className="alerts-kicker">Outros em vigor</p><h2 id="active-alerts-title">Alertas ativos adicionais</h2></div>
            <span>{remainingActive.length} encontrado(s)</span>
          </div>
          <div className="alerts-list">{remainingActive.map((alert) => <AlertCard key={alert.id} alert={alert} />)}</div>
        </section>
      ) : null}

      {remainingUpcoming.length > 0 ? (
        <section className="alerts-section" aria-labelledby="upcoming-alerts-title">
          <div className="alerts-section-heading">
            <div><p className="alerts-kicker">Próximas horas</p><h2 id="upcoming-alerts-title">Alertas programados</h2></div>
            <span>{remainingUpcoming.length} encontrado(s)</span>
          </div>
          <div className="alerts-list">{remainingUpcoming.map((alert) => <AlertCard key={alert.id} alert={alert} />)}</div>
        </section>
      ) : null}

      <section className="alerts-method" aria-labelledby="alerts-method-title">
        <Info aria-hidden="true" />
        <div>
          <h2 id="alerts-method-title">Como interpretar esta página</h2>
          <p>
            Os alertas são emitidos pelo INMET. O Tempo Pelotas filtra, organiza e apresenta os avisos,
            mas não substitui as orientações da Defesa Civil, do INMET ou das autoridades locais. Em
            situações de risco, siga sempre as instruções oficiais.
          </p>
        </div>
      </section>
    </div>
  );
}
