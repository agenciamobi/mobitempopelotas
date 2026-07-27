import { Link } from "@tanstack/react-router";
import { Activity, ArrowRight, CloudFog, Eye, Gauge, Layers3, Waves } from "lucide-react";

import type { HourlyForecast } from "@/lib/weather/types";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

import "./TodayAtmosphericSignals.css";

type FogTone = "low" | "attention" | "high" | "unknown";

type FogSignal = {
  tone: FogTone;
  hour: HourlyForecast | null;
  title: string;
  detail: string;
};

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

function formatNumber(value: number | null | undefined, suffix: string) {
  if (value === null || value === undefined) return "Não informado";
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)}${suffix}`;
}

function hasAtmosphericData(hour: HourlyForecast) {
  return [
    hour.dewPoint,
    hour.relativeHumidity,
    hour.visibilityKm,
    hour.cloudCover,
    hour.cloudCoverLow,
    hour.cloudCoverMid,
    hour.cloudCoverHigh,
    hour.cape,
    hour.pressure,
  ].some((value) => value !== null && value !== undefined);
}

function fogScore(hour: HourlyForecast) {
  if (hour.dewPoint === null || hour.dewPoint === undefined) return -1;

  const spread = Math.max(0, hour.temperature - hour.dewPoint);
  let score = Math.max(0, 6 - spread) * 12;
  score += Math.max(0, (hour.relativeHumidity ?? 70) - 80) * 1.5;
  score += Math.max(0, (hour.cloudCoverLow ?? 0) - 50) * 0.8;
  if (hour.visibilityKm !== null && hour.visibilityKm !== undefined) {
    score += Math.max(0, 10 - hour.visibilityKm) * 6;
  }
  return score;
}

function buildFogSignal(hours: HourlyForecast[]): FogSignal {
  const candidates = hours
    .filter((hour) => hour.dewPoint !== null && hour.dewPoint !== undefined)
    .sort((a, b) => fogScore(b) - fogScore(a));
  const hour = candidates[0] ?? null;

  if (!hour || hour.dewPoint === null || hour.dewPoint === undefined) {
    return {
      tone: "unknown",
      hour: null,
      title: "Sinal ainda não calculável",
      detail: "A previsão não informou ponto de orvalho suficiente para esta leitura.",
    };
  }

  const spread = Math.max(0, hour.temperature - hour.dewPoint);
  const lowCloud = hour.cloudCoverLow ?? 0;
  const humidity = hour.relativeHumidity ?? 0;
  const visibility = hour.visibilityKm ?? 99;

  if (spread <= 1.5 && (visibility <= 3 || lowCloud >= 85 || humidity >= 95)) {
    return {
      tone: "high",
      hour,
      title: `Sinal elevado por volta de ${hour.time}`,
      detail: `Temperatura e ponto de orvalho ficam separados por ${formatNumber(spread, " °C")}, com ${Math.round(lowCloud)}% de nuvens baixas e visibilidade prevista de ${formatNumber(visibility, " km")}.`,
    };
  }

  if (spread <= 3 && (visibility <= 8 || lowCloud >= 65 || humidity >= 90)) {
    return {
      tone: "attention",
      hour,
      title: `Vale acompanhar perto de ${hour.time}`,
      detail: `A combinação de umidade, nuvens baixas e visibilidade sugere possibilidade de neblina ou teto baixo, sem confirmar ocorrência local.`,
    };
  }

  return {
    tone: "low",
    hour,
    title: "Sinal baixo nas próximas horas",
    detail: "A previsão não combina, neste momento, proximidade forte do ponto de orvalho com baixa visibilidade ou muita nuvem baixa.",
  };
}

function maximumHour(
  hours: HourlyForecast[],
  read: (hour: HourlyForecast) => number | null | undefined,
) {
  return hours.reduce<HourlyForecast | null>((selected, hour) => {
    const value = read(hour);
    if (value === null || value === undefined) return selected;
    if (!selected) return hour;
    return value > (read(selected) ?? Number.NEGATIVE_INFINITY) ? hour : selected;
  }, null);
}

function minimumHour(
  hours: HourlyForecast[],
  read: (hour: HourlyForecast) => number | null | undefined,
) {
  return hours.reduce<HourlyForecast | null>((selected, hour) => {
    const value = read(hour);
    if (value === null || value === undefined) return selected;
    if (!selected) return hour;
    return value < (read(selected) ?? Number.POSITIVE_INFINITY) ? hour : selected;
  }, null);
}

function capeLabel(value: number | null | undefined) {
  if (value === null || value === undefined) return "Não informado";
  if (value >= 1_000) return "Energia convectiva elevada";
  if (value >= 300) return "Energia convectiva moderada";
  return "Energia convectiva baixa";
}

function cloudValue(value: number | null | undefined) {
  return Math.max(0, Math.min(100, value ?? 0));
}

export function TodayAtmosphericSignals({ data }: { data: WeatherIntelligenceData }) {
  const hours = data.weather.hourly.slice(0, 12);
  const atmosphericHours = hours.filter(hasAtmosphericData);
  const observedDewPoint = data.weather.observation.current.dewPoint;

  if (!atmosphericHours.length && observedDewPoint === null) return null;

  const currentTemperature = data.weather.current?.temperature ?? null;
  const currentSpread =
    currentTemperature === null || observedDewPoint === null
      ? null
      : Math.max(0, currentTemperature - observedDewPoint);
  const fogSignal = buildFogSignal(atmosphericHours);
  const lowestVisibility = minimumHour(atmosphericHours, (hour) => hour.visibilityKm);
  const peakCape = maximumHour(atmosphericHours, (hour) => hour.cape);
  const pressureStart = atmosphericHours.find((hour) => hour.pressure !== null && hour.pressure !== undefined);
  const pressureEnd = [...atmosphericHours]
    .reverse()
    .find((hour) => hour.pressure !== null && hour.pressure !== undefined);
  const pressureChange =
    pressureStart?.pressure === null ||
    pressureStart?.pressure === undefined ||
    pressureEnd?.pressure === null ||
    pressureEnd?.pressure === undefined
      ? null
      : pressureEnd.pressure - pressureStart.pressure;
  const cloudHours = atmosphericHours
    .filter((hour) =>
      [hour.cloudCoverLow, hour.cloudCoverMid, hour.cloudCoverHigh].some(
        (value) => value !== null && value !== undefined,
      ),
    )
    .slice(0, 6);
  const forecastSource = data.weather.quality.forecastSource;
  const sourceHealth = forecastSource ? data.weather.sources[forecastSource] : null;
  const modelLabel =
    forecastSource === "open-meteo"
      ? "Open-Meteo Best Match"
      : data.weather.quality.forecastProvider ?? "Modelo não informado";

  return (
    <section
      className="today-atmosphere"
      id="atmosfera-hoje"
      aria-labelledby="today-atmosphere-title"
    >
      <header className="today-atmosphere__heading">
        <div>
          <span className="eyebrow">Umidade e estrutura da atmosfera</span>
          <h2 id="today-atmosphere-title">Ponto de orvalho, nuvens e visibilidade</h2>
        </div>
        <div className="today-atmosphere__intro">
          <p>
            Estes sinais ajudam a interpretar abafamento, possibilidade de neblina, teto baixo e
            instabilidade. Eles complementam a previsão e não substituem observação local, radar ou
            avisos oficiais.
          </p>
          <Link to="/meteograma-pelotas">
            Abrir meteograma de 24 e 48 horas <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </header>

      <div className="today-atmosphere__signals">
        <article>
          <span><Waves aria-hidden="true" /> Ponto de orvalho observado</span>
          <strong>{formatNumber(observedDewPoint, " °C")}</strong>
          <small>
            {currentSpread === null
              ? "Leitura da Embrapa sem comparação térmica disponível."
              : `${formatNumber(currentSpread, " °C")} abaixo da temperatura observada.`}
          </small>
        </article>

        <article className={`is-${fogSignal.tone}`}>
          <span><CloudFog aria-hidden="true" /> Neblina e nuvens baixas</span>
          <strong>{fogSignal.title}</strong>
          <small>{fogSignal.detail}</small>
        </article>

        <article>
          <span><Eye aria-hidden="true" /> Menor visibilidade prevista</span>
          <strong>{formatNumber(lowestVisibility?.visibilityKm, " km")}</strong>
          <small>
            {lowestVisibility
              ? `Menor valor da janela por volta de ${lowestVisibility.time}.`
              : "A fonte não informou visibilidade horária."}
          </small>
        </article>

        <article>
          <span><Activity aria-hidden="true" /> Instabilidade convectiva</span>
          <strong>{capeLabel(peakCape?.cape)}</strong>
          <small>
            {peakCape?.cape === null || peakCape?.cape === undefined
              ? "CAPE não informado nesta atualização."
              : `Pico de ${Math.round(peakCape.cape)} J/kg por volta de ${peakCape.time}; CAPE isolado não confirma temporal.`}
          </small>
        </article>
      </div>

      {cloudHours.length ? (
        <div className="today-atmosphere__clouds" aria-label="Perfil de nuvens das próximas horas">
          <header>
            <div>
              <Layers3 aria-hidden="true" />
              <span>
                <strong>Perfil de nuvens por altitude</strong>
                <small>Baixas, médias e altas nas próximas horas</small>
              </span>
            </div>
            <div className="today-atmosphere__legend" aria-label="Legenda das camadas">
              <span className="is-low">Baixas</span>
              <span className="is-mid">Médias</span>
              <span className="is-high">Altas</span>
            </div>
          </header>

          <div className="today-atmosphere__cloud-grid">
            {cloudHours.map((hour) => (
              <article key={hour.timestamp ?? hour.time}>
                <strong>{hour.time}</strong>
                <div>
                  <span className="is-low" style={{ width: `${cloudValue(hour.cloudCoverLow)}%` }} />
                </div>
                <div>
                  <span className="is-mid" style={{ width: `${cloudValue(hour.cloudCoverMid)}%` }} />
                </div>
                <div>
                  <span className="is-high" style={{ width: `${cloudValue(hour.cloudCoverHigh)}%` }} />
                </div>
                <small>{Math.round(hour.cloudCover ?? Math.max(cloudValue(hour.cloudCoverLow), cloudValue(hour.cloudCoverMid), cloudValue(hour.cloudCoverHigh)))}% total</small>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      <footer className="today-atmosphere__footer">
        <Gauge aria-hidden="true" />
        <span>
          <strong>{modelLabel}</strong>
          <small>
            {pressureChange === null
              ? "Tendência de pressão não calculável."
              : `Pressão varia ${pressureChange > 0 ? "+" : ""}${pressureChange.toFixed(0)} hPa na janela.`}
            {" · "}Dados consultados em {formatDateTime(sourceHealth?.fetchedAt)}.
          </small>
        </span>
      </footer>
    </section>
  );
}
