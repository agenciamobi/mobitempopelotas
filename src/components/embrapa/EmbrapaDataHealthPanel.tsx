import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  Gauge,
  History,
  RadioTower,
  ShieldCheck,
} from "lucide-react";

import type {
  EmbrapaHealthLevel,
  EmbrapaHealthSnapshot,
} from "@/lib/weather/embrapa-health.server";

import "./EmbrapaDataHealthPanel.css";

const levelCopy: Record<EmbrapaHealthLevel, { label: string; title: string; description: string }> =
  {
    normal: {
      label: "Operação normal",
      title: "Centralizador funcionando normalmente",
      description:
        "O coletor está ativo, a leitura central é recente e não existem incidentes operacionais abertos.",
    },
    degraded: {
      label: "Atenção",
      title: "Dados disponíveis com degradação",
      description:
        "O portal ainda possui dados, mas detectou atraso, falhas repetidas, resposta lenta ou leitura incompleta.",
    },
    critical: {
      label: "Incidente crítico",
      title: "A centralização precisa de atenção",
      description:
        "A última coleta está muito atrasada ou o coletor acumulou falhas que comprometem a atualização em tempo real.",
    },
    unavailable: {
      label: "Sem diagnóstico",
      title: "Saúde operacional indisponível",
      description:
        "O ambiente ainda não conseguiu consultar o registro central de monitoramento da estação.",
    },
  };

function formatDateTime(value: string | null) {
  if (!value) return "Não registrado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Não registrado";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function formatAge(value: number | null) {
  if (value === null) return "Sem registro";
  if (value < 1) return "Há menos de 1 min";
  if (value < 60) return `Há ${Math.round(value)} min`;
  const hours = Math.floor(value / 60);
  const minutes = Math.round(value % 60);
  return minutes ? `Há ${hours} h ${minutes} min` : `Há ${hours} h`;
}

function formatDuration(value: number | null) {
  if (value === null) return "Aguardando medição";
  if (value < 1_000) return `${Math.round(value)} ms`;
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value / 1_000)} s`;
}

function formatInteger(value: number) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value);
}

function StatusIcon({ level }: { level: EmbrapaHealthLevel }) {
  if (level === "normal") return <CheckCircle2 aria-hidden="true" />;
  if (level === "unavailable") return <RadioTower aria-hidden="true" />;
  return <AlertTriangle aria-hidden="true" />;
}

function availabilityCount(snapshot: EmbrapaHealthSnapshot) {
  return [
    snapshot.data.temperatureAvailable,
    snapshot.data.humidityAvailable,
    snapshot.data.pressureAvailable,
    snapshot.data.windAvailable,
    snapshot.data.rainAvailable,
  ].filter(Boolean).length;
}

export function EmbrapaDataHealthPanel({ snapshot }: { snapshot: EmbrapaHealthSnapshot }) {
  const copy = levelCopy[snapshot.level];
  const availableFields = availabilityCount(snapshot);
  const collectorCurrent =
    snapshot.collector.enabled &&
    snapshot.collector.attemptAgeMinutes !== null &&
    snapshot.collector.attemptAgeMinutes <= 5;

  return (
    <section
      className={`embrapa-health is-${snapshot.level}`}
      id="saude-dos-dados"
      aria-labelledby="embrapa-health-title"
    >
      <header className="embrapa-health__header">
        <div>
          <span className="embrapa-health__eyebrow">Saúde dos dados</span>
          <h2 id="embrapa-health-title">{copy.title}</h2>
          <p>{copy.description}</p>
        </div>
        <span className="embrapa-health__status" role="status">
          <StatusIcon level={snapshot.level} />
          {copy.label}
        </span>
      </header>

      <div className="embrapa-health__metrics" aria-label="Indicadores operacionais">
        <article>
          <Clock3 aria-hidden="true" />
          <span>Último sucesso</span>
          <strong>{formatAge(snapshot.collector.successAgeMinutes)}</strong>
          <small>{formatDateTime(snapshot.collector.lastSuccessAt)}</small>
        </article>
        <article>
          <Gauge aria-hidden="true" />
          <span>Duração da coleta</span>
          <strong>{formatDuration(snapshot.collector.lastDurationMs)}</strong>
          <small>Tempo da última tentativa concluída</small>
        </article>
        <article>
          <History aria-hidden="true" />
          <span>Registros em 24 horas</span>
          <strong>{formatInteger(snapshot.history.last24Hours)}</strong>
          <small>{formatInteger(snapshot.history.total)} no histórico central</small>
        </article>
        <article>
          <Activity aria-hidden="true" />
          <span>Falhas consecutivas</span>
          <strong>{formatInteger(snapshot.collector.consecutiveFailures)}</strong>
          <small>
            {formatInteger(snapshot.collector.successfulCollects)} sucessos ·{" "}
            {formatInteger(snapshot.collector.failedCollects)} falhas
          </small>
        </article>
      </div>

      <div className="embrapa-health__pipeline" aria-label="Etapas do fluxo de dados">
        <article className={collectorCurrent ? "is-ok" : "is-warning"}>
          <RadioTower aria-hidden="true" />
          <div>
            <span>Agendador</span>
            <strong>
              {collectorCurrent ? "Executando a cada minuto" : "Sem execução recente"}
            </strong>
            <small>Última tentativa: {formatDateTime(snapshot.collector.lastAttemptAt)}</small>
          </div>
        </article>
        <article className={snapshot.collector.lastOutcome === "failure" ? "is-warning" : "is-ok"}>
          <ShieldCheck aria-hidden="true" />
          <div>
            <span>Coleta e validação</span>
            <strong>
              {snapshot.collector.lastOutcome === "failure"
                ? "Última tentativa falhou"
                : "Última leitura validada"}
            </strong>
            <small>Valores normalizados antes de chegar ao portal</small>
          </div>
        </article>
        <article className={availableFields >= 4 ? "is-ok" : "is-warning"}>
          <Database aria-hidden="true" />
          <div>
            <span>Campos essenciais</span>
            <strong>{availableFields} de 5 grupos disponíveis</strong>
            <small>Temperatura, umidade, pressão, vento e chuva</small>
          </div>
        </article>
        <article className={snapshot.history.total > 0 ? "is-ok" : "is-warning"}>
          <History aria-hidden="true" />
          <div>
            <span>Persistência</span>
            <strong>
              {snapshot.history.total > 0
                ? "Histórico sendo preservado"
                : "Sem histórico disponível"}
            </strong>
            <small>Gravação deduplicada por mudança dos dados</small>
          </div>
        </article>
      </div>

      <div className="embrapa-health__alerts">
        <div className="embrapa-health__alerts-heading">
          <div>
            <span className="embrapa-health__eyebrow">Incidentes automáticos</span>
            <h3>
              {snapshot.alerts.openCount
                ? "Ocorrências que exigem atenção"
                : "Nenhum incidente aberto"}
            </h3>
          </div>
          <span>
            {snapshot.alerts.openCount} aberto{snapshot.alerts.openCount === 1 ? "" : "s"}
          </span>
        </div>

        {snapshot.alerts.items.length ? (
          <div className="embrapa-health__alert-list">
            {snapshot.alerts.items.map((alert) => (
              <article className={`is-${alert.severity}`} key={alert.code}>
                <AlertTriangle aria-hidden="true" />
                <div>
                  <strong>{alert.title}</strong>
                  <p>{alert.message}</p>
                  <small>Detectado novamente em {formatDateTime(alert.lastDetectedAt)}</small>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="embrapa-health__clear">
            <CheckCircle2 aria-hidden="true" />
            <div>
              <strong>Coleta dentro dos parâmetros esperados</strong>
              <p>
                Falhas, atrasos, lentidão e campos ausentes são verificados automaticamente a cada
                execução.
              </p>
            </div>
          </div>
        )}
      </div>

      <footer>
        <span>Diagnóstico gerado em {formatDateTime(snapshot.generatedAt)}</span>
        <small>O painel apresenta somente informações operacionais não sensíveis.</small>
      </footer>
    </section>
  );
}
