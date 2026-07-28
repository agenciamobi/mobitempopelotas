import Link from "@/production/compat/NextLink";
import type { ReactNode } from "react";

import type { CppmetForecastItem } from "@/production/lib/cppmet-forecast";
import { WeatherIcon } from "@/production/components/weather-icon";
import {
  resolveHeroWeatherIcon,
  weatherConditionLabels,
} from "@/production/lib/hero-weather-presentation";
import type { WeatherData } from "@/production/lib/weather-data";
import { getWeatherAdvisory, type AdvisoryLevel } from "@/production/lib/weather-insights";

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

type HeroMetricIconName = "humidity" | "wind" | "pressure" | "direction";

type HeroPresentation = {
  description: string;
  primaryAction: {
    href: string;
    label: string;
  };
  secondaryAction: {
    href: string;
    label: string;
  };
  photoHref: string;
  photoCredit: string;
};

const heroPresentationByLevel = {
  normal: {
    description: "Consulte as condições para agora e a previsão para as próximas horas.",
    primaryAction: {
      href: "/tempo-hoje-pelotas",
      label: "Ver previsão de hoje",
    },
    secondaryAction: {
      href: "/previsao-7-dias-pelotas",
      label: "Ver previsão para 7 dias",
    },
    photoHref: "https://commons.wikimedia.org/wiki/File:Amanhecer_na_Praia_do_Laranjal.jpg",
    photoCredit: "Foto: Sebastian2112 / CC BY-SA 4.0",
  },
  attention: {
    description:
      "Veja quando a chance de chuva e de rajadas aumenta e consulte os avisos oficiais antes de sair.",
    primaryAction: {
      href: "/alertas",
      label: "Consultar avisos oficiais",
    },
    secondaryAction: {
      href: "/tempo-hoje-pelotas",
      label: "Ver previsão por hora",
    },
    photoHref: "https://commons.wikimedia.org/wiki/File:Sunset_over_Calm_Lake.jpg",
    photoCredit: "Foto: Kane Morley / CC BY-SA 4.0",
  },
  warning: {
    description:
      "Consulte os avisos oficiais e os horários com maior risco de chuva intensa, temporal ou rajadas fortes.",
    primaryAction: {
      href: "/alertas",
      label: "Consultar avisos oficiais",
    },
    secondaryAction: {
      href: "/tempo-hoje-pelotas",
      label: "Ver previsão por hora",
    },
    photoHref: "https://commons.wikimedia.org/wiki/File:Heavy_Rain.jpg",
    photoCredit: "Foto: Pridatko Oleksandr / domínio público",
  },
} satisfies Record<AdvisoryLevel, HeroPresentation>;

function capitalizeSentence(value: string) {
  return value.replace(/^./, (character) => character.toUpperCase());
}

function getCurrentUpdateMeta(current: WeatherData["current"]) {
  if (!current.available) return "Leitura recente indisponível";
  if (current.updatedAt) return `Atualizada em ${current.updatedAt}`;
  if (current.source.observedAt) return `Leitura das ${current.source.observedAt}`;
  return "Leitura recente";
}

function getOfficialAlertReason(count: number) {
  return count === 1
    ? "Pelotas está incluída em um aviso oficial do INMET"
    : `Pelotas está incluída em ${count} avisos oficiais do INMET`;
}

function getCurrentConditionLabel(icon: keyof typeof weatherConditionLabels) {
  if (icon === "rain") return "Chuva";
  if (icon === "storm") return "Trovoadas";
  if (icon === "wind") return "Tempo ventoso";
  return weatherConditionLabels[icon];
}

function HeroMetricIcon({ name }: { name: HeroMetricIconName }) {
  const paths = {
    humidity: <path d="M12 3.2S6.8 9.3 6.8 13.7a5.2 5.2 0 0 0 10.4 0C17.2 9.3 12 3.2 12 3.2Z" />,
    wind: (
      <path d="M3 8h10.5c3.8 0 3.8-5.5.2-5.5-1.9 0-2.9 1-2.9 2.8M3 13h15.5c3.8 0 3.8 6.5.2 6.5-1.9 0-2.9-1-2.9-2.8M3 18h7.5" />
    ),
    pressure: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="m12 12 3.2-3.2M8 16h8" />
      </>
    ),
    direction: (
      <>
        <path d="m12 3 5 13-5-2-5 2 5-13Z" />
        <path d="M12 14v7" />
      </>
    ),
  } satisfies Record<HeroMetricIconName, ReactNode>;

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths[name]}
      </g>
    </svg>
  );
}

function HeroMetric({
  icon,
  label,
  value,
}: {
  icon: HeroMetricIconName;
  label: string;
  value: string;
}) {
  return (
    <div className="weather-hero-metric">
      <HeroMetricIcon name={icon} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function metricValue(value: number | null, unit: string) {
  return value === null ? "Não informado" : `${value}${unit}`;
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
  const presentation = heroPresentationByLevel[resolvedLevel];
  const today = weather.daily[0];
  const description = cppmetForecast?.item.summary ?? presentation.description;
  const officialAlertReason =
    officialAlertCount > 0 ? getOfficialAlertReason(officialAlertCount) : null;
  const weatherReasons =
    advisory.level === "normal" ? [] : advisory.reasons.map(capitalizeSentence);
  const reasons = [officialAlertReason, ...weatherReasons]
    .filter((reason): reason is string => Boolean(reason))
    .slice(0, 2);
  const currentUpdateMeta = getCurrentUpdateMeta(current);
  const nextHourForecast = !current.available ? (weather.hourly[0] ?? null) : null;
  const heroIcon = resolveHeroWeatherIcon(weather, cppmetForecast?.item.summary);
  const heroCondition = getCurrentConditionLabel(heroIcon);

  return (
    <section
      className={`weather-hero weather-hero--${resolvedLevel} weather-hero--condition-${heroIcon}`}
      data-condition={heroIcon}
      data-official-alerts={officialAlertCount > 0 ? "true" : "false"}
      aria-labelledby="weather-hero-title"
    >
      <div className="weather-hero-photo" aria-hidden="true" />
      {liveCameraBackground}
      <div className="weather-hero-overlay" aria-hidden="true" />
      <div className="weather-hero-orbit weather-hero-orbit--one" aria-hidden="true" />
      <div className="weather-hero-orbit weather-hero-orbit--two" aria-hidden="true" />

      <div className="weather-hero-content">
        <div className="weather-hero-copy">
          <h1 id="weather-hero-title" className="weather-hero-seo-title">
            Tempo em Pelotas hoje
          </h1>
          <p className="weather-hero-headline">{heroCondition} agora em Pelotas.</p>
          <p className="weather-hero-description">{description}</p>

          {today ? (
            <dl className="weather-hero-daily-facts" aria-label="Resumo da previsão de hoje">
              <div>
                <dt>Mín. e máx. previstas</dt>
                <dd>
                  {today.min}° <small>/ {today.max}°</small>
                </dd>
              </div>
              <div>
                <dt>Chance máxima de chuva</dt>
                <dd>{today.rainChance === null ? "Não informada" : `${today.rainChance}%`}</dd>
              </div>
              <div>
                <dt>Rajada máxima prevista</dt>
                <dd>
                  {today.windGust === null ? (
                    "Não informada"
                  ) : (
                    <>
                      {today.windGust} <small>km/h</small>
                    </>
                  )}
                </dd>
              </div>
            </dl>
          ) : null}

          {reasons.length > 0 ? (
            <div className="weather-hero-reasons" aria-label="Fatores considerados na avaliação">
              {reasons.map((reason) => (
                <span key={reason}>{reason}</span>
              ))}
            </div>
          ) : null}

          <div className="weather-hero-actions">
            <Link className="weather-hero-primary" href={presentation.primaryAction.href}>
              {presentation.primaryAction.label}
              <span aria-hidden="true">→</span>
            </Link>
            <Link className="weather-hero-secondary" href={presentation.secondaryAction.href}>
              {presentation.secondaryAction.label}
            </Link>
          </div>
        </div>

        <div
          className={`weather-hero-now${current.available ? "" : " is-unavailable"}`}
          aria-label={
            current.available
              ? "Condições para agora em Pelotas, com medição numérica observada e condição estimada"
              : "Medição atual indisponível e previsão da próxima hora"
          }
        >
          <div className="weather-hero-now-heading">
            <div>
              <span>Pelotas, RS</span>
              <small>{currentUpdateMeta}</small>
            </div>
            <span className="weather-hero-live">
              <i aria-hidden="true" /> {current.available ? "Agora" : "Indisponível"}
            </span>
          </div>

          {current.available ? (
            <>
              <div className="weather-hero-visual">
                <div className="weather-hero-icon weather-hero-icon--condition">
                  <WeatherIcon
                    name={heroIcon}
                    title={`Condição estimada para agora: ${heroCondition}`}
                  />
                  <small>{heroCondition}</small>
                </div>

                <div className="weather-hero-temperature">
                  <strong>{metricValue(current.temperature, "°")}</strong>
                  <div>
                    <small>
                      {current.feelsLike === null
                        ? "Sensação não informada"
                        : `Sensação de ${current.feelsLike}°`}
                    </small>
                  </div>
                </div>
              </div>

              <div className="weather-hero-metrics">
                <HeroMetric
                  icon="humidity"
                  label="Umidade"
                  value={metricValue(current.humidity, "%")}
                />
                <HeroMetric
                  icon="wind"
                  label="Vento medido"
                  value={metricValue(current.windSpeed, " km/h")}
                />
                <HeroMetric
                  icon="pressure"
                  label="Pressão"
                  value={metricValue(current.pressure, " hPa")}
                />
                <HeroMetric
                  icon="direction"
                  label="Direção"
                  value={current.windDirection ?? "Não informada"}
                />
              </div>
            </>
          ) : nextHourForecast ? (
            <>
              <div className="weather-hero-visual">
                <div className="weather-hero-icon weather-hero-icon--condition">
                  <WeatherIcon
                    name={nextHourForecast.icon}
                    title={`Condição prevista para a próxima hora: ${weatherConditionLabels[nextHourForecast.icon]}`}
                  />
                  <small>{weatherConditionLabels[nextHourForecast.icon]}</small>
                </div>

                <div className="weather-hero-temperature">
                  <strong>{metricValue(nextHourForecast.temperature, "°")}</strong>
                  <div>
                    <span>Previsão da próxima hora</span>
                    <small>Medição recente indisponível</small>
                  </div>
                </div>
              </div>

              <div className="weather-hero-metrics">
                <HeroMetric
                  icon="humidity"
                  label="Chance de chuva"
                  value={metricValue(nextHourForecast.precipitation, "%")}
                />
                <HeroMetric
                  icon="wind"
                  label="Vento previsto"
                  value={metricValue(nextHourForecast.windSpeed, " km/h")}
                />
                <HeroMetric
                  icon="direction"
                  label="Rajada prevista"
                  value={metricValue(nextHourForecast.windGust, " km/h")}
                />
              </div>

              <div className="weather-hero-current-unavailable">
                <p>Os valores acima são de previsão e não representam uma medição da estação.</p>
                <Link href="/estacao-embrapa-pelotas">Consultar a estação</Link>
              </div>
            </>
          ) : (
            <div className="weather-hero-current-unavailable">
              <strong>Medição atual indisponível</strong>
              <p>Nenhum valor previsto foi usado como condição observada.</p>
              <Link href="/estacao-embrapa-pelotas">Consultar a estação</Link>
            </div>
          )}
        </div>
      </div>

      {liveCameraBackground ? null : (
        <a
          className="weather-hero-credit"
          href={presentation.photoHref}
          target="_blank"
          rel="noreferrer"
        >
          {presentation.photoCredit}
        </a>
      )}
    </section>
  );
}
