"use client";

import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  CloudFog,
  CloudRain,
  Eye,
  Gauge,
  Layers3,
  Navigation,
  TimerReset,
  Waves,
  Wind,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { MeteogramData, MeteogramHour } from "@/lib/weather/meteogram.server";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

import "./MeteogramPage.css";

type ForecastWindow = 24 | 48;
type NumericValue = number | null | undefined;
type ChartSeries = {
  id: string;
  label: string;
  unit: string;
  className: string;
  read: (hour: MeteogramHour) => NumericValue;
};

const CHART_WIDTH = 1120;
const CHART_HEIGHT = 290;
const CHART_PADDING = { top: 28, right: 26, bottom: 48, left: 62 } as const;

function formatDateTime(value: string | null | undefined) {
  if (!value) return "horário não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "horário não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatHour(value: string, includeDate = false) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    ...(includeDate ? { weekday: "short", day: "2-digit" } : {}),
    hour: "2-digit",
    minute: "2-digit",
  })
    .format(date)
    .replace(".", "");
}

function formatNumber(value: NumericValue, unit = "", digits = 0) {
  if (value === null || value === undefined) return "—";
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)}${unit}`;
}

function formatRainChance(value: NumericValue) {
  if (value === null || value === undefined) return "Não informada";
  return `${Math.round(value)}%`;
}

function formatGust(value: NumericValue) {
  if (value === null || value === undefined) return "Não informada";
  if (value <= 0) return "Sem rajada prevista";
  return formatNumber(value, " km/h", 1);
}

function directionLabel(degrees: NumericValue) {
  if (degrees === null || degrees === undefined) return "—";
  const labels = ["N", "NNE", "NE", "ENE", "L", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"];
  const normalized = ((degrees % 360) + 360) % 360;
  return labels[Math.round(normalized / 22.5) % labels.length] ?? "—";
}

function weatherLabel(code: NumericValue, isDay: boolean | null) {
  if (code === null || code === undefined) return "Condição não informada";
  if (code === 0) return isDay === false ? "Noite de céu limpo" : "Céu limpo";
  if (code === 1 || code === 2) return "Parcialmente nublado";
  if (code === 3) return "Céu nublado";
  if (code === 45 || code === 48) return "Neblina";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 86)) return "Chuva";
  if (code >= 95) return "Trovoadas";
  return "Tempo variável";
}

function numericHours(
  hours: MeteogramHour[],
  read: (hour: MeteogramHour) => NumericValue,
) {
  return hours.filter((hour) => read(hour) !== null && read(hour) !== undefined);
}

function maximumHour(
  hours: MeteogramHour[],
  read: (hour: MeteogramHour) => NumericValue,
) {
  return numericHours(hours, read).reduce<MeteogramHour | null>((selected, hour) => {
    if (!selected) return hour;
    return (read(hour) ?? Number.NEGATIVE_INFINITY) >
      (read(selected) ?? Number.NEGATIVE_INFINITY)
      ? hour
      : selected;
  }, null);
}

function minimumHour(
  hours: MeteogramHour[],
  read: (hour: MeteogramHour) => NumericValue,
) {
  return numericHours(hours, read).reduce<MeteogramHour | null>((selected, hour) => {
    if (!selected) return hour;
    return (read(hour) ?? Number.POSITIVE_INFINITY) <
      (read(selected) ?? Number.POSITIVE_INFINITY)
      ? hour
      : selected;
  }, null);
}

function positiveMaximumHour(
  hours: MeteogramHour[],
  read: (hour: MeteogramHour) => NumericValue,
) {
  return maximumHour(
    hours.filter((hour) => (read(hour) ?? 0) > 0),
    read,
  );
}

function maximumValue(hours: MeteogramHour[], read: (hour: MeteogramHour) => NumericValue) {
  const values = numericHours(hours, read).map((hour) => read(hour) as number);
  return values.length ? Math.max(...values) : null;
}

function fallbackHours(data: WeatherIntelligenceData): MeteogramHour[] {
  const sourceTime = Date.parse(data.weather.source.fetchedAt);
  return data.weather.hourly.map((hour, index) => ({
    timestamp:
      hour.timestamp ??
      new Date((Number.isFinite(sourceTime) ? sourceTime : Date.now()) + index * 3_600_000).toISOString(),
    temperature: hour.temperature,
    feelsLike: null,
    relativeHumidity: hour.relativeHumidity ?? null,
    dewPoint: hour.dewPoint ?? null,
    precipitationProbability: hour.precipitationProbability,
    precipitationMm: hour.precipitationMm ?? null,
    pressure: hour.pressure ?? null,
    cloudCover: hour.cloudCover ?? null,
    cloudCoverLow: hour.cloudCoverLow ?? null,
    cloudCoverMid: hour.cloudCoverMid ?? null,
    cloudCoverHigh: hour.cloudCoverHigh ?? null,
    visibilityKm: hour.visibilityKm ?? null,
    cape: hour.cape ?? null,
    boundaryLayerHeight: hour.boundaryLayerHeight ?? null,
    windSpeed: hour.windSpeed,
    windGust: hour.windGust,
    windDirectionDegrees: null,
    weatherCode: null,
    isDay: null,
  }));
}

function usableHours(weather: WeatherIntelligenceData, meteogram: MeteogramData) {
  return meteogram.status === "live" && meteogram.hours.length
    ? meteogram.hours
    : fallbackHours(weather);
}

function sourceLabel(weather: WeatherIntelligenceData, meteogram: MeteogramData) {
  if (meteogram.status === "live") return `${meteogram.source.name} ${meteogram.source.model}`;
  return weather.weather.quality.forecastProvider ?? "Previsão disponível";
}

function sourceFetchedAt(weather: WeatherIntelligenceData, meteogram: MeteogramData) {
  if (meteogram.status === "live") return meteogram.source.fetchedAt;
  const key = weather.weather.quality.forecastSource;
  return key ? weather.weather.sources[key].fetchedAt : weather.weather.source.fetchedAt;
}

function temperatureSpread(hour: MeteogramHour) {
  return hour.temperature === null || hour.dewPoint === null
    ? null
    : Math.max(0, hour.temperature - hour.dewPoint);
}

function fogSupportDetail(hour: MeteogramHour, spread: number) {
  const parts = [`temperatura e ponto de orvalho separados por ${formatNumber(spread, " °C", 1)}`];
  if (hour.relativeHumidity !== null) {
    parts.push(`${formatNumber(hour.relativeHumidity, "%")} de umidade`);
  }
  if (hour.cloudCoverLow !== null) {
    parts.push(`${formatNumber(hour.cloudCoverLow, "%")} de nuvens baixas`);
  }
  if (hour.visibilityKm !== null) {
    parts.push(`visibilidade de ${formatNumber(hour.visibilityKm, " km", 1)}`);
  }
  return parts.join(", ");
}

function fogAssessment(hours: MeteogramHour[]) {
  const candidate = minimumHour(
    hours.filter((hour) => temperatureSpread(hour) !== null),
    temperatureSpread,
  );
  if (!candidate) {
    return {
      tone: "unknown",
      title: "Ainda sem dados suficientes",
      detail: "A previsão não informou ponto de orvalho suficiente para avaliar a possibilidade de neblina.",
    };
  }

  const spread = temperatureSpread(candidate);
  if (spread === null) {
    return {
      tone: "unknown",
      title: "Ainda sem dados suficientes",
      detail: "A previsão não informou ponto de orvalho suficiente para avaliar a possibilidade de neblina.",
    };
  }

  const visibility = candidate.visibilityKm;
  const lowCloud = candidate.cloudCoverLow;
  const humidity = candidate.relativeHumidity;
  const hasSupportingSignal = [visibility, lowCloud, humidity].some((value) => value !== null);
  const hasStrongSupportingSignal =
    (visibility !== null && visibility <= 3) ||
    (lowCloud !== null && lowCloud >= 85) ||
    (humidity !== null && humidity >= 95);
  const hasModerateSupportingSignal =
    (visibility !== null && visibility <= 8) ||
    (lowCloud !== null && lowCloud >= 65) ||
    (humidity !== null && humidity >= 90);

  if (spread <= 1.5 && hasStrongSupportingSignal) {
    return {
      tone: "high",
      title: `Maior possibilidade por volta de ${formatHour(candidate.timestamp)}`,
      detail: `${fogSupportDetail(candidate, spread)}. Esses sinais aumentam a possibilidade de neblina, sem confirmar ocorrência em todos os bairros.`,
    };
  }
  if (spread <= 3 && hasModerateSupportingSignal) {
    return {
      tone: "attention",
      title: `Vale acompanhar por volta de ${formatHour(candidate.timestamp)}`,
      detail: `${fogSupportDetail(candidate, spread)}. Os sinais disponíveis podem favorecer neblina, sem confirmar ocorrência em todos os bairros.`,
    };
  }
  if (spread <= 3 && !hasSupportingSignal) {
    return {
      tone: "unknown",
      title: "Ponto de orvalho próximo, mas faltam dados complementares",
      detail: `${fogSupportDetail(candidate, spread)}. Umidade, nuvens baixas e visibilidade não foram informadas para completar a avaliação.`,
    };
  }
  return {
    tone: "low",
    title: "Baixa possibilidade no período",
    detail: hasSupportingSignal
      ? `${fogSupportDetail(candidate, spread)}. Os dados disponíveis não reúnem os principais sinais de neblina ao mesmo tempo.`
      : `${fogSupportDetail(candidate, spread)}. Os sinais complementares ainda não foram informados.`,
  };
}

function pressureAssessment(hours: MeteogramHour[]) {
  const values = numericHours(hours, (hour) => hour.pressure);
  const first = values[0]?.pressure ?? null;
  const last = values.at(-1)?.pressure ?? null;
  if (first === null || last === null) {
    return { title: "Pressão não informada", change: null, detail: "Não há valores horários suficientes para mostrar a tendência." };
  }
  const change = Number((last - first).toFixed(1));
  return {
    title: Math.abs(change) < 1 ? "Pouca mudança prevista" : change > 0 ? "A pressão deve subir" : "A pressão deve cair",
    change,
    detail: `${formatNumber(first, " hPa", 1)} no início e ${formatNumber(last, " hPa", 1)} no fim do período.`,
  };
}

function capeAssessment(hours: MeteogramHour[]) {
  const peak = maximumHour(hours, (hour) => hour.cape);
  const value = peak?.cape ?? null;
  if (value === null) {
    return { title: "Índice de instabilidade não informado", detail: "A previsão não publicou o valor de CAPE nesta atualização." };
  }
  return {
    title:
      value >= 1_000
        ? "Maior possibilidade de nuvens de tempestade"
        : value >= 300
          ? "Alguma instabilidade prevista"
          : "Baixa instabilidade prevista",
    detail: `O índice CAPE chega a ${formatNumber(value, " J/kg")} por volta de ${formatHour(peak?.timestamp ?? "")}. Esse valor, sozinho, não confirma temporal.`,
  };
}

function lineSegments(
  hours: MeteogramHour[],
  read: (hour: MeteogramHour) => NumericValue,
  minimum: number,
  maximum: number,
) {
  const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const plotHeight = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;
  const denominator = Math.max(1, hours.length - 1);
  const range = Math.max(0.1, maximum - minimum);
  const segments: string[] = [];
  let current: string[] = [];

  hours.forEach((hour, index) => {
    const value = read(hour);
    if (value === null || value === undefined) {
      if (current.length) segments.push(current.join(" "));
      current = [];
      return;
    }
    const x = CHART_PADDING.left + (index / denominator) * plotWidth;
    const y = CHART_PADDING.top + ((maximum - value) / range) * plotHeight;
    current.push(`${current.length ? "L" : "M"} ${x.toFixed(2)} ${y.toFixed(2)}`);
  });
  if (current.length) segments.push(current.join(" "));
  return segments;
}

function chartDomain(
  hours: MeteogramHour[],
  series: ChartSeries[],
  fixed?: [number, number],
) {
  if (fixed) return fixed;
  const values = series.flatMap((item) =>
    hours
      .map((hour) => item.read(hour))
      .filter((value): value is number => value !== null && value !== undefined),
  );
  if (!values.length) return null;
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const padding = Math.max(1, (maximum - minimum) * 0.12);
  return [minimum - padding, maximum + padding] as [number, number];
}

function MeteogramLineChart({
  id,
  title,
  description,
  hours,
  selectedIndex,
  series,
  fixedDomain,
  axisUnit,
}: {
  id: string;
  title: string;
  description: string;
  hours: MeteogramHour[];
  selectedIndex: number;
  series: ChartSeries[];
  fixedDomain?: [number, number];
  axisUnit: string;
}) {
  const domain = chartDomain(hours, series, fixedDomain);
  if (!domain) {
    return (
      <section className="meteogram-chart-card is-unavailable" id={id}>
        <h3>{title}</h3>
        <p>{description}</p>
        <strong>Dados não informados nesta atualização</strong>
      </section>
    );
  }

  const [minimum, maximum] = domain;
  const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const selectedX =
    CHART_PADDING.left +
    (Math.min(selectedIndex, Math.max(0, hours.length - 1)) / Math.max(1, hours.length - 1)) *
      plotWidth;
  const ticks = Array.from({ length: 5 }, (_, index) => maximum - ((maximum - minimum) * index) / 4);

  return (
    <section className="meteogram-chart-card" id={id} aria-labelledby={`${id}-title`}>
      <header>
        <div>
          <h3 id={`${id}-title`}>{title}</h3>
          <p>{description}</p>
        </div>
        <div className="meteogram-chart-legend" aria-label={`Legenda de ${title}`}>
          {series.map((item) => (
            <span key={item.id} className={item.className}>
              <i aria-hidden="true" /> {item.label}
            </span>
          ))}
        </div>
      </header>

      <div className="meteogram-chart-scroll">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          role="img"
          aria-label={`${title}. Previsão com ${hours.length} horários.`}
        >
          {ticks.map((tick, index) => {
            const y =
              CHART_PADDING.top +
              (index / Math.max(1, ticks.length - 1)) *
                (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom);
            return (
              <g key={tick}>
                <line className="meteogram-chart-grid" x1={CHART_PADDING.left} y1={y} x2={CHART_WIDTH - CHART_PADDING.right} y2={y} />
                <text className="meteogram-chart-axis" x={CHART_PADDING.left - 10} y={y + 4} textAnchor="end">
                  {formatNumber(tick, axisUnit, axisUnit === " hPa" ? 0 : 0)}
                </text>
              </g>
            );
          })}

          <line className="meteogram-chart-selected" x1={selectedX} y1={CHART_PADDING.top} x2={selectedX} y2={CHART_HEIGHT - CHART_PADDING.bottom} />

          {series.map((item) =>
            lineSegments(hours, item.read, minimum, maximum).map((path, index) => (
              <path key={`${item.id}-${index}`} className={`meteogram-chart-line ${item.className}`} d={path} />
            )),
          )}

          {hours.map((hour, index) => {
            const shouldLabel = index === 0 || index === hours.length - 1 || index % 3 === 0;
            if (!shouldLabel) return null;
            const x = CHART_PADDING.left + (index / Math.max(1, hours.length - 1)) * plotWidth;
            return (
              <text key={hour.timestamp} className="meteogram-chart-time" x={x} y={CHART_HEIGHT - 17} textAnchor="middle">
                {formatHour(hour.timestamp)}
              </text>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

function PrecipitationVolume({ hours, selectedIndex }: { hours: MeteogramHour[]; selectedIndex: number }) {
  const availableHours = hours.filter((hour) => hour.precipitationMm !== null);
  const values = availableHours.map((hour) => hour.precipitationMm as number);
  const complete = availableHours.length === hours.length;

  if (!availableHours.length) {
    return (
      <section className="meteogram-volume is-unavailable" aria-labelledby="meteogram-volume-title">
        <header>
          <div>
            <h3 id="meteogram-volume-title">Chuva prevista por hora</h3>
            <p>Milímetros estimados em cada horário. Valores futuros não são chuva já medida.</p>
          </div>
          <span>Volume não informado no período</span>
        </header>
      </section>
    );
  }

  const maximum = Math.max(0.1, ...values);
  const total = values.reduce((sum, value) => sum + value, 0);

  return (
    <section className="meteogram-volume" aria-labelledby="meteogram-volume-title">
      <header>
        <div>
          <h3 id="meteogram-volume-title">Chuva prevista por hora</h3>
          <p>Milímetros estimados em cada horário. Valores futuros não são chuva já medida.</p>
        </div>
        <span>
          {complete
            ? `${formatNumber(total, " mm", 1)} no período`
            : `${formatNumber(total, " mm", 1)} em ${availableHours.length} de ${hours.length} horários`}
        </span>
      </header>
      <div className="meteogram-volume-grid">
        {hours.map((hour, index) => {
          const volumeKnown = hour.precipitationMm !== null;
          const height = volumeKnown
            ? Math.max(0, ((hour.precipitationMm as number) / maximum) * 100)
            : 0;

          return (
            <article
              key={hour.timestamp}
              className={`${index === selectedIndex ? "is-selected" : ""}${volumeKnown ? "" : " is-unknown"}`.trim()}
            >
              <span style={{ height: `${height}%` }} />
              <strong>{formatNumber(hour.precipitationMm, " mm", 1)}</strong>
              <small>
                {formatHour(hour.timestamp)}{volumeKnown ? "" : " · volume não informado"}
              </small>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function selectedMetric(label: string, value: string, detail?: string) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </article>
  );
}

function selectedRainDetail(hour: MeteogramHour) {
  return hour.precipitationMm === null
    ? "Volume horário não informado"
    : `${formatNumber(hour.precipitationMm, " mm", 1)} previstos na hora`;
}

function selectedWindDetail(hour: MeteogramHour) {
  const direction = directionLabel(hour.windDirectionDegrees);
  const directionText = direction === "—" ? "Direção não informada" : `Vento vindo de ${direction}`;
  return `${directionText} · Rajada: ${formatGust(hour.windGust)}`;
}

function selectedCloudDetail(hour: MeteogramHour) {
  return hour.cloudCover === null
    ? "Cobertura total não informada"
    : `Cobertura total: ${formatNumber(hour.cloudCover, "%")}`;
}

function selectedBoundaryLayerDetail(hour: MeteogramHour) {
  return hour.boundaryLayerHeight === null
    ? "Altura da camada próxima ao solo não informada"
    : `Altura estimada da camada próxima ao solo: ${formatNumber(hour.boundaryLayerHeight, " m")}`;
}

export function MeteogramHero({
  weather,
  meteogram,
}: {
  weather: WeatherIntelligenceData;
  meteogram: MeteogramData;
}) {
  const hours = usableHours(weather, meteogram).slice(0, 24);
  const minimumTemperature = minimumHour(hours, (hour) => hour.temperature);
  const maximumTemperature = maximumHour(hours, (hour) => hour.temperature);
  const maximumRainValue = maximumValue(hours, (hour) => hour.precipitationProbability);
  const maximumRain = positiveMaximumHour(hours, (hour) => hour.precipitationProbability);
  const maximumGustValue = maximumValue(hours, (hour) => hour.windGust);
  const maximumGust = positiveMaximumHour(hours, (hour) => hour.windGust);
  const minimumVisibility = minimumHour(hours, (hour) => hour.visibilityKm);

  return (
    <section className="meteogram-hero" aria-labelledby="meteogram-hero-title">
      <div className="meteogram-hero__content">
        <span className="eyebrow">Previsão hora a hora</span>
        <h1 id="meteogram-hero-title">Como o tempo pode mudar nas próximas horas.</h1>
        <p>
          Compare temperatura, chuva, nuvens, visibilidade, pressão, vento e possibilidade de tempestade
          nas próximas 24 ou 48 horas.
        </p>
        <div className="meteogram-hero__actions">
          <a href="#linha-do-tempo-meteograma">Ver horários <ArrowRight aria-hidden="true" /></a>
          <Link to="/tempo-hoje-pelotas">Voltar ao tempo de hoje</Link>
        </div>
      </div>

      <div className="meteogram-hero__panel">
        <header>
          <span>Próximas 24 horas</span>
          <strong>{sourceLabel(weather, meteogram)}</strong>
          <small>Atualizado em {formatDateTime(sourceFetchedAt(weather, meteogram))}</small>
        </header>
        <div>
          <article>
            <span>Temperatura</span>
            <strong>
              {formatNumber(minimumTemperature?.temperature, " °C")} a {formatNumber(maximumTemperature?.temperature, " °C")}
            </strong>
            <small>Menor e maior valor previsto</small>
          </article>
          <article>
            <span>Maior chance de chuva</span>
            <strong>{formatRainChance(maximumRainValue)}</strong>
            <small>
              {maximumRain
                ? `Por volta de ${formatHour(maximumRain.timestamp)}`
                : maximumRainValue === 0
                  ? "Sem horário de destaque"
                  : "Não informada"}
            </small>
          </article>
          <article>
            <span>Maior rajada</span>
            <strong>{formatGust(maximumGustValue)}</strong>
            <small>
              {maximumGust
                ? `Por volta de ${formatHour(maximumGust.timestamp)}`
                : maximumGustValue === 0
                  ? "Sem horário de destaque"
                  : "Não informada"}
            </small>
          </article>
          <article>
            <span>Menor visibilidade</span>
            <strong>{formatNumber(minimumVisibility?.visibilityKm, " km", 1)}</strong>
            <small>{minimumVisibility ? `Por volta de ${formatHour(minimumVisibility.timestamp)}` : "Não informada"}</small>
          </article>
        </div>
      </div>
    </section>
  );
}

export function MeteogramPage({
  weather,
  meteogram,
}: {
  weather: WeatherIntelligenceData;
  meteogram: MeteogramData;
}) {
  const allHours = useMemo(() => usableHours(weather, meteogram), [weather, meteogram]);
  const maximumWindow: ForecastWindow = allHours.length >= 36 ? 48 : 24;
  const [windowHours, setWindowHours] = useState<ForecastWindow>(24);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const hours = allHours.slice(0, Math.min(windowHours, allHours.length));
  const selected = hours[Math.min(selectedIndex, Math.max(0, hours.length - 1))] ?? null;

  useEffect(() => {
    if (windowHours > maximumWindow) setWindowHours(maximumWindow);
  }, [maximumWindow, windowHours]);

  useEffect(() => {
    if (selectedIndex >= hours.length) setSelectedIndex(Math.max(0, hours.length - 1));
  }, [hours.length, selectedIndex]);

  if (!hours.length) {
    return (
      <section className="meteogram-unavailable">
        <CloudFog aria-hidden="true" />
        <div>
          <h2>A previsão hora a hora está em atualização</h2>
          <p>{meteogram.message ?? weather.weather.message ?? "Nenhuma previsão horária está disponível neste momento."}</p>
          <Link to="/tempo-hoje-pelotas">Ver o resumo de hoje</Link>
        </div>
      </section>
    );
  }

  const maximumRainValue = maximumValue(hours, (hour) => hour.precipitationProbability);
  const maximumRain = positiveMaximumHour(hours, (hour) => hour.precipitationProbability);
  const maximumGustValue = maximumValue(hours, (hour) => hour.windGust);
  const maximumGust = positiveMaximumHour(hours, (hour) => hour.windGust);
  const minimumVisibility = minimumHour(hours, (hour) => hour.visibilityKm);
  const maximumCape = maximumHour(hours, (hour) => hour.cape);
  const maximumCapeAction = (maximumCape?.cape ?? 0) > 0 ? maximumCape : null;
  const fog = fogAssessment(hours);
  const pressure = pressureAssessment(hours);
  const cape = capeAssessment(hours);
  const precipitationHours = hours.filter((hour) => hour.precipitationMm !== null);
  const totalPrecipitation = precipitationHours.reduce(
    (total, hour) => total + (hour.precipitationMm as number),
    0,
  );
  const hasCompletePrecipitationWindow = precipitationHours.length === hours.length;
  const sourceIsFallback = meteogram.status !== "live";

  function selectHour(hour: MeteogramHour | null) {
    if (!hour) return;
    const index = hours.findIndex((item) => item.timestamp === hour.timestamp);
    if (index >= 0) setSelectedIndex(index);
  }

  return (
    <div className="meteogram-page">
      <nav className="meteogram-chapters" aria-label="Seções da previsão hora a hora">
        <a href="#linha-do-tempo-meteograma"><span>01</span><strong>Horários</strong><small>Escolha uma hora</small></a>
        <a href="#temperatura-orvalho"><span>02</span><strong>Temperatura</strong><small>Sensação e umidade</small></a>
        <a href="#chuva-umidade"><span>03</span><strong>Chuva</strong><small>Chance e volume</small></a>
        <a href="#nuvens-visibilidade"><span>04</span><strong>Nuvens</strong><small>Camadas e visibilidade</small></a>
        <a href="#vento-pressao"><span>05</span><strong>Vento</strong><small>Rajadas e pressão</small></a>
      </nav>

      <section className="meteogram-overview" id="linha-do-tempo-meteograma" aria-labelledby="meteogram-overview-title">
        <header>
          <div>
            <span className="eyebrow">Escolha um horário</span>
            <h2 id="meteogram-overview-title">Veja todas as informações previstas para cada hora</h2>
          </div>
          <div className="meteogram-window-toggle" aria-label="Período exibido">
            <button type="button" className={windowHours === 24 ? "is-active" : ""} aria-pressed={windowHours === 24} onClick={() => setWindowHours(24)}>24 horas</button>
            <button type="button" className={windowHours === 48 ? "is-active" : ""} aria-pressed={windowHours === 48} disabled={maximumWindow < 48} onClick={() => setWindowHours(48)}>48 horas</button>
          </div>
        </header>

        <div className="meteogram-quick-actions" aria-label="Atalhos para horários importantes">
          <button type="button" disabled={!maximumRain} onClick={() => selectHour(maximumRain)}><CloudRain aria-hidden="true" /> {maximumRain ? "Maior chance de chuva" : maximumRainValue === 0 ? "Sem pico de chuva" : "Chuva sem horário de pico"}</button>
          <button type="button" disabled={!maximumGust} onClick={() => selectHour(maximumGust)}><Wind aria-hidden="true" /> {maximumGust ? "Maior rajada" : maximumGustValue === 0 ? "Sem rajada prevista" : "Rajada não informada"}</button>
          <button type="button" disabled={!minimumVisibility} onClick={() => selectHour(minimumVisibility)}><Eye aria-hidden="true" /> {minimumVisibility ? "Menor visibilidade" : "Visibilidade não informada"}</button>
          <button type="button" disabled={!maximumCapeAction} onClick={() => selectHour(maximumCapeAction)}><Activity aria-hidden="true" /> {maximumCapeAction ? "Maior possibilidade de tempestade" : maximumCape?.cape === 0 ? "Sem pico de instabilidade" : "Instabilidade não informada"}</button>
          <button type="button" onClick={() => setSelectedIndex(0)}><TimerReset aria-hidden="true" /> Início da previsão</button>
        </div>

        <div className="meteogram-timeline" role="list" aria-label="Horários da previsão">
          {hours.map((hour, index) => (
            <button
              type="button"
              role="listitem"
              key={hour.timestamp}
              className={index === selectedIndex ? "is-selected" : ""}
              aria-pressed={index === selectedIndex}
              onClick={() => setSelectedIndex(index)}
            >
              <span>{index === 0 ? "Próximo horário" : formatHour(hour.timestamp, true)}</span>
              <strong>{formatNumber(hour.temperature, " °C")}</strong>
              <small>{formatRainChance(hour.precipitationProbability)} chuva · {formatGust(hour.windGust)}</small>
            </button>
          ))}
        </div>

        {selected ? (
          <div className="meteogram-selected">
            <header>
              <div>
                <span>Horário escolhido</span>
                <h3>{formatHour(selected.timestamp, true)}</h3>
              </div>
              <strong>{weatherLabel(selected.weatherCode, selected.isDay)}</strong>
            </header>
            <div className="meteogram-selected-grid">
              {selectedMetric("Temperatura", formatNumber(selected.temperature, " °C", 1), selected.feelsLike === null ? "Sensação não informada" : `Sensação ${formatNumber(selected.feelsLike, " °C", 1)}`)}
              {selectedMetric("Ponto de orvalho", formatNumber(selected.dewPoint, " °C", 1), temperatureSpread(selected) === null ? "Diferença para a temperatura não informada" : `Diferença para a temperatura: ${formatNumber(temperatureSpread(selected), " °C", 1)}`)}
              {selectedMetric("Chuva", formatRainChance(selected.precipitationProbability), selectedRainDetail(selected))}
              {selectedMetric("Umidade do ar", formatNumber(selected.relativeHumidity, "%"))}
              {selectedMetric("Vento", formatNumber(selected.windSpeed, " km/h", 1), selectedWindDetail(selected))}
              {selectedMetric("Pressão", formatNumber(selected.pressure, " hPa", 1))}
              {selectedMetric("Visibilidade", formatNumber(selected.visibilityKm, " km", 1))}
              {selectedMetric("Nuvens baixas", formatNumber(selected.cloudCoverLow, "%"), selectedCloudDetail(selected))}
              {selectedMetric("Índice de instabilidade (CAPE)", formatNumber(selected.cape, " J/kg"), selectedBoundaryLayerDetail(selected))}
            </div>
          </div>
        ) : null}
      </section>

      <section className="meteogram-insights" aria-label="Resumo da previsão">
        <article className={`is-${fog.tone}`}>
          <CloudFog aria-hidden="true" />
          <span>Possibilidade de neblina</span>
          <strong>{fog.title}</strong>
          <p>{fog.detail}</p>
        </article>
        <article>
          <Gauge aria-hidden="true" />
          <span>Pressão</span>
          <strong>{pressure.title}</strong>
          <p>{pressure.detail}</p>
        </article>
        <article>
          <Activity aria-hidden="true" />
          <span>Possibilidade de tempestade</span>
          <strong>{cape.title}</strong>
          <p>{cape.detail}</p>
        </article>
        <article>
          <CloudRain aria-hidden="true" />
          <span>{hasCompletePrecipitationWindow ? "Chuva prevista no período" : "Chuva nos horários informados"}</span>
          <strong>
            {precipitationHours.length ? formatNumber(totalPrecipitation, " mm", 1) : "Não informada"}
          </strong>
          <p>
            {hasCompletePrecipitationWindow
              ? "Soma dos volumes previstos por hora. Não representa chuva já medida."
              : precipitationHours.length
                ? `Soma parcial: ${precipitationHours.length} de ${hours.length} horários têm volume publicado. Não representa chuva já medida.`
                : "O modelo não publicou volume horário nesta atualização."}
          </p>
        </article>
      </section>

      <MeteogramLineChart
        id="temperatura-orvalho"
        title="Temperatura, sensação e umidade do ar"
        description="O ponto de orvalho ajuda a entender quando o ar está mais próximo da saturação e pode favorecer condensação ou neblina."
        hours={hours}
        selectedIndex={selectedIndex}
        axisUnit=" °C"
        series={[
          { id: "temperature", label: "Temperatura", unit: "°C", className: "is-temperature", read: (hour) => hour.temperature },
          { id: "feels", label: "Sensação", unit: "°C", className: "is-feels-like", read: (hour) => hour.feelsLike },
          { id: "dew", label: "Ponto de orvalho", unit: "°C", className: "is-dew-point", read: (hour) => hour.dewPoint },
        ]}
      />

      <MeteogramLineChart
        id="chuva-umidade"
        title="Chance de chuva e umidade do ar"
        description="Os dois valores usam porcentagem, mas respondem a perguntas diferentes: possibilidade de chover e quantidade relativa de umidade no ar."
        hours={hours}
        selectedIndex={selectedIndex}
        fixedDomain={[0, 100]}
        axisUnit="%"
        series={[
          { id: "rain", label: "Chance de chuva", unit: "%", className: "is-rain", read: (hour) => hour.precipitationProbability },
          { id: "humidity", label: "Umidade", unit: "%", className: "is-humidity", read: (hour) => hour.relativeHumidity },
        ]}
      />

      <PrecipitationVolume hours={hours} selectedIndex={selectedIndex} />

      <MeteogramLineChart
        id="nuvens-visibilidade"
        title="Nuvens baixas, médias e altas"
        description="Cada altura é mostrada separadamente. As porcentagens não devem ser somadas."
        hours={hours}
        selectedIndex={selectedIndex}
        fixedDomain={[0, 100]}
        axisUnit="%"
        series={[
          { id: "low-cloud", label: "Baixas", unit: "%", className: "is-low-cloud", read: (hour) => hour.cloudCoverLow },
          { id: "mid-cloud", label: "Médias", unit: "%", className: "is-mid-cloud", read: (hour) => hour.cloudCoverMid },
          { id: "high-cloud", label: "Altas", unit: "%", className: "is-high-cloud", read: (hour) => hour.cloudCoverHigh },
        ]}
      />

      <MeteogramLineChart
        id="visibilidade-meteograma"
        title="Visibilidade prevista"
        description="Valores menores merecem atenção em deslocamentos, especialmente quando coincidem com umidade alta e nuvens baixas."
        hours={hours}
        selectedIndex={selectedIndex}
        fixedDomain={[0, Math.max(10, ...hours.map((hour) => hour.visibilityKm ?? 0))]}
        axisUnit=" km"
        series={[
          { id: "visibility", label: "Visibilidade", unit: "km", className: "is-visibility", read: (hour) => hour.visibilityKm },
        ]}
      />

      <MeteogramLineChart
        id="vento-pressao"
        title="Vento e rajadas"
        description="O vento representa a velocidade média prevista; a rajada é um aumento breve e normalmente mais forte."
        hours={hours}
        selectedIndex={selectedIndex}
        fixedDomain={[0, Math.max(20, ...hours.map((hour) => hour.windGust ?? hour.windSpeed ?? 0))]}
        axisUnit=" km/h"
        series={[
          { id: "wind", label: "Vento", unit: "km/h", className: "is-wind", read: (hour) => hour.windSpeed },
          { id: "gust", label: "Rajada", unit: "km/h", className: "is-gust", read: (hour) => hour.windGust },
        ]}
      />

      <MeteogramLineChart
        id="pressao-meteograma"
        title="Pressão ao nível do mar"
        description="A subida ou queda da pressão ajuda a acompanhar mudanças no tempo, mas não deve ser usada sozinha para prever chuva ou temporal."
        hours={hours}
        selectedIndex={selectedIndex}
        axisUnit=" hPa"
        series={[
          { id: "pressure", label: "Pressão", unit: "hPa", className: "is-pressure", read: (hour) => hour.pressure },
        ]}
      />

      <section className="meteogram-method" aria-labelledby="meteogram-method-title">
        <Layers3 aria-hidden="true" />
        <div>
          <span className="eyebrow">De onde vêm os dados</span>
          <h2 id="meteogram-method-title">Esta página mostra previsão, não medição</h2>
          <p>
            Os gráficos usam {sourceLabel(weather, meteogram)} com valores por hora. As medições da
            Embrapa aparecem separadamente e representam somente o local e o horário da estação.
            A previsão pode mudar entre atualizações, principalmente para chuva, visibilidade, nuvens e
            possibilidade de tempestade.
          </p>
          {sourceIsFallback ? (
            <strong>A previsão detalhada não respondeu nesta atualização. A página usa os dados horários disponíveis e pode mostrar menos informações.</strong>
          ) : null}
        </div>
        <div>
          <span>Última atualização</span>
          <strong>{formatDateTime(sourceFetchedAt(weather, meteogram))}</strong>
          <a href={meteogram.source.url} target="_blank" rel="noopener noreferrer">Abrir página da fonte</a>
        </div>
      </section>

      <section className="meteogram-related" aria-labelledby="meteogram-related-title">
        <header>
          <span className="eyebrow">Veja junto com outras páginas</span>
          <h2 id="meteogram-related-title">Compare previsão, medições e imagens</h2>
        </header>
        <div>
          <Link to="/tempo-hoje-pelotas"><Waves aria-hidden="true" /><span><strong>Tempo de hoje</strong><small>Condição atual e resumo das próximas horas.</small></span></Link>
          <Link to="/chuva-em-pelotas"><CloudRain aria-hidden="true" /><span><strong>Chuva em Pelotas</strong><small>Chance e volume por horário.</small></span></Link>
          <Link to="/vento-em-pelotas"><Navigation aria-hidden="true" /><span><strong>Vento em Pelotas</strong><small>Velocidade, direção e rajadas.</small></span></Link>
          <Link to="/radar-e-satelite-pelotas"><Eye aria-hidden="true" /><span><strong>Radar e satélite</strong><small>Imagens observadas e horário de cada quadro.</small></span></Link>
        </div>
      </section>
    </div>
  );
}
