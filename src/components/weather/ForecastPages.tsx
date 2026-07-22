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
  Eye,
  Gauge,
  Info,
  Moon,
  Navigation,
  Sun,
  Sunrise,
  Sunset,
  Wind,
  type LucideIcon,
} from "lucide-react";

import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import type { WeatherIconName } from "@/lib/weather/types";

import "./ForecastPages.css";

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

function WeatherIcon({ name, size = 30 }: { name: WeatherIconName | null; size?: number }) {
  const Icon = name ? iconMap[name] : Cloud;
  return <Icon aria-hidden="true" size={size} strokeWidth={1.7} />;
}

function displayNumber(value: number | null, suffix: string) {
  return value === null ? "—" : `${value}${suffix}`;
}

function formatFetchedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "horário não informado";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function ForecastUnavailable() {
  return (
    <section className="forecast-unavailable" aria-labelledby="forecast-unavailable-title">
      <p className="forecast-kicker">Tempo em Pelotas</p>
      <h1 id="forecast-unavailable-title">Previsão temporariamente indisponível</h1>
      <p>
        As fontes meteorológicas não forneceram dados suficientes para montar esta página agora.
      </p>
      <Link to="/">
        <ArrowLeft aria-hidden="true" /> Voltar ao tempo agora
      </Link>
    </section>
  );
}

function QualityBadge({ data }: { data: WeatherIntelligenceData }) {
  const quality = data.weather.quality;

  return (
    <div className="forecast-quality" aria-label="Qualidade dos dados meteorológicos">
      <span className={`forecast-confidence forecast-confidence-${quality.confidence}`}>
        {quality.confidence === "high" ? (
          <CheckCircle2 aria-hidden="true" />
        ) : (
          <Info aria-hidden="true" />
        )}
        {confidenceLabels[quality.confidence]}
      </span>
      <span>Índice {quality.score}/100</span>
      {quality.degradedSources.length > 0 ? (
        <span>{quality.degradedSources.length} fonte(s) com restrição</span>
      ) : null}
    </div>
  );
}

function ForecastPageHeader({
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
    <header className="forecast-page-header">
      <div>
        <Link className="forecast-back-link" to="/">
          <ArrowLeft aria-hidden="true" /> Tempo agora
        </Link>
        <p className="forecast-kicker">{kicker}</p>
        <h1>{title}</h1>
        <p className="forecast-page-description">{description}</p>
      </div>
      <QualityBadge data={data} />
    </header>
  );
}

export function TodayForecastPage({ data }: { data: WeatherIntelligenceData }) {
  const weather = data.weather;
  const current = weather.current;
  const today = weather.daily[0];
  const activeAlerts = weather.alerts.filter((alert) => alert.period === "active");

  if (!current && !today && weather.hourly.length === 0) return <ForecastUnavailable />;

  const title = current?.condition
    ? `${current.condition} em Pelotas nesta ${new Intl.DateTimeFormat("pt-BR", {
        weekday: "long",
        timeZone: "America/Sao_Paulo",
      }).format(new Date())}`
    : "Previsão do tempo para hoje em Pelotas";

  return (
    <div className="forecast-page">
      <ForecastPageHeader
        kicker="Previsão de hoje"
        title={title}
        description={data.brief.summary}
        data={data}
      />

      <section className="forecast-today-hero" aria-labelledby="today-summary-title">
        <div className="forecast-today-main">
          <p className="forecast-kicker">Condições atuais</p>
          <h2 id="today-summary-title">Como está o tempo agora</h2>
          <div className="forecast-now-reading">
            <span className="forecast-now-icon">
              <WeatherIcon name={current?.icon ?? today?.icon ?? null} size={62} />
            </span>
            <div>
              <strong>
                {current?.temperature === null || current?.temperature === undefined
                  ? "—"
                  : `${current.temperature}°`}
              </strong>
              <span>{current?.condition ?? "Condição em atualização"}</span>
              <small>
                {current?.feelsLike === null || current?.feelsLike === undefined
                  ? "Sensação térmica em atualização"
                  : `Sensação de ${current.feelsLike}°`}
              </small>
            </div>
          </div>
        </div>

        <div className="forecast-today-range">
          <span>Hoje</span>
          <strong>
            {today ? `${today.min}° / ${today.max}°` : "Faixa térmica em atualização"}
          </strong>
          <small>
            {today
              ? `${today.rainChance === null ? "Probabilidade de chuva não informada" : `${today.rainChance}% de chance de chuva`} · ${today.precipitationMm} mm previstos`
              : "Previsão diária em atualização"}
          </small>
        </div>
      </section>

      {activeAlerts.length > 0 ? (
        <section className="forecast-active-alert" aria-label="Alertas meteorológicos ativos">
          <AlertTriangle aria-hidden="true" />
          <div>
            <strong>
              {activeAlerts.length === 1
                ? "Há um alerta oficial ativo"
                : `Há ${activeAlerts.length} alertas oficiais ativos`}
            </strong>
            <span>{activeAlerts[0]?.headline || activeAlerts[0]?.event}</span>
          </div>
          <Link to="/alertas">
            Consultar alertas <ArrowRight aria-hidden="true" />
          </Link>
        </section>
      ) : null}

      {current ? (
        <section className="forecast-current-metrics" aria-label="Detalhes do tempo agora">
          <article>
            <Droplets aria-hidden="true" />
            <span>Umidade</span>
            <strong>{displayNumber(current.humidity, "%")}</strong>
          </article>
          <article>
            <Wind aria-hidden="true" />
            <span>Vento</span>
            <strong>{displayNumber(current.windSpeed, " km/h")}</strong>
            <small>{displayNumber(current.windGust, " km/h de rajada")}</small>
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

      {weather.hourly.length > 0 ? (
        <section className="forecast-content-section" aria-labelledby="today-hourly-title">
          <div className="forecast-section-heading">
            <div>
              <p className="forecast-kicker">Próximas horas</p>
              <h2 id="today-hourly-title">Evolução ao longo do dia</h2>
            </div>
            <Link to="/chuva-em-pelotas">Detalhes da chuva</Link>
          </div>

          <div className="forecast-hourly-grid">
            {weather.hourly.map((hour) => (
              <article key={hour.time}>
                <span>{hour.time}</span>
                <WeatherIcon name={hour.icon} />
                <strong>{hour.temperature}°</strong>
                <small>
                  {hour.precipitationProbability === null
                    ? "Probabilidade não informada"
                    : `${hour.precipitationProbability}% chuva`}
                </small>
                <small>{hour.windSpeed} km/h de vento</small>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section
        className="forecast-content-section forecast-guidance"
        aria-labelledby="today-guidance-title"
      >
        <div className="forecast-section-heading">
          <div>
            <p className="forecast-kicker">Leitura do dia</p>
            <h2 id="today-guidance-title">O que merece atenção</h2>
          </div>
        </div>

        <div className="forecast-guidance-grid">
          <article>
            <strong>Destaques</strong>
            {data.brief.highlights.length > 0 ? (
              <ul>
                {data.brief.highlights.map((highlight) => (
                  <li key={highlight}>{highlight}</li>
                ))}
              </ul>
            ) : (
              <p>Sem destaques adicionais para o período.</p>
            )}
          </article>
          <article className="forecast-guidance-caution">
            <strong>Pontos de atenção</strong>
            {data.brief.cautions.length > 0 ? (
              <ul>
                {data.brief.cautions.map((caution) => (
                  <li key={caution}>{caution}</li>
                ))}
              </ul>
            ) : (
              <p>Não há pontos de atenção relevantes nas fontes consultadas.</p>
            )}
          </article>
        </div>
      </section>

      <p className="forecast-source-note">
        Dados consolidados em {formatFetchedAt(weather.source.fetchedAt)} a partir de Embrapa,
        INMET, CPPMet/UFPel e {weather.quality.forecastProvider ?? "modelo meteorológico"}.
      </p>
    </div>
  );
}

export function SevenDayForecastPage({ data }: { data: WeatherIntelligenceData }) {
  const weather = data.weather;

  if (weather.daily.length === 0) return <ForecastUnavailable />;

  const minimum = Math.min(...weather.daily.map((day) => day.min));
  const maximum = Math.max(...weather.daily.map((day) => day.max));
  const daysWithRainProbability = weather.daily.filter((day) => day.rainChance !== null);
  const rainiestDay =
    daysWithRainProbability.length > 0
      ? daysWithRainProbability.reduce((current, day) =>
          (day.rainChance ?? -1) > (current.rainChance ?? -1) ? day : current,
        )
      : null;
  const daysWithGust = weather.daily.filter((day) => day.windGust !== null);
  const windiestDay =
    daysWithGust.length > 0
      ? daysWithGust.reduce((current, day) =>
          (day.windGust ?? -1) > (current.windGust ?? -1) ? day : current,
        )
      : null;

  return (
    <div className="forecast-page">
      <ForecastPageHeader
        kicker="Previsão estendida"
        title="Previsão do tempo para os próximos 7 dias em Pelotas"
        description={`A semana varia entre ${minimum}° e ${maximum}°. Compare temperaturas, chuva e rajadas para planejar os próximos dias.`}
        data={data}
      />

      <section className="forecast-week-summary" aria-label="Resumo dos próximos sete dias">
        <article>
          <span>Faixa térmica da semana</span>
          <strong>
            {minimum}° a {maximum}°
          </strong>
        </article>
        <article>
          <span>Maior chance de chuva</span>
          <strong>
            {rainiestDay?.rainChance === null || !rainiestDay
              ? "Não informada"
              : `${rainiestDay.rainChance}%`}
          </strong>
          <small>{rainiestDay?.weekday ?? "Fonte sem probabilidade"}</small>
        </article>
        <article>
          <span>Rajada mais forte</span>
          <strong>
            {windiestDay?.windGust === null || !windiestDay
              ? "Não informada"
              : `${windiestDay.windGust} km/h`}
          </strong>
          <small>{windiestDay?.weekday ?? "Fonte sem rajadas"}</small>
        </article>
      </section>

      <section className="forecast-content-section" aria-labelledby="seven-day-list-title">
        <div className="forecast-section-heading">
          <div>
            <p className="forecast-kicker">Dia a dia</p>
            <h2 id="seven-day-list-title">Temperatura, chuva e vento</h2>
          </div>
          <Link to="/tempo-hoje-pelotas">Ver detalhes de hoje</Link>
        </div>

        <div className="forecast-seven-day-list">
          {weather.daily.map((day, index) => (
            <article
              key={`${day.weekday}-${day.date}`}
              className={index === 0 ? "is-today" : undefined}
            >
              <div className="forecast-day-name">
                <strong>{day.weekday}</strong>
                <span>{day.date}</span>
              </div>
              <span className="forecast-day-icon">
                <WeatherIcon name={day.icon} size={34} />
              </span>
              <div className="forecast-day-data">
                <span>
                  <Droplets aria-hidden="true" />{" "}
                  {day.rainChance === null
                    ? "Probabilidade não informada"
                    : `${day.rainChance}% de chuva`}
                </span>
                <span>{day.precipitationMm} mm previstos</span>
              </div>
              <div className="forecast-day-data">
                <span>
                  <Wind aria-hidden="true" />{" "}
                  {day.windGust === null
                    ? "Rajadas não informadas"
                    : `Rajadas de ${day.windGust} km/h`}
                </span>
              </div>
              <strong className="forecast-day-temperature">
                {day.min}° <span>/</span> {day.max}°
              </strong>
            </article>
          ))}
        </div>
      </section>

      {weather.officialForecast.length > 0 ? (
        <section
          className="forecast-content-section forecast-regional"
          aria-labelledby="regional-title"
        >
          <div className="forecast-section-heading">
            <div>
              <p className="forecast-kicker">Contexto regional</p>
              <h2 id="regional-title">Leitura do CPPMet / UFPel</h2>
            </div>
          </div>
          <div className="forecast-regional-grid">
            {weather.officialForecast.slice(0, 4).map((day) => (
              <article key={`${day.day}-${day.summary}`}>
                <strong>{day.day}</strong>
                <span>
                  {day.minimum === null || day.maximum === null
                    ? "Temperaturas em atualização"
                    : `${day.minimum}° / ${day.maximum}°`}
                </span>
                <p>{day.summary || day.text}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <div className="forecast-related-links" aria-label="Outras previsões">
        <Link to="/chuva-em-pelotas">
          Chuva em Pelotas <ArrowRight aria-hidden="true" />
        </Link>
        <Link to="/vento-em-pelotas">
          Vento e rajadas <ArrowRight aria-hidden="true" />
        </Link>
      </div>

      <p className="forecast-source-note">
        Previsão consolidada em {formatFetchedAt(weather.source.fetchedAt)}. O modelo principal é
        {` ${weather.quality.forecastProvider ?? "o modelo meteorológico disponível"}`}, enriquecido
        com fontes oficiais e regionais quando disponíveis.
      </p>
    </div>
  );
}
