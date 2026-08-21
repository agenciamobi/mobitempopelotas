import { Clock3, ExternalLink, FileText, MapPin } from "lucide-react";

import type { InmetAlert } from "@/lib/weather/official-sources.types";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

import "./InmetAlertCoverageDetails.css";

const priority: Record<InmetAlert["severity"], number> = {
  "great-danger": 3,
  danger: 2,
  potential: 1,
  unknown: 0,
};

function formatDateTime(value: string | null) {
  if (!value) return "Não informado pela fonte";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Não informado pela fonte";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function scopeLabel(alert: InmetAlert) {
  if (alert.relevance === "pelotas") return "Pelotas citada diretamente";
  if (alert.relevance === "regional") return "Abrangência regional relevante";
  return "Abrangência estadual relevante";
}

function placeCount(alert: InmetAlert) {
  if (alert.municipalities.length) {
    return alert.municipalities.length === 1
      ? "1 município identificado"
      : `${alert.municipalities.length} municípios identificados`;
  }
  if (alert.areas.length) {
    return alert.areas.length === 1 ? "1 área oficial" : `${alert.areas.length} áreas oficiais`;
  }
  return "Abrangência sem lista detalhada";
}

function sortedAlerts(alerts: InmetAlert[]) {
  return [...alerts].sort((left, right) => {
    if (left.period !== right.period) return left.period === "active" ? -1 : 1;
    const severity = priority[right.severity] - priority[left.severity];
    if (severity) return severity;
    const leftTime = Date.parse(left.startsAt ?? left.sentAt ?? "") || Number.POSITIVE_INFINITY;
    const rightTime = Date.parse(right.startsAt ?? right.sentAt ?? "") || Number.POSITIVE_INFINITY;
    return leftTime - rightTime;
  });
}

export function InmetAlertCoverageDetails({ data }: { data: WeatherIntelligenceData }) {
  const alerts = sortedAlerts(data.weather.alerts);
  if (!alerts.length) return null;

  return (
    <section
      className="inmet-alert-coverage-details"
      id="abrangencia-oficial-alertas"
      aria-labelledby="inmet-alert-coverage-title"
    >
      <header>
        <div>
          <span>
            <MapPin aria-hidden="true" /> Abrangência oficial detalhada
          </span>
          <h2 id="inmet-alert-coverage-title">Veja exatamente o território citado em cada aviso</h2>
        </div>
        <p>
          O INMET pode publicar áreas amplas e listas extensas de municípios. A leitura principal resume
          esse conteúdo; aqui o portal preserva o detalhe territorial recebido do aviso oficial para você
          conferir quando precisar.
        </p>
      </header>

      <div className="inmet-alert-coverage-details__list">
        {alerts.map((alert) => (
          <details key={alert.id} className={`is-${alert.severity}`}>
            <summary>
              <span>{alert.period === "active" ? "Em vigor" : "Programado"}</span>
              <strong>{alert.headline || alert.event}</strong>
              <small>{placeCount(alert)}</small>
            </summary>

            <div className="inmet-alert-coverage-details__body">
              <dl>
                <div>
                  <dt>Publicado</dt>
                  <dd>{formatDateTime(alert.sentAt)}</dd>
                </div>
                <div>
                  <dt>Início</dt>
                  <dd>{formatDateTime(alert.startsAt)}</dd>
                </div>
                <div>
                  <dt>Término</dt>
                  <dd>{formatDateTime(alert.expiresAt)}</dd>
                </div>
                <div>
                  <dt>Escopo no portal</dt>
                  <dd>{scopeLabel(alert)}</dd>
                </div>
              </dl>

              {alert.municipalities.length ? (
                <div className="inmet-alert-coverage-details__places">
                  <h3>Municípios identificados no aviso</h3>
                  <p>{alert.municipalities.join(", ")}</p>
                </div>
              ) : null}

              {alert.areas.length ? (
                <div className="inmet-alert-coverage-details__places">
                  <h3>Descrição oficial da área</h3>
                  <p>{alert.areas.join(" · ")}</p>
                </div>
              ) : null}

              {!alert.municipalities.length && !alert.areas.length ? (
                <div className="inmet-alert-coverage-details__places is-empty">
                  <FileText aria-hidden="true" />
                  <p>A fonte não entregou uma lista territorial detalhada neste aviso.</p>
                </div>
              ) : null}

              <a href={alert.officialUrl} target="_blank" rel="noopener noreferrer">
                Conferir aviso no INMET <ExternalLink aria-hidden="true" />
              </a>
            </div>
          </details>
        ))}
      </div>

      <footer>
        <Clock3 aria-hidden="true" />
        <span>
          A lista representa o conteúdo recebido do aviso do INMET e pode mudar quando o órgão atualiza,
          amplia ou encerra a publicação.
        </span>
      </footer>
    </section>
  );
}
