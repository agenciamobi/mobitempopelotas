import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarRange,
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
import "./SevenDayRetailHero.css";

type SevenDayRetailHeroProps = {
  weather: WeatherData;
  advisoryLevel: AdvisoryLevel;
  officialAlertCount?: number;
};

type RetailMetric = {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
};

function formatValue(value: number | null | undefined, suffix = "") {
  return value === null || value === undefined ? "—" : `${value}${suffix}`;
}

function alertLabel(count: number) {
  if (count === 1) return "1 aviso oficial para Pelotas";
  return `${count} avisos oficiais para Pelotas`;
}

function getRainScore(day: DailyForecast) {
  return (day.rainChance ?? 0) + day.precipitation * 4;
}

function getRiskScore(day: DailyForecast) {
  return getRainScore(day) + (day.windGust ?? 0) * 0.7;
}

function choosePhotoIcon(days: DailyForecast[]): WeatherIconName {
  if (days.length === 0) return "cloud";

  const highestRisk = days.reduce((current, day) =>
    getRiskScore(day) > getRiskScore(current) ? day : current,
  );

  if ((highestRisk.rainChance ?? 0) >= 50 || highestRisk.precipitation >= 5) {
    return highestRisk.icon === "storm" ? "storm" : "rain";
  }

  return days[0]?.icon ?? "cloud";
}

function buildMetrics(days: DailyForecast[]): RetailMetric[] {
  if (days.length === 0) {
    return [
      { label: "Menor mínima", value: "—", detail: "em atualização", icon: Thermometer },
      { label: "Maior chance de chuva", value: "—", detail: "em atualização", icon: CloudRain },
      { label: "Rajada mais forte", value: "—", detail: "em atualização", icon: Wind },
    ];
  }

  const minimum = Math.min(...days.map((day) => day.min));
  const rainiest = days.reduce((current, day) =>
    getRainScore(day) > getRainScore(current) ? day : current,
  );
  const windiest = days.reduce((current, day) =>
    (day.windGust ?? -1) > (current.windGust ?? -1) ? day : current,
  );

  return [
    {
      label: "Menor mínima",
      value: `${minimum}°`,
      detail: days.find((day) => day.min === minimum)?.weekday ?? "na semana",
      icon: Thermometer,
    },
    {
      label: "Maior chance de chuva",
      value: formatValue(rainiest.rainChance, "%"),
      detail: rainiest.weekday,
      icon: CloudRain,
    },
    {
      label: "Rajada mais forte",
      value: formatValue(windiest.windGust, " km/h"),
      detail: windiest.weekday,
      icon: Wind,
    },
  ];
}

export function SevenDayRetailHero({
  weather,
  advisoryLevel,
  officialAlertCount = 0,
}: SevenDayRetailHeroProps) {
  const days = weather.daily.slice(0, 7);
  const hasAlert = officialAlertCount > 0;
  const minimum = days.length ? Math.min(...days.map((day) => day.min)) : null;
  const maximum = days.length ? Math.max(...days.map((day) => day.max)) : null;
  const warmest = days.length
    ? days.reduce((current, day) => (day.max > current.max ? day : current))
    : null;
  const coldest = days.length
    ? days.reduce((current, day) => (day.min < current.min ? day : current))
    : null;
  const rainiest = days.length
    ? days.reduce((current, day) => (getRainScore(day) > getRainScore(current) ? day : current))
    : null;
  const rainyDays = days.filter(
    (day) => (day.rainChance ?? 0) >= 30 || day.precipitation >= 1,
  ).length;
  const iconName = choosePhotoIcon(days);
  const condition = weatherConditionLabels[iconName];
  const metrics = buildMetrics(days);
  const photo = getRetailWeatherPhoto(iconName, advisoryLevel);
  const photoStyle = {
    "--today-retail-hero-photo": `url("${photo.src}")`,
    "--today-retail-hero-position": photo.position,
  } as CSSProperties;

  return (
    <section
      className={`today-retail-hero seven-day-retail-hero today-retail-hero--${advisoryLevel}`}
      aria-labelledby="seven-day-retail-hero-title"
      data-official-alerts={hasAlert ? "true" : "false"}
      data-weather-photo={iconName}
    >
      <div className="today-retail-hero__inner seven-day-retail-hero__inner">
        <div className="today-retail-hero__copy seven-day-retail-hero__copy">
          <span className="today-retail-hero__eyebrow">
            <i aria-hidden="true" /> Próximos 7 dias · Pelotas
          </span>

          <h1 id="seven-day-retail-hero-title">
            Previsão de 7 dias para Pelotas: <span>temperatura, chuva e vento.</span>
          </h1>

          <p>
            Compare mínima e máxima, chance e volume de chuva e rajadas previstos para cada dia.
            Confirme novamente os dias mais distantes conforme eles se aproximarem.
          </p>

          <div className="today-retail-hero__badges" aria-label="Situação da previsão semanal">
            <span>
              <CalendarRange aria-hidden="true" /> {days.length || 0} dias na previsão
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
            <a className="today-retail-hero__primary" href="#semana-dia-a-dia">
              Ver previsão dia a dia <ArrowRight aria-hidden="true" />
            </a>
            <a className="today-retail-hero__secondary" href="#riscos-da-semana">
              Ver maiores chances de chuva
            </a>
          </div>
        </div>

        <div className="today-retail-hero__showcase seven-day-retail-hero__showcase">
          <article
            className="today-retail-hero__current seven-day-retail-hero__current"
            style={photoStyle}
            aria-label="Panorama da previsão para os próximos sete dias em Pelotas"
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
                  <small>Previsão para os próximos 7 dias</small>
                </div>
                <b>
                  <i aria-hidden="true" /> 7 dias
                </b>
              </header>

              <div className="today-retail-hero__current-main">
                <div className="today-retail-hero__weather-icon">
                  <WeatherIcon name={iconName} title={`Condição de maior destaque da semana: ${condition}`} />
                </div>
                <div>
                  <strong>
                    {minimum === null || maximum === null ? "—" : `${minimum}°–${maximum}°`}
                  </strong>
                  <span>Faixa de temperatura dos próximos 7 dias</span>
                  <small>
                    {rainyDays === 0
                      ? "Sem dia com chuva relevante nesta atualização"
                      : `${rainyDays} ${rainyDays === 1 ? "dia" : "dias"} com chance ou volume de chuva`}
                  </small>
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
                        <em>{metric.detail}</em>
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

          <div className="today-retail-hero__tiles seven-day-retail-hero__tiles" aria-label="Destaques da semana">
            <article>
              <span>
                <Thermometer aria-hidden="true" /> Maior máxima
              </span>
              <strong>{warmest ? `${warmest.max}°` : "—"}</strong>
              <small>{warmest?.weekday ?? "Em atualização"}</small>
            </article>

            <article className="is-rain">
              <span>
                <CloudRain aria-hidden="true" /> Maior volume de chuva
              </span>
              <strong>{rainiest ? `${rainiest.precipitation} mm` : "—"}</strong>
              <small>{rainiest?.weekday ?? "Em atualização"}</small>
            </article>

            <article className="is-wind">
              <span>
                <Thermometer aria-hidden="true" /> Menor mínima
              </span>
              <strong>{coldest ? `${coldest.min}°` : "—"}</strong>
              <small>{coldest?.weekday ?? "Em atualização"}</small>
            </article>

            <article className="is-sun">
              <span>
                <Gauge aria-hidden="true" /> Fonte da previsão
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
