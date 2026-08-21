import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CloudRain,
  Droplets,
  Gauge,
  ShieldAlert,
  Umbrella,
  Wind,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";

import { WeatherIcon } from "@/production/components/weather-icon";
import type { DailyForecast, WeatherData, WeatherIconName } from "@/production/lib/weather-data";
import type { AdvisoryLevel } from "@/production/lib/weather-insights";

import { getRetailWeatherPhoto } from "./today-retail-hero-backgrounds";
import "./TodayRetailHero.css";
import "./TodayRetailHeroPhoto.css";
import "./RainRetailHero.css";

type RainRetailHeroProps = {
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

function rainScore(day: DailyForecast) {
  return (day.rainChance ?? 0) + day.precipitation * 4;
}

function formatChance(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : `${value}%`;
}

function formatMillimeters(value: number | null | undefined) {
  return value === null || value === undefined
    ? "—"
    : `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mm`;
}

function formatGust(value: number | null) {
  if (value === null) return "—";
  if (value <= 0) return "Sem rajadas";
  return `${value} km/h`;
}

function timeReference(value: string | null | undefined) {
  if (!value) return "Horário em atualização";
  const normalized = value.trim().toLocaleLowerCase("pt-BR");
  if (normalized === "agora") return "Agora";
  if (normalized === "próxima hora") return "Na próxima hora";
  return `Por volta de ${value}`;
}

function alertLabel(count: number) {
  return count === 1 ? "1 aviso oficial" : `${count} avisos oficiais`;
}

function choosePhotoIcon(weather: WeatherData): WeatherIconName {
  const peakHour = weather.hourly.slice(0, 12).reduce<(typeof weather.hourly)[number] | null>(
    (selected, hour) =>
      !selected || (hour.precipitation ?? -1) > (selected.precipitation ?? -1) ? hour : selected,
    null,
  );
  const rainiestDay = weather.daily.slice(0, 7).reduce<DailyForecast | null>(
    (selected, day) => (!selected || rainScore(day) > rainScore(selected) ? day : selected),
    null,
  );

  if ((peakHour?.precipitation ?? 0) >= 40 || (rainiestDay?.precipitation ?? 0) >= 2) {
    return peakHour?.icon === "storm" || rainiestDay?.icon === "storm" ? "storm" : "rain";
  }

  return weather.hourly[0]?.icon ?? weather.daily[0]?.icon ?? "cloud";
}

export function RainRetailHero({
  weather,
  advisoryLevel,
  officialAlertCount = 0,
}: RainRetailHeroProps) {
  const hours = weather.hourly.slice(0, 12);
  const days = weather.daily.slice(0, 7);
  const hasHourlyForecast = hours.length > 0;
  const hasDailyForecast = days.length > 0;
  const hasRainData = hasHourlyForecast || hasDailyForecast;
  const today = days[0] ?? null;
  const peakHour = hours.reduce<(typeof hours)[number] | null>(
    (selected, hour) =>
      !selected || (hour.precipitation ?? -1) > (selected.precipitation ?? -1) ? hour : selected,
    null,
  );
  const highestVolumeDay = days.reduce<DailyForecast | null>(
    (selected, day) => (!selected || day.precipitation > selected.precipitation ? day : selected),
    null,
  );
  const hasPositiveRainVolume = (highestVolumeDay?.precipitation ?? 0) > 0;
  const wetHours = hours.filter((hour) => (hour.precipitation ?? 0) >= 30).length;
  const totalRain = days.reduce((total, day) => total + day.precipitation, 0);
  const wetGusts = hours
    .filter((hour) => (hour.precipitation ?? 0) >= 30 && hour.windGust !== null)
    .map((hour) => hour.windGust as number);
  const strongestWetGust = wetGusts.length ? Math.max(...wetGusts) : null;
  const iconName = choosePhotoIcon(weather);
  const photo = getRetailWeatherPhoto(iconName, advisoryLevel);
  const photoStyle = {
    "--today-retail-hero-photo": `url("${photo.src}")`,
    "--today-retail-hero-position": photo.position,
  } as CSSProperties;
  const hasAlert = officialAlertCount > 0;
  const metrics: RetailMetric[] = [
    {
      label: "Volume previsto hoje",
      value: formatMillimeters(today?.precipitation),
      icon: Droplets,
    },
    {
      label: "Total previsto em 7 dias",
      value: hasDailyForecast ? formatMillimeters(totalRain) : "—",
      icon: Gauge,
    },
    {
      label: "Horários com 30% ou mais",
      value: hasHourlyForecast ? `${wetHours} de ${hours.length}` : "Em atualização",
      icon: Umbrella,
    },
  ];

  const description = hasHourlyForecast && hasDailyForecast
    ? "Veja a chance de chuva nas próximas 12 horas, o volume estimado para hoje e os dias com maior possibilidade de precipitação."
    : hasHourlyForecast
      ? "Veja a chance de chuva nas próximas horas. O volume diário e a previsão dos próximos dias estão em atualização."
      : hasDailyForecast
        ? "A previsão diária está disponível; a chance de chuva por horário ainda está em atualização."
        : "A previsão de chuva está em atualização. Consulte novamente em alguns instantes.";

  return (
    <section
      className={`today-retail-hero rain-retail-hero today-retail-hero--${advisoryLevel}`}
      aria-labelledby="rain-retail-hero-title"
      data-official-alerts={hasAlert ? "true" : "false"}
      data-weather-photo={iconName}
    >
      <div className="today-retail-hero__inner rain-retail-hero__inner">
        <div className="today-retail-hero__copy rain-retail-hero__copy">
          <span className="today-retail-hero__eyebrow">
            <i aria-hidden="true" /> Chuva em Pelotas
          </span>

          <h1 id="rain-retail-hero-title">
            Chuva em Pelotas: <span>chance por horário e volume previsto.</span>
          </h1>

          <p>{description}</p>

          <div className="today-retail-hero__badges" aria-label="Situação da previsão de chuva">
            <span>
              <CloudRain aria-hidden="true" /> {hasHourlyForecast
                ? `${wetHours} ${wetHours === 1 ? "horário com 30% ou mais" : "horários com 30% ou mais"}`
                : "Chance por horário em atualização"}
            </span>
            {hasAlert ? (
              <Link className="is-alert" to="/alertas">
                <ShieldAlert aria-hidden="true" /> {alertLabel(officialAlertCount)}
              </Link>
            ) : (
              <span className="is-stable">Sem aviso oficial de chuva listado para Pelotas</span>
            )}
          </div>

          <div className="today-retail-hero__actions">
            {hasHourlyForecast ? (
              <a className="today-retail-hero__primary" href="#chuva-por-hora">
                Ver chance por horário <ArrowRight aria-hidden="true" />
              </a>
            ) : hasDailyForecast ? (
              <a className="today-retail-hero__primary" href="#chuva-na-semana">
                Ver chuva nos próximos 7 dias <ArrowRight aria-hidden="true" />
              </a>
            ) : (
              <Link className="today-retail-hero__primary" to="/tempo-hoje-pelotas">
                Ver tempo de hoje <ArrowRight aria-hidden="true" />
              </Link>
            )}

            {hasDailyForecast && hasHourlyForecast ? (
              <a className="today-retail-hero__secondary" href="#chuva-na-semana">
                Ver chuva nos próximos 7 dias
              </a>
            ) : (
              <Link className="today-retail-hero__secondary" to="/previsao-7-dias-pelotas">
                Ver previsão de 7 dias
              </Link>
            )}
          </div>
        </div>

        <div className="today-retail-hero__showcase rain-retail-hero__showcase">
          <article
            className="today-retail-hero__current rain-retail-hero__current"
            style={photoStyle}
            aria-label={hasRainData ? "Resumo da previsão de chuva em Pelotas" : "Previsão de chuva em atualização em Pelotas"}
          >
            <div
              className="today-retail-hero__current-photo"
              role="img"
              aria-label={hasRainData ? photo.alt : "Imagem ilustrativa da previsão meteorológica de Pelotas"}
            />

            <div className="today-retail-hero__current-content">
              <header>
                <div>
                  <span>Pelotas, RS</span>
                  <small>Previsão para as próximas 12 horas</small>
                </div>
                <b>
                  <i aria-hidden="true" /> Chuva
                </b>
              </header>

              <div className="today-retail-hero__current-main">
                <div className="today-retail-hero__weather-icon">
                  <WeatherIcon
                    name={iconName}
                    title={peakHour ? "Condição associada à maior chance de chuva" : "Previsão de chuva em atualização"}
                  />
                </div>
                <div>
                  <strong>{formatChance(peakHour?.precipitation)}</strong>
                  <span>{peakHour ? "Maior chance nas próximas 12 horas" : "Chance horária em atualização"}</span>
                  <small>{timeReference(peakHour?.time)}</small>
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

          <div className="today-retail-hero__tiles rain-retail-hero__tiles" aria-label="Destaques da chuva">
            <article className="is-rain">
              <span><CloudRain aria-hidden="true" /> Horário com maior chance</span>
              <strong>{formatChance(peakHour?.precipitation)}</strong>
              <small>{timeReference(peakHour?.time)}</small>
            </article>
            <article>
              <span><Umbrella aria-hidden="true" /> Dia com maior volume</span>
              <strong>{hasPositiveRainVolume ? highestVolumeDay?.weekday : hasDailyForecast ? "Sem volume previsto" : "—"}</strong>
              <small>{hasPositiveRainVolume ? formatMillimeters(highestVolumeDay?.precipitation) : hasDailyForecast ? "Nos próximos 7 dias" : "Previsão diária em atualização"}</small>
            </article>
            <article className="is-wind">
              <span><Wind aria-hidden="true" /> Rajada em período com chuva</span>
              <strong>{formatGust(strongestWetGust)}</strong>
              <small>{wetHours > 0 ? "Maior rajada publicada entre os horários com 30% ou mais" : "Sem horário de chuva relevante para comparar rajadas"}</small>
            </article>
            <article className="is-sun">
              <span><Gauge aria-hidden="true" /> Fonte da previsão</span>
              <strong>{weather.source.forecastName ?? weather.source.name}</strong>
              <small>Chance e volume previstos pelo modelo</small>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
