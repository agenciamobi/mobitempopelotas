import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  CloudRain,
  Radar,
  Sunrise,
  Sunset,
  TriangleAlert,
  Wind,
  type LucideIcon,
} from "lucide-react";

import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";
import type { HourlyForecast } from "@/lib/weather/types";

import "./TodayWeatherResources.css";

type PeriodStatus = "stable" | "moderate" | "attention" | "high";

type PeriodSummary = {
  label: string;
  range: string;
  peakRain: number | null;
  maxGust: number;
  minTemperature: number;
  maxTemperature: number;
  score: number;
  status: PeriodStatus;
};

type ResourceLink = {
  to: "/chuva-em-pelotas" | "/vento-em-pelotas" | "/radar-e-satelite-pelotas" | "/alertas";
  label: string;
  detail: string;
  icon: LucideIcon;
};

const periodLabels = ["Próximas horas", "Na sequência", "Mais tarde"];

const resourceLinks: ResourceLink[] = [
  {
    to: "/chuva-em-pelotas",
    label: "Chuva detalhada",
    detail: "Probabilidade, volume e evolução",
    icon: CloudRain,
  },
  {
    to: "/vento-em-pelotas",
    label: "Vento em Pelotas",
    detail: "Velocidade, direção e rajadas",
    icon: Wind,
  },
  {
    to: "/radar-e-satelite-pelotas",
    label: "Radar e satélite",
    detail: "Observe a aproximação das áreas de chuva",
    icon: Radar,
  },
  {
    to: "/alertas",
    label: "Alertas oficiais",
    detail: "Avisos do INMET relevantes para Pelotas",
    icon: TriangleAlert,
  },
];

function maximum(values: Array<number | null | undefined>) {
  const validValues = values.filter((value): value is number => value !== null && value !== undefined);
  return validValues.length ? Math.max(...validValues) : null;
}

function periodStatus(peakRain: number | null, maxGust: number): PeriodStatus {
  if ((peakRain ?? 0) >= 70 || maxGust >= 50) return "high";
  if ((peakRain ?? 0) >= 40 || maxGust >= 35) return "attention";
  if ((peakRain ?? 100) <= 20 && maxGust < 30) return "stable";
  return "moderate";
}

function periodScore(peakRain: number | null, maxGust: number) {
  return (peakRain ?? 25) + Math.max(0, maxGust - 25) * 2;
}

function summarizePeriod(hours: HourlyForecast[], index: number): PeriodSummary {
  const firstHour = hours[0];
  const lastHour = hours[hours.length - 1];
  const peakRain = maximum(hours.map((hour) => hour.precipitationProbability));
  const maxGust = Math.max(...hours.map((hour) => hour.windGust ?? hour.windSpeed));
  const temperatures = hours.map((hour) => hour.temperature);

  return {
    label: periodLabels[index] ?? `Período ${index + 1}`,
    range: firstHour.time === lastHour.time ? firstHour.time : `${firstHour.time}–${lastHour.time}`,
    peakRain,
    maxGust,
    minTemperature: Math.min(...temperatures),
    maxTemperature: Math.max(...temperatures),
    score: periodScore(peakRain, maxGust),
    status: periodStatus(peakRain, maxGust),
  };
}

function buildPeriods(hours: HourlyForecast[]) {
  const visibleHours = hours.slice(0, 12);
  const periods: PeriodSummary[] = [];

  for (let index = 0; index < visibleHours.length; index += 4) {
    const periodHours = visibleHours.slice(index, index + 4);
    if (periodHours.length) periods.push(summarizePeriod(periodHours, periods.length));
  }

  return periods;
}

function statusLabel(status: PeriodStatus) {
  if (status === "stable") return "Mais estável";
  if (status === "moderate") return "Variação moderada";
  if (status === "attention") return "Atenção";
  return "Atenção alta";
}

function statusAdvice(status: PeriodStatus) {
  if (status === "stable") return "Tende a ser a faixa mais favorável para deslocamentos e tarefas externas.";
  if (status === "moderate") return "Vale acompanhar mudanças de chuva e vento antes de sair.";
  if (status === "attention") return "Planeje alternativas e confira o radar antes de atividades externas.";
  return "Evite depender de condições estáveis e acompanhe alertas e radar.";
}

function hourRisk(hour: HourlyForecast) {
  return (hour.precipitationProbability ?? 25) + Math.max(0, (hour.windGust ?? hour.windSpeed) - 25) * 2;
}

function extractClock(value: string | null | undefined) {
  if (!value) return null;
  const matches = value.match(/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g);
  return matches?.at(-1) ?? null;
}

function clockMinutes(value: string | null) {
  if (!value) return null;
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  return hours * 60 + minutes;
}

function daylightDuration(sunrise: string | null, sunset: string | null) {
  const sunriseMinutes = clockMinutes(sunrise);
  const sunsetMinutes = clockMinutes(sunset);
  if (sunriseMinutes === null || sunsetMinutes === null || sunsetMinutes <= sunriseMinutes) return null;

  const duration = sunsetMinutes - sunriseMinutes;
  return `${Math.floor(duration / 60)}h ${String(duration % 60).padStart(2, "0")}min`;
}

function formatRain(value: number | null) {
  return value === null ? "—" : `${Math.round(value)}%`;
}

export function TodayWeatherResources({ data }: { data: WeatherIntelligenceData }) {
  const periods = buildPeriods(data.weather.hourly);
  if (!periods.length) return null;

  const bestPeriod = periods.reduce((best, period) => (period.score < best.score ? period : best));
  const attentionHour = data.weather.hourly
    .slice(0, 12)
    .reduce<HourlyForecast | null>(
      (highest, hour) => (!highest || hourRisk(hour) > hourRisk(highest) ? hour : highest),
      null,
    );
  const sunrise = extractClock(
    data.weather.current?.sunrise ?? data.weather.inmetForecast[0]?.sunrise,
  );
  const sunset = extractClock(
    data.weather.current?.sunset ?? data.weather.inmetForecast[0]?.sunset,
  );
  const daylight = daylightDuration(sunrise, sunset);

  return (
    <section
      className="today-resources"
      id="recursos-hoje"
      aria-labelledby="today-resources-title"
    >
      <header className="today-resources__heading">
        <div>
          <span className="eyebrow">Planejador do dia</span>
          <h2 id="today-resources-title">Recursos para decidir as próximas horas</h2>
        </div>
        <p>
          A previsão foi organizada em janelas práticas. Os destaques abaixo são recalculados a
          partir de chuva, rajadas e temperatura previstas para as próximas 12 horas.
        </p>
      </header>

      <div className="today-resources__signals" aria-label="Destaques automáticos para hoje">
        <article className="is-best">
          <span>
            <CheckCircle2 aria-hidden="true" /> Melhor janela estimada
          </span>
          <strong>{bestPeriod.range}</strong>
          <small>{statusAdvice(bestPeriod.status)}</small>
        </article>

        <article className="is-attention">
          <span>
            <TriangleAlert aria-hidden="true" /> Maior atenção
          </span>
          <strong>{attentionHour?.time ?? "Em atualização"}</strong>
          <small>
            {attentionHour
              ? `${formatRain(attentionHour.precipitationProbability)} de chuva e rajadas de até ${attentionHour.windGust ?? attentionHour.windSpeed} km/h.`
              : "A previsão horária ainda não permite identificar um horário."}
          </small>
        </article>

        <article>
          <span>
            <Sunrise aria-hidden="true" /> Luz natural
          </span>
          <strong>{sunrise && sunset ? `${sunrise}–${sunset}` : "Em atualização"}</strong>
          <small>{daylight ? `${daylight} entre nascer e pôr do sol.` : "Horários solares não informados."}</small>
        </article>
      </div>

      <div className="today-resources__periods" aria-label="Planejamento das próximas 12 horas">
        {periods.map((period) => {
          const isBest = period === bestPeriod;

          return (
            <article
              className={`status-${period.status}${isBest ? " is-best" : ""}`}
              key={`${period.label}-${period.range}`}
            >
              <div className="today-resources__period-topline">
                <span>
                  <Clock3 aria-hidden="true" /> {period.label}
                </span>
                <b>{isBest ? "Melhor janela" : statusLabel(period.status)}</b>
              </div>
              <strong>{period.range}</strong>
              <dl>
                <div>
                  <dt>Temperatura</dt>
                  <dd>
                    {period.minTemperature}°–{period.maxTemperature}°
                  </dd>
                </div>
                <div>
                  <dt>Chuva máxima</dt>
                  <dd>{formatRain(period.peakRain)}</dd>
                </div>
                <div>
                  <dt>Rajada</dt>
                  <dd>{period.maxGust} km/h</dd>
                </div>
              </dl>
              <p>{statusAdvice(period.status)}</p>
            </article>
          );
        })}
      </div>

      <div className="today-resources__links">
        <div>
          <span className="eyebrow">Aprofunde a leitura</span>
          <strong>Abra somente o recurso que precisa agora</strong>
        </div>
        <nav aria-label="Recursos meteorológicos relacionados">
          {resourceLinks.map((resource) => {
            const Icon = resource.icon;

            return (
              <Link to={resource.to} key={resource.to}>
                <Icon aria-hidden="true" />
                <span>
                  <strong>{resource.label}</strong>
                  <small>{resource.detail}</small>
                </span>
                <ArrowRight aria-hidden="true" />
              </Link>
            );
          })}
        </nav>
      </div>

      <footer className="today-resources__solar-note">
        <Sunset aria-hidden="true" />
        <span>
          As janelas são orientativas e não substituem avisos oficiais. Em caso de mudança rápida,
          confira radar e alertas antes de sair.
        </span>
      </footer>
    </section>
  );
}
