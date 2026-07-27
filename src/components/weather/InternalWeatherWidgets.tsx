import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Info,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { useMemo, type ReactNode } from "react";

import { HomeForecastStory } from "@/components/weather/HomeForecastStory";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

import "./InternalWeatherWidgets.css";
import "./InternalWeatherWidgetsContainment.css";
import "./InternalWeatherWidgetsRefinement.css";

type InternalPageChapter = {
  href: string;
  label: string;
  detail: string;
};

type InternalPageChaptersProps = {
  items: InternalPageChapter[];
  label: string;
};

type InternalForecastStoryProps = {
  data: WeatherIntelligenceData;
  includeTrend?: boolean;
};

type InternalPracticalSummaryProps = {
  data: WeatherIntelligenceData;
  title: string;
  footer?: ReactNode;
};

function formatNumber(value: number | null | undefined, suffix = "") {
  if (value === null || value === undefined) return "Não informado";

  return `${new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(value)}${suffix}`;
}

function formatWind(
  speed: number | null | undefined,
  direction: string | null | undefined,
) {
  const speedLabel = formatNumber(speed, " km/h");
  return speed !== null && speed !== undefined && direction
    ? `${speedLabel} · ${direction}`
    : speedLabel;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "horário não informado";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "horário não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function sourceName(
  source: string | null | undefined,
  forecastProvider: string | null | undefined,
) {
  if (source === "embrapa") return "Embrapa";
  if (source === "inmet") return "INMET";
  if (source === "cppmet") return "CPPMet/UFPel";
  if (source === "met-norway") return "MET Norway";
  if (source === "open-meteo") return forecastProvider ?? "Open-Meteo";
  return "Origem não informada";
}

export function InternalPageChapters({ items, label }: InternalPageChaptersProps) {
  return (
    <nav className="internal-page-chapters" aria-label={label}>
      {items.map((item, index) => (
        <a href={item.href} key={item.href}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <strong>{item.label}</strong>
          <small>{item.detail}</small>
        </a>
      ))}
    </nav>
  );
}

export function InternalForecastStory({
  data,
  includeTrend = false,
}: InternalForecastStoryProps) {
  const scopedData = useMemo<WeatherIntelligenceData>(() => {
    if (includeTrend) return data;

    return {
      ...data,
      weather: {
        ...data.weather,
        daily: data.weather.daily.slice(0, 1),
      },
    };
  }, [data, includeTrend]);

  return (
    <div
      className={`internal-forecast-widget${includeTrend ? " includes-trend" : " is-today-only"}`}
    >
      <HomeForecastStory data={scopedData} context="today-page" />
    </div>
  );
}

export function InternalObservationWidget({ data }: { data: WeatherIntelligenceData }) {
  const weather = data.weather;
  const current = weather.current;
  const hasMeasurement =
    current?.temperature !== null && current?.temperature !== undefined;
  const observed = hasMeasurement && weather.quality.currentSource === "embrapa";
  const forecastProvider = weather.quality.forecastProvider;

  const metrics = current
    ? [
        {
          label: "Umidade do ar",
          value: formatNumber(current.humidity, "%"),
          source: sourceName(weather.currentProvenance.humidity, forecastProvider),
        },
        {
          label: "Vento observado",
          value: formatWind(current.windSpeed, current.windDirection),
          source: sourceName(weather.currentProvenance.windSpeed, forecastProvider),
        },
        {
          label: "Pressão atmosférica",
          value: formatNumber(current.pressure, " hPa"),
          source: sourceName(weather.currentProvenance.pressure, forecastProvider),
        },
        {
          label: "Pôr do sol",
          value:
            current.sunset ?? weather.inmetForecast[0]?.sunset ?? "Não informado",
          source: sourceName(weather.currentProvenance.sunset, forecastProvider),
        },
      ]
    : [];

  return (
    <section
      className="home-observation-story internal-observation-widget"
      id="medicao-atual"
      aria-labelledby="internal-observation-title"
    >
      <div className="home-observation-story__intro">
        <span className="eyebrow">Condição atual</span>
        <h2 id="internal-observation-title">O que a estação observa agora em Pelotas</h2>
        <p>Temperatura, umidade, vento e pressão com a origem identificada em cada valor.</p>
        <Link to="/estacao-embrapa-pelotas">
          Abrir dados completos da estação <span aria-hidden="true">→</span>
        </Link>
      </div>

      {current && hasMeasurement ? (
        <div className="home-observation-story__reading">
          <div className="home-observation-temperature">
            <small className="internal-observation-status">
              {observed ? (
                <>
                  <CheckCircle2 aria-hidden="true" /> Dados observados pela Embrapa
                </>
              ) : (
                <>
                  <Info aria-hidden="true" /> Valor atual estimado pelo modelo
                </>
              )}
            </small>
            <strong>{formatNumber(current.temperature)}°</strong>
            <span>
              {current.feelsLike === null || current.feelsLike === undefined
                ? "Sensação térmica não informada"
                : `Sensação térmica de ${formatNumber(current.feelsLike)}°`}
            </span>
            <small className="internal-observation-updated">
              Leitura atualizada em {formatDateTime(current.observedAt ?? weather.source.fetchedAt)}
            </small>
          </div>

          <dl>
            {metrics.map((metric) => (
              <div key={metric.label}>
                <dt>{metric.label}</dt>
                <dd>
                  <span>{metric.value}</span>
                  <small>{metric.source}</small>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <div className="home-observation-story__unavailable internal-observation-unavailable">
          <RefreshCw aria-hidden="true" />
          <strong>Medição local indisponível agora</strong>
          <span>A previsão continua disponível e identificada separadamente.</span>
        </div>
      )}
    </section>
  );
}

export function InternalPracticalSummary({
  data,
  title,
  footer,
}: InternalPracticalSummaryProps) {
  return (
    <section
      className="internal-practical-widget"
      id="leitura-do-dia"
      aria-labelledby="internal-practical-title"
    >
      <div className="internal-practical-widget__intro">
        <span className="eyebrow">Para organizar a rotina</span>
        <h2 id="internal-practical-title">{title}</h2>
        <p>{data.brief.summary}</p>
        <small>Resumo do Tempo Pelotas com base nas fontes identificadas nesta página.</small>
      </div>

      <div className="internal-practical-widget__cards">
        <article>
          <span>
            <CheckCircle2 aria-hidden="true" /> Condições favoráveis
          </span>
          {data.brief.highlights.length ? (
            <ul>
              {data.brief.highlights.slice(0, 2).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>Nenhuma condição favorável adicional foi destacada.</p>
          )}
        </article>

        <article className="is-caution">
          <span>
            <TriangleAlert aria-hidden="true" /> O que exige atenção
          </span>
          {data.brief.cautions.length ? (
            <ul>
              {data.brief.cautions.slice(0, 2).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>Nenhum ponto adicional de atenção foi indicado.</p>
          )}
        </article>
      </div>

      {footer ? (
        <div className="internal-practical-widget__footer">{footer}</div>
      ) : null}
    </section>
  );
}

export function InternalNextStep() {
  return (
    <Link className="internal-next-step" to="/tempo-amanha-pelotas">
      <span>
        <small>Planeje o próximo dia</small>
        <strong>Ver previsão para amanhã</strong>
      </span>
      <ArrowRight aria-hidden="true" />
    </Link>
  );
}
