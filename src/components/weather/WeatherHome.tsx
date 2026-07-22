import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSun,
  Droplets,
  Eye,
  Gauge,
  Info,
  Moon,
  Navigation,
  ShieldAlert,
  Sun,
  Sunrise,
  Sunset,
  Wind,
  type LucideIcon,
} from "lucide-react";

import type { WeatherSourceKey } from "@/lib/weather/aggregated-weather.types";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import type { WeatherIconName } from "@/lib/weather/types";

import "./WeatherHome.css";

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

const sourceLabels: Record<WeatherSourceKey, string> = {
  embrapa: "Embrapa Clima Temperado",
  inmet: "INMET",
  cppmet: "CPPMet / UFPel",
  "open-meteo": "Open-Meteo",
};

const confidenceLabels = {
  high: "Alta confiança",
  medium: "Confiança moderada",
  low: "Baixa confiança",
} as const;

function WeatherIcon({ name, size = 28 }: { name: WeatherIconName | null; size?: number }) {
  const Icon = name ? iconMap[name] : Cloud;
  return <Icon aria-hidden="true" size={size} strokeWidth={1.8} />;
}

function formatDateTime(value: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function formatFetchedAt(value: string) {
  return formatDateTime(value) ?? "horário não informado";
}

function displayNumber(value: number | null, suffix: string) {
  return value === null ? "—" : `${value}${suffix}`;
}

function sourceLabel(source: WeatherSourceKey | null) {
  return source ? sourceLabels[source] : "fonte indisponível";
}

export function WeatherHome({ data }: { data: WeatherIntelligenceData }) {
  const weather = data.weather;

  if (
    weather.status === "unavailable" &&
    !weather.current &&
    weather.hourly.length === 0 &&
    weather.daily.length === 0
  ) {
    return (
      <section className="weather-unavailable" aria-labelledby="weather-unavailable-title">
        <p className="weather-kicker">Tempo em Pelotas</p>
        <h1 id="weather-unavailable-title">Dados temporariamente indisponíveis</h1>
        <p>{weather.message ?? data.brief.summary}</p>
        <p className="weather-source-note">
          O portal continuará tentando consultar as fontes meteorológicas automaticamente.
        </p>
      </section>
    );
  }

  const current = weather.current;
  const degradedSources = weather.quality.degradedSources;
  const activeAlerts = weather.alerts.filter((alert) => alert.period === "active");
  const upcomingAlerts = weather.alerts.filter((alert) => alert.period === "upcoming");
  const relevantAlerts = [...activeAlerts, ...upcomingAlerts].slice(0, 4);
  const temperatureLabel =
    current?.temperature === null || current?.temperature === undefined
      ? "Temperatura indisponível"
      : `${current.temperature} graus Celsius`;

  return (
    <div className="weather-home">
      {current ? (
        <section className="weather-current" aria-labelledby="weather-current-title">
          <div className="weather-current-copy">
            <p className="weather-kicker">Condições atuais</p>
            <h1 id="weather-current-title">
              Tempo agora em {current.city}, {current.state}
            </h1>
            <p className="weather-condition">
              {current.condition ?? "Condição meteorológica em atualização"}
            </p>
            <p className="weather-update">
              {current.observedAt ? `Atualizado às ${current.observedAt}` : "Horário em atualização"}
              {" · "}
              {sourceLabel(weather.quality.currentSource)}
            </p>
            <div className="weather-quality-summary" aria-label="Qualidade dos dados meteorológicos">
              <span className={`weather-confidence weather-confidence-${weather.quality.confidence}`}>
                {weather.quality.confidence === "high" ? (
                  <CheckCircle2 aria-hidden="true" />
                ) : (
                  <Info aria-hidden="true" />
                )}
                {confidenceLabels[weather.quality.confidence]}
              </span>
              <span>Índice de qualidade: {weather.quality.score}/100</span>
              {degradedSources.length > 0 ? (
                <span>{degradedSources.length} fonte(s) com restrição</span>
              ) : null}
            </div>
          </div>

          <div className="weather-temperature" aria-label={temperatureLabel}>
            <WeatherIcon name={current.icon} size={58} />
            <strong>{current.temperature === null ? "—" : `${current.temperature}°`}</strong>
            <span>
              {current.feelsLike === null ? "Sensação indisponível" : `Sensação de ${current.feelsLike}°`}
            </span>
          </div>
        </section>
      ) : null}

      {current ? (
        <section className="weather-metrics" aria-label="Detalhes das condições atuais">
          <article>
            <Droplets aria-hidden="true" />
            <span>Umidade</span>
            <strong>{displayNumber(current.humidity, "%")}</strong>
          </article>
          <article>
            <Wind aria-hidden="true" />
            <span>Vento</span>
            <strong>{displayNumber(current.windSpeed, " km/h")}</strong>
            <small>
              {current.windGust === null
                ? "Rajadas indisponíveis"
                : `Rajadas de ${current.windGust} km/h`}
            </small>
          </article>
          <article>
            <Navigation aria-hidden="true" />
            <span>Direção</span>
            <strong>{current.windDirection ?? "—"}</strong>
          </article>
          <article>
            <Gauge aria-hidden="true" />
            <span>Pressão</span>
            <strong>{displayNumber(current.pressure, " hPa")}</strong>
          </article>
          <article>
            <Eye aria-hidden="true" />
            <span>Visibilidade</span>
            <strong>{displayNumber(current.visibilityKm, " km")}</strong>
          </article>
          <article>
            <Sunrise aria-hidden="true" />
            <span>Nascer do sol</span>
            <strong>{current.sunrise ?? "—"}</strong>
          </article>
          <article>
            <Sunset aria-hidden="true" />
            <span>Pôr do sol</span>
            <strong>{current.sunset ?? "—"}</strong>
          </article>
        </section>
      ) : null}

      <section className="weather-section weather-brief" aria-labelledby="weather-brief-title">
        <div className="weather-section-heading">
          <div>
            <p className="weather-kicker">Síntese meteorológica</p>
            <h2 id="weather-brief-title">{data.brief.headline}</h2>
          </div>
          <span className="weather-brief-origin">Atualizada automaticamente</span>
        </div>

        <p className="weather-brief-summary">{data.brief.summary}</p>

        {data.brief.highlights.length > 0 || data.brief.cautions.length > 0 ? (
          <div className="weather-brief-grid">
            {data.brief.highlights.length > 0 ? (
              <div>
                <strong>Destaques</strong>
                <ul>
                  {data.brief.highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {data.brief.cautions.length > 0 ? (
              <div className="weather-brief-cautions">
                <strong>Pontos de atenção</strong>
                <ul>
                  {data.brief.cautions.map((caution) => (
                    <li key={caution}>{caution}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {relevantAlerts.length > 0 ? (
        <section className="weather-section weather-alerts" aria-labelledby="weather-alerts-title">
          <div className="weather-section-heading">
            <div>
              <p className="weather-kicker">Avisos oficiais</p>
              <h2 id="weather-alerts-title">Alertas do INMET</h2>
            </div>
            <Link to="/alertas">Ver todos os alertas</Link>
          </div>

          <div className="weather-alert-list">
            {relevantAlerts.map((alert) => (
              <article key={alert.id} className={`weather-alert weather-alert-${alert.severity}`}>
                <div className="weather-alert-icon">
                  {alert.severity === "great-danger" || alert.severity === "danger" ? (
                    <ShieldAlert aria-hidden="true" />
                  ) : (
                    <AlertTriangle aria-hidden="true" />
                  )}
                </div>
                <div>
                  <div className="weather-alert-meta">
                    <span>{alert.period === "active" ? "Ativo agora" : "Próximo"}</span>
                    <span>{alert.severityLabel}</span>
                    <span>{alert.relevance === "pelotas" ? "Pelotas" : "Regional"}</span>
                  </div>
                  <h3>{alert.headline || alert.event}</h3>
                  <p>{alert.description}</p>
                  <small>
                    {formatDateTime(alert.startsAt) ? `Início: ${formatDateTime(alert.startsAt)}` : null}
                    {formatDateTime(alert.expiresAt)
                      ? ` · Término: ${formatDateTime(alert.expiresAt)}`
                      : null}
                  </small>
                </div>
                <a href={alert.officialUrl} target="_blank" rel="noreferrer">
                  Fonte oficial
                </a>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {weather.hourly.length > 0 ? (
        <section className="weather-section" aria-labelledby="hourly-title">
          <div className="weather-section-heading">
            <div>
              <p className="weather-kicker">Próximas horas</p>
              <h2 id="hourly-title">Evolução do tempo</h2>
            </div>
            <Link to="/tempo-hoje-pelotas">Ver previsão de hoje</Link>
          </div>

          <div className="hourly-forecast">
            {weather.hourly.map((hour) => (
              <article key={hour.time}>
                <span>{hour.time}</span>
                <WeatherIcon name={hour.icon} />
                <strong>{hour.temperature}°</strong>
                <small>{hour.precipitationProbability}% de chuva</small>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {weather.officialForecast.length > 0 ? (
        <section className="weather-section weather-official-forecast" aria-labelledby="cppmet-title">
          <div className="weather-section-heading">
            <div>
              <p className="weather-kicker">Contexto regional</p>
              <h2 id="cppmet-title">Previsão do CPPMet / UFPel</h2>
            </div>
          </div>

          <div className="weather-official-list">
            {weather.officialForecast.slice(0, 4).map((day) => (
              <article key={`${day.day}-${day.summary}`}>
                <div>
                  <strong>{day.day}</strong>
                  <span>
                    {day.minimum === null || day.maximum === null
                      ? "Temperaturas em atualização"
                      : `${day.minimum}° / ${day.maximum}°`}
                  </span>
                </div>
                <p>{day.summary || day.text}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {weather.daily.length > 0 ? (
        <section className="weather-section" aria-labelledby="daily-title">
          <div className="weather-section-heading">
            <div>
              <p className="weather-kicker">Previsão estendida</p>
              <h2 id="daily-title">Próximos 7 dias</h2>
            </div>
            <Link to="/previsao-7-dias-pelotas">Ver detalhes</Link>
          </div>

          <div className="daily-forecast">
            {weather.daily.map((day) => (
              <article key={`${day.weekday}-${day.date}`}>
                <div>
                  <strong>{day.weekday}</strong>
                  <span>{day.date}</span>
                </div>
                <WeatherIcon name={day.icon} />
                <span>{day.rainChance}% chuva</span>
                <span>{day.precipitationMm} mm</span>
                <span>Rajadas {day.windGust} km/h</span>
                <strong>
                  {day.min}° / {day.max}°
                </strong>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <p className="weather-source-note">
        Dados consolidados por MOBI Tempo Pelotas a partir de Embrapa Clima Temperado, INMET,
        CPPMet/UFPel e Open-Meteo. Consulta realizada em {formatFetchedAt(weather.source.fetchedAt)}.
        {degradedSources.length > 0
          ? ` Fontes com restrição: ${degradedSources.map((source) => sourceLabels[source]).join(", ")}.`
          : " Todas as fontes prioritárias responderam dentro dos critérios operacionais."}
      </p>
    </div>
  );
}
