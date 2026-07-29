import { Link } from "@tanstack/react-router";
import { ArrowRight, MapPin } from "lucide-react";
import type { CSSProperties } from "react";

import { selectPriorityRegionalAlert } from "@/lib/weather/regional-alert-priority";
import type { RegionalCityWeatherData } from "@/lib/weather/regional-city-weather.types";
import { WeatherIcon } from "@/production/components/weather-icon";
import type { WeatherIconName } from "@/production/lib/weather-data";

import styles from "./RegionalCityHero.module.css";
import { formatRegionalDateTime } from "./regional-time-format";
import { isRegionalNight, regionalWeatherIcon } from "./regional-weather-presentation";

type HeroPresentation = {
  icon: WeatherIconName;
  image: string;
  position: string;
};

const PHOTOS = {
  clear:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=72",
  clouds:
    "https://images.unsplash.com/photo-1499346030926-9a72daac6c63?auto=format&fit=crop&w=1400&q=72",
  rain:
    "https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=1400&q=72",
  storm:
    "https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?auto=format&fit=crop&w=1400&q=72",
  fog:
    "https://images.unsplash.com/photo-1485236715568-ddc5ee6ca227?auto=format&fit=crop&w=1400&q=72",
  night:
    "https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=1400&q=72",
} as const;

const regionalNumberFormat = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});

function metric(value: number | null, suffix: string) {
  return value === null || !Number.isFinite(value)
    ? "—"
    : `${regionalNumberFormat.format(value)}${suffix}`;
}

function maximum(values: Array<number | null>) {
  const usable = values.filter((value): value is number => value !== null && Number.isFinite(value));
  return usable.length > 0 ? Math.max(...usable) : null;
}

function conditionPresentation(condition: string | null, observedAt: string | null): HeroPresentation {
  const normalized = (condition ?? "").toLocaleLowerCase("pt-BR");
  const night = isRegionalNight(observedAt);
  const icon = regionalWeatherIcon(condition, observedAt);

  if (/temporal|trovoada/.test(normalized)) {
    return { icon, image: PHOTOS.storm, position: "center 52%" };
  }
  if (/chuva|garoa/.test(normalized)) {
    return { icon, image: PHOTOS.rain, position: "center 50%" };
  }
  if (/neblina|nevoeiro/.test(normalized)) {
    return { icon, image: PHOTOS.fog, position: "center 48%" };
  }
  if (/limpo/.test(normalized)) {
    return {
      icon,
      image: night ? PHOTOS.night : PHOTOS.clear,
      position: night ? "center 44%" : "center 50%",
    };
  }
  if (/parcialmente/.test(normalized)) {
    return {
      icon,
      image: night ? PHOTOS.night : PHOTOS.clouds,
      position: "center 48%",
    };
  }
  return { icon, image: PHOTOS.clouds, position: "center 48%" };
}

export function RegionalCityHero({ data }: { data: RegionalCityWeatherData }) {
  const { city, current } = data;
  const priorityAlert = selectPriorityRegionalAlert(data.alerts.items);
  const today = data.daily[0] ?? null;
  const highestRainChance = maximum(data.daily.map((day) => day.rainChance));
  const strongestGust = maximum(data.daily.map((day) => day.windGust));
  const condition = current?.condition ?? "Condição em atualização";
  const presentation = conditionPresentation(condition, current?.observedAt ?? null);
  const headline = current
    ? `${condition} agora em ${city.name}.`
    : `Tempo em ${city.name} em atualização.`;
  const description = current
    ? `A estimativa atual indica ${metric(current.temperature, "°")}, sensação de ${metric(current.feelsLike, "°")} e vento de ${metric(current.windSpeed, " km/h")}. Consulte a evolução por hora e a previsão dos próximos dias.`
    : `Os dados meteorológicos para ${city.name} estão sendo atualizados. A página continuará consultando automaticamente as fontes do portal.`;
  const reasons = [
    priorityAlert ? `${city.name} está incluída em aviso oficial do INMET` : null,
    highestRainChance !== null && highestRainChance >= 50
      ? `A chance de chuva chega a ${regionalNumberFormat.format(highestRainChance)}%`
      : null,
    strongestGust !== null && strongestGust >= 40
      ? `As rajadas podem chegar a ${regionalNumberFormat.format(strongestGust)} km/h`
      : null,
  ]
    .filter((reason): reason is string => Boolean(reason))
    .slice(0, 2);
  const mediaStyle = {
    "--regional-hero-image": `url("${presentation.image}")`,
    "--regional-hero-position": presentation.position,
  } as CSSProperties;

  return (
    <section
      className={`${styles.hero} regional-city-hero`}
      aria-labelledby="regional-city-hero-title"
    >
      <div className={`${styles.copy} regional-city-hero-copy`}>
        <Link className={styles.back} to="/tempo-na-regiao-sul-rs">
          Central regional <ArrowRight aria-hidden="true" />
        </Link>
        <span className={styles.eyebrow}>Boletim meteorológico · {city.name}</span>
        <h1 id="regional-city-hero-title">{headline}</h1>
        <p>{description}</p>

        {reasons.length > 0 ? (
          <div className={styles.reasons} aria-label="Pontos de atenção para o município">
            {reasons.map((reason) => (
              <span key={reason}>{reason}</span>
            ))}
          </div>
        ) : null}

        <div className={styles.actions}>
          <a
            className={styles.primaryAction}
            href={priorityAlert ? "#avisos-municipais" : "#previsao-horaria-regional"}
          >
            {priorityAlert ? "Consultar aviso municipal" : "Ver previsão por hora"}
            <span aria-hidden="true">→</span>
          </a>
          <a
            className={styles.secondaryAction}
            href={priorityAlert ? "#previsao-horaria-regional" : "#previsao-7-dias-regional"}
          >
            {priorityAlert ? "Ver previsão por hora" : "Ver próximos 7 dias"}
          </a>
        </div>

        <div className={styles.location}>
          <MapPin aria-hidden="true" /> {city.group} · Rio Grande do Sul
        </div>
      </div>

      <div className={`${styles.media} regional-city-hero-media`} style={mediaStyle}>
        <article
          className={`${styles.nowCard} regional-city-now-card`}
          aria-label={`Condição meteorológica estimada para ${city.name}`}
        >
          <header>
            <div>
              <strong>{city.name}, RS</strong>
              <small>
                {current
                  ? `Atualizada em ${formatRegionalDateTime(current.observedAt)}`
                  : "Dados em atualização"}
              </small>
            </div>
            <span className={styles.nowStatus}>
              <i aria-hidden="true" /> {current ? "Agora" : "Atualizando"}
            </span>
          </header>

          <div className={styles.temperatureRow}>
            <div className={styles.conditionIcon}>
              <WeatherIcon name={presentation.icon} title={`Condição estimada: ${condition}`} />
              <small>{condition}</small>
            </div>
            <div className={styles.temperature}>
              <strong>{metric(current?.temperature ?? null, "°")}</strong>
              <span>Sensação de {metric(current?.feelsLike ?? null, "°")}</span>
            </div>
          </div>

          <dl>
            <div>
              <dt>Umidade</dt>
              <dd>{metric(current?.humidity ?? null, "%")}</dd>
            </div>
            <div>
              <dt>Vento</dt>
              <dd>{metric(current?.windSpeed ?? null, " km/h")}</dd>
            </div>
            <div>
              <dt>Pressão</dt>
              <dd>{metric(current?.pressure ?? null, " hPa")}</dd>
            </div>
          </dl>

          <footer>
            <span>Estimativa por modelo para as coordenadas centrais</span>
            {today ? (
              <small>
                {metric(today.minimum, "°")} / {metric(today.maximum, "°")} previstos hoje
              </small>
            ) : null}
          </footer>
        </article>

        <div className={styles.photoLabel}>
          <span>
            <i aria-hidden="true" /> Imagem ilustrativa
          </span>
          <small>Representação visual da condição atual</small>
        </div>
      </div>
    </section>
  );
}
