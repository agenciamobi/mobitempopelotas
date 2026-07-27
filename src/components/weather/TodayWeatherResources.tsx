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
    label: "Chuva por horário",
    detail: "Chance e volume previsto",
    icon: CloudRain,
  },
  {
    to: "/vento-em-pelotas",
    label: "Vento e rajadas",
    detail: "Velocidade, direção e picos",
    icon: Wind,
  },
  {
    to: "/radar-e-satelite-pelotas",
    label: "Radar e satélite",
    detail: "Veja áreas de chuva se aproximando",
    icon: Radar,
  },
  {
    to: "/alertas",
    label: "Avisos do INMET",
    detail: "Alertas oficiais para Pelotas",
    icon: TriangleAlert,
  },
];

function maximum(values: Array<number | null | undefined>) {
  const validValues = values.filter(
    (value): value is number => value !== null && value !== undefined,
  );
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
  if (status === "stable") return "Condições mais estáveis";
  if (status === "moderate") return "Mudanças possíveis";
  if (status === "attention") return "Acompanhe antes de sair";
  return "Atenção reforçada";
}

function statusAdvice(status: PeriodStatus) {
  if (status === "stable")
    return "É o período com menor combinação de chuva e rajadas na previsão atual.";
  if (status === "moderate")
    return "As condições podem mudar; confira chuva e vento perto do horário de saída.";
  if (status === "attention")
    return "Consulte radar e avisos antes de depender de atividades ao ar livre.";
  return "Evite depender de tempo estável e acompanhe radar e avisos oficiais.";
}

function hourRisk(hour: HourlyForecast) {
  return (
    (hour.precipitationProbability ?? 25) +
    Math.max(0, (hour.windGust ?? hour.windSpeed) - 25) * 2
  );
}

function extractClock(value: string | null | undefined) {
  if (!value) return null;
  const matches = value.match(/\b(?:[01]?\d|2[0-3]):[0-5]\d\b/g);
  return matches?.[0] ?? null;
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
  if (sunriseMinutes === null || sunsetMinutes === null || sunsetMinutes <= sunriseMinutes)
    return null;

  const duration = sunsetMinutes - sunriseMinutes;
  return `${Math.floor(duration / 60)}h ${String(duration % 60).padStart(2, "0")}min`;
}

function formatRain(value: number | null) {
  return value === null ? "—" : `${Math.round(value)}%`;
}

export function TodayWeatherResources({ data }: { data: WeatherIntelligenceData }) {
  const periods = buildPeriods(data.weather.hourly);
  if (!periods.length) return null;

  const bestPeriod = periods.reduce((best, period) =>
    period.score < best.score ? period : best,
  );
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
          <span className="eyebrow">Planeje as próximas 12 horas</span>
          <h2 id="today-resources-title">Qual é o melhor período para sair hoje?</h2>
        </div>
        <p>
          Comparamos chance de chuva, rajadas e temperatura para destacar os períodos mais
          favoráveis e aqueles que merecem nova consulta.
        </p>
      </header>

      <div className="today-resources__signals" aria-label="Principais períodos para planejar o dia">
        <article className="is-best">
          <span>
            <CheckCircle2 aria-hidden="true" /> Período mais favorável
          </span>
          <strong>{bestPeriod.range}</strong>
          <small>{statusAdvice(bestPeriod.status)}</small>
        </article>

        <article className="is-attention">
          <span>
            <TriangleAlert aria-hidden="true" /> Horário de maior atenção
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
            <Sunrise aria-hidden="true" /> Luz do dia
          </span>
          <strong>{sunrise && sunset ? `${sunrise}–${sunset}` : "Em atualização"}</strong>
          <small>
            {daylight
              ? `${daylight} entre o nascer e o pôr do sol.`
              : "Horários solares não informados."}
          </small>
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
                <b>{isBest ? "Melhor período" : statusLabel(period.status)}</b>
              </div>
              <strong>{period.range}</strong>
              <dl>
                <div>
                  <dt>Faixa térmica</dt>
                  <dd>
                    {period.minTemperature}°–{period.maxTemperature}°
                  </dd>
                </div>
                <div>
                  <dt>Chance de chuva</dt>
                  <dd>{formatRain(period.peakRain)}</dd>
                </div>
                <div>
                  <dt>Rajada máxima</dt>
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
          <span className="eyebrow">Consulte o detalhe que precisa</span>
          <strong>Chuva, vento, radar e avisos oficiais</strong>
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
          Use os períodos como orientação. Se o tempo mudar rapidamente, confira radar e avisos
          oficiais antes de sair.
        </span>
      </footer>
    </section>
  );
}
