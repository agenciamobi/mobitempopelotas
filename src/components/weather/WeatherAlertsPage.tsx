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
      address: { "@type": "PostalAddress", addressLocality: "Pelotas", addressRegion: "RS", addressCountry: "BR" },
    },
    url: alert.officialUrl,
  };
}

function FeaturedAlert({ alert }: { alert: InmetAlert }) {
  const label = alertColorLabels[alert.severity];
  return (
    <section className={`alerts-featured alerts-featured-${alert.severity}`} aria-labelledby="featured-alert-title">
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
          <a href={alert.officialUrl} target="_blank" rel="noopener noreferrer">
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
            <span>{alert.municipalities.length > 0 ? alert.municipalities.slice(0, 8).join(", ") : alert.areas.slice(0, 5).join(", ")}</span>
          </div>
        ) : null}
      </div>
      <a className="alerts-official-link" href={alert.officialUrl} target="_blank" rel="noopener noreferrer" aria-label={`Abrir o aviso oficial “${alertTitle}” no site do INMET, em nova aba`}>
        Abrir no INMET <ArrowUpRight aria-hidden="true" />
      </a>
    </article>
  );
}

export function WeatherAlertsPage({ data }: { data: WeatherIntelligenceData }) {
  const weather = data.weather;
  const active = weather.alerts.filter((alert) => alert.period === "active");
  const upcoming = weather.alerts.filter((alert) => alert.period === "upcoming");
  const featured = active[0] ?? upcoming[0] ?? null;
  const remainingActive = featured ? active.filter((alert) => alert.id !== featured.id) : active;
  const remainingUpcoming = featured ? upcoming.filter((alert) => alert.id !== featured.id) : upcoming;
  const inmetSource = weather.sources.inmet;

  return (
    <div className="alerts-page">
      {featured ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(alertSchema(featured)) }} /> : null}
      <header className="alerts-page-header">
        <div>
          <Link className="alerts-back-link" to="/" aria-label="Voltar ao tempo agora em Pelotas"><ArrowLeft aria-hidden="true" /> Tempo agora</Link>
          <p className="alerts-kicker">Avisos oficiais</p>
          <h1>Alertas meteorológicos para Pelotas e região</h1>
          <p>Avisos consultados diretamente no INMET e organizados por período, severidade e relevância para Pelotas.</p>
        </div>
        <div className={`alerts-source-state alerts-source-state-${inmetSource.status}`}>
          {inmetSource.usable ? <CheckCircle2 aria-hidden="true" /> : <Info aria-hidden="true" />}
          <div>
            <strong>{inmetSource.usable ? "Fonte oficial disponível" : "Fonte com restrição"}</strong>
            <span>{inmetSource.usable ? `INMET consultado em ${formatDateTime(inmetSource.fetchedAt)}` : inmetSource.reason || "O portal tentará consultar novamente automaticamente."}</span>
          </div>
        </div>
      </header>

      <section className="alerts-overview" aria-label="Resumo dos avisos meteorológicos">
        <article className={active.length > 0 ? "has-alert" : undefined}><span>Ativos agora</span><strong>{active.length}</strong><small>{active.length === 1 ? "aviso em vigor" : "avisos em vigor"}</small></article>
        <article><span>Próximos</span><strong>{upcoming.length}</strong><small>{upcoming.length === 1 ? "aviso programado" : "avisos programados"}</small></article>
        <article><span>Atualização</span><strong><Clock3 aria-hidden="true" /> Automática</strong><small>A cada nova consulta meteorológica</small></article>
      </section>

      {featured ? <FeaturedAlert alert={featured} /> : null}

      {active.length === 0 && upcoming.length === 0 ? (
        <section className="alerts-clear-state" aria-labelledby="alerts-clear-title">
          <span><CheckCircle2 aria-hidden="true" /></span>
          <div><p className="alerts-kicker">Situação atual</p><h2 id="alerts-clear-title">Nenhum alerta oficial encontrado</h2><p>Não há avisos ativos ou programados do INMET com relevância identificada para Pelotas nas informações disponíveis nesta consulta.</p></div>
        </section>
      ) : null}

      {remainingActive.length > 0 ? (
        <section className="alerts-section" aria-labelledby="active-alerts-title">
          <div className="alerts-section-heading"><div><p className="alerts-kicker">Outros em vigor</p><h2 id="active-alerts-title">Alertas ativos adicionais</h2></div><span>{remainingActive.length} encontrado(s)</span></div>
          <div className="alerts-list">{remainingActive.map((alert) => <AlertCard key={alert.id} alert={alert} />)}</div>
        </section>
      ) : null}

      {remainingUpcoming.length > 0 ? (
        <section className="alerts-section" aria-labelledby="upcoming-alerts-title">
          <div className="alerts-section-heading"><div><p className="alerts-kicker">Próximas horas</p><h2 id="upcoming-alerts-title">Alertas programados</h2></div><span>{remainingUpcoming.length} encontrado(s)</span></div>
          <div className="alerts-list">{remainingUpcoming.map((alert) => <AlertCard key={alert.id} alert={alert} />)}</div>
        </section>
      ) : null}

      <section className="alerts-method" aria-labelledby="alerts-method-title">
        <Info aria-hidden="true" />
        <div><h2 id="alerts-method-title">Como interpretar esta página</h2><p>Os alertas são emitidos pelo INMET. O Tempo Pelotas filtra, organiza e apresenta os avisos, mas não substitui as orientações da Defesa Civil, do INMET ou das autoridades locais. Em situações de risco, siga sempre as instruções oficiais.</p></div>
      </section>
    </div>
  );
}
