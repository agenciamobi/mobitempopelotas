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

function chanceLabel(value: number | null | undefined) {
  return value === null || value === undefined
    ? "chance não informada"
    : `${Math.round(value)}% de chance`;
}

function wetHours(hours: MeteogramHour[]) {
  return hours.filter(
    (hour) =>
      hour.precipitationMm !== null && hour.precipitationMm >= MEASURABLE_RAIN_MM,
  );
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
  const availableVolumeHours = hours.filter((hour) => hour.precipitationMm !== null);
  if (!availableVolumeHours.length) return null;

  const values = availableVolumeHours.map((hour) => hour.precipitationMm as number);
  const hasCompleteVolumeWindow = availableVolumeHours.length === hours.length;
  const total = values.reduce((sum, value) => sum + value, 0);
  const hasPositiveVolume = total > 0;
  const peak = hasPositiveVolume ? peakVolumeHour(availableVolumeHours) : null;
  const wet = wetHours(availableVolumeHours);
  const firstWet = wet[0] ?? null;
  const maximum = Math.max(0.1, ...values);
  const noPositiveVolumeDetail = hasCompleteVolumeWindow
    ? "Sem volume previsto no período"
    : "Sem volume positivo entre os horários informados";

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
          <span>{hasCompleteVolumeWindow ? "Total nas próximas 12h" : "Total parcial disponível"}</span>
          <strong>{formatMm(total)}</strong>
          <small>
            {hasCompleteVolumeWindow
              ? "Soma dos volumes horários disponíveis"
              : `${availableVolumeHours.length} de ${hours.length} horários têm volume informado`}
          </small>
        </article>
        <article>
          <CloudRain aria-hidden="true" />
          <span>Maior volume em uma hora</span>
          <strong>{peak ? formatMm(peak.precipitationMm) : "Nenhum"}</strong>
          <small>{peak ? `Por volta de ${formatHour(peak.timestamp)}` : noPositiveVolumeDetail}</small>
        </article>
        <article>
          <Droplets aria-hidden="true" />
          <span>Horas com volume ≥ 0,1 mm</span>
          <strong>{wet.length}</strong>
          <small>Entre os {availableVolumeHours.length} horários com volume informado</small>
        </article>
        <article>
          <Info aria-hidden="true" />
          <span>Primeiro volume previsto</span>
          <strong>{firstWet ? formatHour(firstWet.timestamp) : "Nenhum"}</strong>
          <small>
            {firstWet ? formatMm(firstWet.precipitationMm) : hasCompleteVolumeWindow
              ? "Sem volume ≥ 0,1 mm no período"
              : "Sem volume ≥ 0,1 mm entre os horários informados"}
          </small>
        </article>
      </div>

      <div className="rain-hourly-volume-context__timeline" aria-label="Volume e chance de chuva por hora">
        {hours.map((hour) => {
          const volumeKnown = hour.precipitationMm !== null;
          const volume = hour.precipitationMm ?? 0;
          const style = {
            "--rain-hourly-volume": `${Math.max(0, Math.min(100, (volume / maximum) * 100))}%`,
          } as CSSProperties;

          return (
            <article className={volumeKnown ? undefined : "is-unknown"} key={hour.timestamp} style={style}>
              <header>
                <strong>{formatHour(hour.timestamp)}</strong>
                <span>{chanceLabel(hour.precipitationProbability)}</span>
              </header>
              <div>
                <strong>{formatMm(hour.precipitationMm)}</strong>
                <small>{volumeKnown ? "volume previsto" : "volume não informado"}</small>
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
