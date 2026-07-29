import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Cloud,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSun,
  Moon,
  Sun,
  Wind,
  type LucideIcon,
} from "lucide-react";

import { HourlyRainVolume } from "@/components/weather/HourlyRainVolume";
import type { WeatherIconName } from "@/lib/weather/types";

import "./HomeForecastStory.css";

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

type RainLevel = "none" | "low" | "moderate" | "high" | "very-high";

export type ForecastStoryData = {
  weather: {
    current: {
      windSpeed: number | null;
      windGust: number | null;
    } | null;
    hourly: Array<{
      time: string;
      timestamp?: string;
      temperature: number | null;
      precipitationProbability: number | null;
      precipitationMm?: number | null;
      windSpeed: number | null;
      windGust: number | null;
      icon: WeatherIconName;
    }>;
    daily: Array<{
      weekday: string;
      date: string;
      dateIso?: string;
      min: number | null;
      max: number | null;
      rainChance: number | null;
      precipitationMm: number | null;
      windGust: number | null;
      icon: WeatherIconName;
    }>;
  };
};

type HomeForecastStoryProps = {
  data: ForecastStoryData;
  context?: "home" | "today-page" | "regional-page";
  locationName?: string;
  showLinks?: boolean;
};

function ForecastIcon({ name, size = 25 }: { name: WeatherIconName; size?: number }) {
  const Icon = iconMap[name];
  return <Icon aria-hidden="true" size={size} strokeWidth={1.7} />;
}

function rainReading(value: number | null) {
  const chance = Math.max(0, Math.min(100, Math.round(value ?? 0)));

  if (chance === 0) return { chance, level: "none" as RainLevel, label: "Sem chuva indicada" };
  if (chance < 20) return { chance, level: "low" as RainLevel, label: "Chance baixa" };
  if (chance < 50) return { chance, level: "moderate" as RainLevel, label: "Chance moderada" };
  if (chance < 80) return { chance, level: "high" as RainLevel, label: "Chance alta" };
  return { chance, level: "very-high" as RainLevel, label: "Chance muito alta" };
}

function formatNumber(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits }).format(value);
}

function formatMetric(value: number | null, suffix = "") {
  return value === null || !Number.isFinite(value) ? "—" : `${formatNumber(value)}${suffix}`;
}

function hourlyVolumeLabel(value: number | null | undefined, index: number) {
  if (value === undefined) return <HourlyRainVolume index={index} />;
  if (value === null) return <small>Volume indisponível</small>;
  if (value <= 0) return <small>Sem volume relevante</small>;
  return <small>{formatNumber(value)} mm previstos</small>;
}

function windValue(windGust: number | null, windSpeed: number | null) {
  return windGust ?? windSpeed ?? 0;
}

function timeReference(value: string | null | undefined) {
  if (!value) return "horário não informado";
  const normalized = value.trim().toLocaleLowerCase("pt-BR");
  if (normalized === "agora") return "agora";
  if (normalized === "próxima hora") return "na próxima hora";
  return `por volta de ${value}`;
}

function tomorrowHeadline(chance: number | null) {
  const normalizedChance = chance ?? 0;

  if (normalizedChance >= 70) return "Chuva deve marcar o dia de amanhã";
  if (normalizedChance >= 30) return "Amanhã pode ter períodos de chuva";
  return "Amanhã tende a ter menor chance de chuva";
}

function tomorrowDescription(
  chance: number | null,
  precipitation: number | null,
  windGust: number | null,
) {
  const rainText =
    precipitation === null
      ? chance === null
        ? "chuva em atualização"
        : `${chance}% de chance de chuva`
      : chance === null
        ? `${formatNumber(precipitation)} mm previstos pelo modelo`
        : `${chance}% de chance de chuva e ${formatNumber(precipitation)} mm previstos`;
  const windText = windGust === null ? "rajadas em atualização" : `rajadas de até ${windGust} km/h`;

  return `${rainText}, com ${windText}.`;
}

export function HomeForecastStory({
  data,
  context = "home",
  locationName = "Pelotas",
  showLinks = true,
}: HomeForecastStoryProps) {
  const { hourly, daily, current } = data.weather;
  const isDetailedPage = context !== "home";
  const visibleHours = hourly.slice(0, 7);
  const today = daily[0];
  const tomorrow = daily[1];
  const nextDays = daily.slice(1, 6);
  const peakHour = visibleHours.reduce<(typeof visibleHours)[number] | null>((highest, hour) => {
    const currentChance = hour.precipitationProbability ?? 0;
    const highestChance = highest?.precipitationProbability ?? 0;
    return !highest || currentChance > highestChance ? hour : highest;
  }, null);
  const strongestHourlyGust = visibleHours.reduce(
    (highest, hour) => Math.max(highest, windValue(hour.windGust, hour.windSpeed)),
    windValue(current?.windGust ?? null, current?.windSpeed ?? null),
  );
  const forecastWindow =
    visibleHours.length > 1
      ? `${visibleHours[0].time} até ${visibleHours[visibleHours.length - 1].time}`
      : (visibleHours[0]?.time ?? "Horários em atualização");

  if (!today || (visibleHours.length === 0 && nextDays.length === 0)) return null;

  return (
    <section
      className="home-forecast-story"
      id="previsao-hoje"
      aria-labelledby="home-forecast-title"
    >
      <header className="home-forecast-heading">
        <div>
          <span className="home-forecast-eyebrow">
            {isDetailedPage ? `Previsão por hora em ${locationName}` : "Previsão hora a hora"}
          </span>
          <h2 id="home-forecast-title">
            {isDetailedPage
              ? "Temperatura, chuva e vento nas próximas horas"
              : "Veja como o tempo deve mudar ao longo do dia"}
          </h2>
        </div>

        <dl className="home-forecast-facts" aria-label={`Resumo da previsão de hoje em ${locationName}`}>
          <div>
            <dt>{isDetailedPage ? "Máxima prevista" : "Temperatura máxima"}</dt>
            <dd>{formatMetric(today.max, "°")}</dd>
          </div>
          <div>
            <dt>{isDetailedPage ? "Mínima prevista" : "Temperatura mínima"}</dt>
            <dd>{formatMetric(today.min, "°")}</dd>
          </div>
          <div>
            <dt>{isDetailedPage ? "Maior chance de chuva" : "Chance de chuva"}</dt>
            <dd>{formatMetric(today.rainChance, "%")}</dd>
          </div>
          <div>
            <dt>{isDetailedPage ? "Rajada máxima" : "Vento mais forte"}</dt>
            <dd>{formatMetric(today.windGust, " km/h")}</dd>
          </div>
        </dl>
      </header>

      {visibleHours.length > 0 ? (
        <>
          <div className="home-forecast-window" aria-label="Resumo das próximas horas">
            <div>
              <small>{isDetailedPage ? "Período mostrado" : "Janela exibida"}</small>
              <strong>{visibleHours.length} horários</strong>
              <span>{forecastWindow}</span>
            </div>
            <div
              className={`rain-${rainReading(peakHour?.precipitationProbability ?? null).level}`}
            >
              <small>Maior chance de chuva</small>
              <strong>{rainReading(peakHour?.precipitationProbability ?? null).chance}%</strong>
              <span>{timeReference(peakHour?.time)}</span>
            </div>
            <div>
              <small>{isDetailedPage ? "Rajada máxima" : "Rajada mais forte"}</small>
              <strong>{strongestHourlyGust} km/h</strong>
              <span>nas próximas horas</span>
            </div>
          </div>

          <div className="home-hourly-cards" aria-label={`Tempo nas próximas horas em ${locationName}`}>
            {visibleHours.map((hour, index) => {
              const rain = rainReading(hour.precipitationProbability);
              const isPeak = peakHour === hour && rain.chance > 0;
              const gust = windValue(hour.windGust, hour.windSpeed);

              return (
                <article
                  className={`rain-${rain.level}${index === 0 ? " is-current" : ""}${isPeak ? " is-rain-peak" : ""}`}
                  key={`${hour.timestamp ?? hour.time}-${index}`}
                  aria-label={`${hour.time}: ${formatMetric(hour.temperature, " graus")}, ${rain.chance}% de chance de chuva e rajadas de até ${gust} quilômetros por hora`}
                >
                  <div className="home-hourly-topline">
                    <span>{hour.time}</span>
                    {index === 0 ? (
                      <b>{isDetailedPage ? "Próxima hora" : "Agora"}</b>
                    ) : isPeak ? (
                      <b>Maior chance</b>
                    ) : null}
                  </div>
                  <div className="home-hourly-weather">
                    <ForecastIcon name={hour.icon} />
                    <strong>{formatMetric(hour.temperature, "°")}</strong>
                  </div>
                  <div className="home-hourly-rain">
                    <div>
                      <span>{isDetailedPage ? "Chance de chuva" : "Chuva"}</span>
                      <strong>{rain.chance}%</strong>
                    </div>
                    <i aria-hidden="true">
                      <b style={{ width: `${rain.chance}%` }} />
                    </i>
                    {hourlyVolumeLabel(hour.precipitationMm, index)}
                  </div>
                  <span className="home-hourly-wind">Rajada de até {gust} km/h</span>
                </article>
              );
            })}
          </div>
        </>
      ) : null}

      {nextDays.length > 0 ? (
        <div className="home-next-days" id="tendencia">
          <div className="home-next-days-heading">
            <span className="home-forecast-eyebrow">Tendência do tempo</span>
            <strong>Como o tempo deve evoluir em {locationName}</strong>
          </div>

          <div className="home-next-day-cards">
            {nextDays.map((day, index) => {
              const rain = rainReading(day.rainChance);

              return (
                <article
                  className={`rain-${rain.level}${index === 0 ? " is-tomorrow" : ""}`}
                  key={`${day.weekday}-${day.dateIso ?? day.date}`}
                  aria-label={`${day.weekday}, ${day.date}: máxima de ${formatMetric(day.max, " graus")}, mínima de ${formatMetric(day.min, " graus")} e ${rain.chance}% de chance de chuva`}
                >
                  <div className="home-next-day-topline">
                    <div>
                      <strong>{day.weekday}</strong>
                      <span>{day.date}</span>
                    </div>
                    {index === 0 ? <b>Amanhã</b> : null}
                  </div>
                  <div className="home-next-day-condition">
                    <ForecastIcon name={day.icon} size={28} />
                    <span>{rain.label}</span>
                  </div>
                  <div className="home-next-day-rain">
                    <div>
                      <span>Chance de chuva</span>
                      <strong>{rain.chance}%</strong>
                    </div>
                    <i aria-hidden="true">
                      <b style={{ width: `${rain.chance}%` }} />
                    </i>
                    <small>
                      {day.precipitationMm === null
                        ? "Volume indisponível"
                        : day.precipitationMm > 0
                          ? `${formatNumber(day.precipitationMm)} mm previstos`
                          : "Sem volume relevante"}
                    </small>
                  </div>
                  <div className="home-next-day-temperatures">
                    <span>
                      <small>Máx.</small>
                      <strong>{formatMetric(day.max, "°")}</strong>
                    </span>
                    <span>
                      <small>Mín.</small>
                      <strong>{formatMetric(day.min, "°")}</strong>
                    </span>
                  </div>
                </article>
              );
            })}
          </div>

          {showLinks && tomorrow ? (
            <article className="home-tomorrow-spotlight">
              <div>
                <span className="home-forecast-eyebrow">Destaque da previsão</span>
                <small>{tomorrow.weekday}</small>
              </div>
              <div>
                <strong>{tomorrowHeadline(tomorrow.rainChance)}</strong>
                <p>
                  {tomorrowDescription(
                    tomorrow.rainChance,
                    tomorrow.precipitationMm,
                    tomorrow.windGust,
                  )}
                </p>
              </div>
              <Link to="/tempo-amanha-pelotas">
                Ver amanhã
                <ArrowRight aria-hidden="true" />
              </Link>
            </article>
          ) : null}

          {showLinks ? (
            <div className="home-forecast-links">
              <Link to="/tempo-hoje-pelotas">
                Ver previsão completa de hoje <ArrowRight aria-hidden="true" />
              </Link>
              <Link to="/previsao-7-dias-pelotas">Ver previsão para 7 dias</Link>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
