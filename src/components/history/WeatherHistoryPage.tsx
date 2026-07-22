import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CloudRain,
  Database,
  ExternalLink,
  Info,
  Snowflake,
  ThermometerSun,
  TrendingUp,
  Wind,
} from "lucide-react";

import type { WeatherHistoryData } from "@/lib/weather/history.types";

import { WeatherHistoryChart } from "./WeatherHistoryChart";
import "./WeatherHistoryPage.css";

type WeatherHistoryPageProps = {
  history: WeatherHistoryData;
};

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Horário não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function formatDate(value: string | null) {
  if (!value) return "Data não informada";
  const date = new Date(`${value}T12:00:00-03:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function valueOrDash(value: number | null, suffix: string, digits = 1) {
  if (value === null) return "—";
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: digits })}${suffix}`;
}

export function WeatherHistoryPage({ history }: WeatherHistoryPageProps) {
  const available = history.status !== "unavailable" && history.summary !== null;
  const summary = history.summary;
  const datasetSchema = available
    ? {
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: "Histórico meteorológico recente de Pelotas",
        description:
          "Temperaturas máximas e mínimas, precipitação e rajadas dos últimos 30 dias completos em Pelotas, Rio Grande do Sul.",
        spatialCoverage: {
          "@type": "Place",
          name: "Pelotas, Rio Grande do Sul, Brasil",
          geo: {
            "@type": "GeoCoordinates",
            latitude: -31.7654,
            longitude: -52.3376,
          },
        },
        temporalCoverage: `${history.source.periodStart}/${history.source.periodEnd}`,
        dateModified: history.source.fetchedAt,
        isBasedOn: history.source.url,
        isAccessibleForFree: true,
      }
    : null;

  return (
    <div className="history-page">
      {datasetSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(datasetSchema).replace(/</g, "\\u003c"),
          }}
        />
      ) : null}

      <header className="history-hero">
        <div>
          <Link className="history-back-link" to="/">
            <ArrowLeft aria-hidden="true" /> Tempo agora
          </Link>
          <p className="history-kicker">Histórico meteorológico recente</p>
          <h1>Como foi o tempo nos últimos 30 dias em Pelotas</h1>
          <p className="history-lead">
            Compare máximas, mínimas, chuva e rajadas em dias completos. Nenhum valor demonstrativo
            é usado quando a fonte histórica está indisponível.
          </p>
          <div className="history-hero-meta">
            <span>
              <CalendarDays aria-hidden="true" /> {history.days.length} dias analisados
            </span>
            <span>
              <Database aria-hidden="true" /> {history.source.name}
            </span>
          </div>
        </div>

        <aside className={`history-period-card history-period-card-${history.status}`}>
          <span>Período consultado</span>
          <strong>{summary?.periodLabel ?? "Indisponível"}</strong>
          <small>
            {history.source.periodStart && history.source.periodEnd
              ? `${formatDate(history.source.periodStart)} a ${formatDate(history.source.periodEnd)}`
              : "A fonte não devolveu uma série válida."}
          </small>
          <em>Consulta em {formatDateTime(history.source.fetchedAt)}</em>
        </aside>
      </header>

      {history.status === "partial" ? (
        <div className="history-status history-status-partial" role="status">
          <Info aria-hidden="true" />
          <div>
            <strong>Série parcial</strong>
            <span>{history.error}</span>
          </div>
        </div>
      ) : null}

      {available && summary ? (
        <>
          <section className="history-summary" aria-label="Resumo do período recente">
            <article>
              <ThermometerSun aria-hidden="true" />
              <span>Média das máximas</span>
              <strong>{valueOrDash(summary.averageMax, " °C")}</strong>
              <small>Média das temperaturas máximas diárias</small>
            </article>
            <article>
              <Snowflake aria-hidden="true" />
              <span>Média das mínimas</span>
              <strong>{valueOrDash(summary.averageMin, " °C")}</strong>
              <small>Média das temperaturas mínimas diárias</small>
            </article>
            <article>
              <CloudRain aria-hidden="true" />
              <span>Chuva no período</span>
              <strong>{valueOrDash(summary.totalPrecipitation, " mm")}</strong>
              <small>Soma dos acumulados diários informados</small>
            </article>
            <article>
              <Wind aria-hidden="true" />
              <span>Rajada mais forte</span>
              <strong>{valueOrDash(summary.strongestWindGust, " km/h")}</strong>
              <small>Maior rajada diária disponível</small>
            </article>
          </section>

          <WeatherHistoryChart days={history.days} />

          <section className="history-section" aria-labelledby="history-records-title">
            <div className="history-section-heading">
              <div>
                <p className="history-kicker">Destaques do período</p>
                <h2 id="history-records-title">Dias que se destacaram na série</h2>
              </div>
              <p>
                Os recordes abaixo valem apenas para o intervalo consultado e para o ponto de grade
                da fonte. Não representam recordes históricos oficiais do município.
              </p>
            </div>

            <div className="history-records">
              <article>
                <ThermometerSun aria-hidden="true" />
                <span>Dia mais quente</span>
                <strong>{summary.warmestDay.temperatureMax} °C</strong>
                <p>
                  {summary.warmestDay.weekday}, {summary.warmestDay.label}
                </p>
              </article>
              <article>
                <Snowflake aria-hidden="true" />
                <span>Noite mais fria</span>
                <strong>{summary.coldestDay.temperatureMin} °C</strong>
                <p>
                  {summary.coldestDay.weekday}, {summary.coldestDay.label}
                </p>
              </article>
              <article>
                <CloudRain aria-hidden="true" />
                <span>Dia mais chuvoso</span>
                <strong>{valueOrDash(summary.wettestDay?.precipitation ?? null, " mm")}</strong>
                <p>
                  {summary.wettestDay
                    ? `${summary.wettestDay.weekday}, ${summary.wettestDay.label}`
                    : "Precipitação não informada"}
                </p>
              </article>
              <article>
                <Wind aria-hidden="true" />
                <span>Dia com maior rajada</span>
                <strong>{valueOrDash(summary.windiestDay?.windGust ?? null, " km/h")}</strong>
                <p>
                  {summary.windiestDay
                    ? `${summary.windiestDay.weekday}, ${summary.windiestDay.label}`
                    : "Rajadas não informadas"}
                </p>
              </article>
            </div>
          </section>

          <section className="history-section" aria-labelledby="history-table-title">
            <div className="history-section-heading">
              <div>
                <p className="history-kicker">Série diária acessível</p>
                <h2 id="history-table-title">Valores usados nos cálculos</h2>
              </div>
              <p>
                A tabela complementa o gráfico e permite verificar cada data. Campos não publicados
                pela fonte aparecem como “não informado”.
              </p>
            </div>

            <div className="history-table-wrap">
              <table className="history-table">
                <caption>
                  Temperatura, chuva e rajadas dos últimos dias completos em Pelotas
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Data</th>
                    <th scope="col">Máxima</th>
                    <th scope="col">Mínima</th>
                    <th scope="col">Chuva</th>
                    <th scope="col">Rajada</th>
                  </tr>
                </thead>
                <tbody>
                  {[...history.days].reverse().map((day) => (
                    <tr key={day.date}>
                      <th scope="row">
                        {day.weekday}, {day.label}
                      </th>
                      <td>{day.temperatureMax} °C</td>
                      <td>{day.temperatureMin} °C</td>
                      <td>{valueOrDash(day.precipitation, " mm")}</td>
                      <td>{valueOrDash(day.windGust, " km/h")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <section className="history-unavailable" aria-labelledby="history-unavailable-title">
          <AlertTriangle aria-hidden="true" />
          <div>
            <p className="history-kicker">Dados temporariamente indisponíveis</p>
            <h2 id="history-unavailable-title">O histórico recente não pôde ser carregado</h2>
            <p>
              O portal não substitui a ausência da fonte por números simulados. O gráfico e os
              resumos voltarão a aparecer quando uma série real estiver disponível.
            </p>
            <small>{history.error}</small>
          </div>
        </section>
      )}

      <section className="history-methodology" aria-labelledby="history-methodology-title">
        <TrendingUp aria-hidden="true" />
        <div>
          <p className="history-kicker">Interpretação correta</p>
          <h2 id="history-methodology-title">Histórico recente não é normal climatológica</h2>
          <p>
            Esta página descreve o comportamento dos últimos dias. Climatologia exige séries longas,
            controle de qualidade e períodos padronizados. Portanto, estes dados não devem ser
            usados para afirmar que um mês foi “normal” ou para definir tendências climáticas de
            longo prazo.
          </p>
          <p>
            A fonte é modelada para a região de Pelotas e pode diferir de instrumentos instalados em
            locais específicos, como a Estação Embrapa.
          </p>
        </div>
      </section>

      <section
        className="history-actions"
        aria-label="Ações relacionadas ao histórico meteorológico"
      >
        <div>
          <p className="history-kicker">Fonte e contexto</p>
          <h2>Compare a série recente com medições e previsão</h2>
        </div>
        <div>
          <a
            className="history-primary-action"
            href={history.source.url}
            target="_blank"
            rel="noreferrer"
          >
            Fonte histórica <ExternalLink aria-hidden="true" />
          </a>
          <Link className="history-secondary-action" to="/estacao-embrapa-pelotas">
            Estação Embrapa <ArrowRight aria-hidden="true" />
          </Link>
          <Link className="history-secondary-action" to="/metodologia">
            Metodologia e fontes
          </Link>
        </div>
      </section>
    </div>
  );
}
