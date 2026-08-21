import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  CloudRain,
  Gauge,
  ShieldAlert,
  Thermometer,
  Wind,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";

import { WeatherIcon } from "@/production/components/weather-icon";
import { weatherConditionLabels } from "@/production/lib/hero-weather-presentation";
import type { DailyForecast, WeatherData, WeatherIconName } from "@/production/lib/weather-data";
import type { AdvisoryLevel } from "@/production/lib/weather-insights";

import { getRetailWeatherPhoto } from "./today-retail-hero-backgrounds";
import "./TodayRetailHero.css";
import "./TodayRetailHeroPhoto.css";
import "./TomorrowRetailHero.css";

type TomorrowRetailHeroProps = {
  weather: WeatherData;
  advisoryLevel: AdvisoryLevel;
  officialAlertCount?: number;
};

type RetailMetric = {
  label: string;
  value: string;
  detail?: string;
  icon: LucideIcon;
};

function formatValue(value: number | null | undefined, suffix = "") {
  return value === null || value === undefined ? "—" : `${value}${suffix}`;
}

function formatTomorrowDate(day: DailyForecast | null) {
  if (!day) return "Data em atualização";
  if (!day.dateIso) return `${day.weekday} · ${day.date}`;

  const parsed = new Date(`${day.dateIso}T12:00:00-03:00`);
  if (Number.isNaN(parsed.getTime())) return `${day.weekday} · ${day.date}`;

  const label = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "America/Sao_Paulo",
  }).format(parsed);

  return label.charAt(0).toUpperCase() + label.slice(1);
}

function alertLabel(count: number) {
  if (count === 1) return "1 aviso oficial para Pelotas";
  return `${count} avisos oficiais para Pelotas`;
}

function differenceLabel(value: number | null) {
  if (value === null || value === 0) return value === 0 ? "Sem mudança" : "Sem comparação";
  return value > 0 ? `+${value}° vs. hoje` : `${value}° vs. hoje`;
}

function buildMetrics(tomorrow: DailyForecast | null): RetailMetric[] {
  return [
    {
      label: "Mínima prevista",
      value: formatValue(tomorrow?.min, "°"),
      icon: Thermometer,
    },
    {
      label: "Chance de chuva",
      value: formatValue(tomorrow?.rainChance, "%"),
      icon: CloudRain,
    },
    {
      label: "Rajada máxima",
      value: formatValue(tomorrow?.windGust, " km/h"),
      icon: Wind,
    },
  ];
}

export function TomorrowRetailHero({
  weather,
  advisoryLevel,
  officialAlertCount = 0,
}: TomorrowRetailHeroProps) {
  const today = weather.daily[0] ?? null;
  const tomorrow = weather.daily[1] ?? null;
  const iconName: WeatherIconName = tomorrow?.icon ?? "cloud";
  const condition = tomorrow ? weatherConditionLabels[iconName] : "Previsão em atualização";
  const metrics = buildMetrics(tomorrow);
  const hasAlert = officialAlertCount > 0;
  const amplitude = tomorrow ? Math.max(0, tomorrow.max - tomorrow.min) : null;
  const maximumDifference = tomorrow && today ? tomorrow.max - today.max : null;
  const photo = getRetailWeatherPhoto(iconName, advisoryLevel);
  const photoStyle = {
    "--today-retail-hero-photo": `url("${photo.src}")`,
    "--today-retail-hero-position": photo.position,
  } as CSSProperties;

  return (
    <section
      className={`today-retail-hero tomorrow-retail-hero today-retail-hero--${advisoryLevel}`}
      aria-labelledby="tomorrow-retail-hero-title"
      data-official-alerts={hasAlert ? "true" : "false"}
      data-weather-photo={iconName}
    >
      <div className="today-retail-hero__inner tomorrow-retail-hero__inner">
        <div className="today-retail-hero__copy tomorrow-retail-hero__copy">
          <span className="today-retail-hero__eyebrow">
            <i aria-hidden="true" /> Tempo amanhã · Pelotas
          </span>

          <h1 id="tomorrow-retail-hero-title">
            Tempo amanhã em Pelotas: <span>temperatura, chuva e vento.</span>
          </h1>

          <p>
            {tomorrow
              ? `${condition}. A previsão indica mínima de ${tomorrow.min}° e máxima de ${tomorrow.max}°. Veja a chance de chuva, as rajadas e o que pode mudar sua rotina.`
              : "A previsão para amanhã está sendo atualizada pelas fontes meteorológicas do portal."}
          </p>

          <div className="today-retail-hero__badges" aria-label="Situação da previsão de amanhã">
            <span>
              <CalendarDays aria-hidden="true" /> {formatTomorrowDate(tomorrow)}
            </span>
            {hasAlert ? (
              <Link className="is-alert" to="/alertas">
                <ShieldAlert aria-hidden="true" /> {alertLabel(officialAlertCount)}
              </Link>
            ) : (
              <span className="is-stable">Sem aviso oficial listado para Pelotas</span>
            )}
          </div>

          <div className="today-retail-hero__actions">
            <a className="today-retail-hero__primary" href="#planejamento-amanha">
              Ver como se preparar <ArrowRight aria-hidden="true" />
            </a>
            <Link className="today-retail-hero__secondary" to="/previsao-7-dias-pelotas">
              Ver próximos 7 dias
            </Link>
          </div>
        </div>

        <div className="today-retail-hero__showcase tomorrow-retail-hero__showcase">
          <article
            className="today-retail-hero__current tomorrow-retail-hero__current"
            style={photoStyle}
            aria-label="Resumo da previsão do tempo para amanhã em Pelotas"
          >
            <div
              className="today-retail-hero__current-photo"
              role="img"
              aria-label={photo.alt}
            />

            <div className="today-retail-hero__current-content">
              <header>
                <div>
                  <span>Pelotas, RS</span>
                  <small>Previsão para amanhã</small>
                </div>
                <b>
                  <i aria-hidden="true" /> Amanhã
                </b>
              </header>

              <div className="today-retail-hero__current-main">
                <div className="today-retail-hero__weather-icon">
                  <WeatherIcon name={iconName} title={`Condição prevista para amanhã: ${condition}`} />
                </div>
                <div>
                  <strong>{formatValue(tomorrow?.max, "°")}</strong>
                  <span>{condition}</span>
                </div>
              </div>

              <div className="today-retail-hero__current-metrics">
                {metrics.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <div key={metric.label}>
                      <Icon aria-hidden="true" />
                      <span>
                        <small>{metric.label}</small>
                        <strong>{metric.value}</strong>
                        {metric.detail ? <em>{metric.detail}</em> : null}
                      </span>
                    </div>
                  );
                })}
              </div>

              <a
                className="today-retail-hero__photo-credit"
                href={photo.sourceHref}
                target="_blank"
                rel="noreferrer"
              >
                Foto: {photo.credit}
              </a>
            </div>
          </article>

          <div className="today-retail-hero__tiles tomorrow-retail-hero__tiles" aria-label="Indicadores para amanhã">
            <article>
              <span>
                <Gauge aria-hidden="true" /> Variação térmica
              </span>
              <strong>{formatValue(amplitude, "°")}</strong>
              <small>Diferença entre mínima e máxima</small>
            </article>

            <article className="is-rain">
              <span>
                <CloudRain aria-hidden="true" /> Volume de chuva
              </span>
              <strong>{formatValue(tomorrow?.precipitation, " mm")}</strong>
              <small>Estimativa para o dia</small>
            </article>

            <article className="is-wind">
              <span>
                <Thermometer aria-hidden="true" /> Máxima versus hoje
              </span>
              <strong>{differenceLabel(maximumDifference)}</strong>
              <small>Comparação entre as duas previsões</small>
            </article>

            <article className="is-sun">
              <span>
                <CalendarDays aria-hidden="true" /> Fonte da previsão
              </span>
              <strong>{weather.source.forecastName ?? weather.source.name}</strong>
              <small>Modelo meteorológico principal</small>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
