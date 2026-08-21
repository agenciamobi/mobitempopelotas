import { CloudRain, Database, Droplets, Info } from "lucide-react";
import type { CSSProperties } from "react";

import type { MeteogramData, MeteogramHour } from "@/lib/weather/meteogram.server";

import "./RainHourlyVolumeContext.css";

const WINDOW_HOURS = 12;
const MEASURABLE_RAIN_MM = 0.1;

function formatHour(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatDateTime(value: string) {
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

function formatMm(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: value > 0 && value < 1 ? 1 : 0,
    maximumFractionDigits: 1,
  }).format(value)} mm`;
}

function formatChance(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : `${Math.round(value)}%`;
}

function wetHours(hours: MeteogramHour[]) {
  return hours.filter((hour) => (hour.precipitationMm ?? 0) >= MEASURABLE_RAIN_MM);
}

function peakVolumeHour(hours: MeteogramHour[]) {
  return hours.reduce<MeteogramHour | null>((selected, hour) => {
    if (hour.precipitationMm === null) return selected;
    if (!selected || selected.precipitationMm === null) return hour;
    return hour.precipitationMm > selected.precipitationMm ? hour : selected;
  }, null);
}

export function RainHourlyVolumeContext({ meteogram }: { meteogram: MeteogramData }) {
  if (meteogram.status !== "live" || !meteogram.hours.length) return null;

  const hours = meteogram.hours.slice(0, WINDOW_HOURS);
  const values = hours
    .map((hour) => hour.precipitationMm)
    .filter((value): value is number => value !== null);
  if (!values.length) return null;

  const total = values.reduce((sum, value) => sum + value, 0);
  const peak = peakVolumeHour(hours);
  const wet = wetHours(hours);
  const firstWet = wet[0] ?? null;
  const maximum = Math.max(0.1, ...values);

  return (
    <section
      className="rain-hourly-volume-context"
      id="volume-de-chuva-por-hora"
      aria-labelledby="rain-hourly-volume-title"
    >
      <header>
        <div>
          <span className="rain-hourly-volume-context__eyebrow">
            <CloudRain aria-hidden="true" /> Volume por hora
          </span>
          <h2 id="rain-hourly-volume-title">Quanto de chuva o modelo prevê em cada horário</h2>
        </div>
        <p>
          Além da chance percentual, o perfil detalhado do Open-Meteo estima o volume de precipitação
          em milímetros para cada hora. São valores de previsão, não chuva já medida em Pelotas.
        </p>
      </header>

      <div className="rain-hourly-volume-context__summary" aria-label="Resumo do volume previsto">
        <article>
          <Droplets aria-hidden="true" />
          <span>Total nas próximas 12h</span>
          <strong>{formatMm(total)}</strong>
          <small>Soma dos volumes horários disponíveis</small>
        </article>
        <article>
          <CloudRain aria-hidden="true" />
          <span>Maior volume em uma hora</span>
          <strong>{formatMm(peak?.precipitationMm)}</strong>
          <small>{peak ? `Por volta de ${formatHour(peak.timestamp)}` : "Horário não informado"}</small>
        </article>
        <article>
          <Droplets aria-hidden="true" />
          <span>Horas com volume ≥ 0,1 mm</span>
          <strong>{wet.length}</strong>
          <small>Entre os {hours.length} horários consultados</small>
        </article>
        <article>
          <Info aria-hidden="true" />
          <span>Primeiro volume previsto</span>
          <strong>{firstWet ? formatHour(firstWet.timestamp) : "Nenhum"}</strong>
          <small>{firstWet ? formatMm(firstWet.precipitationMm) : "Sem volume ≥ 0,1 mm no período"}</small>
        </article>
      </div>

      <div className="rain-hourly-volume-context__timeline" aria-label="Volume e chance de chuva por hora">
        {hours.map((hour) => {
          const volume = hour.precipitationMm ?? 0;
          const style = {
            "--rain-hourly-volume": `${Math.max(0, Math.min(100, (volume / maximum) * 100))}%`,
          } as CSSProperties;

          return (
            <article key={hour.timestamp} style={style}>
              <header>
                <strong>{formatHour(hour.timestamp)}</strong>
                <span>{formatChance(hour.precipitationProbability)} chance</span>
              </header>
              <div>
                <strong>{formatMm(hour.precipitationMm)}</strong>
                <small>volume previsto</small>
              </div>
              <i aria-hidden="true"><span /></i>
            </article>
          );
        })}
      </div>

      <footer>
        <Database aria-hidden="true" />
        <span>
          <strong>{meteogram.source.name} · {meteogram.source.model}</strong>
          <small>
            Perfil horário atualizado em {formatDateTime(meteogram.source.fetchedAt)}. Chance e volume
            são grandezas diferentes e podem mudar conforme o modelo é recalculado.
          </small>
        </span>
      </footer>
    </section>
  );
}
