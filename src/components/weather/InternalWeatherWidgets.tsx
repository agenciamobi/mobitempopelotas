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
      <HomeForecastStory data={scopedData} />
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
          label: "Umidade",
          value: formatNumber(current.humidity, "%"),
          source: sourceName(weather.currentProvenance.humidity, forecastProvider),
        },
        {
          label: "Vento agora",
          value: formatNumber(current.windSpeed, " km/h"),
          source: sourceName(weather.currentProvenance.windSpeed, forecastProvider),
        },
        {
          label: "Pressão",
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
        <span className="eyebrow">Medição local</span>
        <h2 id="internal-observation-title">Medição local mais recente</h2>
        <p>Leitura em Pelotas com a origem identificada em cada indicador.</p>
        <Link to="/estacao-embrapa-pelotas">
          Ver detalhes da estação <span aria-hidden="true">→</span>
        </Link>
      </div>

      {current && hasMeasurement ? (
        <div className="home-observation-story__reading">
          <div className="home-observation-temperature">
            <small className="internal-observation-status">
              {observed ? (
                <>
                  <CheckCircle2 aria-hidden="true" /> Observação Embrapa
                </>
              ) : (
                <>
                  <Info aria-hidden="true" /> Atual complementada por modelo
                </>
              )}
            </small>
            <strong>{formatNumber(current.temperature)}°</strong>
            <span>
              {current.feelsLike === null || current.feelsLike === undefined
                ? "Sensação não informada"
                : `Sensação de ${formatNumber(current.feelsLike)} °C`}
            </span>
            <small className="internal-observation-updated">
              Atualizado em {formatDateTime(current.observedAt ?? weather.source.fetchedAt)}
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
          <strong>Leitura local temporariamente indisponível</strong>
          <span>A previsão por modelo continua ativa e separada da observação.</span>
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
  const summaryOrigin =
    data.intelligence.origin === "gemini"
      ? `Síntese assistida por ${data.intelligence.model ?? "Gemini"}`
      : "Síntese por regras do portal";

  return (
    <section
      className="internal-practical-widget"
      id="leitura-do-dia"
      aria-labelledby="internal-practical-title"
    >
      <div className="internal-practical-widget__intro">
        <span className="eyebrow">Leitura prática</span>
        <h2 id="internal-practical-title">{title}</h2>
        <p>{data.brief.summary}</p>
        <small>{summaryOrigin}. Dados vinculados às fontes meteorológicas.</small>
      </div>

      <div className="internal-practical-widget__cards">
        <article>
          <span>
            <CheckCircle2 aria-hidden="true" /> Para a rotina
          </span>
          {data.brief.highlights.length ? (
            <ul>
              {data.brief.highlights.slice(0, 2).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>Sem outros destaques para o período.</p>
          )}
        </article>

        <article className="is-caution">
          <span>
            <TriangleAlert aria-hidden="true" /> Pontos de atenção
          </span>
          {data.brief.cautions.length ? (
            <ul>
              {data.brief.cautions.slice(0, 2).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p>Sem atenção adicional indicada pelas fontes.</p>
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
        <small>Próxima leitura</small>
        <strong>Como fica o tempo amanhã</strong>
      </span>
      <ArrowRight aria-hidden="true" />
    </Link>
  );
}
