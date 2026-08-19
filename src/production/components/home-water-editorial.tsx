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
          <h2 id="tp-home-water-title">Situação das águas no Laranjal e na Lagoa</h2>
        </div>
        <p>
          O Laranjal é a referência local para Pelotas. Outros pontos ajudam a entender como o nível
          varia ao longo da Lagoa dos Patos.
        </p>
      </header>

      <div className="tp-home-water__layout">
        <article className={`tp-home-water__focus is-${laranjalTrend.direction}`}>
          <div className="tp-home-water__focus-topline">
            <div>
              <span>Praia do Laranjal</span>
              <small>{laranjal.source.station}</small>
            </div>
            <b>
              {laranjal.status === "live"
                ? "Dados atualizados"
                : laranjal.status === "stale"
                  ? "Dados atrasados"
                  : "Sem dados"}
            </b>
          </div>

          <div className="tp-home-water__level">
            <strong>{laranjalAvailable ? formatNumber(laranjal.currentLevel, 2) : "Sem leitura"}</strong>
            {laranjalAvailable ? <span>m</span> : null}
          </div>

          <p className={`tp-home-water__trend is-${laranjalTrend.direction}`}>
            <b aria-hidden="true">{laranjalTrend.symbol}</b>
            {laranjalTrend.label}
          </p>

          <dl className="tp-home-water__focus-metrics">
            <div>
              <dt>6 horas</dt>
              <dd>
                {laranjal.change6hCm === null ? "Indisponível" : `${formatNumber(laranjal.change6hCm)} cm`}
              </dd>
            </div>
            <div>
              <dt>24 horas</dt>
              <dd>
                {laranjal.change24hCm === null ? "Indisponível" : `${formatNumber(laranjal.change24hCm)} cm`}
              </dd>
            </div>
            <div>
              <dt>Última leitura</dt>
              <dd>{formatUpdatedAt(laranjal.updatedAt)}</dd>
            </div>
          </dl>

          <Link href="/nivel-da-lagoa-dos-patos-laranjal">
            Ver nível e histórico do Laranjal <span aria-hidden="true">→</span>
          </Link>
        </article>

        <div className="tp-home-water__network">
          <div className="tp-home-water__network-heading">
            <div>
              <span>Rede regional</span>
              <strong>Outros pontos da Lagoa dos Patos</strong>
            </div>
            <small>
              {lagoon.available} de {lagoon.total} locais com dados
            </small>
          </div>

          <div className="tp-home-water__columns" aria-hidden="true">
            <span>Local</span>
            <span>Nível</span>
            <span>Tendência</span>
            <span>Situação</span>
          </div>

          <div className="tp-home-water__rows">
            {stations.map((station) => {
              const trend = trendLabel(station.trendCmPerHour);
              return (
                <article key={station.station.id}>
                  <div>
                    <strong>{station.station.city}</strong>
                    <span>{station.station.name}</span>
                  </div>
                  <b>
                    {station.currentLevelCm === null
                      ? "Sem leitura"
                      : `${formatNumber(station.currentLevelCm)} cm`}
                  </b>
                  <span className={`is-${trend.direction}`}>
                    {trend.symbol} {trend.label}
                  </span>
                  <small>{stationState(station)}</small>
                </article>
              );
            })}
          </div>

          <div className="tp-home-water__guaiba">
            <div>
              <span>{guaiba.station}</span>
              <strong>Referência do Guaíba</strong>
            </div>
            <b>{guaiba.currentLevel === null ? "Sem leitura" : `${formatNumber(guaiba.currentLevel, 2)} m`}</b>
            <span className={`is-${guaibaTrend.direction}`}>
              {guaibaTrend.symbol} {guaibaTrend.label}
            </span>
            <small>{formatUpdatedAt(guaiba.updatedAt)}</small>
          </div>
        </div>
      </div>

      <footer className="tp-home-water__footer">
        <div className="tp-home-water__legend" aria-label="Legenda de tendência">
          <span className="is-falling">↓ Baixando</span>
          <span className="is-rising">↑ Subindo</span>
          <span className="is-stable">→ Estável</span>
        </div>
        <Link href="/situacao-hidrologica-pelotas">
          Ver situação completa das águas <span aria-hidden="true">→</span>
        </Link>
      </footer>
    </section>
  );
}
