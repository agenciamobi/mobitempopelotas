import Link from "@/production/compat/NextLink";
import type { ReactNode } from "react";

import type { CppmetForecastItem } from "@/production/lib/cppmet-forecast";
import { WeatherIcon } from "@/production/components/weather-icon";
import { resolveHeroPhoto } from "@/production/lib/hero-photo-presentation";
import {
  resolveHeroWeatherIcon,
  weatherConditionLabels,
} from "@/production/lib/hero-weather-presentation";
import type { WeatherData, WeatherIconName } from "@/production/lib/weather-data";
import { getWeatherAdvisory, type AdvisoryLevel } from "@/production/lib/weather-insights";

import "./weather-hero-direction.css";

type WeatherHeroProps = {
  weather: WeatherData;
  advisoryLevel?: AdvisoryLevel;
  officialAlertCount?: number;
  cppmetForecast?: {
    item: CppmetForecastItem;
    sourceUrl: string;
  } | null;
  liveCameraBackground?: ReactNode;
};

function capitalizeSentence(value: string) {
  return value.replace(/^./, (character) => character.toUpperCase());
}

function getCurrentUpdateMeta(current: WeatherData["current"]) {
  if (!current.available) return "Medição recente indisponível";
  if (current.updatedAt) return `Atualizado em ${current.updatedAt}`;
  if (current.source.observedAt) return `Leitura das ${current.source.observedAt}`;
  return "Leitura recente";
}

function getOfficialAlertActionLabel(count: number) {
  return count === 1 ? "Alerta oficial ativo" : `${count} alertas oficiais ativos`;
}

function getCurrentConditionLabel(icon: WeatherIconName) {
  if (icon === "rain") return "Chuva";
  if (icon === "storm") return "Trovoadas";
  if (icon === "wind") return "Tempo ventoso";
  return weatherConditionLabels[icon];
}

function formatMetric(value: number | null, unit: string) {
  return value === null ? "—" : `${value}${unit}`;
}

function HeroFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="weather-hero-editorial-fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function WeatherHero({
  weather,
  advisoryLevel,
  officialAlertCount = 0,
  cppmetForecast = null,
  liveCameraBackground = null,
}: WeatherHeroProps) {
  const { current } = weather;
  const advisory = getWeatherAdvisory(weather);
  const resolvedLevel = advisoryLevel ?? advisory.level;
  const today = weather.daily[0] ?? null;
  const nextHourForecast = weather.hourly[0] ?? null;
  const hourlyPreview = weather.hourly.slice(0, 4);
  const resolvedIcon = resolveHeroWeatherIcon(weather, cppmetForecast?.item.summary);
  const displayIcon = current.available ? resolvedIcon : (nextHourForecast?.icon ?? resolvedIcon);
  const heroPhoto = resolveHeroPhoto({
    weather,
    icon: displayIcon,
    officialSummary: cppmetForecast?.item.summary,
  });
  const displayCondition = getCurrentConditionLabel(displayIcon);
  const displayTemperature = current.available
    ? current.temperature
    : (nextHourForecast?.temperature ?? null);
  const description =
    cppmetForecast?.item.summary ??
    (current.available
      ? "Condição observada e sinais mais importantes para as próximas horas em Pelotas."
      : "A medição atual está indisponível. A próxima hora permanece identificada como previsão.");
  const currentUpdateMeta = getCurrentUpdateMeta(current);
  const forecastReason = advisory.level === "normal" ? null : (advisory.reasons[0] ?? null);
  const secondaryAction =
    officialAlertCount > 0
      ? { href: "/alertas", label: "Ver aviso oficial" }
      : { href: "/previsao-7-dias-pelotas", label: "Ver próximos 7 dias" };

  return (
    <section
      className={`weather-hero weather-hero--${resolvedLevel} weather-hero--condition-${displayIcon} weather-hero--editorial-v70 weather-hero--editorial-v71`}
      data-condition={displayIcon}
      data-photo-kind={heroPhoto.kind}
      data-official-alerts={officialAlertCount > 0 ? "true" : "false"}
      aria-labelledby="weather-hero-title"
    >
      <div
        className="weather-hero-photo"
        aria-hidden="true"
        style={{
          backgroundImage: `url("${heroPhoto.src}")`,
          backgroundPosition: heroPhoto.position,
        }}
      />
      {liveCameraBackground}
      <div className="weather-hero-overlay" aria-hidden="true" />

      <div className="weather-hero-editorial-layout">
        <div className="weather-hero-editorial-main">
          <div className="weather-hero-editorial-meta">
            <div className="weather-hero-editorial-context">
              <span className="weather-hero-editorial-location">Pelotas, RS</span>
              <span
                className={`weather-hero-editorial-status${current.available ? " is-live" : " is-unavailable"}`}
              >
                <i aria-hidden="true" />
                {current.available ? "Agora" : "Previsão"}
              </span>
              <span className="weather-hero-editorial-update">{currentUpdateMeta}</span>
            </div>
          </div>

          <div className="weather-hero-editorial-copy">
            <h1 id="weather-hero-title" className="weather-hero-seo-title">
              Tempo agora em Pelotas
            </h1>

            <div className="weather-hero-editorial-reading">
              <div
                className="weather-hero-editorial-temperature"
                aria-label={
                  current.available
                    ? "Temperatura agora"
                    : "Temperatura prevista para a próxima hora"
                }
              >
                <strong>{formatMetric(displayTemperature, "°")}</strong>
              </div>
              <div className="weather-hero-editorial-condition">
                <div className="weather-hero-editorial-condition-icon">
                  <WeatherIcon name={displayIcon} title={`Condição: ${displayCondition}`} />
                </div>
                <div>
                  <p>{displayCondition}</p>
                  <span>
                    {current.available
                      ? current.feelsLike === null
                        ? "Sensação não informada"
                        : `Sensação de ${current.feelsLike}°`
                      : "Previsão da próxima hora"}
                  </span>
                </div>
              </div>
            </div>

            <p className="weather-hero-editorial-source-inline">
              <span>{current.available ? "Condição observada" : "Fonte da observação"}</span>
              <strong>{current.source.name}</strong>
            </p>

            <p className="weather-hero-editorial-description">{description}</p>

            {officialAlertCount > 0 ? (
              <Link className="weather-hero-editorial-alert" href="/alertas">
                <span className="weather-hero-editorial-alert-dot" aria-hidden="true" />
                <strong>{getOfficialAlertActionLabel(officialAlertCount)}</strong>
                <i aria-hidden="true">→</i>
              </Link>
            ) : forecastReason ? (
              <p className="weather-hero-editorial-note">{capitalizeSentence(forecastReason)}</p>
            ) : null}

            <div className="weather-hero-editorial-actions">
              <Link className="weather-hero-editorial-primary" href="/tempo-hoje-pelotas">
                Ver previsão por hora <span aria-hidden="true">→</span>
              </Link>
              <Link className="weather-hero-editorial-secondary" href={secondaryAction.href}>
                {secondaryAction.label} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <div
            className="weather-hero-editorial-facts weather-hero-editorial-facts--essential"
            aria-label="Resumo das condições e da previsão de hoje"
          >
            <HeroFact label="Mín. / máx." value={today ? `${today.min}° / ${today.max}°` : "—"} />
            <HeroFact
              label="Chuva"
              value={
                today?.rainChance === null || today?.rainChance === undefined
                  ? "—"
                  : `${today.rainChance}%`
              }
            />
            <HeroFact
              label={current.available ? "Vento" : "Vento previsto"}
              value={formatMetric(
                current.available ? current.windSpeed : (nextHourForecast?.windSpeed ?? null),
                " km/h",
              )}
            />
          </div>
        </div>

        <div
          className="weather-hero-editorial-hourly weather-hero-editorial-hourly-strip"
          aria-label="Previsão para as próximas horas"
        >
          <div className="weather-hero-editorial-hourly-heading">
            <div>
              <span>Próximas horas</span>
              <strong>Como o tempo evolui</strong>
            </div>
          </div>

          {hourlyPreview.length > 0 ? (
            <div className="weather-hero-editorial-hourly-list">
              {hourlyPreview.map((hour, index) => (
                <div className="weather-hero-editorial-hour" key={`${hour.time}-${index}`}>
                  <span className="weather-hero-editorial-hour-time">
                    {index === 0 && current.available ? "Agora" : hour.time}
                  </span>
                  <span className="weather-hero-editorial-hour-icon">
                    <WeatherIcon name={hour.icon} title={weatherConditionLabels[hour.icon]} />
                  </span>
                  <strong>{hour.temperature}°</strong>
                  <small>
                    {hour.precipitation === null ? "Chuva —" : `${hour.precipitation}% chuva`}
                  </small>
                </div>
              ))}
            </div>
          ) : (
            <div className="weather-hero-editorial-hourly-empty">
              <strong>Previsão por hora indisponível</strong>
              <p>Os dados serão atualizados assim que a fonte responder novamente.</p>
            </div>
          )}

          <Link
            className="weather-hero-editorial-hourly-more"
            href="/tempo-hoje-pelotas"
            aria-label="Ver a previsão completa por hora"
          >
            Ver todas <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {liveCameraBackground ? null : (
        <span className="weather-hero-credit">{heroPhoto.credit}</span>
      )}
    </section>
  );
}
