import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  CloudRain,
  Compass,
  Droplets,
  ExternalLink,
  Gauge,
  Info,
  MapPin,
  Radio,
  RefreshCw,
  Scale,
  Sun,
  Thermometer,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";

import type { TimedObservation } from "@/lib/weather/official-sources.types";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

import "./EmbrapaStationPage.css";

type EmbrapaStationPageProps = {
  data: WeatherIntelligenceData;
};

type MetricCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  detail?: string;
};

const statusLabels = {
  live: "Leituras reconhecidas",
  partial: "Leitura parcial",
  unavailable: "Medições indisponíveis",
} as const;

function formatNumber(value: number | null, maximumFractionDigits = 1) {
  if (value === null) return "—";
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

function formatDateTime(value: string | null) {
  if (!value) return "Horário não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Horário não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function displayValue(value: number | null, unit: string, digits = 1) {
  return value === null ? "Não informado" : `${formatNumber(value, digits)}${unit}`;
}

function MetricCard({ icon: Icon, label, value, detail }: MetricCardProps) {
  return (
    <article className="embrapa-metric-card">
      <Icon aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}

function ExtremeValue({
  label,
  observation,
  unit,
}: {
  label: string;
  observation: TimedObservation;
  unit: string;
}) {
  return (
    <div>
      <span>{label}</span>
      <strong>{displayValue(observation.value, unit)}</strong>
      <small>
        {observation.time ? `Registrado às ${observation.time}` : "Horário não informado"}
      </small>
    </div>
  );
}

function SourceStatus({
  status,
  error,
}: {
  status: "live" | "partial" | "unavailable";
  error: string | null;
}) {
  const Icon = status === "live" ? CheckCircle2 : status === "partial" ? Clock3 : Info;

  return (
    <div className={`embrapa-source-status embrapa-source-status-${status}`} role="status">
      <Icon aria-hidden="true" />
      <div>
        <strong>{statusLabels[status]}</strong>
        <span>
          {status === "live"
            ? "A página da estação respondeu e os principais campos foram reconhecidos."
            : status === "partial"
              ? "A fonte respondeu, mas alguns campos não puderam ser identificados."
              : error || "Não foi possível consultar ou interpretar a página da estação."}
        </span>
      </div>
    </div>
  );
}

export function EmbrapaStationPage({ data }: EmbrapaStationPageProps) {
  const observation = data.weather.observation;
  const available = observation.status !== "unavailable";
  const usedAsCurrentSource = data.weather.quality.currentSource === "embrapa";

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Observações meteorológicas da Embrapa Clima Temperado em Pelotas",
    description:
      "Temperatura, umidade, pressão, vento, extremos e chuva acumulada consultados no Posto Meteorológico da Sede da Embrapa Clima Temperado.",
    spatialCoverage: "Pelotas, Rio Grande do Sul, Brasil",
    temporalCoverage: "Condição atual informada pela fonte e acumulados do dia, mês e ano",
    isAccessibleForFree: true,
    sameAs: observation.source.url,
    dateModified: observation.source.fetchedAt,
    creator: {
      "@type": "Organization",
      name: "Embrapa Clima Temperado",
      url: "https://www.embrapa.br/clima-temperado",
    },
  };

  return (
    <div className="embrapa-page">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema).replace(/</g, "\\u003c") }}
      />

      <header className="embrapa-hero">
        <div className="embrapa-hero-copy">
          <Link className="embrapa-back-link" to="/">
            <ArrowLeft aria-hidden="true" /> Tempo agora
          </Link>
          <p className="embrapa-kicker">Medição meteorológica local</p>
          <h1>Estação Embrapa Clima Temperado</h1>
          <p className="embrapa-lead">
            Dados observados no Posto Meteorológico da Sede, em Pelotas. Esta página mostra o que a
            estação registrou; a previsão das próximas horas é apresentada separadamente no portal.
          </p>
          <div className="embrapa-hero-meta">
            <span>
              <MapPin aria-hidden="true" /> Pelotas / RS
            </span>
            <span>
              <Gauge aria-hidden="true" /> 57 m de altitude
            </span>
            <span>
              <RefreshCw aria-hidden="true" /> Consulta em{" "}
              {formatDateTime(observation.source.fetchedAt)}
            </span>
          </div>
        </div>

        <aside className={`embrapa-primary-reading embrapa-primary-reading-${observation.status}`}>
          <span className="embrapa-primary-label">Temperatura medida</span>
          <strong>
            {observation.current.temperature === null
              ? "—"
              : `${formatNumber(observation.current.temperature)}°`}
          </strong>
          <p>
            {observation.current.feelsLike === null
              ? "Sensação térmica não informada pela fonte."
              : `Sensação térmica de ${formatNumber(observation.current.feelsLike)} °C.`}
          </p>
          <small>
            {observation.source.observationTime
              ? `Horário indicado pela estação: ${observation.source.observationTime}`
              : "A fonte não informou um horário completo para a medição."}
          </small>
        </aside>
      </header>

      <SourceStatus status={observation.status} error={observation.error} />

      {available ? (
        <>
          <section className="embrapa-section" aria-labelledby="embrapa-current-title">
            <div className="embrapa-section-heading">
              <div>
                <p className="embrapa-kicker">Condição observada</p>
                <h2 id="embrapa-current-title">O que a estação está informando</h2>
              </div>
              <p>
                Os valores representam o ponto onde o equipamento está instalado. Centro, Laranjal,
                áreas rurais e outros bairros podem apresentar condições diferentes no mesmo
                horário.
              </p>
            </div>

            <div className="embrapa-metric-grid">
              <MetricCard
                icon={Droplets}
                label="Umidade relativa"
                value={displayValue(observation.current.humidity, "%", 0)}
                detail="Quantidade relativa de vapor de água no ar"
              />
              <MetricCard
                icon={Thermometer}
                label="Ponto de orvalho"
                value={displayValue(observation.current.dewPoint, " °C")}
                detail="Temperatura em que o ar pode atingir saturação"
              />
              <MetricCard
                icon={Gauge}
                label="Pressão atmosférica"
                value={displayValue(observation.current.pressure, " hPa")}
                detail={observation.current.pressureTrend ?? "Tendência não informada"}
              />
              <MetricCard
                icon={Wind}
                label="Velocidade do vento"
                value={displayValue(observation.current.windSpeed, " km/h")}
                detail={observation.current.windDirection ?? "Direção não informada"}
              />
              <MetricCard
                icon={Compass}
                label="Direção do vento"
                value={observation.current.windDirection ?? "Não informada"}
                detail="Orientação publicada pela estação"
              />
              <MetricCard
                icon={Sun}
                label="Nascer e pôr do sol"
                value={`${observation.current.sunrise ?? "—"} · ${observation.current.sunset ?? "—"}`}
                detail="Horários informados no monitor da Embrapa"
              />
            </div>
          </section>

          <section
            className="embrapa-section embrapa-rain-section"
            aria-labelledby="embrapa-rain-title"
          >
            <div className="embrapa-section-heading">
              <div>
                <p className="embrapa-kicker">Precipitação observada</p>
                <h2 id="embrapa-rain-title">Chuva acumulada na estação</h2>
              </div>
              <p>
                O pluviômetro representa apenas o local da Embrapa. Pancadas isoladas podem produzir
                acumulados muito diferentes em outras regiões de Pelotas.
              </p>
            </div>

            <div className="embrapa-rain-grid">
              <article>
                <CloudRain aria-hidden="true" />
                <span>Hoje</span>
                <strong>{displayValue(observation.accumulated.rainDaily, " mm")}</strong>
              </article>
              <article>
                <Droplets aria-hidden="true" />
                <span>No mês</span>
                <strong>{displayValue(observation.accumulated.rainMonthly, " mm")}</strong>
              </article>
              <article>
                <Waves aria-hidden="true" />
                <span>No ano</span>
                <strong>{displayValue(observation.accumulated.rainAnnual, " mm")}</strong>
              </article>
            </div>
          </section>

          <section className="embrapa-section" aria-labelledby="embrapa-extremes-title">
            <div className="embrapa-section-heading">
              <div>
                <p className="embrapa-kicker">Extremos do dia</p>
                <h2 id="embrapa-extremes-title">Menores e maiores valores reconhecidos</h2>
              </div>
              <p>
                O horário exibido é o texto publicado pela própria estação. Ausências permanecem
                sinalizadas e não são estimadas pelo Tempo Pelotas.
              </p>
            </div>

            <div className="embrapa-extremes-grid">
              <article>
                <div className="embrapa-extreme-heading">
                  <Thermometer aria-hidden="true" />
                  <h3>Temperatura do ar</h3>
                </div>
                <ExtremeValue
                  label="Mínima"
                  observation={observation.extremes.temperatureMin}
                  unit=" °C"
                />
                <ExtremeValue
                  label="Máxima"
                  observation={observation.extremes.temperatureMax}
                  unit=" °C"
                />
              </article>
              <article>
                <div className="embrapa-extreme-heading">
                  <Droplets aria-hidden="true" />
                  <h3>Umidade relativa</h3>
                </div>
                <ExtremeValue
                  label="Mínima"
                  observation={observation.extremes.humidityMin}
                  unit="%"
                />
                <ExtremeValue
                  label="Máxima"
                  observation={observation.extremes.humidityMax}
                  unit="%"
                />
              </article>
              <article>
                <div className="embrapa-extreme-heading">
                  <Wind aria-hidden="true" />
                  <h3>Vento mais forte</h3>
                </div>
                <ExtremeValue
                  label="Maior velocidade"
                  observation={observation.extremes.windSpeedMax}
                  unit=" km/h"
                />
                <div className="embrapa-extreme-note">
                  <span>Direção atual</span>
                  <strong>{observation.current.windDirection ?? "Não informada"}</strong>
                  <small>Não representa necessariamente a direção no momento da máxima.</small>
                </div>
              </article>
            </div>
          </section>
        </>
      ) : (
        <section
          className="embrapa-section embrapa-unavailable"
          aria-labelledby="embrapa-unavailable-title"
        >
          <Radio aria-hidden="true" />
          <div>
            <p className="embrapa-kicker">Fonte externa indisponível</p>
            <h2 id="embrapa-unavailable-title">As medições não puderam ser exibidas agora</h2>
            <p>
              {observation.error ||
                "A página da estação não respondeu ou mudou de estrutura. O portal continuará tentando novamente."}
            </p>
            <a href={observation.source.url} target="_blank" rel="noreferrer">
              Consultar monitor original <ExternalLink aria-hidden="true" />
            </a>
          </div>
        </section>
      )}

      <section className="embrapa-section" aria-labelledby="embrapa-context-title">
        <div className="embrapa-section-heading">
          <div>
            <p className="embrapa-kicker">Contexto e proveniência</p>
            <h2 id="embrapa-context-title">Como estes dados entram no portal</h2>
          </div>
          <p>
            A Embrapa é tratada como medição local. Modelos globais continuam responsáveis pela
            previsão horária e diária quando não existe previsão produzida pela estação.
          </p>
        </div>

        <div className="embrapa-context-grid">
          <article>
            <Activity aria-hidden="true" />
            <h3>
              {usedAsCurrentSource
                ? "Fonte principal da condição atual"
                : "Fonte local de comparação"}
            </h3>
            <p>
              {usedAsCurrentSource
                ? "As medições reconhecidas da Embrapa foram usadas como referência principal para a condição atual exibida pelo portal."
                : "A estação foi consultada, mas a condição atual consolidada precisou usar outra fonte por disponibilidade ou completude."}
            </p>
          </article>
          <article>
            <Clock3 aria-hidden="true" />
            <h3>Consulta não é o mesmo que medição</h3>
            <p>
              “Consulta em” registra quando o Tempo Pelotas acessou a fonte. O horário da medição só
              é mostrado quando aparece explicitamente no monitor da estação.
            </p>
          </article>
          <article>
            <Scale aria-hidden="true" />
            <h3>Diferenças são esperadas</h3>
            <p>
              Instrumentos locais e modelos usam métodos e pontos geográficos distintos. Pequenas
              diferenças não significam necessariamente erro de uma das fontes.
            </p>
          </article>
          <article>
            <MapPin aria-hidden="true" />
            <h3>Representatividade espacial limitada</h3>
            <p>
              A coordenada publicada é aproximadamente{" "}
              {formatNumber(observation.source.latitude, 2)},{" "}
              {formatNumber(observation.source.longitude, 2)}. Uma única estação não descreve todos
              os microclimas do município.
            </p>
          </article>
        </div>
      </section>

      <section className="embrapa-actions" aria-label="Ações relacionadas à Estação Embrapa">
        <div>
          <p className="embrapa-kicker">Fonte e comparação</p>
          <h2>Consulte o dado original e compare com a previsão</h2>
        </div>
        <div>
          <a
            className="embrapa-primary-action"
            href={observation.source.url}
            target="_blank"
            rel="noreferrer"
          >
            Monitor da Embrapa <ExternalLink aria-hidden="true" />
          </a>
          <Link className="embrapa-secondary-action" to="/tempo-hoje-pelotas">
            Previsão de hoje <ArrowRight aria-hidden="true" />
          </Link>
          <Link className="embrapa-secondary-action" to="/metodologia">
            Metodologia e fontes
          </Link>
        </div>
      </section>
    </div>
  );
}
