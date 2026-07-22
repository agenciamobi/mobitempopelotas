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

import type { LaranjalLevelData } from "@/lib/hydrology/laranjal-level.server";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

import "./HydrologyPages.css";

const officialSources = [
  {
    name: "Estação Laranjal",
    organization: "LabHidroSens / UFPel",
    description: "Telemetria pública utilizada para a leitura local apresentada pelo portal.",
    url: "https://tb.labhidrosens.com/dashboard/97ec9a60-d9e1-11f0-ac7c-456d9a25fe9a?publicId=0a869e80-d9e8-11f0-ac7c-456d9a25fe9a",
  },
  {
    name: "Rede de Monitoramento da Lagoa dos Patos",
    organization: "FURG e Portos RS",
    description: "Leituras de diferentes pontos da lagoa, com referências locais de cada estação.",
    url: "https://monitoramentolagoadospatos.com.br/",
  },
  {
    name: "Hidrotelemetria",
    organization: "Agência Nacional de Águas e Saneamento Básico",
    description: "Consulta oficial de estações, níveis, vazões e chuva na rede nacional.",
    url: "https://www.snirh.gov.br/hidrotelemetria/gerarGrafico.aspx",
  },
  {
    name: "Sistema de Alerta de Eventos Críticos",
    organization: "Serviço Geológico do Brasil",
    description: "Boletins, estações e referências oficiais para acompanhamento de eventos hidrológicos.",
    url: "https://www.sgb.gov.br/sace/",
  },
] as const;

const hydrologyFlow = [
  {
    title: "Rios e Guaíba",
    description: "Rios do centro e do norte do estado alimentam o Guaíba e influenciam o sistema regional.",
  },
  {
    title: "Lagoa dos Patos",
    description: "A água segue para a lagoa, que também recebe contribuições de outros rios e arroios.",
  },
  {
    title: "Canal São Gonçalo",
    description: "Pelotas se relaciona com a Lagoa dos Patos e a Lagoa Mirim por meio desse sistema.",
  },
  {
    title: "Vento, chuva e saída oceânica",
    description: "Vento, precipitação e escoamento em Rio Grande afetam a variação observada localmente.",
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

function formatSigned(value: number | null, suffix: string) {
  if (value === null) return "—";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value}${suffix}`;
}

function trendText(value: number | null) {
  if (value === null) return "Tendência indisponível";
  if (value > 0.25) return "Subindo";
  if (value < -0.25) return "Baixando";
  return "Estável";
}

function Sparkline({ data }: { data: LaranjalLevelData }) {
  if (data.series.length < 2) {
    return (
      <div className="hydrology-chart-empty">
        <Activity aria-hidden="true" />
        <span>Histórico recente indisponível</span>
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
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Variação do nível nas últimas 24 horas">
        <defs>
          <linearGradient id="hydrology-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.32" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} />
        <line
          x1={paddingX}
          y1={height / 2}
          x2={width - paddingX}
          y2={height / 2}
        />
        <line
          x1={paddingX}
          y1={height - paddingY}
          x2={width - paddingX}
          y2={height - paddingY}
        />
        <path d={area} fill="url(#hydrology-area)" stroke="none" />
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="4" />
        <circle
          cx={coordinates.at(-1)?.x}
          cy={coordinates.at(-1)?.y}
          r="7"
          fill="currentColor"
        />
      </svg>
      <div className="hydrology-chart-labels">
        <span>Há 24 horas</span>
        <strong>
          {minimum.toFixed(2)} m a {maximum.toFixed(2)} m
        </strong>
        <span>Agora</span>
      </div>
    </div>
  );
}

function SourceStatus({ level }: { level: LaranjalLevelData }) {
  const live = level.status === "live";
  const stale = level.status === "stale";

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
          {live ? "Telemetria atualizada" : stale ? "Última leitura atrasada" : "Telemetria indisponível"}
        </strong>
        <span>
          {level.updatedAt
            ? `Medição registrada em ${formatDateTime(level.updatedAt)}`
            : level.error || "O portal tentará consultar novamente automaticamente."}
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
          <h2 id="hydrology-level-title">Leitura local da Lagoa dos Patos</h2>
        </div>
        <SourceStatus level={level} />
      </div>

      <div className="hydrology-level-main">
        <div className="hydrology-level-value">
          <Waves aria-hidden="true" />
          <strong>{level.currentLevel === null ? "—" : level.currentLevel.toFixed(2)}</strong>
          <span>metros na referência do sensor</span>
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
          <span>Mínima no período</span>
          <strong>{level.periodMinimum === null ? "—" : `${level.periodMinimum.toFixed(2)} m`}</strong>
        </article>
        <article>
          <span>Média no período</span>
          <strong>{level.periodAverage === null ? "—" : `${level.periodAverage.toFixed(2)} m`}</strong>
        </article>
        <article>
          <span>Máxima no período</span>
          <strong>{level.periodMaximum === null ? "—" : `${level.periodMaximum.toFixed(2)} m`}</strong>
        </article>
      </div>

      <div className="hydrology-interpretation-warning">
        <ShieldAlert aria-hidden="true" />
        <p>
          Esta leitura não é uma cota oficial de risco ou inundação. O valor utiliza a referência
          técnica do sensor da Estação Laranjal e deve ser interpretado pela evolução no tempo e
          confirmado na fonte original.
        </p>
      </div>
    </section>
  );
}

function WeatherWaterContext({ weather }: { weather: WeatherIntelligenceData }) {
  const current = weather.weather.current;
  const today = weather.weather.daily[0];
  const maximumGust = Math.max(
    current?.windGust ?? 0,
    ...weather.weather.hourly.map((hour) => hour.windGust),
  );

  return (
    <section className="hydrology-weather-context" aria-labelledby="water-weather-title">
      <div className="hydrology-section-heading">
        <div>
          <p className="hydrology-kicker">Contexto meteorológico</p>
          <h2 id="water-weather-title">Chuva e vento também influenciam a leitura local</h2>
        </div>
        <Link to="/tempo-hoje-pelotas">Ver previsão completa</Link>
      </div>

      <div className="hydrology-weather-grid">
        <article>
          <CloudRain aria-hidden="true" />
          <span>Chuva prevista hoje</span>
          <strong>{today ? `${today.precipitationMm} mm` : "—"}</strong>
          <small>{today ? `${today.rainChance}% de probabilidade` : "Previsão em atualização"}</small>
        </article>
        <article>
          <Wind aria-hidden="true" />
          <span>Vento agora</span>
          <strong>{current?.windSpeed === null || current?.windSpeed === undefined ? "—" : `${current.windSpeed} km/h`}</strong>
          <small>Direção {current?.windDirection ?? "não informada"}</small>
        </article>
        <article>
          <Navigation aria-hidden="true" />
          <span>Maior rajada próxima</span>
          <strong>{maximumGust} km/h</strong>
          <small>Vento pode deslocar água na lagoa</small>
        </article>
        <article>
          <Gauge aria-hidden="true" />
          <span>Pressão atmosférica</span>
          <strong>{current?.pressure === null || current?.pressure === undefined ? "—" : `${current.pressure} hPa`}</strong>
          <small>Contexto meteorológico complementar</small>
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
          <p className="hydrology-kicker">Transparência</p>
          <h2 id="hydrology-sources-title">Fontes e redes para conferência</h2>
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
              Abrir fonte <ArrowUpRight aria-hidden="true" />
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
}: {
  weather: WeatherIntelligenceData;
  level: LaranjalLevelData;
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
            Comece pela leitura local da Estação Laranjal, observe a evolução recente e confirme o
            contexto nas redes oficiais e regionais.
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
      <WeatherWaterContext weather={weather} />

      <section className="hydrology-flow" aria-labelledby="hydrology-flow-title">
        <div className="hydrology-section-heading">
          <div>
            <p className="hydrology-kicker">Contexto geográfico</p>
            <h2 id="hydrology-flow-title">Como as águas se relacionam com Pelotas</h2>
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
            Não utilize uma única medição isolada como classificação de segurança. Confirme horário,
            tendência e fonte, acompanhe os alertas oficiais e siga orientações da Defesa Civil e das
            autoridades locais.
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
          <p className="hydrology-kicker">Monitoramento local</p>
          <h1>Nível da Lagoa dos Patos na Estação Laranjal</h1>
          <p>
            Leitura técnica da telemetria pública do LabHidroSens/UFPel, com evolução nas últimas 24
            horas e contexto meteorológico para Pelotas.
          </p>
        </div>
      </header>

      <LevelReading level={level} />
      <WeatherWaterContext weather={weather} />

      <section className="hydrology-method" aria-labelledby="hydrology-method-title">
        <Info aria-hidden="true" />
        <div>
          <h2 id="hydrology-method-title">Como o valor é obtido</h2>
          <p>
            O sensor informa a distância até a superfície da água. O portal converte essa distância
            usando a altura de referência técnica do equipamento e organiza a série recente. Essa
            referência não deve ser comparada diretamente com cotas de outras estações.
          </p>
        </div>
        <a href={level.source.url} target="_blank" rel="noreferrer">
          Painel original <ArrowUpRight aria-hidden="true" />
        </a>
      </section>

      <OfficialSources />
    </div>
  );
}
