import { Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  CloudRain,
  Database,
  Gauge,
  Info,
  MapPin,
  Navigation,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Waves,
  Wind,
} from "lucide-react";

import type { GuaibaObservationData } from "@/lib/hydrology/guaiba.server";
import type { LagoonMonitoringNetworkData } from "@/lib/hydrology/lagoon-network.server";
import type { LaranjalLevelData } from "@/lib/hydrology/laranjal-level.server";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

import { RegionalWaterNetwork } from "./RegionalWaterNetwork";
import "./HydrologyPages.css";

const officialSources = [
  {
    name: "Estação Laranjal",
    organization: "LabHidroSens / UFPel",
    description: "Medição pública usada para mostrar o nível local no Laranjal.",
    url: "https://tb.labhidrosens.com/dashboard/97ec9a60-d9e1-11f0-ac7c-456d9a25fe9a?publicId=0a869e80-d9e8-11f0-ac7c-456d9a25fe9a",
  },
  {
    name: "Rede da Lagoa dos Patos",
    organization: "FURG e Portos RS",
    description: "Leituras de diferentes pontos da Lagoa, cada uma com referência local própria.",
    url: "https://monitoramentolagoadospatos.com.br/",
  },
  {
    name: "Estações hidrológicas nacionais",
    organization: "Agência Nacional de Águas e Saneamento Básico",
    description: "Consulta oficial de estações, níveis, vazões e chuva na rede nacional.",
    url: "https://www.snirh.gov.br/hidrotelemetria/gerarGrafico.aspx",
  },
  {
    name: "Sistema de Alerta de Eventos Críticos",
    organization: "Serviço Geológico do Brasil",
    description: "Boletins e estações oficiais para acompanhar rios e situações hidrológicas.",
    url: "https://www.sgb.gov.br/sace/",
  },
] as const;

const hydrologyFlow = [
  {
    title: "Rios e Guaíba",
    description:
      "Rios do centro e do norte do estado alimentam o Guaíba e influenciam o sistema regional.",
  },
  {
    title: "Lagoa dos Patos",
    description:
      "A água segue para a Lagoa, que também recebe contribuições de outros rios e arroios.",
  },
  {
    title: "Canal São Gonçalo",
    description:
      "Pelotas se relaciona com a Lagoa dos Patos e a Lagoa Mirim por meio desse sistema.",
  },
  {
    title: "Vento, chuva e saída oceânica",
    description:
      "Vento, chuva e escoamento em Rio Grande afetam a variação observada localmente.",
  },
] as const;

function formatDateTime(value: string | null) {
  if (!value) return "Horário não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function formatReadingAge(value: number | null) {
  if (value === null) return null;
  if (value < 1) return "menos de 1 minuto";

  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

function formatSigned(value: number | null, suffix: string) {
  if (value === null) return "—";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value}${suffix}`;
}

function trendText(value: number | null) {
  if (value === null) return "Tendência não informada";
  if (value > 0.25) return "Subindo";
  if (value < -0.25) return "Baixando";
  return "Pouca mudança";
}

function Sparkline({ data }: { data: LaranjalLevelData }) {
  if (data.series.length < 2) {
    return (
      <div className="hydrology-chart-empty">
        <Activity aria-hidden="true" />
        <span>Não há medições suficientes para mostrar o histórico recente</span>
      </div>
    );
  }

  const width = 900;
  const height = 260;
  const paddingX = 18;
  const paddingY = 24;
  const values = data.series.map((point) => point.level);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = Math.max(0.02, maximum - minimum);
  const plotWidth = width - paddingX * 2;
  const plotHeight = height - paddingY * 2;
  const coordinates = data.series.map((point, index) => {
    const x = paddingX + (index / (data.series.length - 1)) * plotWidth;
    const y = paddingY + ((maximum - point.level) / range) * plotHeight;
    return { x, y };
  });
  const points = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const area = [
    `M ${coordinates[0]?.x ?? paddingX} ${height - paddingY}`,
    ...coordinates.map((point) => `L ${point.x} ${point.y}`),
    `L ${coordinates.at(-1)?.x ?? width - paddingX} ${height - paddingY}`,
    "Z",
  ].join(" ");

  return (
    <div className="hydrology-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={
          data.status === "stale"
            ? "Variação do nível nas 24 horas anteriores à última leitura"
            : "Variação do nível nas últimas 24 horas"
        }
      >
        <defs>
          <linearGradient id="hydrology-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.32" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} />
        <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} />
        <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} />
        <path d={area} fill="url(#hydrology-area)" stroke="none" />
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="4" />
        <circle cx={coordinates.at(-1)?.x} cy={coordinates.at(-1)?.y} r="7" fill="currentColor" />
      </svg>
      <div className="hydrology-chart-labels">
        <span>{data.status === "stale" ? "24 h antes da leitura" : "Há 24 horas"}</span>
        <strong>
          {minimum.toFixed(2)} m a {maximum.toFixed(2)} m
        </strong>
        <span>{data.status === "stale" ? "Última leitura" : "Leitura mais recente"}</span>
      </div>
    </div>
  );
}

function SourceStatus({ level }: { level: LaranjalLevelData }) {
  const live = level.status === "live";
  const stale = level.status === "stale";
  const age = formatReadingAge(level.ageMinutes);

  return (
    <div className={`hydrology-source-status hydrology-source-status-${level.status}`}>
      {live ? (
        <CheckCircle2 aria-hidden="true" />
      ) : stale ? (
        <Clock3 aria-hidden="true" />
      ) : (
        <Info aria-hidden="true" />
      )}
      <div>
        <strong>
          {live
            ? "Leitura atualizada"
            : stale
              ? "Estação sem nova medição"
              : "Leitura indisponível"}
        </strong>
        <span>
          {live && level.updatedAt
            ? `Medição registrada em ${formatDateTime(level.updatedAt)}`
            : stale && level.updatedAt
              ? `${age ? `Sem nova medição há ${age}. ` : ""}Última leitura em ${formatDateTime(level.updatedAt)}.`
              : level.error || "O portal tentará consultar a estação novamente."}
        </span>
      </div>
    </div>
  );
}

function LevelReading({ level }: { level: LaranjalLevelData }) {
  const TrendIcon =
    level.trendCmPerHour !== null && level.trendCmPerHour > 0.25
      ? TrendingUp
      : level.trendCmPerHour !== null && level.trendCmPerHour < -0.25
        ? TrendingDown
        : Activity;

  return (
    <section className="hydrology-level-card" aria-labelledby="hydrology-level-title">
      <div className="hydrology-level-heading">
        <div>
          <p className="hydrology-kicker">Estação Laranjal · UFPel</p>
          <h2 id="hydrology-level-title">
            {level.status === "stale"
              ? "Último nível conhecido no Laranjal"
              : "Nível medido no Laranjal"}
          </h2>
        </div>
        <SourceStatus level={level} />
      </div>

      <div className="hydrology-level-main">
        <div className="hydrology-level-value">
          <Waves aria-hidden="true" />
          <strong>{level.currentLevel === null ? "—" : level.currentLevel.toFixed(2)}</strong>
          <span>
            {level.status === "stale"
              ? "metros na última leitura da estação"
              : "metros na referência da estação"}
          </span>
        </div>
        <div className="hydrology-trend">
          <TrendIcon aria-hidden="true" />
          <div>
            <span>{trendText(level.trendCmPerHour)}</span>
            <strong>{formatSigned(level.trendCmPerHour, " cm/h")}</strong>
          </div>
        </div>
      </div>

      <Sparkline data={level} />

      <div className="hydrology-level-metrics">
        <article>
          <span>Variação em 1 hora</span>
          <strong>{formatSigned(level.change1hCm, " cm")}</strong>
        </article>
        <article>
          <span>Variação em 6 horas</span>
          <strong>{formatSigned(level.change6hCm, " cm")}</strong>
        </article>
        <article>
          <span>Variação em 24 horas</span>
          <strong>{formatSigned(level.change24hCm, " cm")}</strong>
        </article>
        <article>
          <span>Menor nível do período</span>
          <strong>
            {level.periodMinimum === null ? "—" : `${level.periodMinimum.toFixed(2)} m`}
          </strong>
        </article>
        <article>
          <span>Nível médio do período</span>
          <strong>
            {level.periodAverage === null ? "—" : `${level.periodAverage.toFixed(2)} m`}
          </strong>
        </article>
        <article>
          <span>Maior nível do período</span>
          <strong>
            {level.periodMaximum === null ? "—" : `${level.periodMaximum.toFixed(2)} m`}
          </strong>
        </article>
      </div>

      <div className="hydrology-interpretation-warning">
        <ShieldAlert aria-hidden="true" />
        <p>
          Esta leitura não é uma cota oficial de risco ou inundação. O valor usa a referência própria
          da Estação Laranjal e deve ser acompanhado pela evolução no tempo e pelo horário da medição.
        </p>
      </div>
    </section>
  );
}

function WeatherWaterContext({ weather }: { weather: WeatherIntelligenceData }) {
  const current = weather.weather.current;
  const today = weather.weather.daily[0];
  const gustValues = [
    current?.windGust,
    ...weather.weather.hourly.map((hour) => hour.windGust),
  ].filter((value): value is number => value !== null && value !== undefined);
  const maximumGust = gustValues.length > 0 ? Math.max(...gustValues) : null;

  return (
    <section className="hydrology-weather-context" aria-labelledby="water-weather-title">
      <div className="hydrology-section-heading">
        <div>
          <p className="hydrology-kicker">Chuva e vento</p>
          <h2 id="water-weather-title">O tempo também pode influenciar o nível local</h2>
        </div>
        <Link to="/tempo-hoje-pelotas">Ver previsão completa</Link>
      </div>

      <div className="hydrology-weather-grid">
        <article>
          <CloudRain aria-hidden="true" />
          <span>Chuva prevista hoje</span>
          <strong>{today ? `${today.precipitationMm} mm` : "—"}</strong>
          <small>
            {today
              ? today.rainChance === null
                ? "Chance não informada"
                : `${today.rainChance}% de chance`
              : "Previsão em atualização"}
          </small>
        </article>
        <article>
          <Wind aria-hidden="true" />
          <span>Vento agora</span>
          <strong>
            {current?.windSpeed === null || current?.windSpeed === undefined
              ? "—"
              : `${current.windSpeed} km/h`}
          </strong>
          <small>Direção {current?.windDirection ?? "não informada"}</small>
        </article>
        <article>
          <Navigation aria-hidden="true" />
          <span>Maior rajada prevista</span>
          <strong>{maximumGust === null ? "—" : `${maximumGust} km/h`}</strong>
          <small>O vento pode deslocar ou represar água na Lagoa</small>
        </article>
        <article>
          <Gauge aria-hidden="true" />
          <span>Pressão do ar</span>
          <strong>
            {current?.pressure === null || current?.pressure === undefined
              ? "—"
              : `${current.pressure} hPa`}
          </strong>
          <small>Informação meteorológica adicional</small>
        </article>
      </div>
    </section>
  );
}

function OfficialSources() {
  return (
    <section className="hydrology-sources" aria-labelledby="hydrology-sources-title">
      <div className="hydrology-section-heading">
        <div>
          <p className="hydrology-kicker">Páginas originais</p>
          <h2 id="hydrology-sources-title">Confira as medições nas fontes responsáveis</h2>
        </div>
      </div>

      <div className="hydrology-sources-grid">
        {officialSources.map((source) => (
          <article key={source.name}>
            <Database aria-hidden="true" />
            <span>{source.organization}</span>
            <h3>{source.name}</h3>
            <p>{source.description}</p>
            <a href={source.url} target="_blank" rel="noreferrer">
              Abrir página original <ArrowUpRight aria-hidden="true" />
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}

export function HydrologyOverviewPage({
  weather,
  level,
  guaiba,
  lagoon,
}: {
  weather: WeatherIntelligenceData;
  level: LaranjalLevelData;
  guaiba: GuaibaObservationData;
  lagoon: LagoonMonitoringNetworkData;
}) {
  return (
    <div className="hydrology-page">
      <header className="hydrology-page-header">
        <div>
          <Link className="hydrology-back-link" to="/">
            <ArrowLeft aria-hidden="true" /> Tempo agora
          </Link>
          <p className="hydrology-kicker">Águas e segurança em Pelotas</p>
          <h1>Situação das águas no Laranjal e na Lagoa dos Patos</h1>
          <p>
            Comece pela medição da Estação Laranjal, observe a evolução recente e compare com outros
            pontos da Lagoa e do Guaíba.
          </p>
        </div>
        <div className="hydrology-header-marker">
          <MapPin aria-hidden="true" />
          <div>
            <strong>Praia do Laranjal</strong>
            <span>Pelotas, Rio Grande do Sul</span>
          </div>
        </div>
      </header>

      <LevelReading level={level} />
      <RegionalWaterNetwork guaiba={guaiba} lagoon={lagoon} variant="full" />
      <WeatherWaterContext weather={weather} />

      <section className="hydrology-flow" aria-labelledby="hydrology-flow-title">
        <div className="hydrology-section-heading">
          <div>
            <p className="hydrology-kicker">Caminho das águas</p>
            <h2 id="hydrology-flow-title">Como rios, Lagoa e oceano se relacionam com Pelotas</h2>
          </div>
        </div>
        <div className="hydrology-flow-grid">
          {hydrologyFlow.map((step, index) => (
            <article key={step.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <OfficialSources />

      <section className="hydrology-safety-note">
        <AlertTriangle aria-hidden="true" />
        <div>
          <h2>Antes de tomar qualquer decisão</h2>
          <p>
            Não use uma única medição como garantia de segurança. Confira o horário, a mudança recente,
            os alertas oficiais e as orientações da Defesa Civil e das autoridades locais.
          </p>
        </div>
        <Link to="/alertas">
          Ver alertas <ArrowRight aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}

export function LaranjalLevelPage({
  weather,
  level,
}: {
  weather: WeatherIntelligenceData;
  level: LaranjalLevelData;
}) {
  return (
    <div className="hydrology-page">
      <header className="hydrology-detail-header">
        <div>
          <Link className="hydrology-back-link" to="/situacao-hidrologica-pelotas">
            <ArrowLeft aria-hidden="true" /> Situação das águas
          </Link>
          <p className="hydrology-kicker">Medição da Estação Laranjal</p>
          <h1>Nível da Lagoa dos Patos na Estação Laranjal</h1>
          <p>
            Veja a medição pública do LabHidroSens/UFPel, a evolução das últimas 24 horas e as
            informações de chuva e vento para Pelotas.
          </p>
        </div>
      </header>

      <LevelReading level={level} />
      <WeatherWaterContext weather={weather} />

      <section className="hydrology-method" aria-labelledby="hydrology-method-title">
        <Info aria-hidden="true" />
        <div>
          <h2 id="hydrology-method-title">Como o nível é calculado</h2>
          <p>
            A estação mede a distância até a superfície da água. O valor é convertido usando a altura de
            referência do equipamento e organizado em um histórico recente. Essa referência não deve ser
            comparada diretamente com os valores absolutos de outras estações.
          </p>
        </div>
        <a href={level.source.url} target="_blank" rel="noreferrer">
          Abrir painel da estação <ArrowUpRight aria-hidden="true" />
        </a>
      </section>

      <OfficialSources />
    </div>
  );
}
