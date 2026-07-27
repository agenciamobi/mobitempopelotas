import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CloudRain,
  Database,
  ExternalLink,
  Gauge,
  Info,
  Snowflake,
  Table2,
  ThermometerSun,
  TrendingUp,
  Wind,
} from "lucide-react";

import type { HistoricalWeatherDay, WeatherHistoryData } from "@/lib/weather/history.types";

import { WeatherHistoryChart } from "./WeatherHistoryChart";
import "./WeatherHistoryPage.css";
import "./WeatherHistoryRefinement.css";

type WeatherHistoryPageProps = {
  history: WeatherHistoryData;
};

type RecentProfile = {
  rainyDays: number;
  dryDays: number;
  precipitationDaysKnown: number;
  windDaysKnown: number;
  averageAmplitude: number | null;
  temperatureSpan: number | null;
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

function valueOrDash(value: number | null | undefined, suffix: string, digits = 1) {
  if (value === null || value === undefined) return "—";
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: digits })}${suffix}`;
}

function round(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function buildRecentProfile(days: HistoricalWeatherDay[]): RecentProfile {
  const precipitationDays = days.filter((day) => day.precipitation !== null);
  const windDays = days.filter((day) => day.windGust !== null);
  const amplitudes = days.map((day) => day.temperatureMax - day.temperatureMin);
  const highestMaximum = days.length ? Math.max(...days.map((day) => day.temperatureMax)) : null;
  const lowestMinimum = days.length ? Math.min(...days.map((day) => day.temperatureMin)) : null;

  return {
    rainyDays: precipitationDays.filter((day) => (day.precipitation ?? 0) >= 1).length,
    dryDays: precipitationDays.filter((day) => (day.precipitation ?? 0) < 0.1).length,
    precipitationDaysKnown: precipitationDays.length,
    windDaysKnown: windDays.length,
    averageAmplitude: amplitudes.length
      ? round(amplitudes.reduce((total, value) => total + value, 0) / amplitudes.length)
      : null,
    temperatureSpan:
      highestMaximum !== null && lowestMinimum !== null
        ? round(highestMaximum - lowestMinimum)
        : null,
  };
}

function sourceCoverageLabel(history: WeatherHistoryData, profile: RecentProfile) {
  const total = history.days.length;
  if (!total) return "Sem dias válidos";
  const precipitationCoverage = Math.round((profile.precipitationDaysKnown / total) * 100);
  const windCoverage = Math.round((profile.windDaysKnown / total) * 100);
  return `Chuva em ${precipitationCoverage}% dos dias · rajadas em ${windCoverage}%`;
}

export function WeatherHistoryHero({ history }: WeatherHistoryPageProps) {
  const available = history.status !== "unavailable" && history.summary !== null;
  const summary = history.summary;
  const profile = buildRecentProfile(history.days);

  return (
    <section className="history-hero history-hero--retail" aria-labelledby="history-hero-title">
      <div className="history-hero__content">
        <p className="history-kicker">Histórico meteorológico recente</p>
        <h1 id="history-hero-title">Como o tempo variou nos últimos 30 dias em Pelotas.</h1>
        <p className="history-lead">
          Compare máximas, mínimas, chuva e rajadas em dias completos. Este recorte mostra o que ocorreu
          recentemente e não substitui uma normal climatológica de longo prazo.
        </p>
        <div className="history-hero__actions">
          <a href="#comparacao-diaria">Explorar o gráfico <ArrowRight aria-hidden="true" /></a>
          <Link to="/clima-em-pelotas">Entender o clima de Pelotas</Link>
        </div>
      </div>

      <aside className={`history-period-card history-period-card-${history.status}`}>
        <header>
          <span>Período consultado</span>
          <strong>{summary?.periodLabel ?? "Indisponível"}</strong>
          <small>
            {history.source.periodStart && history.source.periodEnd
              ? `${formatDate(history.source.periodStart)} a ${formatDate(history.source.periodEnd)}`
              : "A fonte não devolveu uma série válida."}
          </small>
        </header>

        <div className="history-period-overview">
          <article>
            <CalendarDays aria-hidden="true" />
            <span><strong>{history.days.length || "—"}</strong><small>dias válidos</small></span>
          </article>
          <article>
            <CloudRain aria-hidden="true" />
            <span><strong>{available ? profile.rainyDays : "—"}</strong><small>dias com 1 mm ou mais</small></span>
          </article>
        </div>

        <div className="history-period-source">
          <Database aria-hidden="true" />
          <span>
            <strong>{history.source.name}</strong>
            <small>{sourceCoverageLabel(history, profile)}</small>
          </span>
        </div>

        <footer>Consulta em {formatDateTime(history.source.fetchedAt)}</footer>
      </aside>
    </section>
  );
}

export function WeatherHistoryPage({ history }: WeatherHistoryPageProps) {
  const available = history.status !== "unavailable" && history.summary !== null;
  const summary = history.summary;
  const profile = buildRecentProfile(history.days);
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
    <div className="history-page history-page--retail">
      {datasetSchema ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(datasetSchema).replace(/</g, "\\u003c"),
          }}
        />
      ) : null}

      <nav className="history-chapters" aria-label="Capítulos do histórico meteorológico">
        <a href="#resumo-do-periodo"><span>01</span><strong>Resumo</strong><small>Médias e acumulados</small></a>
        <a href="#comparacao-diaria"><span>02</span><strong>Gráfico</strong><small>7, 14 ou 30 dias</small></a>
        <a href="#perfil-do-periodo"><span>03</span><strong>Perfil</strong><small>Chuva e amplitude</small></a>
        <a href="#destaques-do-periodo"><span>04</span><strong>Extremos</strong><small>Somente do recorte</small></a>
        <a href="#valores-diarios"><span>05</span><strong>Tabela</strong><small>Dados usados nos cálculos</small></a>
      </nav>

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
          <section className="history-summary-section" id="resumo-do-periodo" aria-labelledby="history-summary-title">
            <header className="history-section-heading history-section-heading--compact">
              <div>
                <p className="history-kicker">Visão geral do recorte</p>
                <h2 id="history-summary-title">Médias e acumulados dos dias consultados</h2>
              </div>
              <p>
                Todos os indicadores pertencem apenas ao período informado. Campos ausentes não são
                preenchidos com zero ou estimativas demonstrativas.
              </p>
            </header>

            <div className="history-summary" aria-label="Resumo do período recente">
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
            </div>
          </section>

          <div id="comparacao-diaria" className="history-chart-anchor">
            <WeatherHistoryChart days={history.days} />
          </div>

          <section className="history-profile history-section" id="perfil-do-periodo" aria-labelledby="history-profile-title">
            <div className="history-section-heading">
              <div>
                <p className="history-kicker">Leitura complementar</p>
                <h2 id="history-profile-title">Como o período se distribuiu</h2>
              </div>
              <p>
                A contagem usa somente dias com o campo correspondente disponível. “Sem chuva” significa
                acumulado diário abaixo de 0,1 mm na fonte consultada.
              </p>
            </div>

            <div className="history-profile-grid">
              <article>
                <CloudRain aria-hidden="true" />
                <span>Dias com chuva</span>
                <strong>{profile.rainyDays}</strong>
                <small>Acumulado diário de 1 mm ou mais</small>
              </article>
              <article>
                <CheckCircle2 aria-hidden="true" />
                <span>Dias sem chuva informada</span>
                <strong>{profile.dryDays}</strong>
                <small>Acumulado abaixo de 0,1 mm</small>
              </article>
              <article>
                <Gauge aria-hidden="true" />
                <span>Amplitude média diária</span>
                <strong>{valueOrDash(profile.averageAmplitude, " °C")}</strong>
                <small>Diferença média entre máxima e mínima</small>
              </article>
              <article>
                <TrendingUp aria-hidden="true" />
                <span>Faixa térmica total</span>
                <strong>{valueOrDash(profile.temperatureSpan, " °C")}</strong>
                <small>Da menor mínima à maior máxima do recorte</small>
              </article>
            </div>

            <div className="history-coverage" aria-label="Completude das variáveis do histórico">
              <div>
                <span>Temperatura</span>
                <strong>{history.days.length}/{history.days.length} dias</strong>
                <i><b style={{ width: "100%" }} /></i>
              </div>
              <div>
                <span>Precipitação</span>
                <strong>{profile.precipitationDaysKnown}/{history.days.length} dias</strong>
                <i><b style={{ width: `${history.days.length ? (profile.precipitationDaysKnown / history.days.length) * 100 : 0}%` }} /></i>
              </div>
              <div>
                <span>Rajadas</span>
                <strong>{profile.windDaysKnown}/{history.days.length} dias</strong>
                <i><b style={{ width: `${history.days.length ? (profile.windDaysKnown / history.days.length) * 100 : 0}%` }} /></i>
              </div>
            </div>
          </section>

          <section className="history-section" id="destaques-do-periodo" aria-labelledby="history-records-title">
            <div className="history-section-heading">
              <div>
                <p className="history-kicker">Destaques do período</p>
                <h2 id="history-records-title">Dias que se destacaram na série</h2>
              </div>
              <p>
                Estes são extremos apenas dos dias consultados e do ponto de grade utilizado. Não são
                recordes históricos oficiais de Pelotas.
              </p>
            </div>

            <div className="history-records">
              <article>
                <ThermometerSun aria-hidden="true" />
                <span>Dia mais quente</span>
                <strong>{summary.warmestDay.temperatureMax} °C</strong>
                <p>{summary.warmestDay.weekday}, {summary.warmestDay.label}</p>
              </article>
              <article>
                <Snowflake aria-hidden="true" />
                <span>Noite mais fria</span>
                <strong>{summary.coldestDay.temperatureMin} °C</strong>
                <p>{summary.coldestDay.weekday}, {summary.coldestDay.label}</p>
              </article>
              <article>
                <CloudRain aria-hidden="true" />
                <span>Dia mais chuvoso</span>
                <strong>{valueOrDash(summary.wettestDay?.precipitation ?? null, " mm")}</strong>
                <p>{summary.wettestDay ? `${summary.wettestDay.weekday}, ${summary.wettestDay.label}` : "Precipitação não informada"}</p>
              </article>
              <article>
                <Wind aria-hidden="true" />
                <span>Dia com maior rajada</span>
                <strong>{valueOrDash(summary.windiestDay?.windGust ?? null, " km/h")}</strong>
                <p>{summary.windiestDay ? `${summary.windiestDay.weekday}, ${summary.windiestDay.label}` : "Rajadas não informadas"}</p>
              </article>
            </div>
          </section>

          <section className="history-section" id="valores-diarios" aria-labelledby="history-table-title">
            <div className="history-section-heading">
              <div>
                <p className="history-kicker">Série diária acessível</p>
                <h2 id="history-table-title">Valores usados nos cálculos</h2>
              </div>
              <p>
                A tabela permite conferir cada data e complementa o gráfico. Campos não publicados pela
                fonte aparecem como “não informado”.
              </p>
            </div>

            <div className="history-table-intro">
              <Table2 aria-hidden="true" />
              <span><strong>{history.days.length} linhas de dados</strong><small>Ordem da data mais recente para a mais antiga.</small></span>
            </div>

            <div className="history-table-wrap">
              <table className="history-table">
                <caption>Temperatura, chuva e rajadas dos últimos dias completos em Pelotas</caption>
                <thead>
                  <tr>
                    <th scope="col">Data</th>
                    <th scope="col">Máxima</th>
                    <th scope="col">Mínima</th>
                    <th scope="col">Amplitude</th>
                    <th scope="col">Chuva</th>
                    <th scope="col">Rajada</th>
                  </tr>
                </thead>
                <tbody>
                  {[...history.days].reverse().map((day) => (
                    <tr key={day.date}>
                      <th scope="row">{day.weekday}, {day.label}</th>
                      <td>{day.temperatureMax} °C</td>
                      <td>{day.temperatureMin} °C</td>
                      <td>{round(day.temperatureMax - day.temperatureMin)} °C</td>
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
              O portal não substitui a ausência da fonte por números simulados. O gráfico e os resumos
              voltarão a aparecer quando uma série real estiver disponível.
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
            Esta página descreve dias recentes. Climatologia exige séries longas, períodos padronizados e
            controle de qualidade. O recorte não deve ser usado isoladamente para afirmar que um mês foi
            normal, quente, frio, seco ou chuvoso em relação ao clima de Pelotas.
          </p>
          <Link to="/clima-em-pelotas">Entender clima e sazonalidade <ArrowRight aria-hidden="true" /></Link>
        </div>
      </section>

      <section className="history-actions" aria-label="Ações relacionadas ao histórico meteorológico">
        <div>
          <p className="history-kicker">Fonte e contexto</p>
          <h2>Compare a série recente com observação e previsão</h2>
        </div>
        <div>
          <a className="history-primary-action" href={history.source.url} target="_blank" rel="noopener noreferrer">
            Fonte histórica <ExternalLink aria-hidden="true" />
          </a>
          <Link className="history-secondary-action" to="/estacao-embrapa-pelotas">
            Estação Embrapa <ArrowRight aria-hidden="true" />
          </Link>
          <Link className="history-secondary-action" to="/previsao-7-dias-pelotas">Previsão de 7 dias</Link>
          <Link className="history-secondary-action" to="/metodologia">Metodologia e fontes</Link>
        </div>
      </section>
    </div>
  );
}
