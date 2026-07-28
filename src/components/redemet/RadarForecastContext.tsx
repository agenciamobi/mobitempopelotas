import { CloudFog, CloudRain, Eye, Gauge, Wind } from "lucide-react";

import type { RedemetImageLayerResponse } from "@/lib/redemet/redemet.types";
import type { HourlyForecast } from "@/lib/weather/types";
import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

import "./RadarForecastContext.css";

function parseObservedTime(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseForecastTime(value: string | null | undefined) {
  if (!value) return null;
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);
  const normalized = hasZone
    ? value
    : `${value.length === 16 ? `${value}:00` : value}-03:00`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDateTime(value: string | null | undefined) {
  const date = parseObservedTime(value);
  if (!date) return "Horário não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatFetchedAt(value: string | null | undefined) {
  if (!value) return "atualização não informada";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "atualização não informada";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function nearestForecastHour(hours: HourlyForecast[], observedAt: string | null) {
  const observed = parseObservedTime(observedAt);
  if (!observed) return null;

  const selected = hours.reduce<{ hour: HourlyForecast; difference: number } | null>(
    (nearest, hour) => {
      const forecast = parseForecastTime(hour.timestamp);
      if (!forecast) return nearest;
      const difference = Math.abs(forecast.getTime() - observed.getTime());
      return !nearest || difference < nearest.difference ? { hour, difference } : nearest;
    },
    null,
  );

  if (!selected || selected.difference > 3 * 60 * 60 * 1_000) return null;
  return selected.hour;
}

function formatValue(value: number | null | undefined, suffix: string, digits = 0) {
  if (value === null || value === undefined) return "Não informado";
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: digits }).format(value)}${suffix}`;
}

export function RadarForecastContext({
  radar,
  weather,
}: {
  radar: RedemetImageLayerResponse;
  weather: WeatherIntelligenceData;
}) {
  const frame = radar.frames[radar.currentIndex] ?? radar.frames.at(-1) ?? null;
  if (!frame) return null;

  const forecast = nearestForecastHour(weather.weather.hourly, frame.observedAt);
  const forecastSource = weather.weather.quality.forecastSource;
  const sourceHealth = forecastSource ? weather.weather.sources[forecastSource] : null;
  const modelLabel =
    forecastSource === "open-meteo"
      ? "Open-Meteo Best Match"
      : weather.weather.quality.forecastProvider ?? "Modelo não informado";

  return (
    <section
      className="radar-forecast-context"
      aria-labelledby="radar-forecast-context-title"
    >
      <header>
        <div>
          <span>Imagem e previsão no mesmo horário</span>
          <h2 id="radar-forecast-context-title">O que a previsão mostrava quando esta imagem foi registrada?</h2>
        </div>
        <p>
          O radar mostra uma imagem observada pela REDEMET. Os valores abaixo pertencem à previsão por
          hora mais próxima e não são medidos pelo radar.
        </p>
      </header>

      <div className="radar-forecast-context__times">
        <article>
          <small>Horário da imagem</small>
          <strong>{formatDateTime(frame.observedAt)}</strong>
          <span>REDEMET/DECEA · {frame.label}</span>
        </article>
        <article>
          <small>Horário da previsão</small>
          <strong>{forecast?.time ?? "Sem horário próximo disponível"}</strong>
          <span>{modelLabel}</span>
        </article>
      </div>

      {forecast ? (
        <div className="radar-forecast-context__metrics">
          <article>
            <Gauge aria-hidden="true" />
            <span><small>Temperatura prevista</small><strong>{formatValue(forecast.temperature, " °C")}</strong></span>
          </article>
          <article>
            <CloudRain aria-hidden="true" />
            <span><small>Chance de chuva</small><strong>{formatValue(forecast.precipitationProbability, "%")}</strong></span>
          </article>
          <article>
            <Wind aria-hidden="true" />
            <span><small>Rajada prevista</small><strong>{formatValue(forecast.windGust ?? forecast.windSpeed, " km/h")}</strong></span>
          </article>
          <article>
            <CloudFog aria-hidden="true" />
            <span><small>Nuvens baixas</small><strong>{formatValue(forecast.cloudCoverLow, "%")}</strong></span>
          </article>
          <article>
            <Eye aria-hidden="true" />
            <span><small>Visibilidade prevista</small><strong>{formatValue(forecast.visibilityKm, " km", 1)}</strong></span>
          </article>
        </div>
      ) : (
        <div className="radar-forecast-context__unavailable">
          Não foi encontrado um horário de previsão a até três horas desta imagem. Confira o horário do
          radar e consulte a previsão hora a hora separadamente.
        </div>
      )}

      <footer>
        A comparação usa a previsão {modelLabel}, atualizada às {formatFetchedAt(sourceHealth?.fetchedAt)}.
        O movimento entre imagens anteriores não representa o que acontecerá no futuro.
      </footer>
    </section>
  );
}
