import type {
  LagoonMonitoringNetworkData,
  LagoonMonitoringObservation,
} from "@/lib/lagoon-monitoring-network";

const CHART_WIDTH = 240;
const CHART_HEIGHT = 54;
const CHART_PADDING = 3;

function formatLevel(value: number | null) {
  if (value === null) return "—";

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  }).format(value);
}

function formatSigned(value: number | null) {
  if (value === null) return "—";

  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: Math.abs(value) % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
    signDisplay: "exceptZero",
  }).format(value);
}

function formatUpdatedAt(value: string | null) {
  if (!value) return "Horário indisponível";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getRiskLabel(observation: LagoonMonitoringObservation) {
  if (observation.status === "unavailable") return "Indisponível";
  if (observation.status === "stale") return "Leitura atrasada";
  if (observation.risk === "flooding") return "Acima da cota";
  if (observation.risk === "attention") return "Próximo da cota";
  return "Abaixo da cota";
}

function getDistanceLabel(observation: LagoonMonitoringObservation) {
  const distance = observation.distanceToFloodCm;
  if (distance === null) return "Sem comparação disponível";

  if (distance > 0) {
    return `${formatLevel(distance)} cm abaixo da cota local`;
  }

  if (distance < 0) {
    return `${formatLevel(Math.abs(distance))} cm acima da cota local`;
  }

  return "Na cota de inundação local";
}

function getTrend(observation: LagoonMonitoringObservation) {
  const rate = observation.trendCmPerHour;

  if (rate === null) {
    return {
      direction: "unavailable" as const,
      symbol: "·",
      label: "Sem tendência",
      detail: "série insuficiente",
    };
  }

  if (Math.abs(rate) < 0.1) {
    return {
      direction: "stable" as const,
      symbol: "→",
      label: "Estável",
      detail: "sem mudança relevante",
    };
  }

  if (rate > 0) {
    return {
      direction: "rising" as const,
      symbol: "↑",
      label: "Subindo",
      detail: `${formatSigned(rate)} cm/h`,
    };
  }

  return {
    direction: "falling" as const,
    symbol: "↓",
    label: "Baixando",
    detail: `${formatSigned(Math.abs(rate))} cm/h`,
  };
}

function buildChart(observation: LagoonMonitoringObservation) {
  if (observation.series.length < 2) return null;

  const points = observation.series.slice(-96);
  const levels = points.map((point) => point.levelCm);
  const minimum = Math.min(...levels);
  const maximum = Math.max(...levels);
  const range = Math.max(maximum - minimum, 1);
  const innerWidth = CHART_WIDTH - CHART_PADDING * 2;
  const innerHeight = CHART_HEIGHT - CHART_PADDING * 2;

  const coordinates = points.map((point, index) => ({
    x: CHART_PADDING + (index / (points.length - 1)) * innerWidth,
    y:
      CHART_PADDING +
      ((maximum - point.levelCm) / range) * innerHeight,
  }));

  const line = coordinates
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`,
    )
    .join(" ");
  const first = coordinates[0];
  const last = coordinates.at(-1)!;

  return {
    line,
    area: `${line} L${last.x.toFixed(1)},${CHART_HEIGHT} L${first.x.toFixed(1)},${CHART_HEIGHT} Z`,
    minimum,
    maximum,
  };
}

export function LagoonMonitoringNetwork({
  data,
  variant = "full",
}: {
  data: LagoonMonitoringNetworkData;
  variant?: "home" | "full";
}) {
  const compact = variant === "home";

  return (
    <section
      className={`lagoon-monitoring-network lagoon-monitoring-network--${variant} is-${data.status}`}
      aria-labelledby={`lagoon-monitoring-title-${variant}`}
    >
      <div className="lagoon-monitoring-heading">
        <div>
          <span className="eyebrow">FURG & Portos RS</span>
          <h3 id={`lagoon-monitoring-title-${variant}`}>
            {compact ? "Níveis ao longo da Lagoa dos Patos" : "Rede de Monitoramento da Lagoa dos Patos"}
          </h3>
          <p>
            {compact
              ? "Compare as leituras mais recentes de cinco pontos monitorados entre o norte e o sul da lagoa."
              : "Leituras diretas da API pública dos linígrafos, com série recente, tendência e comparação com a cota de inundação de cada local."}
          </p>
        </div>
        <a href={data.source.url} target="_blank" rel="noreferrer">
          Abrir fonte
          <span aria-hidden="true">↗</span>
        </a>
      </div>

      <div className="lagoon-monitoring-summary" role="status">
        <span className="lagoon-monitoring-summary-dot" aria-hidden="true" />
        <strong>
          {data.available}/{data.total} estações com leitura
        </strong>
        <small>
          {data.latestUpdatedAt
            ? `Leitura mais recente: ${formatUpdatedAt(data.latestUpdatedAt)}`
            : "As leituras estão temporariamente indisponíveis"}
        </small>
      </div>

      <div className="lagoon-monitoring-grid">
        {data.observations.map((observation) => {
          const available = observation.currentLevelCm !== null;
          const progress = Math.max(
            0,
            Math.min(observation.floodThresholdPercentage ?? 0, 100),
          );
          const trend = getTrend(observation);
          const chart = compact ? null : buildChart(observation);

          return (
            <article
              className={`lagoon-monitoring-card is-${observation.status} risk-${observation.risk}`}
              key={observation.station.id}
            >
              <div className="lagoon-monitoring-card-head">
                <div>
                  <small>
                    {observation.station.city} · {observation.station.sensorId}
                  </small>
                  <h4>{observation.station.name}</h4>
                </div>
                <span>{getRiskLabel(observation)}</span>
              </div>

              {available ? (
                <>
                  <div className="lagoon-monitoring-reading-row">
                    <div className="lagoon-monitoring-reading">
                      <strong>{formatLevel(observation.currentLevelCm)}</strong>
                      <span>cm</span>
                    </div>
                    <div
                      className={`lagoon-monitoring-trend is-${trend.direction}`}
                      aria-label={`${trend.label}: ${trend.detail}`}
                    >
                      <b aria-hidden="true">{trend.symbol}</b>
                      <span>
                        <strong>{trend.label}</strong>
                        <small>{trend.detail}</small>
                      </span>
                    </div>
                  </div>

                  <p className="lagoon-monitoring-distance">
                    {getDistanceLabel(observation)}
                  </p>
                  <div
                    className="lagoon-monitoring-progress"
                    aria-label={`${formatLevel(observation.floodThresholdPercentage)}% da cota de inundação local`}
                  >
                    <span style={{ width: `${progress}%` }} />
                  </div>

                  {chart ? (
                    <div
                      className="lagoon-monitoring-chart"
                      aria-label={`Variação recente do nível em ${observation.station.name}`}
                    >
                      <div>
                        <span>{formatLevel(chart.maximum)} cm</span>
                        <span>{formatLevel(chart.minimum)} cm</span>
                      </div>
                      <svg
                        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                        role="img"
                        aria-hidden="true"
                      >
                        <path
                          className="lagoon-monitoring-chart-area"
                          d={chart.area}
                        />
                        <path
                          className="lagoon-monitoring-chart-line"
                          d={chart.line}
                        />
                      </svg>
                      <small>Últimas leituras disponíveis</small>
                    </div>
                  ) : null}

                  <dl className={`lagoon-monitoring-metrics${compact ? " is-compact" : ""}`}>
                    <div>
                      <dt>Cota local</dt>
                      <dd>{formatLevel(observation.floodLevelCm)} cm</dd>
                    </div>
                    <div>
                      <dt>Variação 24h</dt>
                      <dd>{formatSigned(observation.change24hCm)} cm</dd>
                    </div>
                    {!compact ? (
                      <div>
                        <dt>Máx. mai/2024</dt>
                        <dd>{formatLevel(observation.may2024MaximumCm)} cm</dd>
                      </div>
                    ) : null}
                  </dl>
                </>
              ) : (
                <div className="lagoon-monitoring-unavailable">
                  <strong>Leitura indisponível</strong>
                  <p>{observation.error}</p>
                </div>
              )}

              {!compact ? (
                <p className="lagoon-monitoring-role">
                  {observation.station.role}
                </p>
              ) : null}
              <footer>
                <small>
                  {observation.updatedAt
                    ? `Atualizado em ${formatUpdatedAt(observation.updatedAt)}`
                    : "Aguardando atualização da fonte"}
                </small>
                <a
                  href={data.source.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Abrir fonte de ${observation.station.name}`}
                >
                  ↗
                </a>
              </footer>
            </article>
          );
        })}
      </div>

      {!compact ? (
        <div className="lagoon-monitoring-note">
          <strong>Como interpretar</strong>
          <p>
            A tendência e a variação são calculadas a partir da série pública de
            cinco dias. Cada município possui sua própria cota de inundação:
            compare cada leitura somente com a cota exibida no mesmo card. Estes
            dados não substituem avisos da Defesa Civil.
          </p>
        </div>
      ) : null}
    </section>
  );
}
