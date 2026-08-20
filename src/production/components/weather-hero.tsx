import Link from "@/production/compat/NextLink";
import type { ReactNode } from "react";

import type { CppmetForecastItem } from "@/production/lib/cppmet-forecast";
import { WeatherIcon } from "@/production/components/weather-icon";
import { resolveHeroPhoto } from "@/production/lib/hero-photo-presentation";
import {
  resolveHeroWeatherIcon,
  weatherConditionLabels,
} from "@/production/lib/hero-weather-presentation";
import type { InmetAlertSeverity } from "@/production/lib/inmet-alerts";
import type { WeatherData, WeatherIconName } from "@/production/lib/weather-data";
import { getWeatherAdvisory, type AdvisoryLevel } from "@/production/lib/weather-insights";

import "./weather-hero-direction.css";

type WeatherHeroProps = {
  weather: WeatherData;
  advisoryLevel?: AdvisoryLevel;
  officialAlertCount?: number;
  officialAlertSeverity?: InmetAlertSeverity;
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

function getOfficialAlertActionLabel(count: number, severity: InmetAlertSeverity) {
  const countLabel = count === 1 ? "1 alerta oficial" : `${count} alertas oficiais`;
  if (severity === "great-danger") return `${countLabel} · vermelho`;
  if (severity === "danger") return `${countLabel} · laranja`;
  if (severity === "potential") return `${countLabel} · amarelo`;
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
    <div className="tp-home-hero__fact">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function WeatherHero({
  weather,
  advisoryLevel,
  officialAlertCount = 0,
  officialAlertSeverity = "unknown",
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
  const officialSeverityClass =
    officialAlertSeverity === "unknown" ? " severity-unknown" : ` severity-${officialAlertSeverity}`;

  return (
    <section
      className={`tp-home-hero tp-home-hero--${resolvedLevel} tp-home-hero--condition-${displayIcon}`}
      data-condition={displayIcon}
      data-photo-kind={heroPhoto.kind}
      data-official-alerts={officialAlertCount > 0 ? "true" : "false"}
      data-official-alert-severity={officialAlertSeverity}
      aria-labelledby="weather-hero-title"
    >
      <div
        className="tp-home-hero__photo"
        aria-hidden="true"
        style={{
          backgroundImage: `url("${heroPhoto.src}")`,
          backgroundPosition: heroPhoto.position,
        }}
      />
      {liveCameraBackground}
      <div className="tp-home-hero__overlay" aria-hidden="true" />

      <div className="tp-home-hero__layout">
        <div className="tp-home-hero__main">
          <div className="tp-home-hero__meta">
            <div className="tp-home-hero__context">
              <span className="tp-home-hero__location">Pelotas, RS</span>
              <span
                className={`tp-home-hero__status${current.available ? " is-live" : " is-unavailable"}`}
              >
                <i aria-hidden="true" />
                {current.available ? "Agora" : "Previsão"}
              </span>
              <span className="tp-home-hero__update">{currentUpdateMeta}</span>
            </div>
          </div>

          <div className="tp-home-hero__copy">
            <h1 id="weather-hero-title" className="tp-home-hero__seo-title">
              Tempo agora em Pelotas
            </h1>

            <div className="tp-home-hero__reading">
              <div
                className="tp-home-hero__temperature"
                aria-label={
                  current.available
                    ? "Temperatura agora"
                    : "Temperatura prevista para a próxima hora"
                }
              >
                <strong>{formatMetric(displayTemperature, "°")}</strong>
              </div>
              <div className="tp-home-hero__condition">
                <div className="tp-home-hero__condition-icon">
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

            <p className="tp-home-hero__description">{description}</p>

            {officialAlertCount > 0 ? (
              <Link className={`tp-home-hero__alert${officialSeverityClass}`} href="/alertas">
                <span className="tp-home-hero__alert-dot" aria-hidden="true" />
                <strong>{getOfficialAlertActionLabel(officialAlertCount, officialAlertSeverity)}</strong>
                <i aria-hidden="true">→</i>
              </Link>
            ) : forecastReason ? (
              <p className="tp-home-hero__note">{capitalizeSentence(forecastReason)}</p>
            ) : null}

            <div className="tp-home-hero__actions">
              <Link className="tp-home-hero__primary" href="/tempo-hoje-pelotas">
                Ver previsão por hora <span aria-hidden="true">→</span>
              </Link>
              <Link className="tp-home-hero__secondary" href={secondaryAction.href}>
                {secondaryAction.label} <span aria-hidden="true">→</span>
              </Link>
            </div>

            <p className="tp-home-hero__source-inline">
              <span>{current.available ? "Condição observada" : "Fonte da observação"}</span>
              <strong>{current.source.name}</strong>
            </p>
          </div>

          <div className="tp-home-hero__facts" aria-label="Resumo das condições e da previsão de hoje">
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

        <div className="tp-home-hero__hourly" aria-label="Previsão para as próximas horas">
          <div className="tp-home-hero__hourly-heading">
            <div>
              <span>Próximas horas</span>
              <strong>Como o tempo evolui</strong>
            </div>
          </div>

          {hourlyPreview.length > 0 ? (
            <div className="tp-home-hero__hourly-list">
              {hourlyPreview.map((hour, index) => (
                <div className="tp-home-hero__hour" key={`${hour.time}-${index}`}>
                  <span className="tp-home-hero__hour-time">
                    {index === 0 && current.available ? "Agora" : hour.time}
                  </span>
                  <span className="tp-home-hero__hour-icon">
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
            <div className="tp-home-hero__hourly-empty">
              <strong>Previsão por hora indisponível</strong>
              <p>Os dados serão atualizados assim que a fonte responder novamente.</p>
            </div>
          )}

          <Link
            className="tp-home-hero__hourly-more"
            href="/tempo-hoje-pelotas"
            aria-label="Ver a previsão completa por hora"
          >
            Ver todas <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {liveCameraBackground ? null : (
        <span className="tp-home-hero__credit">{heroPhoto.credit}</span>
      )}
    </section>
  );
}
