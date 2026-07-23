import { Link } from "@tanstack/react-router";
import { AlertTriangle, ShieldAlert } from "lucide-react";

import type { LaranjalLevelData } from "@/lib/hydrology/laranjal-level.server";
import type { RedemetOverview } from "@/lib/redemet/redemet.types";
import type { WeatherSourceKey } from "@/lib/weather/aggregated-weather.types";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

import { HomeForecastStory } from "./HomeForecastStory";
import { HomeLocalMonitoring } from "./HomeLocalMonitoring";
import { HomeOperationalNavigation } from "./HomeOperationalNavigation";
import { HomeRegionalObservation } from "./HomeRegionalObservation";
import { WeatherEditorialHero } from "./WeatherEditorialHero";
import "./WeatherHome.css";

const sourceLabels: Record<WeatherSourceKey, string> = {
  embrapa: "Embrapa Clima Temperado",
  inmet: "INMET",
  cppmet: "CPPMet / UFPel",
  "open-meteo": "Modelo meteorológico",
};

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

export function WeatherHome({
  data,
  laranjal,
  redemet,
}: {
  data: WeatherIntelligenceData;
  laranjal: LaranjalLevelData;
  redemet: RedemetOverview;
}) {
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

  const degradedSources = weather.quality.degradedSources;
  const activeAlerts = weather.alerts.filter((alert) => alert.period === "active");
  const upcomingAlerts = weather.alerts.filter((alert) => alert.period === "upcoming");
  const relevantAlerts = [...activeAlerts, ...upcomingAlerts].slice(0, 4);

  return (
    <div className="weather-home">
      <WeatherEditorialHero data={data} />
      <HomeOperationalNavigation data={data} />

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
                    {formatDateTime(alert.startsAt)
                      ? `Início: ${formatDateTime(alert.startsAt)}`
                      : null}
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

      <HomeForecastStory data={data} />
      <HomeRegionalObservation data={redemet} />
      <HomeLocalMonitoring observation={weather.observation} laranjal={laranjal} />

      {weather.officialForecast.length > 0 ? (
        <section
          className="weather-section weather-official-forecast"
          aria-labelledby="cppmet-title"
        >
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

      <p className="weather-source-note">
        Dados consolidados por MOBI Tempo Pelotas a partir de Embrapa Clima Temperado, INMET,
        CPPMet/UFPel, REDEMET/DECEA e {weather.quality.forecastProvider ?? "modelo meteorológico"}.
        Consulta realizada em {formatFetchedAt(weather.source.fetchedAt)}.
        {degradedSources.length > 0
          ? ` Fontes com restrição: ${degradedSources.map((source) => sourceLabels[source]).join(", ")}.`
          : " Todas as fontes prioritárias responderam dentro dos critérios operacionais."}
      </p>
    </div>
  );
}
