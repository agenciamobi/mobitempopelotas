import Link from "@/production/compat/NextLink";
import type { GuaibaObservationData } from "@/production/lib/guaiba-monitor";
import type {
  LagoonMonitoringNetworkData,
  LagoonMonitoringObservation,
} from "@/production/lib/lagoon-monitoring-network";
import type { LaranjalLevelData } from "@/production/lib/laranjal-level";

import "./home-water-editorial.css";

// A Home privilegia a leitura local de Pelotas. Rio Grande e São José do Norte
// ficam junto do Laranjal como referências do trecho sul/estuário; as demais
// estações ajudam a explicar o contexto regional que chega até a Lagoa.
const HOME_LOCAL_ESTUARY_STATION_PRIORITY = ["furg-ccmar", "sao-jose-do-norte"] as const;
const HOME_REGIONAL_STATION_PRIORITY = ["itapua", "arambare", "sao-lourenco-do-sul"] as const;

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
  if (value === null) {
    return { symbol: "·", label: "Tendência indisponível", direction: "unknown" };
  }
  if (Math.abs(value) < 0.1) {
    return { symbol: "→", label: "Praticamente estável", direction: "stable" };
  }
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
  if (status === "live") return { state: "live", accessibleLabel: "atualizada" };
  if (status === "stale") return { state: "stale", accessibleLabel: "atrasada" };
  return { state: "unavailable", accessibleLabel: "indisponível" };
}

function stationState(observation: LagoonMonitoringObservation) {
  if (observation.status === "unavailable") return "Sem dados";
  if (observation.status === "stale") return "Dados atrasados";
  if (observation.risk === "flooding") return "Acima da cota local";
  if (observation.risk === "attention") return "Próximo da cota local";
  return "Abaixo da cota local";
}

type GuaibaReference = NonNullable<GuaibaObservationData["references"]>[number];

function guaibaReferenceState(reference: GuaibaReference) {
  if (reference.status === "unavailable" || reference.currentLevel === null) return "Sem dados";
  if (reference.status === "stale") return "Dados atrasados";
  if (reference.currentLevel >= reference.floodReference) return "Acima da cota local";
  if (reference.currentLevel >= reference.floodReference * 0.85) return "Próximo da cota local";
  return "Abaixo da cota local";
}

function guaibaReferenceTitle(reference: GuaibaReference) {
  if (reference.id === "cais-maua") return "Porto Alegre / RS — Cais Mauá";
  if (reference.id === "gasometro") return "Porto Alegre / RS — Usina do Gasômetro";
  return reference.label;
}

function guaibaReferences(guaiba: GuaibaObservationData): GuaibaReference[] {
  if (guaiba.references?.length) {
    const rank = new Map<GuaibaReference["id"], number>([
      ["gasometro", 0],
      ["cais-maua", 1],
    ]);
    return [...guaiba.references].sort(
      (first, second) => (rank.get(first.id) ?? 99) - (rank.get(second.id) ?? 99),
    );
  }

  return [
    {
      id: guaiba.station.toLowerCase().includes("cais") ? "cais-maua" : "gasometro",
      label: "Nível do Guaíba",
      status: guaiba.status,
      currentLevel: guaiba.currentLevel,
      updatedAt: guaiba.updatedAt,
      ageMinutes: guaiba.ageMinutes,
      trendCmPerHour: guaiba.trendCmPerHour,
      variation24hCm: guaiba.variation24hCm,
      floodReference: guaiba.floodReference,
      station: guaiba.station,
      location: guaiba.location,
      source: {
        name: guaiba.source.name,
        url: guaiba.source.url,
        originalInstitutions: guaiba.source.originalInstitutions,
      },
      error: guaiba.error,
    },
  ];
}

function orderStations(
  observations: LagoonMonitoringObservation[],
  priority: readonly string[],
) {
  const rank = new Map(priority.map((stationId, index) => [stationId, index] as const));
  return [...observations].sort(
    (first, second) =>
      (rank.get(first.station.id) ?? 99) - (rank.get(second.station.id) ?? 99),
  );
}

function LagoonStationRow({ station }: { station: LagoonMonitoringObservation }) {
  const trend = trendLabel(station.trendCmPerHour);

  return (
    <article
      className={`tp-home-water__station is-risk-${station.risk} is-trend-${trend.direction}`}
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
        <span className={`tp-home-water__trend-mark is-${trend.direction}`} aria-hidden="true">
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
}

function GuaibaReferenceRow({ reference }: { reference: GuaibaReference }) {
  const trend = trendLabel(reference.trendCmPerHour);
  const isCaisMaua = reference.id === "cais-maua";

  return (
    <article
      className={`tp-home-water__station tp-home-water__guaiba-reference is-trend-${trend.direction}`}
      key={`guaiba-${reference.id}`}
    >
      <div className="tp-home-water__station-place">
        <strong>{guaibaReferenceTitle(reference)}</strong>
        <span>{reference.station}</span>
        <small>
          {isCaisMaua
            ? "Régua no Centro Histórico de Porto Alegre, com referência própria de nível."
            : "Régua de Porto Alegre usada para acompanhar a entrada de água no sistema Guaíba–Lagoa."}
        </small>
      </div>
      <div className="tp-home-water__station-level">
        <span>Nível</span>
        <b>
          {reference.currentLevel === null
            ? "Sem leitura"
            : `${formatNumber(reference.currentLevel, 2)} m`}
        </b>
      </div>
      <div className="tp-home-water__station-state-wrap">
        <span className={`tp-home-water__trend-mark is-${trend.direction}`} aria-hidden="true">
          {trend.symbol}
        </span>
        <div className="tp-home-water__station-state">
          <strong>{guaibaReferenceState(reference)}</strong>
          <span className={`is-${trend.direction}`}>{trend.label}</span>
          <small>{formatUpdatedAt(reference.updatedAt)}</small>
        </div>
      </div>
    </article>
  );
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
  const localStationIds = new Set<string>(HOME_LOCAL_ESTUARY_STATION_PRIORITY);
  const localEstuaryStations = orderStations(
    lagoon.observations.filter((observation) => localStationIds.has(observation.station.id)),
    HOME_LOCAL_ESTUARY_STATION_PRIORITY,
  );
  const regionalStations = orderStations(
    lagoon.observations.filter((observation) => !localStationIds.has(observation.station.id)),
    HOME_REGIONAL_STATION_PRIORITY,
  );
  const guaibaRows = guaibaReferences(guaiba);
  const laranjalTrend = trendLabel(laranjal.trendCmPerHour);
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
            Para Pelotas, a leitura do Laranjal é a referência principal. As demais réguas ajudam a
            acompanhar como o Guaíba e diferentes pontos da Lagoa dos Patos estão se comportando.
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

          <div className={`tp-home-water__level-card is-${laranjalTrend.direction}`}>
            <div className="tp-home-water__level" aria-label="Nível atual da Lagoa no Laranjal">
              <strong>
                {laranjalAvailable ? formatNumber(laranjal.currentLevel, 2) : "Sem leitura"}
              </strong>
              {laranjalAvailable ? <span>m</span> : null}
            </div>
            <p className="tp-home-water__trend">
              <b aria-hidden="true">{laranjalTrend.symbol}</b>
              <span>{laranjalTrend.label}</span>
            </p>
          </div>

          <dl className="tp-home-water__focus-metrics">
            <div>
              <dt>Mudança em 6 h</dt>
              <dd>{formatSignedCentimeters(laranjal.change6hCm)}</dd>
            </div>
            <div>
              <dt>Mudança em 24 h</dt>
              <dd>{formatSignedCentimeters(laranjal.change24hCm)}</dd>
            </div>
            <div
              className={`tp-home-water__reading is-${laranjalReading.state}`}
              aria-label={`Última leitura ${laranjalReading.accessibleLabel}`}
            >
              <dt>Última leitura</dt>
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

          <section className="tp-home-water__local-network" aria-labelledby="tp-home-water-estuary-title">
            <div className="tp-home-water__local-network-heading">
              <span>Trecho sul e estuário</span>
              <strong id="tp-home-water-estuary-title">Rio Grande e São José do Norte</strong>
            </div>
            <p>
              Referências próximas ao canal de saída da Lagoa dos Patos para o oceano, mantendo
              réguas e cotas próprias.
            </p>
            <div className="tp-home-water__rows tp-home-water__local-rows">
              {localEstuaryStations.map((station) => (
                <LagoonStationRow station={station} key={station.station.id} />
              ))}
            </div>
          </section>
        </article>

        <div className="tp-home-water__network">
          <div className="tp-home-water__network-heading">
            <div>
              <span>Referências regionais</span>
              <strong>Pontos para acompanhar a Lagoa dos Patos</strong>
            </div>
          </div>

          <p className="tp-home-water__network-note">
            As réguas possuem referências próprias. Use a tendência e a situação de cada ponto para
            entender o movimento da água; os níveis absolutos não devem ser comparados diretamente.
          </p>

          <div className="tp-home-water__rows">
            {guaibaRows.map((reference) => (
              <GuaibaReferenceRow reference={reference} key={`guaiba-${reference.id}`} />
            ))}
            {regionalStations.map((station) => (
              <LagoonStationRow station={station} key={station.station.id} />
            ))}
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
            Rede da Lagoa: {lagoon.source.name} · {lagoon.source.organizations}. Réguas do Guaíba
            mantêm suas próprias fontes e referências.
          </small>
        </div>
        <Link href="/situacao-hidrologica-pelotas">
          Ver situação completa das águas <span aria-hidden="true">→</span>
        </Link>
      </footer>
    </section>
  );
}
