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

type DirectionFrequency = {
  label: string;
  detail: string;
  hasDominantDirection: boolean;
};

function directionLabel(degrees: number | null | undefined) {
  if (degrees === null || degrees === undefined) return "—";
  const normalized = ((degrees % 360) + 360) % 360;
  return DIRECTION_LABELS[Math.round(normalized / 22.5) % DIRECTION_LABELS.length] ?? "—";
}

function formatDirectionDegrees(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : `${Math.round(value)}°`;
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

function formatGust(value: number | null | undefined) {
  if (value === null || value === undefined) return "Não informada";
  if (value <= 0) return "Sem rajada prevista";
  return formatSpeed(value);
}

function directionHours(hours: MeteogramHour[]) {
  return hours.filter((hour) => hour.windDirectionDegrees !== null);
}

function directionFrequency(hours: MeteogramHour[]): DirectionFrequency | null {
  const withDirection = directionHours(hours);
  const counts = new Map<string, number>();
  for (const hour of withDirection) {
    const label = directionLabel(hour.windDirectionDegrees);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  const ranked = [...counts.entries()].sort((left, right) => right[1] - left[1]);
  const highestCount = ranked[0]?.[1] ?? null;
  if (highestCount === null) return null;

  const leaders = ranked.filter(([, count]) => count === highestCount).map(([label]) => label);
  if (leaders.length > 1) {
    return {
      label: "Sem direção dominante",
      detail: `Empate entre ${leaders.join(", ")} · ${highestCount} horários cada`,
      hasDominantDirection: false,
    };
  }

  return {
    label: leaders[0] ?? "—",
    detail: `${highestCount} dos ${withDirection.length} horários com direção`,
    hasDominantDirection: true,
  };
}

function peakGustHour(hours: MeteogramHour[]) {
  return hours.reduce<MeteogramHour | null>((selected, hour) => {
    if (hour.windGust === null || hour.windGust <= 0) return selected;
    const selectedValue = selected?.windGust ?? null;
    return selectedValue === null || hour.windGust > selectedValue ? hour : selected;
  }, null);
}

export function WindDirectionContext({ meteogram }: { meteogram: MeteogramData }) {
  if (meteogram.status !== "live" || !meteogram.hours.length) return null;

  const hours = meteogram.hours.slice(0, WINDOW_HOURS);
  const withDirection = directionHours(hours);
  if (!withDirection.length) return null;

  const first = withDirection[0] ?? null;
  const last = withDirection.at(-1) ?? null;
  const frequent = directionFrequency(hours);
  const publishedGustHours = hours.filter((hour) => hour.windGust !== null);
  const peak = peakGustHour(hours);
  const visible = withDirection.slice(0, VISIBLE_HOURS);
  const peakGustDetail = peak
    ? `${formatHour(peak.timestamp)} · rajada ${formatSpeed(peak.windGust)}`
    : publishedGustHours.length
      ? "Sem rajada positiva prevista no período"
      : "Rajada não informada no período";

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
        <article className={frequent?.hasDominantDirection === false ? "is-tied" : undefined}>
          <Compass aria-hidden="true" />
          <span>Mais frequente em 24h</span>
          <strong>{frequent?.label ?? "—"}</strong>
          <small>{frequent?.detail ?? "Sem cálculo"}</small>
        </article>
        <article>
          <TrendingUp aria-hidden="true" />
          <span>Na maior rajada</span>
          <strong>{peak ? directionLabel(peak.windDirectionDegrees) : "Sem destaque"}</strong>
          <small>{peakGustDetail}</small>
        </article>
        <article>
          <Wind aria-hidden="true" />
          <span>Última direção disponível</span>
          <strong>{directionLabel(last?.windDirectionDegrees)}</strong>
          <small>{last ? `${formatHour(last.timestamp)} · ${formatSpeed(last.windSpeed)}` : "—"}</small>
        </article>
      </div>

      <div className="wind-direction-context__timeline" aria-label="Direção, vento e rajada nos próximos horários">
        {visible.map((hour) => (
          <article key={hour.timestamp}>
            <header>
              <strong>{formatHour(hour.timestamp)}</strong>
              <span>{formatDirectionDegrees(hour.windDirectionDegrees)}</span>
            </header>
            <div className="wind-direction-context__direction">
              <Compass aria-hidden="true" />
              <strong>{directionLabel(hour.windDirectionDegrees)}</strong>
              <small>vento vindo de {directionLabel(hour.windDirectionDegrees)}</small>
            </div>
            <dl>
              <div><dt>Vento</dt><dd>{formatSpeed(hour.windSpeed)}</dd></div>
              <div><dt>Rajada</dt><dd>{formatGust(hour.windGust)}</dd></div>
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
