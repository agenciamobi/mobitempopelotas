import Link from "@/production/compat/NextLink";
import type {
  InmetAlert,
  InmetAlertsData,
  InmetAlertRelevance,
} from "@/production/lib/inmet-alerts";
import type { AdvisoryLevel } from "@/production/lib/weather-insights";

import "./inmet-alerts-home.css";

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
  potential: "Alerta amarelo",
  danger: "Alerta laranja",
  "great-danger": "Alerta vermelho",
  unknown: "Aviso meteorológico",
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

function homepageAlertTitle(alert: InmetAlert, verified: boolean) {
  const event = displayHeadline(alert).replace(/^Aviso de\s+/i, "");
  return verified
    ? `${alertColorLabels[alert.severity]}: ${event}`
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

function AlertRow({ alert }: { alert: InmetAlert }) {
  const areaText =
    alert.areas[0] ||
    (alert.municipalities.length
      ? `${alert.municipalities.length} municípios informados`
      : "Confira a área no aviso original");

  return (
    <article className={`inmet-alert-card severity-${alert.severity} relevance-${alert.relevance}`}>
      <div className="inmet-alert-card__topline">
        <span className="inmet-alert-severity">{alert.severityLabel}</span>
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
  advisoryLevel,
}: {
  data: InmetAlertsData;
  advisoryLevel: AdvisoryLevel;
}) {
  if (data.status !== "live" || data.alerts.length === 0) return null;

  const primary = primaryHomeAlert(data);
  if (!primary) return null;
  const verified = hasVerifiedInmetAlertSemantics(primary);
  const title = homepageAlertTitle(primary, verified);
  const colorClass = verified ? `severity-${primary.severity}` : `advisory-${advisoryLevel}`;
  const statusLabel = verified ? primary.severityLabel : "Classificação em validação";

  return (
    <section
      className={`tp-home-alert ${colorClass}${verified ? " is-officially-classified" : " is-unverified"}`}
      data-alert-period={primary.period}
      data-alert-severity={primary.severity}
      data-alert-official-semantics={verified ? "verified" : "unverified"}
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

  if (data.status === "unavailable") {
    return (
      <section className="inmet-alerts-section is-unavailable" aria-labelledby="inmet-alerts-title">
        <header className="inmet-alerts-heading">
          <div>
            <span className="eyebrow">Avisos oficiais do INMET</span>
            <h2 id="inmet-alerts-title">Avisos meteorológicos no Rio Grande do Sul</h2>
          </div>
          <span className="inmet-source-status">Não foi possível atualizar</span>
        </header>
        <div className="inmet-alerts-empty">
          <strong>Não conseguimos consultar os avisos agora.</strong>
          <p>Isso não significa que não existam avisos. Confira diretamente no site do INMET.</p>
          <a href={data.source.portalUrl} target="_blank" rel="noreferrer">
            Abrir site do INMET <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
    );
  }

  if (data.alerts.length === 0) {
    return (
      <section className="inmet-alerts-section is-clear" aria-labelledby="inmet-alerts-title">
        <header className="inmet-alerts-heading">
          <div>
            <span className="eyebrow">Avisos oficiais do INMET</span>
            <h2 id="inmet-alerts-title">Avisos de tempo no Rio Grande do Sul</h2>
          </div>
          <span className="inmet-source-status">Atualizado</span>
        </header>
        <div className="inmet-alerts-empty">
          <strong>O INMET não informa avisos ativos para o Rio Grande do Sul neste momento.</strong>
          <p>
            A situação pode mudar. O portal consulta novamente os dados em intervalos regulares.
          </p>
          <a href={data.source.portalUrl} target="_blank" rel="noreferrer">
            Conferir no site do INMET <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
    );
  }

  const pelotas = data.alerts.filter((alert) => alert.relevance === "pelotas");
  const regional = data.alerts.filter((alert) => alert.relevance === "regional");
  const state = data.alerts.filter((alert) => alert.relevance === "state");
  const groups = [
    {
      id: "pelotas",
      title: "Avisos que incluem Pelotas",
      description: "O aviso cita Pelotas diretamente.",
      alerts: pelotas,
    },
    {
      id: "regional",
      title: "Avisos para áreas próximas à Zona Sul",
      description: "Confira os municípios incluídos e o período de validade de cada aviso.",
      alerts: regional,
    },
    {
      id: "estado",
      title: "Avisos para outras áreas do Rio Grande do Sul",
      description: "Consulte estes avisos ao viajar ou acompanhar outras regiões do estado.",
      alerts: state,
    },
  ].filter((group) => group.alerts.length > 0);

  return (
    <section className="inmet-alerts-section" aria-labelledby="inmet-alerts-title">
      <header className="inmet-alerts-heading">
        <div>
          <span className="eyebrow">Avisos oficiais do INMET</span>
          <h2 id="inmet-alerts-title">Avisos de tempo no Rio Grande do Sul</h2>
          <p>
            {relevanceSummary(data)} Os avisos que incluem Pelotas e a Zona Sul aparecem primeiro.
          </p>
        </div>
        <div className="inmet-alerts-counts" aria-label="Quantidade de avisos por área">
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
            <span>Outras áreas</span>
          </div>
        </div>
      </header>

      <div className="inmet-alert-groups">
        {groups.map((group) => (
          <section
            className={`inmet-alert-group group-${group.id}`}
            key={group.id}
            aria-labelledby={`inmet-group-${group.id}`}
          >
            <header>
              <div>
                <h3 id={`inmet-group-${group.id}`}>{group.title}</h3>
                <p>{group.description}</p>
              </div>
              <span>{group.alerts.length}</span>
            </header>
            <div className="inmet-alert-list">
              {group.alerts.map((alert) => (
                <AlertRow alert={alert} key={alert.id} />
              ))}
            </div>
          </section>
        ))}
      </div>

      <footer className="inmet-alerts-footer">
        <p>
          Última atualização: {formatDateTime(data.source.fetchedAt) ?? "horário não informado"}.
          Consulte a área completa e as orientações no aviso original.
        </p>
        <a href={data.source.portalUrl} target="_blank" rel="noreferrer">
          Abrir site oficial do INMET <span aria-hidden="true">↗</span>
        </a>
      </footer>
    </section>
  );
}
