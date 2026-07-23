import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ExternalLink,
  Minus,
  Waves,
} from "lucide-react";

import type { GuaibaObservationData } from "@/lib/hydrology/guaiba.server";
import type {
  LagoonMonitoringNetworkData,
  LagoonMonitoringObservation,
} from "@/lib/hydrology/lagoon-network.server";

import "./RegionalWaterNetwork.css";

type RegionalWaterNetworkProps = {
  guaiba: GuaibaObservationData;
  lagoon: LagoonMonitoringNetworkData;
  variant?: "home" | "full";
};

function formatNumber(value: number | null, maximumFractionDigits = 1) {
  if (value === null) return "—";

  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

function formatDateTime(value: string | null) {
  if (!value) return "Horário indisponível";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Horário indisponível";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function trendState(value: number | null) {
  if (value === null) {
    return { label: "Sem tendência", className: "is-unknown", icon: Minus };
  }

  if (Math.abs(value) < 0.1) {
    return { label: "Estável", className: "is-stable", icon: Minus };
  }

  if (value > 0) {
    return {
      label: `Subindo ${formatNumber(value)} cm/h`,
      className: "is-rising",
      icon: ArrowUp,
    };
  }

  return {
    label: `Baixando ${formatNumber(Math.abs(value))} cm/h`,
    className: "is-falling",
    icon: ArrowDown,
  };
}

function stationStatus(observation: LagoonMonitoringObservation) {
  if (observation.status === "unavailable") {
    return { label: "Indisponível", className: "is-unavailable" };
  }
  if (observation.status === "stale") {
    return { label: "Leitura atrasada", className: "is-stale" };
  }
  if (observation.risk === "flooding") {
    return { label: "Acima da cota local", className: "is-flooding" };
  }
  if (observation.risk === "attention") {
    return { label: "Próximo da cota local", className: "is-attention" };
  }
  return { label: "Abaixo da cota local", className: "is-live" };
}

function distanceLabel(observation: LagoonMonitoringObservation) {
  if (observation.distanceToFloodCm === null) return "Sem comparação com a cota local";
  if (observation.distanceToFloodCm > 0) {
    return `${formatNumber(observation.distanceToFloodCm)} cm abaixo da cota local`;
  }
  if (observation.distanceToFloodCm < 0) {
    return `${formatNumber(Math.abs(observation.distanceToFloodCm))} cm acima da cota local`;
  }
  return "Na cota de inundação local";
}

function GuaibaPanel({ data, full }: { data: GuaibaObservationData; full: boolean }) {
  const available = data.status !== "unavailable" && data.currentLevel !== null;
  const trend = trendState(data.trendCmPerHour);
  const TrendIcon = trend.icon;

  return (
    <article className={`regional-water-guaiba is-${data.status}`}>
      <header>
        <div>
          <span>Uma das entradas da Lagoa dos Patos</span>
          <h3>Nível do Guaíba</h3>
          <p>
            {data.location} · {data.station}
          </p>
        </div>
        <small>
          <i aria-hidden="true" />
          {data.status === "live"
            ? "Atualizado"
            : data.status === "stale"
              ? "Leitura atrasada"
              : "Indisponível"}
        </small>
      </header>

      {available ? (
        <>
          <div className="regional-water-guaiba-reading">
            <div>
              <strong>{formatNumber(data.currentLevel, 2)}</strong>
              <span>m</span>
            </div>
            <div className={`regional-water-trend ${trend.className}`}>
              <TrendIcon aria-hidden="true" />
              <span>{trend.label}</span>
            </div>
          </div>

          <p className="regional-water-updated">Atualizado em {formatDateTime(data.updatedAt)}</p>

          {data.distanceToFloodReference !== null ? (
            <p className="regional-water-reference">
              {data.distanceToFloodReference >= 0
                ? `${formatNumber(data.distanceToFloodReference, 2)} m abaixo da marca de inundação usada em Porto Alegre.`
                : `${formatNumber(Math.abs(data.distanceToFloodReference), 2)} m acima da marca de inundação usada em Porto Alegre.`}
            </p>
          ) : null}

          <dl>
            <div>
              <dt>Variação em 24 horas</dt>
              <dd>{formatNumber(data.variation24hCm)} cm</dd>
            </div>
            <div>
              <dt>Marca de referência</dt>
              <dd>{formatNumber(data.floodReference, 2)} m</dd>
            </div>
            {full ? (
              <>
                <div>
                  <dt>Mínima do período</dt>
                  <dd>{formatNumber(data.periodMinimum, 2)} m</dd>
                </div>
                <div>
                  <dt>Máxima do período</dt>
                  <dd>{formatNumber(data.periodMaximum, 2)} m</dd>
                </div>
              </>
            ) : null}
          </dl>
        </>
      ) : (
        <div className="regional-water-unavailable" role="status">
          <AlertTriangle aria-hidden="true" />
          <div>
            <strong>Nível do Guaíba temporariamente indisponível</strong>
            <p>{data.error}</p>
          </div>
        </div>
      )}

      <footer>
        <a href={data.source.url} target="_blank" rel="noreferrer">
          Acompanhamento completo <ExternalLink aria-hidden="true" />
        </a>
      </footer>
    </article>
  );
}

export function RegionalWaterNetwork({
  guaiba,
  lagoon,
  variant = "home",
}: RegionalWaterNetworkProps) {
  const full = variant === "full";

  return (
    <section
      className={`regional-water-network regional-water-network-${variant}`}
      aria-labelledby={`regional-water-title-${variant}`}
    >
      <header className="regional-water-heading">
        <div>
          <span>Contexto regional das águas</span>
          <h2 id={`regional-water-title-${variant}`}>Do Guaíba à Lagoa dos Patos</h2>
        </div>
        <p>
          Acompanhe pontos entre o norte e o sul da lagoa. Cada régua possui referência própria e
          não deve ser comparada diretamente com outra estação.
        </p>
      </header>

      <div className="regional-water-layout">
        <GuaibaPanel data={guaiba} full={full} />

        <div className={`regional-water-lagoon is-${lagoon.status}`}>
          <div className="regional-water-lagoon-heading">
            <div>
              <span>FURG & Portos RS</span>
              <h3>Rede da Lagoa dos Patos</h3>
              <p>
                {lagoon.available}/{lagoon.total} estações com leitura nesta consulta
              </p>
            </div>
            <Waves aria-hidden="true" />
          </div>

          <div className="regional-water-stations">
            {lagoon.observations.map((observation) => {
              const available = observation.currentLevelCm !== null;
              const status = stationStatus(observation);
              const trend = trendState(observation.trendCmPerHour);
              const TrendIcon = trend.icon;
              const progress = Math.max(
                0,
                Math.min(observation.floodThresholdPercentage ?? 0, 100),
              );

              return (
                <article
                  className={`regional-water-station ${status.className}`}
                  key={observation.station.id}
                >
                  <header>
                    <div>
                      <small>{observation.station.city}</small>
                      <h4>{observation.station.name}</h4>
                    </div>
                    <span>{status.label}</span>
                  </header>

                  {available ? (
                    <>
                      <div className="regional-water-station-reading">
                        <strong>{formatNumber(observation.currentLevelCm)}</strong>
                        <span>cm</span>
                      </div>
                      <div className={`regional-water-trend ${trend.className}`}>
                        <TrendIcon aria-hidden="true" />
                        <span>{trend.label}</span>
                      </div>
                      <p>{distanceLabel(observation)}</p>
                      <div
                        className="regional-water-progress"
                        aria-label={`${formatNumber(observation.floodThresholdPercentage)}% da cota local`}
                      >
                        <span style={{ width: `${progress}%` }} />
                      </div>
                      <dl>
                        <div>
                          <dt>Cota local</dt>
                          <dd>{formatNumber(observation.floodLevelCm)} cm</dd>
                        </div>
                        <div>
                          <dt>Variação 24h</dt>
                          <dd>{formatNumber(observation.change24hCm)} cm</dd>
                        </div>
                        {full ? (
                          <div>
                            <dt>Máxima mai/2024</dt>
                            <dd>{formatNumber(observation.may2024MaximumCm)} cm</dd>
                          </div>
                        ) : null}
                      </dl>
                      {full ? (
                        <p className="regional-water-role">{observation.station.role}</p>
                      ) : null}
                    </>
                  ) : (
                    <div className="regional-water-unavailable" role="status">
                      <Activity aria-hidden="true" />
                      <div>
                        <strong>Leitura indisponível</strong>
                        <p>{observation.error}</p>
                      </div>
                    </div>
                  )}

                  <footer>
                    <small>{formatDateTime(observation.updatedAt)}</small>
                  </footer>
                </article>
              );
            })}
          </div>

          <footer className="regional-water-lagoon-footer">
            <span>Última atualização regional: {formatDateTime(lagoon.latestUpdatedAt)}</span>
            <a href={lagoon.source.url} target="_blank" rel="noreferrer">
              Abrir rede original <ExternalLink aria-hidden="true" />
            </a>
          </footer>
        </div>
      </div>

      <div className="regional-water-note">
        <AlertTriangle aria-hidden="true" />
        <p>
          O Guaíba ajuda a compreender o cenário regional, mas não determina sozinho o nível em
          Pelotas. Vento, chuva, Canal São Gonçalo e a saída oceânica também influenciam a Lagoa dos
          Patos. Confirme situações de risco com a Defesa Civil e órgãos oficiais.
        </p>
      </div>

      {variant === "home" ? (
        <div className="regional-water-action">
          <Link to="/situacao-hidrologica-pelotas">
            Ver situação completa das águas <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      ) : null}
    </section>
  );
}
