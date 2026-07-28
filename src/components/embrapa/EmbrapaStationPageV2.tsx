import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  CloudRain,
  Compass,
  Droplets,
  ExternalLink,
  Gauge,
  MapPin,
  Radio,
  Scale,
  Sun,
  Thermometer,
  Waves,
  Wind,
  type LucideIcon,
} from "lucide-react";

import type {
  AggregatedCurrentField,
  WeatherSourceHealthStatus,
} from "@/lib/weather/aggregated-weather.types";
import type { TimedObservation } from "@/lib/weather/official-sources.types";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

import "./EmbrapaStationPageV2.css";

type EmbrapaStationProps = {
  data: WeatherIntelligenceData;
};

type MetricCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone?: "cyan" | "purple" | "orange" | "magenta";
};

const currentFieldLabels: Partial<Record<AggregatedCurrentField, string>> = {
  temperature: "temperatura",
  feelsLike: "sensação térmica",
  humidity: "umidade",
  pressure: "pressão",
  windSpeed: "velocidade do vento",
  windDirection: "direção do vento",
  sunrise: "nascer do sol",
  sunset: "pôr do sol",
  observedAt: "horário da medição",
};

const statusCopy: Record<
  WeatherSourceHealthStatus,
  { label: string; title: string; description: string }
> = {
  live: {
    label: "Leitura disponível",
    title: "A estação está enviando dados",
    description: "A fonte respondeu e as principais medições foram reconhecidas.",
  },
  partial: {
    label: "Alguns dados disponíveis",
    title: "Parte das medições está disponível",
    description: "A estação respondeu, mas algumas informações não vieram nesta atualização.",
  },
  stale: {
    label: "Leitura atrasada",
    title: "A última medição não é recente",
    description: "Os valores aparecem como última leitura conhecida e não como condição atual.",
  },
  unavailable: {
    label: "Estação indisponível",
    title: "A estação não pôde ser consultada",
    description: "A página não mostra valores artificiais enquanto a fonte estiver indisponível.",
  },
};

function formatNumber(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

function displayValue(value: number | null | undefined, unit: string, digits = 1) {
  return value === null || value === undefined
    ? "Não informado"
    : `${formatNumber(value, digits)}${unit}`;
}

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

function ageLabel(ageMinutes: number | null) {
  if (ageMinutes === null) return "Tempo desde a medição não informado";
  if (ageMinutes < 1) return "Medida há menos de 1 minuto";
  if (ageMinutes < 60) return `Medida há ${Math.round(ageMinutes)} min`;
  const hours = Math.floor(ageMinutes / 60);
  const minutes = Math.round(ageMinutes % 60);
  return minutes ? `Medida há ${hours} h ${minutes} min` : `Medida há ${hours} h`;
}

function primaryReadingLabel(status: WeatherSourceHealthStatus) {
  if (status === "live") return "Temperatura agora";
  if (status === "partial") return "Temperatura disponível";
  if (status === "stale") return "Última temperatura informada";
  return "Temperatura indisponível";
}

function statusIcon(status: WeatherSourceHealthStatus) {
  if (status === "live") return CheckCircle2;
  if (status === "unavailable") return Radio;
  return Clock3;
}

function fieldsUsedByPortal(data: WeatherIntelligenceData) {
  return Object.entries(data.weather.currentProvenance)
    .filter(([, source]) => source === "embrapa")
    .flatMap(([field]) => {
      const label = currentFieldLabels[field as AggregatedCurrentField];
      return label ? [label] : [];
    });
}

function MetricCard({ icon: Icon, label, value, detail, tone = "cyan" }: MetricCardProps) {
  return (
    <article className={`embrapa-v2-metric is-${tone}`}>
      <Icon aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
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
    <div className="embrapa-v2-extreme-value">
      <span>{label}</span>
      <strong>{displayValue(observation.value, unit)}</strong>
      <small>{observation.time ? `Às ${observation.time}` : "Horário não informado"}</small>
    </div>
  );
}

export function EmbrapaStationHero({ data }: EmbrapaStationProps) {
  const observation = data.weather.observation;
  const health = data.weather.sources.embrapa;
  const status = health.status;
  const StatusIcon = statusIcon(status);
  const usedInCurrentSummary = fieldsUsedByPortal(data).length > 0;

  return (
    <section className="embrapa-v2-hero" aria-labelledby="embrapa-v2-hero-title">
      <div className="embrapa-v2-hero__content">
        <span className="embrapa-v2-eyebrow">Medições locais em Pelotas</span>
        <h1 id="embrapa-v2-hero-title">Estação meteorológica da Embrapa.</h1>
        <p>
          Veja o que foi medido no Posto Meteorológico da Sede, quando a leitura foi registrada e quais
          informações foram usadas no resumo atual do Tempo Pelotas.
        </p>
        <div className="embrapa-v2-hero__actions">
          <a href="#leitura-observada">Ver todas as medições <ArrowRight aria-hidden="true" /></a>
          <Link to="/tempo-hoje-pelotas">Comparar com a previsão</Link>
        </div>
      </div>

      <aside className={`embrapa-v2-reading is-${status}`} aria-label="Leitura principal da estação">
        <header>
          <span className="embrapa-v2-status-chip">
            <StatusIcon aria-hidden="true" /> {statusCopy[status].label}
          </span>
          <small>{usedInCurrentSummary ? "Usada no resumo atual" : "Medição local para comparação"}</small>
        </header>

        <div className="embrapa-v2-reading__temperature">
          <span>{primaryReadingLabel(status)}</span>
          <strong>
            {observation.current.temperature === null
              ? "—"
              : `${formatNumber(observation.current.temperature)}°`}
          </strong>
          <p>
            {observation.current.feelsLike === null
              ? "Sensação térmica não informada pela estação."
              : `Sensação térmica de ${formatNumber(observation.current.feelsLike)} °C.`}
          </p>
        </div>

        <div className="embrapa-v2-reading__quick">
          <span><Droplets aria-hidden="true" /><b>{displayValue(observation.current.humidity, "%", 0)}</b><small>umidade</small></span>
          <span><Wind aria-hidden="true" /><b>{displayValue(observation.current.windSpeed, " km/h")}</b><small>vento</small></span>
        </div>

        <footer>
          <span><Clock3 aria-hidden="true" />{ageLabel(data.weather.quality.observationAgeMinutes)}</span>
          <small>
            {observation.source.observationTime
              ? `Horário informado pela estação: ${observation.source.observationTime}`
              : "A estação não informou o horário completo da medição."}
          </small>
        </footer>
      </aside>
    </section>
  );
}

export function EmbrapaStationPageV2({ data }: EmbrapaStationProps) {
  const observation = data.weather.observation;
  const health = data.weather.sources.embrapa;
  const status = health.status;
  const available = observation.status !== "unavailable";
  const usedFields = fieldsUsedByPortal(data);
  const StatusIcon = statusIcon(status);

  const datasetSchema = available
    ? {
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: "Observações meteorológicas da Embrapa Clima Temperado em Pelotas",
        description:
          "Temperatura, umidade, pressão, vento, extremos, chuva acumulada e evapotranspiração consultados no Posto Meteorológico da Sede da Embrapa Clima Temperado.",
        spatialCoverage: {
          "@type": "Place",
          name: "Posto Meteorológico da Sede da Embrapa Clima Temperado, Pelotas",
          geo: {
            "@type": "GeoCoordinates",
            latitude: observation.source.latitude,
            longitude: observation.source.longitude,
            elevation: observation.source.altitude,
          },
        },
        dateModified: observation.source.fetchedAt,
        isBasedOn: observation.source.url,
        isAccessibleForFree: true,
        creator: {
          "@type": "Organization",
          name: "Embrapa Clima Temperado",
          url: "https://www.embrapa.br/clima-temperado",
        },
      }
    : null;

  return (
    <div className="embrapa-v2-page">
      {datasetSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema).replace(/</g, "\\u003c") }}
        />
      ) : null}

      <nav
        className={`embrapa-v2-chapters${available ? "" : " is-compact"}`}
        aria-label="Seções da Estação Embrapa"
      >
        <a href="#estado-da-fonte"><span>01</span><strong>Situação</strong><small>Atualização da estação</small></a>
        {available ? (
          <>
            <a href="#leitura-observada"><span>02</span><strong>Medições</strong><small>Valores no local</small></a>
            <a href="#chuva-e-evapotranspiracao"><span>03</span><strong>Chuva</strong><small>Acumulados e evapotranspiração</small></a>
            <a href="#extremos-do-dia"><span>04</span><strong>Extremos</strong><small>Menores e maiores valores</small></a>
          </>
        ) : null}
        <a href="#uso-no-portal"><span>{available ? "05" : "02"}</span><strong>Origem dos dados</strong><small>Uso no resumo atual</small></a>
      </nav>

      <section
        className={`embrapa-v2-source is-${status}`}
        id="estado-da-fonte"
        aria-labelledby="embrapa-v2-source-title"
        role="status"
      >
        <StatusIcon aria-hidden="true" />
        <div>
          <span className="embrapa-v2-eyebrow">Situação da estação</span>
          <h2 id="embrapa-v2-source-title">{statusCopy[status].title}</h2>
          <p>{health.reason ?? statusCopy[status].description}</p>
        </div>
        <dl>
          <div><dt>Última atualização</dt><dd>{formatDateTime(observation.source.fetchedAt)}</dd></div>
          <div><dt>Tempo desde a medição</dt><dd>{ageLabel(data.weather.quality.observationAgeMinutes)}</dd></div>
          <div><dt>Usada no resumo atual</dt><dd>{usedFields.length > 0 ? "Sim" : "Não nesta atualização"}</dd></div>
        </dl>
      </section>

      {available ? (
        <>
          <section className="embrapa-v2-section" id="leitura-observada" aria-labelledby="embrapa-v2-current-title">
            <header className="embrapa-v2-section-heading">
              <div>
                <span className="embrapa-v2-eyebrow">Medições no local da estação</span>
                <h2 id="embrapa-v2-current-title">Valores informados na última leitura</h2>
              </div>
              <p>
                Estes valores representam o local dos instrumentos. Centro, Laranjal, bairros e áreas
                rurais podem apresentar condições diferentes no mesmo horário.
              </p>
            </header>

            <div className="embrapa-v2-metric-grid">
              <MetricCard icon={Thermometer} label="Temperatura" value={displayValue(observation.current.temperature, " °C")} detail="Valor medido pela estação" />
              <MetricCard icon={Droplets} label="Umidade relativa" value={displayValue(observation.current.humidity, "%", 0)} detail="Quantidade relativa de vapor de água no ar" tone="purple" />
              <MetricCard icon={Gauge} label="Pressão atmosférica" value={displayValue(observation.current.pressure, " hPa")} detail={observation.current.pressureTrend ?? "Tendência não informada"} tone="orange" />
              <MetricCard icon={Wind} label="Velocidade do vento" value={displayValue(observation.current.windSpeed, " km/h")} detail="Velocidade informada pela estação" tone="magenta" />
              <MetricCard icon={Compass} label="Direção do vento" value={observation.current.windDirection ?? "Não informada"} detail="Direção informada pela estação" />
              <MetricCard icon={Droplets} label="Ponto de orvalho" value={displayValue(observation.current.dewPoint, " °C")} detail="Temperatura em que o ar pode atingir saturação" tone="purple" />
              <MetricCard icon={Sun} label="Nascer do sol" value={observation.current.sunrise ?? "Não informado"} detail="Horário mostrado pela estação" tone="orange" />
              <MetricCard icon={Sun} label="Pôr do sol" value={observation.current.sunset ?? "Não informado"} detail="Horário mostrado pela estação" tone="magenta" />
            </div>
          </section>

          <section className="embrapa-v2-water" id="chuva-e-evapotranspiracao" aria-labelledby="embrapa-v2-water-title">
            <header className="embrapa-v2-section-heading">
              <div>
                <span className="embrapa-v2-eyebrow">Chuva e perda de água</span>
                <h2 id="embrapa-v2-water-title">Acumulados informados pela estação</h2>
              </div>
              <p>
                A chuva representa o pluviômetro da Embrapa. Pancadas isoladas podem gerar acumulados
                muito diferentes em outros pontos de Pelotas.
              </p>
            </header>

            <div className="embrapa-v2-water-columns">
              <article>
                <header><CloudRain aria-hidden="true" /><span><strong>Chuva</strong><small>Água registrada pelo pluviômetro</small></span></header>
                <dl>
                  <div><dt>Hoje</dt><dd>{displayValue(observation.accumulated.rainDaily, " mm")}</dd></div>
                  <div><dt>No mês</dt><dd>{displayValue(observation.accumulated.rainMonthly, " mm")}</dd></div>
                  <div><dt>No ano</dt><dd>{displayValue(observation.accumulated.rainAnnual, " mm")}</dd></div>
                </dl>
              </article>
              <article>
                <header><Waves aria-hidden="true" /><span><strong>Evapotranspiração</strong><small>Água que retorna para a atmosfera</small></span></header>
                <dl>
                  <div><dt>Hoje</dt><dd>{displayValue(observation.accumulated.evapotranspirationDaily, " mm", 2)}</dd></div>
                  <div><dt>No mês</dt><dd>{displayValue(observation.accumulated.evapotranspirationMonthly, " mm", 2)}</dd></div>
                  <div><dt>No ano</dt><dd>{displayValue(observation.accumulated.evapotranspirationAnnual, " mm", 2)}</dd></div>
                </dl>
              </article>
            </div>
          </section>

          <section className="embrapa-v2-section" id="extremos-do-dia" aria-labelledby="embrapa-v2-extremes-title">
            <header className="embrapa-v2-section-heading">
              <div>
                <span className="embrapa-v2-eyebrow">Menores e maiores valores do dia</span>
                <h2 id="embrapa-v2-extremes-title">Extremos informados pela estação</h2>
              </div>
              <p>
                Os horários são reproduzidos como informados pela estação. Valores ausentes não são
                estimados pelo Tempo Pelotas.
              </p>
            </header>

            <div className="embrapa-v2-extremes-grid">
              <article>
                <header><Thermometer aria-hidden="true" /><h3>Temperatura do ar</h3></header>
                <ExtremeValue label="Mínima" observation={observation.extremes.temperatureMin} unit=" °C" />
                <ExtremeValue label="Máxima" observation={observation.extremes.temperatureMax} unit=" °C" />
              </article>
              <article>
                <header><Droplets aria-hidden="true" /><h3>Umidade relativa</h3></header>
                <ExtremeValue label="Mínima" observation={observation.extremes.humidityMin} unit="%" />
                <ExtremeValue label="Máxima" observation={observation.extremes.humidityMax} unit="%" />
              </article>
              <article>
                <header><Droplets aria-hidden="true" /><h3>Ponto de orvalho</h3></header>
                <ExtremeValue label="Mínimo" observation={observation.extremes.dewPointMin ?? { value: null, time: null }} unit=" °C" />
                <ExtremeValue label="Máximo" observation={observation.extremes.dewPointMax ?? { value: null, time: null }} unit=" °C" />
              </article>
              <article>
                <header><Wind aria-hidden="true" /><h3>Vento</h3></header>
                <ExtremeValue label="Maior velocidade" observation={observation.extremes.windSpeedMax} unit=" km/h" />
                <div className="embrapa-v2-extreme-value"><span>Direção atual</span><strong>{observation.current.windDirection ?? "Não informada"}</strong><small>Não representa necessariamente a direção no momento da maior velocidade.</small></div>
              </article>
            </div>
          </section>
        </>
      ) : (
        <section className="embrapa-v2-unavailable" aria-labelledby="embrapa-v2-unavailable-title">
          <Radio aria-hidden="true" />
          <div>
            <span className="embrapa-v2-eyebrow">Estação temporariamente indisponível</span>
            <h2 id="embrapa-v2-unavailable-title">As medições não puderam ser exibidas</h2>
            <p>{observation.error ?? "A estação não respondeu. O portal tentará novamente nas próximas atualizações."}</p>
            <a href={observation.source.url} target="_blank" rel="noopener noreferrer">Abrir página original <ExternalLink aria-hidden="true" /></a>
          </div>
        </section>
      )}

      <section className="embrapa-v2-provenance" id="uso-no-portal" aria-labelledby="embrapa-v2-provenance-title">
        <header className="embrapa-v2-section-heading">
          <div>
            <span className="embrapa-v2-eyebrow">Origem dos dados</span>
            <h2 id="embrapa-v2-provenance-title">Quais informações da Embrapa aparecem no resumo atual</h2>
          </div>
          <p>
            O Tempo Pelotas verifica cada informação separadamente. A Embrapa pode fornecer temperatura
            e umidade, enquanto a previsão das próximas horas vem de outro serviço identificado.
          </p>
        </header>

        <div className="embrapa-v2-provenance-grid">
          <article>
            <Activity aria-hidden="true" />
            <span>Informações usadas agora</span>
            <strong>{usedFields.length}</strong>
            <p>{usedFields.length ? usedFields.join(", ") : "Nenhuma informação do resumo atual veio da Embrapa nesta atualização."}</p>
          </article>
          <article>
            <CalendarClock aria-hidden="true" />
            <span>Dois horários importantes</span>
            <strong>Medição e atualização</strong>
            <p>O horário da medição informa quando o valor foi registrado; a atualização mostra quando o portal consultou a estação.</p>
          </article>
          <article>
            <Scale aria-hidden="true" />
            <span>Por que os valores podem ser diferentes</span>
            <strong>Estação e previsão não medem do mesmo jeito</strong>
            <p>Instrumentos e modelos usam métodos, horários e pontos geográficos diferentes.</p>
          </article>
          <article>
            <MapPin aria-hidden="true" />
            <span>Local da estação</span>
            <strong>{formatNumber(observation.source.altitude, 0)} m de altitude</strong>
            <p>{formatNumber(observation.source.latitude, 3)}, {formatNumber(observation.source.longitude, 3)}. Uma única estação não representa todos os bairros e microclimas de Pelotas.</p>
          </article>
        </div>
      </section>

      <section className="embrapa-v2-actions" aria-label="Outras páginas relacionadas à Estação Embrapa">
        <div>
          <span className="embrapa-v2-eyebrow">Fonte original e comparação</span>
          <h2>Veja a página da Embrapa e compare com a previsão</h2>
        </div>
        <div>
          <a href={observation.source.url} target="_blank" rel="noopener noreferrer">Página da Embrapa <ExternalLink aria-hidden="true" /></a>
          <Link to="/tempo-hoje-pelotas">Previsão de hoje <ArrowRight aria-hidden="true" /></Link>
          <Link to="/historico-climatico-pelotas">Histórico de 30 dias</Link>
          <Link to="/metodologia">Como os dados funcionam</Link>
        </div>
      </section>
    </div>
  );
}
