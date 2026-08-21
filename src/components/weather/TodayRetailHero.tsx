import {
  ArrowRight,
  CloudRain,
  Droplets,
  Gauge,
  ShieldAlert,
  SunMedium,
  Thermometer,
  Wind,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties } from "react";

import { WeatherIcon } from "@/production/components/weather-icon";
import {
  resolveHeroWeatherIcon,
  weatherConditionLabels,
} from "@/production/lib/hero-weather-presentation";
import type { WeatherData } from "@/production/lib/weather-data";
import type { AdvisoryLevel } from "@/production/lib/weather-insights";

import { getTodayRetailHeroPhoto } from "./today-retail-hero-backgrounds";
import "./TodayRetailHero.css";
import "./TodayRetailHeroPhoto.css";
import "./TodayRetailHeroRefinement.css";

type TodayRetailHeroProps = {
  weather: WeatherData;
  advisoryLevel: AdvisoryLevel;
  officialAlertCount?: number;
  locationName?: string;
  locationState?: string;
  primaryHref?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  alertHref?: string;
  description?: string;
  currentIsObserved?: boolean;
};

type RetailMetric = {
  label: string;
  value: string;
  detail?: string;
  icon: LucideIcon;
};

function formatValue(value: number | null, suffix = "") {
  return value === null ? "—" : `${value}${suffix}`;
}

function formatWind(value: number | null, direction: string | null) {
  const speed = formatValue(value, " km/h");
  return value !== null && direction ? `${speed} · ${direction}` : speed;
}

function extractClock(value: string | null | undefined) {
  if (!value) return null;
  const matches = value.match(/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g);
  return matches?.[0] ?? null;
}

function updateLabel(weather: WeatherData) {
  const current = weather.current;
  const updateValue = current.updatedAt ?? current.source.observedAt;
  const clock = extractClock(updateValue);

  if (clock) return `Atualizado às ${clock}`;
  if (updateValue) return `Atualizado em ${updateValue}`;
  return current.available ? "Leitura recente" : "Dados em atualização";
}

function alertLabel(count: number, locationName: string) {
  if (count === 1) return `1 aviso oficial para ${locationName}`;
  return `${count} avisos oficiais para ${locationName}`;
}

function buildCurrentMetrics(weather: WeatherData): RetailMetric[] {
  const { current } = weather;
  const nextHour = weather.hourly[0] ?? null;

  if (!current.available && nextHour) {
    return [
      {
        label: "Chuva",
        value: formatValue(nextHour.precipitation, "%"),
        detail: "na próxima hora",
        icon: CloudRain,
      },
      {
        label: "Vento",
        value: formatValue(nextHour.windSpeed, " km/h"),
        detail: "previsão horária",
        icon: Wind,
      },
      {
        label: "Rajada",
        value: formatValue(nextHour.windGust, " km/h"),
        detail: "máxima prevista",
        icon: Gauge,
      },
    ];
  }

  return [
    {
      label: "Sensação",
      value: formatValue(current.feelsLike, "°"),
      icon: Thermometer,
    },
    {
      label: "Umidade",
      value: formatValue(current.humidity, "%"),
      icon: Droplets,
    },
    {
      label: "Vento",
      value: formatWind(current.windSpeed, current.windDirection),
      icon: Wind,
    },
  ];
}

export function TodayRetailHero({
  weather,
  advisoryLevel,
  officialAlertCount = 0,
  locationName = "Pelotas",
  locationState = "RS",
  primaryHref = "#previsao-hoje",
  secondaryHref = "#recursos-hoje",
  secondaryLabel = "Planejar próximas horas",
  alertHref = "/alertas",
  description,
  currentIsObserved,
}: TodayRetailHeroProps) {
  const { current } = weather;
  const today = weather.daily[0] ?? null;
  const nextHour = weather.hourly[0] ?? null;
  const hasForecastSignal = current.available || nextHour !== null;
  const iconName = resolveHeroWeatherIcon(weather);
  const condition = hasForecastSignal
    ? weatherConditionLabels[iconName]
    : "Dados meteorológicos em atualização";
  const currentTemperature = current.available ? current.temperature : (nextHour?.temperature ?? null);
  const metrics = buildCurrentMetrics(weather);
  const sunrise = extractClock(current.sunrise ?? weather.astronomy?.sunrise);
  const sunset = extractClock(current.sunset ?? weather.astronomy?.sunset);
  const hasAlert = officialAlertCount > 0;
  const isObserved = current.available && (currentIsObserved ?? true);
  const conditionMoment = current.available ? "agora" : nextHour ? "na próxima hora" : null;
  const statusDetail = isObserved
    ? "Observado agora"
    : current.available
      ? "Estimativa para agora"
      : nextHour
        ? "Próxima hora"
        : "Dados em atualização";
  const photo = getTodayRetailHeroPhoto(iconName, advisoryLevel);
  const photoStyle = {
    "--today-retail-hero-photo": `url("${photo.src}")`,
    "--today-retail-hero-position": photo.position,
  } as CSSProperties;
  const defaultDescription = conditionMoment
    ? `${condition} ${conditionMoment}. Acompanhe a previsão por hora, chuva e vento nas próximas horas para organizar o seu dia.`
    : `Os dados meteorológicos de ${locationName} estão em atualização. Consulte novamente em alguns instantes para ver condição, chuva e vento.`;

  return (
    <section
      className={`today-retail-hero today-retail-hero--${advisoryLevel}`}
      aria-labelledby="today-retail-hero-title"
      aria-describedby="today-retail-hero-description"
      data-official-alerts={hasAlert ? "true" : "false"}
      data-weather-photo={iconName}
    >
      <div className="today-retail-hero__inner">
        <div className="today-retail-hero__copy">
          <span className="today-retail-hero__eyebrow">
            <i aria-hidden="true" /> Previsão local atualizada · {locationName}, {locationState}
          </span>

          <h1 id="today-retail-hero-title">
            Tempo hoje <span>em {locationName}</span>
          </h1>

          <p id="today-retail-hero-description">
            {description ?? defaultDescription}
          </p>

          <div className="today-retail-hero__badges" aria-label="Situação da previsão">
            <span>{updateLabel(weather)}</span>
            {hasAlert ? (
              <a className="is-alert" href={alertHref}>
                <ShieldAlert aria-hidden="true" /> {alertLabel(officialAlertCount, locationName)}
              </a>
            ) : (
              <span className="is-stable">Sem aviso oficial listado para {locationName}</span>
            )}
          </div>

          <div className="today-retail-hero__actions">
            <a className="today-retail-hero__primary" href={primaryHref}>
              Ver previsão por hora <ArrowRight aria-hidden="true" />
            </a>
            <a className="today-retail-hero__secondary" href={secondaryHref}>
              {secondaryLabel}
            </a>
          </div>
        </div>

        <div className="today-retail-hero__showcase">
          <article
            className="today-retail-hero__current"
            style={photoStyle}
            aria-label={
              isObserved
                ? `Condição observada agora em ${locationName}`
                : current.available
                  ? `Condição estimada agora em ${locationName}`
                  : nextHour
                    ? `Condição prevista para a próxima hora em ${locationName}`
                    : `Dados meteorológicos em atualização em ${locationName}`
            }
          >
            <div
              className="today-retail-hero__current-photo"
              role="img"
              aria-label={photo.alt}
            />

            <div className="today-retail-hero__current-content">
              <header>
                <div>
                  <span>{locationName}, {locationState}</span>
                  <small>{statusDetail}</small>
                </div>
                <b>
                  <i aria-hidden="true" /> {isObserved ? "Agora" : hasForecastSignal ? "Previsão" : "Atualizando"}
                </b>
              </header>

              <div className="today-retail-hero__current-main">
                <div className="today-retail-hero__weather-icon">
                  <WeatherIcon
                    name={iconName}
                    title={`Condição em ${locationName}: ${condition}`}
                  />
                </div>
                <div>
                  <strong>{formatValue(currentTemperature, "°")}</strong>
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

          <div className="today-retail-hero__tiles" aria-label={`Resumo do dia em ${locationName}`}>
            <article>
              <span>
                <Thermometer aria-hidden="true" /> Faixa do dia
              </span>
              <strong>{today ? `${today.min}° / ${today.max}°` : "Em atualização"}</strong>
              <small>Mínima e máxima previstas</small>
            </article>

            <article className="is-rain">
              <span>
                <CloudRain aria-hidden="true" /> Chuva
              </span>
              <strong>{!today || today.rainChance === null ? "—" : `${today.rainChance}%`}</strong>
              <small>Maior chance prevista</small>
            </article>

            <article className="is-wind">
              <span>
                <Wind aria-hidden="true" /> Rajadas
              </span>
              <strong>{!today || today.windGust === null ? "—" : `${today.windGust} km/h`}</strong>
              <small>Máxima prevista hoje</small>
            </article>

            <article className="is-sun">
              <span>
                <SunMedium aria-hidden="true" /> Luz natural
              </span>
              <strong>{sunrise && sunset ? `${sunrise}–${sunset}` : "Em atualização"}</strong>
              <small>Nascer e pôr do sol</small>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
