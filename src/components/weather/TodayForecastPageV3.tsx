import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Cloud,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSun,
  Droplets,
  Gauge,
  Info,
  Moon,
  Navigation,
  Radar,
  Sun,
  Sunrise,
  Sunset,
  Thermometer,
  Wind,
  type LucideIcon,
} from "lucide-react";

import type { InmetAlert, InmetAlertSeverity } from "@/lib/weather/official-sources.types";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import type { HourlyForecast, WeatherIconName } from "@/lib/weather/types";
import { useOpenMeteoIntelligenceRecovery } from "@/production/lib/open-meteo-browser-recovery";

import "./TodayForecastPageV3.css";

const iconMap: Record<WeatherIconName, LucideIcon> = {
  sun: Sun,
  moon: Moon,
  "partly-cloudy": CloudSun,
  "partly-cloudy-night": CloudMoon,
  cloud: Cloud,
  rain: CloudRain,
  storm: CloudLightning,
  wind: Wind,
};

const confidenceLabels = {
  high: "Alta confiança",
  medium: "Confiança moderada",
  low: "Baixa confiança",
} as const;

const alertSeverityRank: Record<InmetAlertSeverity, number> = {
  "great-danger": 4,
  danger: 3,
  potential: 2,
  unknown: 1,
};

function WeatherGlyph({ name, size = 42 }: { name: WeatherIconName | null; size?: number }) {
  const Icon = name ? iconMap[name] : Cloud;
  return <Icon aria-hidden="true" size={size} strokeWidth={1.65} />;
}

function formatNumber(value: number | null, suffix = "") {
  return value === null ? "Não informado" : `${value}${suffix}`;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "horário não informado";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "horário não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(parsed);
}

function formatToday() {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

function sourceName(source: string | null | undefined, forecastProvider: string | null) {
  if (source === "embrapa") return "Embrapa";
  if (source === "inmet") return "INMET";
  if (source === "cppmet") return "CPPMet/UFPel";
  if (source === "met-norway") return "MET Norway";
  if (source === "open-meteo") return forecastProvider ?? "Open-Meteo";
  return "Origem não informada";
}

function currentSourceLabel(data: WeatherIntelligenceData) {
  const source = data.weather.quality.currentSource;
  if (source === "embrapa") return "Medição observada pela Embrapa Clima Temperado";
  if (source === "met-norway") return "Condição estimada pelo MET Norway";
  if (source === "open-meteo") {
    return `Condição estimada por ${data.weather.quality.forecastProvider ?? "Open-Meteo"}`;
  }
  return "Origem da condição atual não informada";
}

function pickRelevantAlert(alerts: InmetAlert[]) {
  return [...alerts]
    .filter((alert) => alert.period === "active" || alert.period === "upcoming")
    .sort((left, right) => {
      const relevanceDifference = Number(right.relevance === "pelotas") - Number(left.relevance === "pelotas");
      if (relevanceDifference !== 0) return relevanceDifference;

      const periodDifference = Number(right.period === "active") - Number(left.period === "active");
      if (periodDifference !== 0) return periodDifference;

      const severityDifference = alertSeverityRank[right.severity] - alertSeverityRank[left.severity];
      if (severityDifference !== 0) return severityDifference;

      return new Date(right.sentAt ?? 0).getTime() - new Date(left.sentAt ?? 0).getTime();
    })[0] ?? null;
}

function alertValidity(alert: InmetAlert) {
  if (alert.period === "active" && alert.expiresAt) {
    return `Em vigor até ${formatDateTime(alert.expiresAt)}`;
  }
  if (alert.period === "active" && alert.startsAt) {
    return `Em vigor desde ${formatDateTime(alert.startsAt)}`;
  }
  if (alert.period === "active") return "Em vigor — horário não informado pelo INMET";
  if (alert.startsAt) return `Previsto a partir de ${formatDateTime(alert.startsAt)}`;
  return "Período ainda não informado pelo INMET";
}

function strongestWind(hour: HourlyForecast) {
  return hour.windGust ?? hour.windSpeed;
}

function maxBy<T>(items: T[], value: (item: T) => number) {
  return items.reduce<T | null>((winner, item) => {
    if (!winner) return item;
    return value(item) > value(winner) ? item : winner;
  }, null);
}

function ForecastUnavailable() {
  return (
    <section className="today-v3-unavailable" aria-labelledby="today-v3-unavailable-title">
      <p>Tempo Pelotas</p>
      <h1 id="today-v3-unavailable-title">A previsão de hoje está em atualização</h1>
      <span>
        As fontes não forneceram dados suficientes para montar esta página. Nenhum valor demonstrativo
        foi inserido.
      </span>
      <Link to="/">
        <ArrowLeft aria-hidden="true" /> Voltar à visão geral
      </Link>
    </section>
  );
}

export function TodayForecastPageV3({ data }: { data: WeatherIntelligenceData }) {
  const recoveredData = useOpenMeteoIntelligenceRecovery(data);
  const weather = recoveredData.weather;
  const current = weather.current;
  const today = weather.daily[0];
  const nextHours = weather.hourly.slice(0, 12);

  if (!current && !today && nextHours.length === 0) return <ForecastUnavailable />;

  const observed = weather.quality.currentSource === "embrapa";
  const condition = current?.condition ?? "Condição atual em atualização";
  const title = current
    ? `${condition} agora em Pelotas.`
    : today
      ? `Hoje em Pelotas: mínima de ${today.min}° e máxima de ${today.max}°.`
      : "Tempo hoje em Pelotas.";
  const lead = current && today
    ? `A leitura atual marca ${formatNumber(current.temperature, "°")}, com sensação de ${formatNumber(current.feelsLike, "°")}. Para o restante do dia, a previsão varia entre ${today.min}° e ${today.max}° e indica ${today.rainChance === null ? "probabilidade de chuva não informada" : `${today.rainChance}% de chance máxima de chuva`}.`
    : recoveredData.brief.summary;
  const relevantAlert = pickRelevantAlert(weather.alerts);
  const hottestHour = maxBy(nextHours, (hour) => hour.temperature);
  const rainyHours = nextHours.filter((hour) => hour.precipitationProbability !== null);
  const wettestHour = maxBy(rainyHours, (hour) => hour.precipitationProbability ?? 0);
  const windiestHour = maxBy(nextHours, strongestWind);
  const hourlyMinimum = nextHours.length ? Math.min(...nextHours.map((hour) => hour.temperature)) : 0;
  const hourlyMaximum = nextHours.length ? Math.max(...nextHours.map((hour) => hour.temperature)) : 0;
  const hourlyRange = Math.max(1, hourlyMaximum - hourlyMinimum);
  const summaryOrigin = recoveredData.intelligence.origin === "gemini"
    ? `Síntese assistida por ${recoveredData.intelligence.model ?? "Gemini"}`
    : "Síntese por regras do portal";

  const metrics = current
    ? [
        {
          icon: Droplets,
          label: "Umidade",
          value: formatNumber(current.humidity, "%"),
          source: sourceName(weather.currentProvenance.humidity, weather.quality.forecastProvider),
        },
        {
          icon: Wind,
          label: "Vento médio",
          value: formatNumber(current.windSpeed, " km/h"),
          source: sourceName(weather.currentProvenance.windSpeed, weather.quality.forecastProvider),
        },
        {
          icon: Navigation,
          label: "Direção",
          value: current.windDirection ?? "Não informada",
          source: sourceName(weather.currentProvenance.windDirection, weather.quality.forecastProvider),
        },
        {
          icon: Gauge,
          label: "Pressão",
          value: formatNumber(current.pressure, " hPa"),
          source: sourceName(weather.currentProvenance.pressure, weather.quality.forecastProvider),
        },
        {
          icon: Sunrise,
          label: "Nascer do sol",
          value: current.sunrise ?? "Não informado",
          source: sourceName(weather.currentProvenance.sunrise, weather.quality.forecastProvider),
        },
        {
          icon: Sunset,
          label: "Pôr do sol",
          value: current.sunset ?? "Não informado",
          source: sourceName(weather.currentProvenance.sunset, weather.quality.forecastProvider),
        },
      ]
    : [];

  return (
    <div className="today-v3-page">
      <header className="today-v3-hero" id="agora">
        <div className="today-v3-hero-copy">
          <Link className="today-v3-back-link" to="/">
            <ArrowLeft aria-hidden="true" /> Visão geral
          </Link>

          <div className="today-v3-context">
            <span>{observed ? "Observação local" : "Estimativa atual"}</span>
            <small>Hoje · {formatToday()}</small>
          </div>

          <h1>{title}</h1>
          <p className="today-v3-lead">{lead}</p>

          <dl className="today-v3-hero-facts" aria-label="Resumo do restante do dia">
            <div>
              <dt>Faixa prevista</dt>
              <dd>{today ? `${today.min}° / ${today.max}°` : "—"}</dd>
            </div>
            <div>
              <dt>Chuva máxima</dt>
              <dd>{today?.rainChance === null || !today ? "Não informada" : `${today.rainChance}%`}</dd>
            </div>
            <div>
              <dt>Pôr do sol</dt>
              <dd>{current?.sunset ?? "Não informado"}</dd>
            </div>
          </dl>
        </div>

        <aside className="today-v3-now" aria-label="Condição atual em Pelotas">
          <div className="today-v3-now-topline">
            <span>{observed ? "Observado agora" : "Estimado agora"}</span>
            <div className={`today-v3-quality is-${weather.quality.confidence}`}>
              {weather.quality.confidence === "high" ? (
                <CheckCircle2 aria-hidden="true" />
              ) : (
                <Info aria-hidden="true" />
              )}
              <strong>{confidenceLabels[weather.quality.confidence]}</strong>
              <small>{weather.quality.score}/100</small>
            </div>
          </div>

          <div className="today-v3-now-reading">
            <span className="today-v3-weather-icon">
              <WeatherGlyph name={current?.icon ?? today?.icon ?? null} size={88} />
            </span>
            <div>
              <strong>{current?.temperature === null || !current ? "—" : `${current.temperature}°`}</strong>
              <span>{condition}</span>
            </div>
          </div>

          <dl className="today-v3-now-details">
            <div>
              <dt>Sensação</dt>
              <dd>{formatNumber(current?.feelsLike ?? null, "°")}</dd>
            </div>
            <div>
              <dt>Umidade</dt>
              <dd>{formatNumber(current?.humidity ?? null, "%")}</dd>
            </div>
            <div>
              <dt>Vento</dt>
              <dd>{formatNumber(current?.windSpeed ?? null, " km/h")}</dd>
            </div>
          </dl>

          <p className="today-v3-now-source">
            <span>{currentSourceLabel(recoveredData)}</span>
            <small>Atualizado em {formatDateTime(current?.observedAt ?? weather.source.fetchedAt)}</small>
          </p>
        </aside>
      </header>

      <nav className="today-v3-chapters" aria-label="Navegação da previsão de hoje">
        <a href="#agora"><span>01</span><strong>Agora</strong><small>Condição atual</small></a>
        <a href="#medicao-atual"><span>02</span><strong>Leitura local</strong><small>Campo por campo</small></a>
        <a href="#proximas-horas"><span>03</span><strong>Próximas horas</strong><small>Evolução do dia</small></a>
        <a href="#leitura-do-dia"><span>04</span><strong>Leitura do dia</strong><small>Destaques e cautelas</small></a>
        <a href="#como-interpretar-hoje"><span>05</span><strong>Entenda</strong><small>Metodologia e FAQ</small></a>
      </nav>

      {relevantAlert ? (
        <section className={`today-v3-alert is-${relevantAlert.severity}`} aria-label="Aviso meteorológico relevante">
          <AlertTriangle aria-hidden="true" />
          <div>
            <p><span>{relevantAlert.severityLabel}</span><small>{alertValidity(relevantAlert)}</small></p>
            <strong>{relevantAlert.headline || relevantAlert.event}</strong>
          </div>
          <Link to="/alertas">Consultar aviso <ArrowRight aria-hidden="true" /></Link>
        </section>
      ) : null}

      {nextHours.length > 0 ? (
        <section className="today-v3-window" aria-labelledby="today-v3-window-title">
          <header>
            <div>
              <p className="today-v3-kicker">Janela do restante do dia</p>
              <h2 id="today-v3-window-title">Os próximos movimentos mais relevantes</h2>
            </div>
            <span>{nextHours.length} horários comparados</span>
          </header>
          <div className="today-v3-window-grid">
            <article>
              <Thermometer aria-hidden="true" />
              <span>Maior temperatura</span>
              <strong>{hottestHour ? `${hottestHour.temperature}°` : "—"}</strong>
              <small>{hottestHour?.time ?? "Horário não informado"}</small>
            </article>
            <article>
              <Droplets aria-hidden="true" />
              <span>Maior chance de chuva</span>
              <strong>{wettestHour?.precipitationProbability === null || !wettestHour ? "Não informada" : `${wettestHour.precipitationProbability}%`}</strong>
              <small>{wettestHour?.time ?? "Fonte sem probabilidade"}</small>
            </article>
            <article>
              <Wind aria-hidden="true" />
              <span>Vento mais forte</span>
              <strong>{windiestHour ? `${strongestWind(windiestHour)} km/h` : "—"}</strong>
              <small>{windiestHour?.time ?? "Horário não informado"}</small>
            </article>
          </div>
        </section>
      ) : null}

      {current ? (
        <section className="today-v3-observation" id="medicao-atual" aria-labelledby="today-v3-observation-title">
          <header className="today-v3-section-heading">
            <div>
              <p className="today-v3-kicker">Leitura atual e procedência</p>
              <h2 id="today-v3-observation-title">Cada campo mantém sua origem identificada</h2>
            </div>
            <Link to="/estacao-embrapa-pelotas">Abrir estação Embrapa <ArrowRight aria-hidden="true" /></Link>
          </header>

          <div className="today-v3-observation-layout">
            <div className="today-v3-metrics">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <article key={metric.label}>
                    <Icon aria-hidden="true" />
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                    <small>Fonte: {metric.source}</small>
                  </article>
                );
              })}
            </div>

            <aside className="today-v3-integrity">
              <div>
                <Info aria-hidden="true" />
                <p className="today-v3-kicker">Medição não é previsão</p>
              </div>
              <h3>{observed ? "A condição principal vem de uma estação local." : "A condição atual está em contingência por modelo."}</h3>
              <p>
                {observed
                  ? "Temperatura, umidade, pressão e vento podem vir da Embrapa. Campos ausentes podem ser complementados por outra fonte e permanecem identificados individualmente."
                  : "O portal não apresenta a estimativa do modelo como se fosse uma medição da estação. A origem permanece visível até a leitura local voltar a responder."}
              </p>
              <dl>
                <div><dt>Idade da observação</dt><dd>{weather.quality.observationAgeMinutes === null ? "Não informada" : `${weather.quality.observationAgeMinutes} min`}</dd></div>
                <div><dt>Fontes com restrição</dt><dd>{weather.quality.degradedSources.length}</dd></div>
              </dl>
            </aside>
          </div>
        </section>
      ) : null}

      {nextHours.length > 0 ? (
        <section className="today-v3-hourly" id="proximas-horas" aria-labelledby="today-v3-hourly-title">
          <header className="today-v3-section-heading">
            <div>
              <p className="today-v3-kicker">Previsão horária</p>
              <h2 id="today-v3-hourly-title">Temperatura, chuva e vento ao longo do dia</h2>
            </div>
            <Link to="/chuva-em-pelotas">Detalhes da chuva <ArrowRight aria-hidden="true" /></Link>
          </header>

          <div className="today-v3-hourly-track" aria-label="Previsão horária para hoje">
            {nextHours.map((hour, index) => {
              const temperatureLevel = ((hour.temperature - hourlyMinimum) / hourlyRange) * 100;
              const rainTone = hour.precipitationProbability === null
                ? "unknown"
                : hour.precipitationProbability >= 60
                  ? "high"
                  : hour.precipitationProbability >= 30
                    ? "medium"
                    : "low";

              return (
                <article
                  className={index === 0 ? "is-current" : undefined}
                  data-rain={rainTone}
                  key={hour.time}
                  aria-label={`${hour.time}: ${hour.temperature} graus, ${hour.precipitationProbability === null ? "probabilidade de chuva não informada" : `${hour.precipitationProbability}% de chance de chuva`} e vento de ${hour.windSpeed} quilômetros por hora`}
                >
                  <div className="today-v3-hour-topline">
                    <span>{index === 0 ? "Agora" : hour.time}</span>
                    <WeatherGlyph name={hour.icon} />
                  </div>
                  <strong>{hour.temperature}°</strong>
                  <div className="today-v3-temperature-scale" aria-hidden="true">
                    <span style={{ width: `${Math.max(12, temperatureLevel)}%` }} />
                  </div>
                  <dl>
                    <div><dt>Chuva</dt><dd>{hour.precipitationProbability === null ? "—" : `${hour.precipitationProbability}%`}</dd></div>
                    <div><dt>Vento</dt><dd>{hour.windSpeed} km/h</dd></div>
                    <div><dt>Rajada</dt><dd>{hour.windGust === null ? "—" : `${hour.windGust} km/h`}</dd></div>
                  </dl>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="today-v3-reading" id="leitura-do-dia" aria-labelledby="today-v3-reading-title">
        <div className="today-v3-reading-intro">
          <p className="today-v3-kicker">Leitura do dia</p>
          <h2 id="today-v3-reading-title">{recoveredData.brief.headline}</h2>
          <p>{recoveredData.brief.summary}</p>
          <small>{summaryOrigin}. Os números continuam vinculados às fontes estruturadas.</small>
        </div>

        <div className="today-v3-reading-lists">
          <article>
            <span>O que favorece a rotina</span>
            {recoveredData.brief.highlights.length ? (
              <ul>{recoveredData.brief.highlights.map((item) => <li key={item}>{item}</li>)}</ul>
            ) : (
              <p>Sem destaques adicionais para o período.</p>
            )}
          </article>
          <article className="is-caution">
            <span>O que exige atenção</span>
            {recoveredData.brief.cautions.length ? (
              <ul>{recoveredData.brief.cautions.map((item) => <li key={item}>{item}</li>)}</ul>
            ) : (
              <p>Não há pontos de atenção relevantes nas fontes consultadas.</p>
            )}
          </article>
        </div>
      </section>

      <nav className="today-v3-related" aria-label="Continue consultando o Tempo Pelotas">
        <Link to="/tempo-amanha-pelotas"><span><small>Próximo período</small><strong>Previsão para amanhã</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/previsao-7-dias-pelotas"><span><small>Planejamento</small><strong>Previsão para 7 dias</strong></span><ArrowRight aria-hidden="true" /></Link>
        <Link to="/radar-e-satelite-pelotas"><span><small>Observação regional</small><strong>Radar e satélite</strong></span><Radar aria-hidden="true" /></Link>
      </nav>

      <aside className="today-v3-source-note" aria-label="Origem e atualização dos dados">
        <Info aria-hidden="true" />
        <p>
          Dados consolidados em {formatDateTime(weather.source.fetchedAt)} a partir de Embrapa, INMET,
          CPPMet/UFPel e {weather.quality.forecastProvider ?? "modelo meteorológico disponível"}.
          Medição, estimativa e previsão permanecem identificadas separadamente.
        </p>
      </aside>
    </div>
  );
}
