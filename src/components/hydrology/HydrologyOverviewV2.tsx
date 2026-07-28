import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  CloudRain,
  Database,
  ExternalLink,
  Gauge,
  Info,
  MapPinned,
  Navigation,
  RadioTower,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Waves,
  Wind,
} from "lucide-react";

import type { GuaibaObservationData } from "@/lib/hydrology/guaiba.server";
import type { LagoonMonitoringNetworkData } from "@/lib/hydrology/lagoon-network.server";
import type { LaranjalLevelData } from "@/lib/hydrology/laranjal-level.server";
import type { SaceGuaibaData } from "@/lib/hydrology/sace-guaiba.server";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

import { RegionalWaterNetwork } from "./RegionalWaterNetwork";
import { SaceGuaibaContext } from "./SaceGuaibaContext";
import "./HydrologyOverviewV2.css";

type HydrologyOverviewProps = {
  weather: WeatherIntelligenceData;
  level: LaranjalLevelData;
  guaiba: GuaibaObservationData;
  lagoon: LagoonMonitoringNetworkData;
  sace: SaceGuaibaData;
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Horário não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Horário não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function formatNumber(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

function formatSigned(value: number | null | undefined, unit: string, digits = 1) {
  if (value === null || value === undefined) return "—";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${formatNumber(value, digits)} ${unit}`;
}

function ageLabel(value: number | null) {
  if (value === null) return "Idade não determinada";
  if (value < 1) return "Menos de 1 minuto";
  if (value < 60) return `${Math.round(value)} min`;
  const hours = Math.floor(value / 60);
  const minutes = Math.round(value % 60);
  return minutes ? `${hours} h ${minutes} min` : `${hours} h`;
}

function trendState(value: number | null) {
  if (value === null) {
    return { label: "Tendência indisponível", className: "is-unknown", icon: Activity };
  }
  if (value > 0.25) {
    return { label: `Subindo ${formatNumber(value)} cm/h`, className: "is-rising", icon: TrendingUp };
  }
  if (value < -0.25) {
    return {
      label: `Baixando ${formatNumber(Math.abs(value))} cm/h`,
      className: "is-falling",
      icon: TrendingDown,
    };
  }
  return { label: "Estável no recorte", className: "is-stable", icon: Activity };
}

function statusCopy(level: LaranjalLevelData) {
  if (level.status === "live") {
    return {
      label: "Telemetria atualizada",
      title: "Leitura local disponível",
      description: "O sensor publicou uma medição dentro da janela de atualidade do portal.",
      icon: CheckCircle2,
    };
  }
  if (level.status === "stale") {
    return {
      label: "Última leitura conhecida",
      title: "O sensor está sem nova medição",
      description: "O valor permanece visível como referência anterior e não como nível atual.",
      icon: Clock3,
    };
  }
  return {
    label: "Telemetria indisponível",
    title: "A leitura local não pôde ser consultada",
    description: "O portal não preenche a ausência da fonte com nível estimado ou demonstrativo.",
    icon: AlertTriangle,
  };
}

function LevelSparkline({ level }: { level: LaranjalLevelData }) {
  if (level.series.length < 2) {
    return (
      <div className="hydrology-v2-chart-empty">
        <Activity aria-hidden="true" />
        <span>Não há pontos suficientes para desenhar a evolução recente.</span>
      </div>
    );
  }

  const width = 900;
  const height = 280;
  const paddingX = 30;
  const paddingY = 30;
  const values = level.series.map((point) => point.level);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = Math.max(0.02, maximum - minimum);
  const plotWidth = width - paddingX * 2;
  const plotHeight = height - paddingY * 2;
  const points = level.series.map((point, index) => ({
    x: paddingX + (index / Math.max(level.series.length - 1, 1)) * plotWidth,
    y: paddingY + ((maximum - point.level) / range) * plotHeight,
  }));
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = [
    `M ${points[0]?.x ?? paddingX} ${height - paddingY}`,
    ...points.map((point) => `L ${point.x} ${point.y}`),
    `L ${points.at(-1)?.x ?? width - paddingX} ${height - paddingY}`,
    "Z",
  ].join(" ");

  return (
    <div className="hydrology-v2-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={
          level.status === "stale"
            ? "Evolução nas 24 horas anteriores à última leitura conhecida"
            : "Evolução do nível nas últimas 24 horas"
        }
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="hydrology-v2-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.3" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((index) => {
          const y = paddingY + (index / 3) * plotHeight;
          return <line key={index} x1={paddingX} x2={width - paddingX} y1={y} y2={y} />;
        })}
        <path d={area} fill="url(#hydrology-v2-area)" stroke="none" />
        <polyline points={line} fill="none" stroke="currentColor" strokeWidth="4" />
        <circle cx={points.at(-1)?.x} cy={points.at(-1)?.y} r="7" fill="currentColor" />
      </svg>
      <div>
        <span>{level.status === "stale" ? "24 h antes da leitura" : "Há 24 horas"}</span>
        <strong>{formatNumber(minimum, 2)} m a {formatNumber(maximum, 2)} m</strong>
        <span>{level.status === "stale" ? "Última leitura" : "Leitura mais recente"}</span>
      </div>
    </div>
  );
}

function forecastHydrologyContext(weather: WeatherIntelligenceData) {
  const hourly = weather.weather.hourly.slice(0, 24);
  const precipitation = hourly
    .map((item) => item.precipitationMm)
    .filter((value): value is number => value !== null && value !== undefined);
  const probabilities = hourly
    .map((item) => item.precipitationProbability)
    .filter((value): value is number => value !== null);
  const gusts = hourly
    .map((item) => item.windGust)
    .filter((value): value is number => value !== null);

  return {
    precipitationTotal: precipitation.length
      ? precipitation.reduce((total, value) => total + value, 0)
      : null,
    maximumRainChance: probabilities.length ? Math.max(...probabilities) : null,
    maximumGust: gusts.length ? Math.max(...gusts) : null,
  };
}

export function HydrologyOverviewHero({ level, lagoon, sace }: Pick<HydrologyOverviewProps, "level" | "lagoon" | "sace">) {
  const status = statusCopy(level);
  const StatusIcon = status.icon;
  const trend = trendState(level.trendCmPerHour);
  const TrendIcon = trend.icon;

  return (
    <section className="hydrology-v2-hero" aria-labelledby="hydrology-v2-hero-title">
      <div className="hydrology-v2-hero__content">
        <span className="hydrology-v2-eyebrow">Águas e segurança em Pelotas</span>
        <h1 id="hydrology-v2-hero-title">Situação das águas no Laranjal e na Lagoa dos Patos.</h1>
        <p>
          Comece pela leitura local da UFPel e depois compare o contexto regional. Cada estação possui
          referência própria; níveis de pontos diferentes não devem ser tratados como uma única régua.
        </p>
        <div className="hydrology-v2-hero__actions">
          <a href="#leitura-local">Ver leitura local <ArrowRight aria-hidden="true" /></a>
          <Link to="/nivel-da-lagoa-dos-patos-laranjal">Abrir página da estação</Link>
        </div>
      </div>

      <aside className={`hydrology-v2-hero__reading is-${level.status}`} aria-label="Resumo da Estação Laranjal">
        <header>
          <span><StatusIcon aria-hidden="true" />{status.label}</span>
          <small>{formatDateTime(level.updatedAt)}</small>
        </header>
        <div className="hydrology-v2-hero__level">
          <span>Estação Laranjal</span>
          <strong>{level.currentLevel === null ? "—" : formatNumber(level.currentLevel, 2)}</strong>
          <small>m na referência técnica do sensor</small>
        </div>
        <div className={`hydrology-v2-hero__trend ${trend.className}`}>
          <TrendIcon aria-hidden="true" />
          <span><small>Tendência recente</small><strong>{trend.label}</strong></span>
        </div>
        <dl>
          <div><dt>Rede da lagoa</dt><dd>{lagoon.available}/{lagoon.total} pontos</dd></div>
          <div><dt>SACE transmitindo</dt><dd>{sace.counts.transmitting}/{sace.counts.total}</dd></div>
        </dl>
        <footer>Referência local · não é cota oficial de inundação</footer>
      </aside>
    </section>
  );
}

export function HydrologyOverviewV2({ weather, level, guaiba, lagoon, sace }: HydrologyOverviewProps) {
  const status = statusCopy(level);
  const StatusIcon = status.icon;
  const trend = trendState(level.trendCmPerHour);
  const TrendIcon = trend.icon;
  const forecast = forecastHydrologyContext(weather);
  const current = weather.weather.current;

  const datasetSchema = level.currentLevel !== null
    ? {
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: "Monitoramento hidrológico de Pelotas e da Lagoa dos Patos",
        description:
          "Leitura local da Estação Laranjal e contexto regional do Guaíba, Lagoa dos Patos e SACE Guaíba.",
        spatialCoverage: [
          { "@type": "Place", name: "Praia do Laranjal, Pelotas" },
          { "@type": "Place", name: "Lagoa dos Patos, Rio Grande do Sul" },
          { "@type": "Place", name: "Bacia do Guaíba, Rio Grande do Sul" },
        ],
        dateModified: level.source.fetchedAt,
        isBasedOn: [level.source.url, lagoon.source.url, sace.source.url],
        isAccessibleForFree: true,
      }
    : null;

  return (
    <div className="hydrology-v2-page">
      {datasetSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema).replace(/</g, "\\u003c") }}
        />
      ) : null}

      <nav className="hydrology-v2-chapters" aria-label="Capítulos da situação das águas">
        <a href="#estado-da-telemetria"><span>01</span><strong>Fonte local</strong><small>Atualidade da leitura</small></a>
        <a href="#leitura-local"><span>02</span><strong>Laranjal</strong><small>Nível e tendência</small></a>
        <a href="#rede-regional"><span>03</span><strong>Lagoa</strong><small>Guaíba e estações</small></a>
        <a href="#bacia-do-guaiba"><span>04</span><strong>SACE</strong><small>Rios a montante</small></a>
        <a href="#contexto-meteorologico"><span>05</span><strong>Tempo</strong><small>Chuva e vento previstos</small></a>
      </nav>

      <section className={`hydrology-v2-source is-${level.status}`} id="estado-da-telemetria" aria-labelledby="hydrology-v2-source-title" role="status">
        <StatusIcon aria-hidden="true" />
        <div>
          <span className="hydrology-v2-eyebrow">Estado da Estação Laranjal</span>
          <h2 id="hydrology-v2-source-title">{status.title}</h2>
          <p>{level.error ?? status.description}</p>
        </div>
        <dl>
          <div><dt>Horário da medição</dt><dd>{formatDateTime(level.updatedAt)}</dd></div>
          <div><dt>Idade da leitura</dt><dd>{ageLabel(level.ageMinutes)}</dd></div>
          <div><dt>Consulta do portal</dt><dd>{formatDateTime(level.source.fetchedAt)}</dd></div>
        </dl>
      </section>

      <section className="hydrology-v2-local" id="leitura-local" aria-labelledby="hydrology-v2-local-title">
        <header className="hydrology-v2-section-heading">
          <div>
            <span className="hydrology-v2-eyebrow">Referência local · LabHidroSens/UFPel</span>
            <h2 id="hydrology-v2-local-title">Evolução recente na Estação Laranjal</h2>
          </div>
          <p>
            O sensor mede a distância até a água e o portal aplica a referência técnica do equipamento.
            O resultado não deve ser comparado diretamente com cotas de outras estações.
          </p>
        </header>

        {level.currentLevel !== null ? (
          <>
            <div className="hydrology-v2-local-reading">
              <article>
                <Waves aria-hidden="true" />
                <span>{level.status === "stale" ? "Último nível conhecido" : "Nível mais recente"}</span>
                <strong>{formatNumber(level.currentLevel, 2)} m</strong>
                <small>Na referência técnica da Estação Laranjal</small>
              </article>
              <article className={trend.className}>
                <TrendIcon aria-hidden="true" />
                <span>Tendência</span>
                <strong>{trend.label}</strong>
                <small>Calculada com a série válida disponível</small>
              </article>
            </div>

            <LevelSparkline level={level} />

            <div className="hydrology-v2-local-metrics">
              <article><span>Variação em 1 hora</span><strong>{formatSigned(level.change1hCm, "cm")}</strong></article>
              <article><span>Variação em 6 horas</span><strong>{formatSigned(level.change6hCm, "cm")}</strong></article>
              <article><span>Variação em 24 horas</span><strong>{formatSigned(level.change24hCm, "cm")}</strong></article>
              <article><span>Mínima do recorte</span><strong>{level.periodMinimum === null ? "—" : `${formatNumber(level.periodMinimum, 2)} m`}</strong></article>
              <article><span>Média do recorte</span><strong>{level.periodAverage === null ? "—" : `${formatNumber(level.periodAverage, 2)} m`}</strong></article>
              <article><span>Máxima do recorte</span><strong>{level.periodMaximum === null ? "—" : `${formatNumber(level.periodMaximum, 2)} m`}</strong></article>
            </div>
          </>
        ) : (
          <div className="hydrology-v2-unavailable">
            <AlertTriangle aria-hidden="true" />
            <div><strong>Sem leitura local válida</strong><p>A ausência do sensor não é substituída por estimativa de nível.</p></div>
          </div>
        )}

        <div className="hydrology-v2-reference-warning">
          <ShieldAlert aria-hidden="true" />
          <p>
            <strong>Não é classificação de risco.</strong> O valor local não utiliza as cotas oficiais de
            atenção, alerta ou inundação de outras estações. Observe horário, tendência e fonte original.
          </p>
          <a href={level.source.url} target="_blank" rel="noopener noreferrer">Painel original <ExternalLink aria-hidden="true" /></a>
        </div>
      </section>

      <div id="rede-regional" className="hydrology-v2-regional-anchor">
        <RegionalWaterNetwork guaiba={guaiba} lagoon={lagoon} variant="full" />
      </div>

      <SaceGuaibaContext data={sace} />

      <section className="hydrology-v2-weather" id="contexto-meteorologico" aria-labelledby="hydrology-v2-weather-title">
        <header className="hydrology-v2-section-heading">
          <div>
            <span className="hydrology-v2-eyebrow">Contexto previsto · próximas 24 horas</span>
            <h2 id="hydrology-v2-weather-title">Chuva e vento podem alterar a distribuição da água</h2>
          </div>
          <p>
            Estes valores são previsão meteorológica, não medição hidrológica. Eles ajudam a contextualizar
            a tendência, mas não permitem calcular sozinhos o nível futuro no Laranjal.
          </p>
        </header>

        <div className="hydrology-v2-weather-grid">
          <article><CloudRain aria-hidden="true" /><span>Chuva prevista</span><strong>{forecast.precipitationTotal === null ? "—" : `${formatNumber(forecast.precipitationTotal)} mm`}</strong><small>Soma horária disponível para 24 h</small></article>
          <article><Gauge aria-hidden="true" /><span>Maior chance de chuva</span><strong>{forecast.maximumRainChance === null ? "—" : `${formatNumber(forecast.maximumRainChance, 0)}%`}</strong><small>Maior probabilidade horária no recorte</small></article>
          <article><Navigation aria-hidden="true" /><span>Maior rajada prevista</span><strong>{forecast.maximumGust === null ? "—" : `${formatNumber(forecast.maximumGust)} km/h`}</strong><small>Vento pode represar ou deslocar água</small></article>
          <article><Wind aria-hidden="true" /><span>Vento consolidado agora</span><strong>{current?.windSpeed === null || current?.windSpeed === undefined ? "—" : `${formatNumber(current.windSpeed)} km/h`}</strong><small>Direção {current?.windDirection ?? "não informada"}</small></article>
        </div>
      </section>

      <section className="hydrology-v2-network-summary" aria-labelledby="hydrology-v2-network-title">
        <header className="hydrology-v2-section-heading">
          <div>
            <span className="hydrology-v2-eyebrow">Cobertura desta atualização</span>
            <h2 id="hydrology-v2-network-title">Cada rede responde a uma pergunta diferente</h2>
          </div>
          <p>
            O painel não converte automaticamente níveis e categorias entre referências distintas. A leitura
            local, a rede da lagoa, o Guaíba e o SACE permanecem identificados separadamente.
          </p>
        </header>
        <div>
          <article><Waves aria-hidden="true" /><span>Estação Laranjal</span><strong>{level.status === "live" ? "Atualizada" : level.status === "stale" ? "Atrasada" : "Indisponível"}</strong><small>Referência local da UFPel</small></article>
          <article><MapPinned aria-hidden="true" /><span>Rede da Lagoa</span><strong>{lagoon.available}/{lagoon.total}</strong><small>Estações com leitura nesta consulta</small></article>
          <article><Activity aria-hidden="true" /><span>Guaíba</span><strong>{guaiba.status === "live" ? "Atualizado" : guaiba.status === "stale" ? "Atrasado" : "Indisponível"}</strong><small>{guaiba.station}</small></article>
          <article><RadioTower aria-hidden="true" /><span>SACE Guaíba</span><strong>{sace.counts.transmitting}/{sace.counts.total}</strong><small>{sace.counts.aboveNormal} com categoria acima de normal</small></article>
        </div>
      </section>

      <section className="hydrology-v2-safety" aria-labelledby="hydrology-v2-safety-title">
        <AlertTriangle aria-hidden="true" />
        <div>
          <span className="hydrology-v2-eyebrow">Antes de tomar decisões</span>
          <h2 id="hydrology-v2-safety-title">Uma leitura isolada não define segurança</h2>
          <p>
            Confirme horário, tendência, fonte e alertas oficiais. Em emergência, siga a Defesa Civil e as
            autoridades locais. Uma estação sem transmissão não deve ser interpretada como nível normal.
          </p>
        </div>
        <Link to="/alertas">Ver alertas oficiais <ArrowRight aria-hidden="true" /></Link>
      </section>

      <section className="hydrology-v2-actions" aria-label="Ações relacionadas à situação das águas">
        <div><span className="hydrology-v2-eyebrow">Fontes e aprofundamento</span><h2>Consulte cada rede em sua referência original</h2></div>
        <div>
          <a href={level.source.url} target="_blank" rel="noopener noreferrer">Estação Laranjal <ExternalLink aria-hidden="true" /></a>
          <Link to="/nivel-da-lagoa-dos-patos-laranjal">Detalhes do Laranjal <ArrowRight aria-hidden="true" /></Link>
          <Link to="/tempo-hoje-pelotas">Tempo em Pelotas</Link>
          <Link to="/metodologia">Metodologia e fontes</Link>
        </div>
      </section>
    </div>
  );
}
