import { Compass, Database, Navigation, TrendingUp, Wind } from "lucide-react";

import type { MeteogramData, MeteogramHour } from "@/lib/weather/meteogram.server";

import "./WindDirectionContext.css";

const WINDOW_HOURS = 24;
const VISIBLE_HOURS = 12;
const DIRECTION_LABELS = [
  "N",
  "NNE",
  "NE",
  "ENE",
  "L",
  "ESE",
  "SE",
  "SSE",
  "S",
  "SSO",
  "SO",
  "OSO",
  "O",
  "ONO",
  "NO",
  "NNO",
] as const;

function directionLabel(degrees: number | null | undefined) {
  if (degrees === null || degrees === undefined) return "—";
  const normalized = ((degrees % 360) + 360) % 360;
  return DIRECTION_LABELS[Math.round(normalized / 22.5) % DIRECTION_LABELS.length] ?? "—";
}

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

function formatSpeed(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 }).format(value)} km/h`;
}

function directionHours(hours: MeteogramHour[]) {
  return hours.filter((hour) => hour.windDirectionDegrees !== null);
}

function mostFrequentDirection(hours: MeteogramHour[]) {
  const counts = new Map<string, number>();
  for (const hour of directionHours(hours)) {
    const label = directionLabel(hour.windDirectionDegrees);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return [...counts.entries()].sort((left, right) => right[1] - left[1])[0] ?? null;
}

function peakGustHour(hours: MeteogramHour[]) {
  return hours.reduce<MeteogramHour | null>((selected, hour) => {
    const value = hour.windGust ?? hour.windSpeed;
    if (value === null) return selected;
    const selectedValue = selected ? (selected.windGust ?? selected.windSpeed) : null;
    return selectedValue === null || value > selectedValue ? hour : selected;
  }, null);
}

export function WindDirectionContext({ meteogram }: { meteogram: MeteogramData }) {
  if (meteogram.status !== "live" || !meteogram.hours.length) return null;

  const hours = meteogram.hours.slice(0, WINDOW_HOURS);
  const withDirection = directionHours(hours);
  if (!withDirection.length) return null;

  const first = withDirection[0] ?? null;
  const last = withDirection.at(-1) ?? null;
  const frequent = mostFrequentDirection(hours);
  const peak = peakGustHour(hours);
  const visible = withDirection.slice(0, VISIBLE_HOURS);

  return (
    <section
      className="wind-direction-context"
      id="direcao-do-vento-por-hora"
      aria-labelledby="wind-direction-context-title"
    >
      <header>
        <div>
          <span className="wind-direction-context__eyebrow">
            <Compass aria-hidden="true" /> Direção prevista por hora
          </span>
          <h2 id="wind-direction-context-title">De onde o vento deve soprar nas próximas horas</h2>
        </div>
        <p>
          A direção abaixo vem do perfil horário do Open-Meteo. Ela é previsão de modelo e permanece
          separada da direção observada pela estação no momento atual.
        </p>
      </header>

      <div className="wind-direction-context__summary" aria-label="Resumo da direção prevista">
        <article>
          <Navigation aria-hidden="true" />
          <span>Primeiro horário</span>
          <strong>{directionLabel(first?.windDirectionDegrees)}</strong>
          <small>{first ? `${formatHour(first.timestamp)} · ${formatSpeed(first.windSpeed)}` : "—"}</small>
        </article>
        <article>
          <Compass aria-hidden="true" />
          <span>Mais frequente em 24h</span>
          <strong>{frequent?.[0] ?? "—"}</strong>
          <small>{frequent ? `${frequent[1]} dos ${withDirection.length} horários com direção` : "Sem cálculo"}</small>
        </article>
        <article>
          <TrendingUp aria-hidden="true" />
          <span>Na maior rajada</span>
          <strong>{directionLabel(peak?.windDirectionDegrees)}</strong>
          <small>{peak ? `${formatHour(peak.timestamp)} · rajada ${formatSpeed(peak.windGust)}` : "—"}</small>
        </article>
        <article>
          <Wind aria-hidden="true" />
          <span>Fim da janela de 24h</span>
          <strong>{directionLabel(last?.windDirectionDegrees)}</strong>
          <small>{last ? `${formatHour(last.timestamp)} · ${formatSpeed(last.windSpeed)}` : "—"}</small>
        </article>
      </div>

      <div className="wind-direction-context__timeline" aria-label="Direção, vento e rajada nos próximos horários">
        {visible.map((hour) => (
          <article key={hour.timestamp}>
            <header>
              <strong>{formatHour(hour.timestamp)}</strong>
              <span>{Math.round(hour.windDirectionDegrees ?? 0)}°</span>
            </header>
            <div className="wind-direction-context__direction">
              <Compass aria-hidden="true" />
              <strong>{directionLabel(hour.windDirectionDegrees)}</strong>
              <small>vento vindo de {directionLabel(hour.windDirectionDegrees)}</small>
            </div>
            <dl>
              <div><dt>Vento</dt><dd>{formatSpeed(hour.windSpeed)}</dd></div>
              <div><dt>Rajada</dt><dd>{formatSpeed(hour.windGust)}</dd></div>
            </dl>
          </article>
        ))}
      </div>

      <footer>
        <Database aria-hidden="true" />
        <span>
          <strong>{meteogram.source.name} · {meteogram.source.model}</strong>
          <small>
            Atualizado em {formatDateTime(meteogram.source.fetchedAt)}. A direção meteorológica indica
            de onde o vento vem; a previsão pode mudar entre novas rodadas do modelo.
          </small>
        </span>
      </footer>
    </section>
  );
}
