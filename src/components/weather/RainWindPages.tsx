import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CloudRain,
  Compass,
  Droplets,
  Gauge,
  Info,
  Navigation,
  Umbrella,
  Waves,
  Wind,
} from "lucide-react";

import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

import "./RainWindPages.css";

function formatFetchedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "horário não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function QualitySummary({ data }: { data: WeatherIntelligenceData }) {
  const quality = data.weather.quality;

  return (
    <div className="condition-quality" aria-label="Qualidade dos dados meteorológicos">
      <span className={`condition-confidence condition-confidence-${quality.confidence}`}>
        {quality.confidence === "high" ? (
          <CheckCircle2 aria-hidden="true" />
        ) : (
          <Info aria-hidden="true" />
        )}
        {quality.confidence === "high"
          ? "Alta confiança"
          : quality.confidence === "medium"
            ? "Confiança moderada"
            : "Baixa confiança"}
      </span>
      <small>Índice {quality.score}/100</small>
    </div>
  );
}

function PageHeader({
  kicker,
  title,
  description,
  data,
}: {
  kicker: string;
  title: string;
  description: string;
  data: WeatherIntelligenceData;
}) {
  return (
    <header className="condition-page-header">
      <div>
        <Link className="condition-back-link" to="/">
          <ArrowLeft aria-hidden="true" /> Tempo agora
        </Link>
        <p className="condition-kicker">{kicker}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <QualitySummary data={data} />
    </header>
  );
}

function EmptyConditionPage({ label }: { label: string }) {
  return (
    <section className="condition-empty">
      <p className="condition-kicker">Tempo em Pelotas</p>
      <h1>{label} temporariamente indisponível</h1>
      <p>As fontes consultadas não forneceram dados suficientes para esta análise.</p>
      <Link to="/">
        <ArrowLeft aria-hidden="true" /> Voltar ao tempo agora
      </Link>
    </section>
  );
}

export function RainPage({ data }: { data: WeatherIntelligenceData }) {
  const weather = data.weather;
  const today = weather.daily[0];

  if (!today && weather.hourly.length === 0) return <EmptyConditionPage label="Previsão de chuva" />;

  const totalRain = weather.daily.reduce((total, day) => total + day.precipitationMm, 0);
  const rainiestDay = weather.daily.reduce(
    (selected, day) => (day.rainChance > selected.rainChance ? day : selected),
    weather.daily[0] ?? {
      weekday: "Hoje",
      date: "",
      min: 0,
      max: 0,
      rainChance: 0,
      precipitationMm: 0,
      windGust: 0,
      icon: "cloud" as const,
    },
  );
  const nextWetHour = weather.hourly.find((hour) => hour.precipitationProbability >= 40) ?? null;
  const activeRainAlerts = weather.alerts.filter(
    (alert) =>
      alert.period === "active" &&
      /chuva|tempestade|alagamento|inunda|granizo/i.test(
        `${alert.event} ${alert.headline} ${alert.description}`,
      ),
  );

  return (
    <div className="condition-page condition-page-rain">
      <PageHeader
        kicker="Chuva em Pelotas"
        title="Quando e quanto pode chover em Pelotas"
        description="Probabilidade por hora, volume previsto e tendência para os próximos sete dias, com alertas oficiais quando disponíveis."
        data={data}
      />

      <section className="condition-highlight condition-highlight-rain" aria-labelledby="rain-highlight-title">
        <div>
          <p className="condition-kicker">Resumo de hoje</p>
          <h2 id="rain-highlight-title">
            {today && today.rainChance >= 60
              ? "A chuva tem presença relevante na previsão"
              : "A chance de chuva permanece limitada"}
          </h2>
          <p>
            {today
              ? `A previsão indica até ${today.rainChance}% de chance e aproximadamente ${today.precipitationMm} mm ao longo do dia.`
              : "A previsão diária está em atualização; consulte a evolução por hora abaixo."}
          </p>
        </div>

        <div className="condition-highlight-reading">
          <CloudRain aria-hidden="true" />
          <strong>{today ? `${today.rainChance}%` : "—"}</strong>
          <span>chance máxima hoje</span>
        </div>
      </section>

      {activeRainAlerts.length > 0 ? (
        <section className="condition-alert">
          <AlertTriangle aria-hidden="true" />
          <div>
            <strong>Há alerta oficial relacionado à chuva</strong>
            <span>{activeRainAlerts[0]?.headline || activeRainAlerts[0]?.event}</span>
          </div>
          <Link to="/alertas">
            Ver alerta <ArrowRight aria-hidden="true" />
          </Link>
        </section>
      ) : null}

      <section className="condition-summary-grid" aria-label="Indicadores de chuva">
        <article>
          <Droplets aria-hidden="true" />
          <span>Volume previsto em 7 dias</span>
          <strong>{totalRain.toFixed(1)} mm</strong>
        </article>
        <article>
          <Umbrella aria-hidden="true" />
          <span>Dia com maior probabilidade</span>
          <strong>{rainiestDay.rainChance}%</strong>
          <small>{rainiestDay.weekday}</small>
        </article>
        <article>
          <Waves aria-hidden="true" />
          <span>Próxima janela relevante</span>
          <strong>{nextWetHour?.time ?? "Sem janela próxima"}</strong>
          <small>
            {nextWetHour ? `${nextWetHour.precipitationProbability}% de probabilidade` : "Abaixo de 40%"}
          </small>
        </article>
      </section>

      {weather.hourly.length > 0 ? (
        <section className="condition-section" aria-labelledby="rain-hourly-title">
          <div className="condition-section-heading">
            <div>
              <p className="condition-kicker">Próximas horas</p>
              <h2 id="rain-hourly-title">Probabilidade de chuva por horário</h2>
            </div>
            <Link to="/tempo-hoje-pelotas">Previsão completa de hoje</Link>
          </div>

          <div className="rain-hourly-list">
            {weather.hourly.map((hour) => (
              <article key={hour.time}>
                <div>
                  <strong>{hour.time}</strong>
                  <span>{hour.temperature}°</span>
                </div>
                <div className="rain-probability-track" aria-hidden="true">
                  <span style={{ width: `${Math.max(4, hour.precipitationProbability)}%` }} />
                </div>
                <strong>{hour.precipitationProbability}%</strong>
                <small>{hour.windGust} km/h de rajada</small>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {weather.daily.length > 0 ? (
        <section className="condition-section" aria-labelledby="rain-week-title">
          <div className="condition-section-heading">
            <div>
              <p className="condition-kicker">Próximos sete dias</p>
              <h2 id="rain-week-title">Chuva prevista ao longo da semana</h2>
            </div>
          </div>

          <div className="rain-week-grid">
            {weather.daily.map((day) => (
              <article key={`${day.weekday}-${day.date}`}>
                <div>
                  <strong>{day.weekday}</strong>
                  <span>{day.date}</span>
                </div>
                <CloudRain aria-hidden="true" />
                <strong>{day.rainChance}%</strong>
                <span>{day.precipitationMm} mm</span>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <p className="condition-source-note">
        Dados consolidados em {formatFetchedAt(weather.source.fetchedAt)}. Probabilidades e volumes
        são previsões, não medições acumuladas em tempo real.
      </p>
    </div>
  );
}

export function WindPage({ data }: { data: WeatherIntelligenceData }) {
  const weather = data.weather;
  const current = weather.current;

  if (!current && weather.hourly.length === 0 && weather.daily.length === 0) {
    return <EmptyConditionPage label="Condição do vento" />;
  }

  const windiestHour = weather.hourly.reduce(
    (selected, hour) => (hour.windGust > selected.windGust ? hour : selected),
    weather.hourly[0] ?? {
      time: "Agora",
      temperature: 0,
      precipitationProbability: 0,
      windSpeed: 0,
      windGust: 0,
      icon: "wind" as const,
    },
  );
  const windiestDay = weather.daily.reduce(
    (selected, day) => (day.windGust > selected.windGust ? day : selected),
    weather.daily[0] ?? {
      weekday: "Hoje",
      date: "",
      min: 0,
      max: 0,
      rainChance: 0,
      precipitationMm: 0,
      windGust: 0,
      icon: "wind" as const,
    },
  );
  const maximumGust = Math.max(windiestHour.windGust, windiestDay.windGust);
  const windLevel = maximumGust >= 70 ? "warning" : maximumGust >= 50 ? "attention" : "normal";

  return (
    <div className="condition-page condition-page-wind">
      <PageHeader
        kicker="Vento em Pelotas"
        title="Velocidade, direção e rajadas previstas"
        description="Acompanhe o vento agora, a evolução das próximas horas e os períodos com rajadas mais fortes em Pelotas."
        data={data}
      />

      <section
        className={`condition-highlight condition-highlight-wind condition-wind-${windLevel}`}
        aria-labelledby="wind-highlight-title"
      >
        <div>
          <p className="condition-kicker">Condição atual</p>
          <h2 id="wind-highlight-title">
            {windLevel === "warning"
              ? "Rajadas fortes aparecem na previsão"
              : windLevel === "attention"
                ? "O vento exige atenção em alguns períodos"
                : "O vento permanece dentro de um padrão moderado"}
          </h2>
          <p>
            {current
              ? `Agora, o vento está em ${current.windSpeed ?? "—"} km/h, com direção ${current.windDirection ?? "não informada"} e rajadas de ${current.windGust ?? "—"} km/h.`
              : "A leitura atual está em atualização; consulte as projeções horárias abaixo."}
          </p>
        </div>

        <div className="condition-highlight-reading">
          <Wind aria-hidden="true" />
          <strong>{current?.windSpeed === null || current?.windSpeed === undefined ? "—" : current.windSpeed}</strong>
          <span>km/h agora</span>
        </div>
      </section>

      <section className="condition-summary-grid" aria-label="Indicadores de vento">
        <article>
          <Navigation aria-hidden="true" />
          <span>Direção atual</span>
          <strong>{current?.windDirection ?? "—"}</strong>
        </article>
        <article>
          <Gauge aria-hidden="true" />
          <span>Maior rajada nas próximas horas</span>
          <strong>{windiestHour.windGust} km/h</strong>
          <small>{windiestHour.time}</small>
        </article>
        <article>
          <Compass aria-hidden="true" />
          <span>Maior rajada da semana</span>
          <strong>{windiestDay.windGust} km/h</strong>
          <small>{windiestDay.weekday}</small>
        </article>
      </section>

      {windLevel !== "normal" ? (
        <section className="condition-alert condition-alert-wind">
          <AlertTriangle aria-hidden="true" />
          <div>
            <strong>{windLevel === "warning" ? "Atenção para rajadas fortes" : "Períodos de vento mais intenso"}</strong>
            <span>
              Objetos soltos, estruturas leves e atividades ao ar livre podem exigir precaução.
            </span>
          </div>
          <Link to="/alertas">
            Consultar alertas <ArrowRight aria-hidden="true" />
          </Link>
        </section>
      ) : null}

      {weather.hourly.length > 0 ? (
        <section className="condition-section" aria-labelledby="wind-hourly-title">
          <div className="condition-section-heading">
            <div>
              <p className="condition-kicker">Próximas horas</p>
              <h2 id="wind-hourly-title">Evolução do vento e das rajadas</h2>
            </div>
            <Link to="/tempo-hoje-pelotas">Ver o dia completo</Link>
          </div>

          <div className="wind-hourly-grid">
            {weather.hourly.map((hour) => (
              <article key={hour.time}>
                <span>{hour.time}</span>
                <Wind aria-hidden="true" />
                <strong>{hour.windSpeed} km/h</strong>
                <small>Rajada {hour.windGust} km/h</small>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {weather.daily.length > 0 ? (
        <section className="condition-section" aria-labelledby="wind-week-title">
          <div className="condition-section-heading">
            <div>
              <p className="condition-kicker">Previsão estendida</p>
              <h2 id="wind-week-title">Rajadas máximas nos próximos dias</h2>
            </div>
          </div>

          <div className="wind-week-list">
            {weather.daily.map((day) => (
              <article key={`${day.weekday}-${day.date}`}>
                <div>
                  <strong>{day.weekday}</strong>
                  <span>{day.date}</span>
                </div>
                <Wind aria-hidden="true" />
                <div className="wind-gust-track" aria-hidden="true">
                  <span style={{ width: `${Math.min(100, Math.max(8, day.windGust))}%` }} />
                </div>
                <strong>{day.windGust} km/h</strong>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <p className="condition-source-note">
        Dados consolidados em {formatFetchedAt(weather.source.fetchedAt)}. Rajadas previstas podem
        variar localmente conforme relevo, vegetação, edificações e proximidade da Lagoa dos Patos.
      </p>
    </div>
  );
}
