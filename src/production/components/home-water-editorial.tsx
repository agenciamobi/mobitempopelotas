import Link from "@/production/compat/NextLink";
import type { GuaibaObservationData } from "@/production/lib/guaiba-monitor";
import type {
  LagoonMonitoringNetworkData,
  LagoonMonitoringObservation,
} from "@/production/lib/lagoon-monitoring-network";
import type { LaranjalLevelData } from "@/production/lib/laranjal-level";

import "./home-water-editorial.css";

const HOME_LAGOON_STATION_PRIORITY = ["sao-lourenco-do-sul", "furg-ccmar", "itapua"] as const;

function formatNumber(value: number | null, maximumFractionDigits = 1) {
  if (value === null) return "Indisponível";

  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

function formatSignedCentimeters(value: number | null) {
  if (value === null) return "Indisponível";
  if (Math.abs(value) < 0.05) return "0 cm";
  const signal = value > 0 ? "+" : "−";
  return `${signal}${formatNumber(Math.abs(value))} cm`;
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

function trendLabel(value: number | null) {
  if (value === null) return { symbol: "·", label: "Tendência indisponível", direction: "unknown" };
  if (Math.abs(value) < 0.1) return { symbol: "→", label: "Praticamente estável", direction: "stable" };
  if (value > 0) {
    return {
      symbol: "↑",
      label: `Subindo ${formatNumber(value)} cm por hora`,
      direction: "rising",
    };
  }
  return {
    symbol: "↓",
    label: `Baixando ${formatNumber(Math.abs(value))} cm por hora`,
    direction: "falling",
  };
}

function readingStatus(status: LaranjalLevelData["status"]) {
  if (status === "live") return { label: "Leitura atualizada", state: "live" };
  if (status === "stale") return { label: "Leitura atrasada", state: "stale" };
  return { label: "Sem leitura", state: "unavailable" };
}

function stationState(observation: LagoonMonitoringObservation) {
  if (observation.status === "unavailable") return "Sem dados";
  if (observation.status === "stale") return "Dados atrasados";
  if (observation.risk === "flooding") return "Acima da cota local";
  if (observation.risk === "attention") return "Próximo da cota local";
  return "Abaixo da cota local";
}

function summarizeLagoon(lagoon: LagoonMonitoringNetworkData) {
  const prioritized = HOME_LAGOON_STATION_PRIORITY.flatMap((stationId) =>
    lagoon.observations.filter((observation) => observation.station.id === stationId),
  );
  const prioritizedIds = new Set(prioritized.map((observation) => observation.station.id));
  const fallback = lagoon.observations.filter(
    (observation) => !prioritizedIds.has(observation.station.id),
  );
  return [...prioritized, ...fallback].slice(0, 3);
}

export function HomeWaterEditorial({
  laranjal,
  guaiba,
  lagoon,
}: {
  laranjal: LaranjalLevelData;
  guaiba: GuaibaObservationData;
  lagoon: LagoonMonitoringNetworkData;
}) {
  const stations = summarizeLagoon(lagoon);
  const laranjalTrend = trendLabel(laranjal.trendCmPerHour);
  const guaibaTrend = trendLabel(guaiba.trendCmPerHour);
  const laranjalReading = readingStatus(laranjal.status);
  const laranjalAvailable = laranjal.status !== "unavailable" && laranjal.currentLevel !== null;

  return (
    <section
      className="tp-home-water"
      id="situacao-das-aguas"
      aria-labelledby="tp-home-water-title"
    >
      <header className="tp-home-water__intro">
        <div>
          <span>Lagoa dos Patos · monitoramento local</span>
          <h2 id="tp-home-water-title">Nível da Lagoa no Laranjal e referências regionais</h2>
        </div>
        <div className="tp-home-water__intro-context">
          <p>
            Para Pelotas, a leitura do Laranjal é a referência principal. A rede regional entra como
            contexto para acompanhar o comportamento da Lagoa dos Patos em outros pontos.
          </p>
          <Link href="/situacao-hidrologica-pelotas">
            Abrir monitoramento hidrológico completo <span aria-hidden="true">→</span>
          </Link>
        </div>
      </header>

      <div className="tp-home-water__layout">
        <article className={`tp-home-water__focus is-${laranjalTrend.direction}`}>
          <div className="tp-home-water__focus-topline">
            <div>
              <span>Praia do Laranjal</span>
              <small>Pelotas / RS · {laranjal.source.station}</small>
            </div>
          </div>

          <div
            className={`tp-home-water__level is-${laranjalTrend.direction}`}
            aria-label="Nível atual da Lagoa no Laranjal"
          >
            <strong>{laranjalAvailable ? formatNumber(laranjal.currentLevel, 2) : "Sem leitura"}</strong>
            {laranjalAvailable ? <span>m</span> : null}
          </div>

          <p className={`tp-home-water__trend is-${laranjalTrend.direction}`}>
            <b aria-hidden="true">{laranjalTrend.symbol}</b>
            {laranjalTrend.label}
          </p>

          <dl className="tp-home-water__focus-metrics">
            <div>
              <dt>Mudança em 6 h</dt>
              <dd>{formatSignedCentimeters(laranjal.change6hCm)}</dd>
            </div>
            <div>
              <dt>Mudança em 24 h</dt>
              <dd>{formatSignedCentimeters(laranjal.change24hCm)}</dd>
            </div>
            <div className={`tp-home-water__reading is-${laranjalReading.state}`}>
              <dt>{laranjalReading.label}</dt>
              <dd>{formatUpdatedAt(laranjal.updatedAt)}</dd>
            </div>
          </dl>

          <div className="tp-home-water__focus-source">
            <span>Fonte local</span>
            <strong>{laranjal.source.name}</strong>
          </div>

          <Link href="/nivel-da-lagoa-dos-patos-laranjal">
            Ver nível e histórico do Laranjal <span aria-hidden="true">→</span>
          </Link>
        </article>

        <div className="tp-home-water__network">
          <div className="tp-home-water__network-heading">
            <div>
              <span>Rede regional</span>
              <strong>Três referências para entender a Lagoa</strong>
            </div>
          </div>

          <p className="tp-home-water__network-note">
            Cada estação usa sua própria referência local de medição. Para interpretar a rede,
            priorize tendência e situação do ponto em vez de comparar apenas o valor absoluto.
          </p>

          <div className="tp-home-water__rows">
            {stations.map((station) => {
              const trend = trendLabel(station.trendCmPerHour);
              return (
                <article
                  className={`tp-home-water__station is-risk-${station.risk}`}
                  key={station.station.id}
                >
                  <div className="tp-home-water__station-place">
                    <strong>{station.station.city}</strong>
                    <span>{station.station.name}</span>
                    <small>{station.station.role}</small>
                  </div>
                  <div className="tp-home-water__station-level">
                    <span>Nível</span>
                    <b>
                      {station.currentLevelCm === null
                        ? "Sem leitura"
                        : `${formatNumber(station.currentLevelCm)} cm`}
                    </b>
                  </div>
                  <div className="tp-home-water__station-state-wrap">
                    <span
                      className={`tp-home-water__trend-mark is-${trend.direction}`}
                      aria-hidden="true"
                    >
                      {trend.symbol}
                    </span>
                    <div className="tp-home-water__station-state">
                      <strong>{stationState(station)}</strong>
                      <span className={`is-${trend.direction}`}>{trend.label}</span>
                      <small>{formatUpdatedAt(station.updatedAt)}</small>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="tp-home-water__guaiba">
            <div>
              <span>Contexto ao norte</span>
              <strong>{guaiba.station}</strong>
              <small>{guaiba.source.name}</small>
            </div>
            <div>
              <span>Nível</span>
              <b>{guaiba.currentLevel === null ? "Sem leitura" : `${formatNumber(guaiba.currentLevel, 2)} m`}</b>
            </div>
            <div className="tp-home-water__station-state-wrap">
              <span
                className={`tp-home-water__trend-mark is-${guaibaTrend.direction}`}
                aria-hidden="true"
              >
                {guaibaTrend.symbol}
              </span>
              <div className="tp-home-water__station-state tp-home-water__guaiba-state">
                <strong>Referência do Guaíba</strong>
                <span className={`is-${guaibaTrend.direction}`}>{guaibaTrend.label}</span>
                <small>{formatUpdatedAt(guaiba.updatedAt)}</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="tp-home-water__footer">
        <div>
          <div className="tp-home-water__legend" aria-label="Legenda de tendência">
            <span className="is-falling">↓ Baixando</span>
            <span className="is-rising">↑ Subindo</span>
            <span className="is-stable">→ Estável</span>
          </div>
          <small>
            Rede regional: {lagoon.source.name} · {lagoon.source.organizations}
          </small>
        </div>
        <Link href="/situacao-hidrologica-pelotas">
          Ver situação completa das águas <span aria-hidden="true">→</span>
        </Link>
      </footer>
    </section>
  );
}
