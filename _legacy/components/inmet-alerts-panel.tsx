import Link from "next/link";
import type {
  InmetAlert,
  InmetAlertsData,
  InmetAlertRelevance,
} from "@/lib/inmet-alerts";

type InmetAlertsPanelProps = {
  data: InmetAlertsData;
  variant?: "home" | "page";
};

const relevanceLabels: Record<InmetAlertRelevance, string> = {
  pelotas: "Inclui Pelotas",
  regional: "Áreas próximas à Zona Sul",
  state: "Outras áreas do RS",
};

function formatDateTime(value: string | null) {
  if (!value) return "Horário não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function periodLabel(alert: InmetAlert) {
  const start = formatDateTime(alert.startsAt);
  const end = formatDateTime(alert.expiresAt);

  if (!alert.expiresAt) return alert.period === "upcoming" ? `Previsto para começar em ${start}` : `Em vigor desde ${start}`;
  return alert.period === "upcoming" ? `Previsto entre ${start} e ${end}` : `Em vigor até ${end}`;
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

function AlertRow({ alert }: { alert: InmetAlert }) {
  const areaText = alert.areas[0] ||
    (alert.municipalities.length ? `${alert.municipalities.length} municípios informados` : "Confira a área no aviso original");

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
      <p className="inmet-alert-area"><strong>Onde vale:</strong> {areaText}</p>
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

function HomePanel({ data }: { data: InmetAlertsData }) {
  if (data.status !== "live" || data.alerts.length === 0) return null;

  const primary = data.alerts.find((alert) => alert.relevance === "pelotas")
    ?? data.alerts.find((alert) => alert.relevance === "regional")
    ?? data.alerts[0];

  return (
    <section className={`home-inmet-alerts severity-${primary.severity}`} aria-labelledby="home-inmet-title">
      <div className="home-inmet-alerts__main">
        <div className="home-inmet-alerts__mark" aria-hidden="true">
          <small>INMET</small>
          <strong>!</strong>
        </div>
        <div className="home-inmet-alerts__copy">
          <div className="home-inmet-alerts__topline">
            <span>Aviso oficial do INMET</span>
            <b>{primary.severityLabel}</b>
          </div>
          <h2 id="home-inmet-title">{displayHeadline(primary)}</h2>
          <div className="home-inmet-alerts__meta">
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
      <div className="home-inmet-alerts__aside">
        <strong>Áreas e orientações oficiais</strong>
        <small>{homeAlertCountLabel(data)}</small>
        <Link href="/alertas">Consultar avisos <span aria-hidden="true">→</span></Link>
      </div>
    </section>
  );
}

export function InmetAlertsPanel({ data, variant = "page" }: InmetAlertsPanelProps) {
  if (variant === "home") return <HomePanel data={data} />;

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
          <a href={data.source.portalUrl} target="_blank" rel="noreferrer">Abrir site do INMET <span aria-hidden="true">↗</span></a>
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
          <p>A situação pode mudar. O portal consulta novamente os dados em intervalos regulares.</p>
          <a href={data.source.portalUrl} target="_blank" rel="noreferrer">Conferir no site do INMET <span aria-hidden="true">↗</span></a>
        </div>
      </section>
    );
  }

  const pelotas = data.alerts.filter((alert) => alert.relevance === "pelotas");
  const regional = data.alerts.filter((alert) => alert.relevance === "regional");
  const state = data.alerts.filter((alert) => alert.relevance === "state");
  const groups = [
    { id: "pelotas", title: "Avisos que incluem Pelotas", description: "O aviso cita Pelotas diretamente.", alerts: pelotas },
    { id: "regional", title: "Avisos para áreas próximas à Zona Sul", description: "Confira os municípios incluídos e o período de validade de cada aviso.", alerts: regional },
    { id: "estado", title: "Avisos para outras áreas do Rio Grande do Sul", description: "Consulte estes avisos ao viajar ou acompanhar outras regiões do estado.", alerts: state },
  ].filter((group) => group.alerts.length > 0);

  return (
    <section className="inmet-alerts-section" aria-labelledby="inmet-alerts-title">
      <header className="inmet-alerts-heading">
        <div>
          <span className="eyebrow">Avisos oficiais do INMET</span>
          <h2 id="inmet-alerts-title">Avisos de tempo no Rio Grande do Sul</h2>
          <p>{relevanceSummary(data)} Os avisos que incluem Pelotas e a Zona Sul aparecem primeiro.</p>
        </div>
        <div className="inmet-alerts-counts" aria-label="Quantidade de avisos por área">
          <div><strong>{data.counts.pelotas}</strong><span>Pelotas</span></div>
          <div><strong>{data.counts.regional}</strong><span>Zona Sul</span></div>
          <div><strong>{data.counts.state}</strong><span>Outras áreas</span></div>
        </div>
      </header>

      <div className="inmet-alert-groups">
        {groups.map((group) => (
          <section className={`inmet-alert-group group-${group.id}`} key={group.id} aria-labelledby={`inmet-group-${group.id}`}>
            <header>
              <div>
                <h3 id={`inmet-group-${group.id}`}>{group.title}</h3>
                <p>{group.description}</p>
              </div>
              <span>{group.alerts.length}</span>
            </header>
            <div className="inmet-alert-list">
              {group.alerts.map((alert) => <AlertRow alert={alert} key={alert.id} />)}
            </div>
          </section>
        ))}
      </div>

      <footer className="inmet-alerts-footer">
        <p>Última atualização: {formatDateTime(data.source.fetchedAt)}. Consulte a área completa e as orientações no aviso original.</p>
        <a href={data.source.portalUrl} target="_blank" rel="noreferrer">Abrir site oficial do INMET <span aria-hidden="true">↗</span></a>
      </footer>
    </section>
  );
}
