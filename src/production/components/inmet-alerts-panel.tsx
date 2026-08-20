import Link from "@/production/compat/NextLink";
import type {
  InmetAlert,
  InmetAlertsData,
  InmetAlertRelevance,
} from "@/production/lib/inmet-alerts";
import type { AdvisoryLevel } from "@/production/lib/weather-insights";

import "./inmet-alerts-home.css";
import "./inmet-alerts-page.css";

type InmetAlertsPanelProps = {
  data: InmetAlertsData;
  variant?: "home" | "page";
  advisoryLevel?: AdvisoryLevel;
};

const relevanceLabels: Record<InmetAlertRelevance, string> = {
  pelotas: "Inclui Pelotas",
  regional: "Áreas próximas à Zona Sul",
  state: "Outras áreas do RS",
};

const severityRank: Record<InmetAlert["severity"], number> = {
  unknown: 0,
  potential: 1,
  danger: 2,
  "great-danger": 3,
};

const alertColorLabels: Record<InmetAlert["severity"], string> = {
  potential: "Amarelo",
  danger: "Laranja",
  "great-danger": "Vermelho",
  unknown: "Classificação não informada",
};

const relevanceRank: Record<InmetAlert["relevance"], number> = {
  pelotas: 0,
  regional: 1,
  state: 2,
};

const periodRank: Record<InmetAlert["period"], number> = {
  active: 0,
  upcoming: 1,
};

function validDate(value: string | null) {
  if (!value) return false;
  return Number.isFinite(new Date(value).getTime());
}

export function hasVerifiedInmetAlertSemantics(alert: InmetAlert) {
  return (
    alert.severity !== "unknown" &&
    validDate(alert.startsAt) &&
    validDate(alert.expiresAt)
  );
}

function hasOfficialInmetClassification(alert: InmetAlert) {
  return alert.severity !== "unknown";
}

function severityDisplayLabel(alert: InmetAlert) {
  if (!hasOfficialInmetClassification(alert)) return alert.severityLabel;
  return `${alertColorLabels[alert.severity]} · ${alert.severityLabel}`;
}

function formatDateTime(value: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function periodLabel(alert: InmetAlert) {
  const start = formatDateTime(alert.startsAt);
  const end = formatDateTime(alert.expiresAt);

  if (alert.period === "upcoming") {
    if (start && end) return `Previsto entre ${start} e ${end}`;
    if (start) return `Previsto para começar em ${start}`;
    if (end) return `Programado até ${end}`;
    return "Período previsto não informado pelo INMET";
  }

  if (end) return `Em vigor até ${end}`;
  if (start) return `Em vigor desde ${start}`;
  return "Em vigor — horário não informado pelo INMET";
}

function relevanceSummary(data: InmetAlertsData) {
  if (data.counts.pelotas > 0) {
    return data.counts.pelotas === 1
      ? "Pelotas está incluída em um aviso oficial."
      : `Pelotas está incluída em ${data.counts.pelotas} avisos oficiais.`;
  }
  if (data.counts.regional > 0) {
    return "Há aviso para áreas próximas ou relacionadas à Zona Sul.";
  }
  return data.counts.total === 1
    ? "Há um aviso oficial no Rio Grande do Sul."
    : `Há ${data.counts.total} avisos oficiais no Rio Grande do Sul.`;
}

function displayHeadline(alert: InmetAlert) {
  const headline = alert.headline?.trim();

  if (!headline || /severidade|severity|grau|grade/i.test(headline)) {
    return `Aviso de ${alert.event}`;
  }

  return headline;
}

function homepageAlertTitle(alert: InmetAlert, classified: boolean) {
  const event = displayHeadline(alert).replace(/^Aviso de\s+/i, "");
  return classified
    ? `Alerta ${alertColorLabels[alert.severity].toLowerCase()}: ${event}`
    : `Aviso meteorológico: ${event}`;
}

function homeAreaLabel(alert: InmetAlert) {
  if (alert.relevance === "pelotas") return "Inclui o município de Pelotas";
  if (alert.relevance === "regional") return alert.areas[0] || "Áreas próximas à Zona Sul";
  return alert.areas[0] || "Outras áreas do Rio Grande do Sul";
}

function homeAlertCountLabel(data: InmetAlertsData) {
  if (data.counts.pelotas > 0) {
    return `${data.counts.pelotas} ${data.counts.pelotas === 1 ? "aviso" : "avisos"} incluindo Pelotas`;
  }
  if (data.counts.regional > 0) {
    return `${data.counts.regional} ${data.counts.regional === 1 ? "aviso regional" : "avisos regionais"}`;
  }
  return `${data.counts.total} ${data.counts.total === 1 ? "aviso no RS" : "avisos no RS"}`;
}

function compareHomeAlerts(first: InmetAlert, second: InmetAlert) {
  const relevanceDifference = relevanceRank[first.relevance] - relevanceRank[second.relevance];
  if (relevanceDifference !== 0) return relevanceDifference;

  const periodDifference = periodRank[first.period] - periodRank[second.period];
  if (periodDifference !== 0) return periodDifference;

  const severityDifference = severityRank[second.severity] - severityRank[first.severity];
  if (severityDifference !== 0) return severityDifference;

  const firstTime = new Date(first.sentAt ?? first.startsAt ?? 0).getTime();
  const secondTime = new Date(second.sentAt ?? second.startsAt ?? 0).getTime();
  return secondTime - firstTime;
}

function primaryHomeAlert(data: InmetAlertsData) {
  return [...data.alerts].sort(compareHomeAlerts)[0] ?? null;
}

function homeSeverityAlerts(data: InmetAlertsData, primary: InmetAlert) {
  const scope = data.alerts.filter((alert) => alert.relevance === primary.relevance);
  const uniqueKeys = new Set<string>();

  return [...scope]
    .sort(compareHomeAlerts)
    .filter((alert) => hasOfficialInmetClassification(alert))
    .filter((alert) => {
      const key = `${alert.severity}:${alert.event.toLowerCase()}`;
      if (uniqueKeys.has(key)) return false;
      uniqueKeys.add(key);
      return true;
    })
    .slice(0, 3);
}

function AlertRow({ alert }: { alert: InmetAlert }) {
  const areaText =
    alert.areas[0] ||
    (alert.municipalities.length
      ? `${alert.municipalities.length} municípios informados`
      : "Confira a área no aviso original");

  return (
    <article className={`inmet-alert-card severity-${alert.severity} relevance-${alert.relevance}`}>
      <div className="inmet-alert-card__topline">
        <span className="inmet-alert-severity">{severityDisplayLabel(alert)}</span>
        <span className="inmet-alert-relevance">{relevanceLabels[alert.relevance]}</span>
      </div>
      <div className="inmet-alert-card__heading">
        <div>
          <h3>{displayHeadline(alert)}</h3>
          <p>{periodLabel(alert)}</p>
        </div>
        <span className="inmet-alert-event">{alert.event}</span>
      </div>
      <p className="inmet-alert-area">
        <strong>Onde vale:</strong> {areaText}
      </p>
      {alert.description ? <p className="inmet-alert-description">{alert.description}</p> : null}
      {alert.instruction ? (
        <details>
          <summary>Como se proteger</summary>
          <p>{alert.instruction}</p>
        </details>
      ) : null}
      <a href={alert.officialUrl} target="_blank" rel="noreferrer">
        Ver aviso original no INMET <span aria-hidden="true">↗</span>
      </a>
    </article>
  );
}

function HomePanel({
  data,
}: {
  data: InmetAlertsData;
  advisoryLevel: AdvisoryLevel;
}) {
  if (data.status !== "live" || data.alerts.length === 0) return null;

  const primary = primaryHomeAlert(data);
  if (!primary) return null;
  const classified = hasOfficialInmetClassification(primary);
  const verified = hasVerifiedInmetAlertSemantics(primary);
  const title = homepageAlertTitle(primary, classified);
  const colorClass = classified ? `severity-${primary.severity}` : "severity-unknown";
  const statusLabel = classified ? severityDisplayLabel(primary) : "Classificação não informada";
  const severityAlerts = homeSeverityAlerts(data, primary);

  return (
    <section
      className={`tp-home-alert ${colorClass}${classified ? " is-officially-classified" : " is-unverified"}`}
      data-alert-period={primary.period}
      data-alert-severity={primary.severity}
      data-alert-official-semantics={verified ? "verified" : "partial"}
      aria-label={`${title}. ${periodLabel(primary)}`}
      aria-labelledby="home-inmet-title"
    >
      <div className="tp-home-alert__main">
        <div className="tp-home-alert__mark" aria-hidden="true">
          <small>INMET</small>
          <strong>!</strong>
        </div>
        <div className="tp-home-alert__copy">
          <div className="tp-home-alert__topline">
            <span>Aviso oficial do INMET</span>
            <b>{statusLabel}</b>
          </div>
          <h2 id="home-inmet-title">{title}</h2>
          <div className="tp-home-alert__meta">
            <span>
              <small>Abrangência</small>
              <strong>{homeAreaLabel(primary)}</strong>
            </span>
            <span>
              <small>Validade</small>
              <strong>{periodLabel(primary)}</strong>
            </span>
          </div>
          {severityAlerts.length > 0 ? (
            <div className="tp-home-alert__levels" aria-label="Classificações dos avisos oficiais em destaque">
              {severityAlerts.map((alert) => (
                <span className={`severity-${alert.severity}`} key={`${alert.id}-${alert.severity}`}>
                  <i aria-hidden="true" />
                  <strong>{alertColorLabels[alert.severity]}</strong>
                  <small>{alert.event}</small>
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="tp-home-alert__aside">
        <strong>Áreas e orientações oficiais</strong>
        <small>{homeAlertCountLabel(data)}</small>
        <Link href="/alertas">
          Consultar avisos <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}

export function InmetAlertsPanel({
  data,
  variant = "page",
  advisoryLevel = "normal",
}: InmetAlertsPanelProps) {
  if (variant === "home") return <HomePanel data={data} advisoryLevel={advisoryLevel} />;

  const pelotas = data.alerts.filter((alert) => alert.relevance === "pelotas");
  const regional = data.alerts.filter((alert) => alert.relevance === "regional");
  const state = data.alerts.filter((alert) => alert.relevance === "state");

  return (
    <section
      className={`inmet-alerts-section${data.status === "unavailable" ? " is-unavailable" : ""}`}
      aria-labelledby="inmet-alerts-title"
    >
      <header className="inmet-alerts-heading">
        <div>
          <span className="eyebrow">Avisos oficiais</span>
          <h2 id="inmet-alerts-title">INMET: o que está vigente agora</h2>
          <p>
            Avisos meteorológicos oficiais em vigor ou programados para começar em até 48 horas,
            organizados por relevância para Pelotas e a Zona Sul.
          </p>
        </div>
        <span className="inmet-source-status">
          {data.status === "live" ? "Consulta oficial ativa" : "Consulta oficial em contingência"}
        </span>
      </header>

      <div className="inmet-alerts-counts" aria-label="Resumo dos avisos">
        <div>
          <strong>{data.counts.pelotas}</strong>
          <span>Pelotas</span>
        </div>
        <div>
          <strong>{data.counts.regional}</strong>
          <span>Zona Sul</span>
        </div>
        <div>
          <strong>{data.counts.state}</strong>
          <span>Demais RS</span>
        </div>
      </div>

      {data.alerts.length ? (
        <div className="inmet-alert-groups">
          {pelotas.length ? (
            <AlertGroup
              title="Pelotas"
              description="Avisos que incluem Pelotas entre os municípios informados pelo INMET."
              alerts={pelotas}
            />
          ) : null}
          {regional.length ? (
            <AlertGroup
              title="Zona Sul e entorno"
              description="Avisos para municípios próximos, costa ou áreas regionais relacionadas à Zona Sul."
              alerts={regional}
            />
          ) : null}
          {state.length ? (
            <AlertGroup
              title="Outras áreas do Rio Grande do Sul"
              description="Avisos estaduais sem indicação direta de Pelotas ou da Zona Sul."
              alerts={state}
            />
          ) : null}
        </div>
      ) : (
        <div className="inmet-alerts-empty">
          <strong>
            {data.status === "live"
              ? "Nenhum aviso oficial vigente no momento"
              : "Não foi possível confirmar os avisos oficiais agora"}
          </strong>
          <p>
            {data.status === "live"
              ? "A consulta automática do Tempo Pelotas continuará verificando novos avisos do INMET."
              : "Quando a consulta do INMET estiver indisponível, o portal não deve interpretar ausência de dados como ausência de risco."}
          </p>
          <a href="https://alertas2.inmet.gov.br/" target="_blank" rel="noreferrer">
            Consultar diretamente o INMET <span aria-hidden="true">↗</span>
          </a>
        </div>
      )}

      <footer className="inmet-alerts-footer">
        <p>{relevanceSummary(data)}</p>
        <a href={data.sourceUrl} target="_blank" rel="noreferrer">
          Fonte oficial: INMET <span aria-hidden="true">↗</span>
        </a>
      </footer>
    </section>
  );
}

function AlertGroup({
  title,
  description,
  alerts,
}: {
  title: string;
  description: string;
  alerts: InmetAlert[];
}) {
  return (
    <section className="inmet-alert-group">
      <header>
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <span>{alerts.length}</span>
      </header>
      <div className="inmet-alert-list">
        {alerts.map((alert) => (
          <AlertRow key={alert.id} alert={alert} />
        ))}
      </div>
    </section>
  );
}
