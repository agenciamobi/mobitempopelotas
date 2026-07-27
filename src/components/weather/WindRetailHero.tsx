import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Compass,
  Gauge,
  Navigation,
  ShieldAlert,
  Wind,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";

import { WeatherIcon } from "@/production/components/weather-icon";
import { weatherConditionLabels } from "@/production/lib/hero-weather-presentation";
import type { WeatherData, WeatherIconName } from "@/production/lib/weather-data";
import type { AdvisoryLevel } from "@/production/lib/weather-insights";

import { getRetailWeatherPhoto } from "./today-retail-hero-backgrounds";
import "./TodayRetailHero.css";
import "./TodayRetailHeroPhoto.css";
import "./WindRetailHero.css";

type WindRetailHeroProps = {
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

function formatSpeed(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : `${value} km/h`;
}

function choosePhotoIcon(maximumGust: number | null, fallback: WeatherIconName): WeatherIconName {
  if (maximumGust !== null && maximumGust >= 60) return "storm";
  if (maximumGust !== null && maximumGust >= 35) return "wind";
  return fallback;
}

export function WindRetailHero({
  weather,
  advisoryLevel,
  officialAlertCount = 0,
}: WindRetailHeroProps) {
  const hours = weather.hourly.slice(0, 12);
  const days = weather.daily.slice(0, 7);
  const gustValues = [
    ...hours.map((hour) => hour.windGust),
    ...days.map((day) => day.windGust),
  ].filter((value): value is number => value !== null);
  const maximumGust = gustValues.length ? Math.max(...gustValues) : null;
  const strongestHour = hours.reduce<(typeof hours)[number] | null>(
    (selected, hour) =>
      !selected || (hour.windGust ?? -1) > (selected.windGust ?? -1) ? hour : selected,
    null,
  );
  const strongestDay = days.reduce<(typeof days)[number] | null>(
    (selected, day) =>
      !selected || (day.windGust ?? -1) > (selected.windGust ?? -1) ? day : selected,
    null,
  );
  const attentionHours = hours.filter((hour) => (hour.windGust ?? hour.windSpeed) >= 40).length;
  const currentSpeed = weather.current.available ? weather.current.windSpeed : null;
  const currentDirection = weather.current.available ? weather.current.windDirection : null;
  const fallbackIcon = weather.current.icon ?? days[0]?.icon ?? "wind";
  const iconName = choosePhotoIcon(maximumGust, fallbackIcon);
  const condition = weatherConditionLabels[iconName];
  const photo = getRetailWeatherPhoto(iconName, advisoryLevel);
  const photoStyle = {
    "--today-retail-hero-photo": `url("${photo.src}")`,
    "--today-retail-hero-position": photo.position,
  } as CSSProperties;
  const hasAlert = officialAlertCount > 0;
  const metrics: RetailMetric[] = [
    {
      label: "Vento observado",
      value: formatSpeed(currentSpeed),
      detail: weather.current.available ? "medição da Embrapa" : "medição indisponível",
      icon: Wind,
    },
    {
      label: "Direção atual",
      value: currentDirection ?? "—",
      detail: weather.current.available ? "observação local" : "não informada",
      icon: Navigation,
    },
    {
      label: "Horas de atenção",
      value: `${attentionHours} de ${hours.length || 0}`,
      detail: "rajada ou vento a partir de 40 km/h",
      icon: Gauge,
    },
  ];

  return (
    <section
      className={`today-retail-hero wind-retail-hero today-retail-hero--${advisoryLevel}`}
      aria-labelledby="wind-retail-hero-title"
      data-official-alerts={hasAlert ? "true" : "false"}
      data-weather-photo={iconName}
    >
      <div className="today-retail-hero__inner wind-retail-hero__inner">
        <div className="today-retail-hero__copy wind-retail-hero__copy">
          <span className="today-retail-hero__eyebrow">
            <i aria-hidden="true" /> Vento em Pelotas
          </span>

          <h1 id="wind-retail-hero-title">
            O vento em Pelotas, <span>organizado por intensidade.</span>
          </h1>

          <p>
            Compare a medição local com vento e rajadas previstos. Identifique as horas mais tranquilas
            e os períodos que podem afetar atividades ao ar livre.
          </p>

          <div className="today-retail-hero__badges" aria-label="Situação do vento em Pelotas">
            <span>
              <Wind aria-hidden="true" /> {attentionHours} horários com maior intensidade
            </span>
            {hasAlert ? (
              <Link className="is-alert" to="/alertas">
                <ShieldAlert aria-hidden="true" /> {officialAlertCount} aviso(s) oficial(is)
              </Link>
            ) : (
              <span className="is-stable">Sem aviso oficial listado para Pelotas</span>
            )}
          </div>

          <div className="today-retail-hero__actions">
            <a className="today-retail-hero__primary" href="#vento-por-hora">
              Ver vento por horário <ArrowRight aria-hidden="true" />
            </a>
            <a className="today-retail-hero__secondary" href="#vento-na-semana">
              Comparar os próximos dias
            </a>
          </div>
        </div>

        <div className="today-retail-hero__showcase wind-retail-hero__showcase">
          <article
            className="today-retail-hero__current wind-retail-hero__current"
            style={photoStyle}
            aria-label="Resumo do vento e das rajadas previstas em Pelotas"
          >
            <div className="today-retail-hero__current-photo" role="img" aria-label={photo.alt} />

            <div className="today-retail-hero__current-content">
              <header>
                <div>
                  <span>Pelotas, RS</span>
                  <small>Próximas 12 horas</small>
                </div>
                <b>
                  <i aria-hidden="true" /> Vento
                </b>
              </header>

              <div className="today-retail-hero__current-main">
                <div className="today-retail-hero__weather-icon">
                  <WeatherIcon name={iconName} title={`Cenário de vento de maior destaque: ${condition}`} />
                </div>
                <div>
                  <strong>{formatSpeed(strongestHour?.windGust ?? strongestHour?.windSpeed)}</strong>
                  <span>maior intensidade nas próximas horas</span>
                  <small>{strongestHour ? `por volta de ${strongestHour.time}` : "horários em atualização"}</small>
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

          <div className="today-retail-hero__tiles wind-retail-hero__tiles" aria-label="Destaques do vento">
            <article className="is-wind">
              <span><Wind aria-hidden="true" /> Próxima maior rajada</span>
              <strong>{formatSpeed(strongestHour?.windGust)}</strong>
              <small>{strongestHour?.time ?? "Em atualização"}</small>
            </article>
            <article>
              <span><Compass aria-hidden="true" /> Dia mais ventoso</span>
              <strong>{strongestDay?.weekday ?? "—"}</strong>
              <small>{formatSpeed(strongestDay?.windGust)}</small>
            </article>
            <article className="is-sun">
              <span><Navigation aria-hidden="true" /> Direção observada</span>
              <strong>{currentDirection ?? "—"}</strong>
              <small>{weather.current.available ? "medição local" : "indisponível"}</small>
            </article>
            <article className="is-rain">
              <span><Gauge aria-hidden="true" /> Fonte principal</span>
              <strong>{weather.source.forecastName ?? weather.source.name}</strong>
              <small>vento e rajadas previstos</small>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
