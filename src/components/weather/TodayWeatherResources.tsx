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
  maxGust: number | null;
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

function periodStatus(peakRain: number | null, windRisk: number): PeriodStatus {
  if ((peakRain ?? 0) >= 70 || windRisk >= 50) return "high";
  if ((peakRain ?? 0) >= 40 || windRisk >= 35) return "attention";
  if ((peakRain ?? 100) <= 20 && windRisk < 30) return "stable";
  return "moderate";
}

function periodScore(peakRain: number | null, windRisk: number) {
  return (peakRain ?? 25) + Math.max(0, windRisk - 25) * 2;
}

function summarizePeriod(hours: HourlyForecast[], index: number): PeriodSummary {
  const firstHour = hours[0];
  const lastHour = hours[hours.length - 1];
  const peakRain = maximum(hours.map((hour) => hour.precipitationProbability));
  const maxGust = maximum(hours.map((hour) => hour.windGust));
  const maxWindSpeed = Math.max(...hours.map((hour) => hour.windSpeed));
  const windRisk = maxGust ?? maxWindSpeed;
  const temperatures = hours.map((hour) => hour.temperature);

  return {
    label: periodLabels[index] ?? `Período ${index + 1}`,
    range: firstHour.time === lastHour.time ? firstHour.time : `${firstHour.time}–${lastHour.time}`,
    peakRain,
    maxGust,
    minTemperature: Math.min(...temperatures),
    maxTemperature: Math.max(...temperatures),
    score: periodScore(peakRain, windRisk),
    status: periodStatus(peakRain, windRisk),
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
  if (status === "stable") return "Condições estáveis";
  if (status === "moderate") return "Mudanças possíveis";
  if (status === "attention") return "Acompanhe antes de sair";
  return "Atenção reforçada";
}

function statusAdvice(status: PeriodStatus) {
  if (status === "stable")
    return "A chance de chuva é baixa e o vento fica abaixo dos limiares de atenção usados nesta página.";
  if (status === "moderate")
    return "As condições podem mudar; confira chuva e vento perto do horário de saída.";
  if (status === "attention")
    return "Consulte radar e avisos antes de depender de atividades ao ar livre.";
  return "Evite depender de tempo estável e acompanhe radar e avisos oficiais.";
}

function hourRisk(hour: HourlyForecast) {
  return (
    (hour.precipitationProbability ?? 0) +
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

function formatGust(value: number | null) {
  if (value === null) return "Não informada";
  if (value <= 0) return "Sem rajada prevista";
  return `${value} km/h`;
}

export function TodayWeatherResources({ data }: { data: WeatherIntelligenceData }) {
  const periods = buildPeriods(data.weather.hourly);
  if (!periods.length) return null;

  const comparablePeriods = periods.filter((period) => period.peakRain !== null);
  const comparableScores = comparablePeriods.map((period) => period.score);
  const hasPeriodContrast =
    comparableScores.length > 1 && Math.max(...comparableScores) > Math.min(...comparableScores);
  const bestPeriod = comparablePeriods.reduce<PeriodSummary | null>(
    (best, period) => (!best || period.score < best.score ? period : best),
    null,
  );
  const visibleHours = data.weather.hourly.slice(0, 12);
  const hourRisks = visibleHours.map((hour) => hourRisk(hour));
  const hasHourContrast = Math.max(...hourRisks) > Math.min(...hourRisks);
  const attentionHour = hasHourContrast
    ? visibleHours.reduce<HourlyForecast | null>(
        (highest, hour) => (!highest || hourRisk(hour) > hourRisk(highest) ? hour : highest),
        null,
      )
    : null;
  const attentionRain = attentionHour
    ? attentionHour.precipitationProbability === null
      ? "chance de chuva não informada"
      : `${formatRain(attentionHour.precipitationProbability)} de chance de chuva`
    : null;
  const attentionWind = attentionHour
    ? attentionHour.windGust === null
      ? `vento de ${attentionHour.windSpeed} km/h; rajada não informada`
      : attentionHour.windGust <= 0
        ? `vento de ${attentionHour.windSpeed} km/h; sem rajada prevista`
        : `rajadas de até ${attentionHour.windGust} km/h`
    : null;
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
          Comparamos chance de chuva, vento, rajadas e temperatura para destacar diferenças reais
          entre os próximos períodos.
        </p>
      </header>

      <div className="today-resources__signals" aria-label="Principais períodos para planejar o dia">
        <article className={hasPeriodContrast && bestPeriod ? "is-best" : undefined}>
          <span>
            <CheckCircle2 aria-hidden="true" /> {hasPeriodContrast ? "Período mais favorável" : "Comparação entre períodos"}
          </span>
          <strong>
            {hasPeriodContrast && bestPeriod
              ? bestPeriod.range
              : comparablePeriods.length
                ? "Sem diferença relevante"
                : "Chance de chuva em atualização"}
          </strong>
          <small>
            {hasPeriodContrast && bestPeriod
              ? statusAdvice(bestPeriod.status)
              : comparablePeriods.length > 1
                ? "Os períodos têm pontuações semelhantes de chuva e vento nesta atualização."
                : comparablePeriods.length === 1
                  ? "Ainda não há períodos suficientes com chance de chuva publicada para comparar."
                  : "A chance de chuva ainda não foi informada nos períodos comparados."}
          </small>
        </article>

        <article className={hasHourContrast ? "is-attention" : undefined}>
          <span>
            <TriangleAlert aria-hidden="true" /> {hasHourContrast ? "Horário de maior atenção" : "Comparação por horário"}
          </span>
          <strong>{hasHourContrast ? attentionHour?.time ?? "Em atualização" : "Sem um único horário"}</strong>
          <small>
            {attentionHour && attentionRain && attentionWind
              ? `${attentionRain} e ${attentionWind}.`
              : "Os horários têm valores semelhantes; nenhum se destaca como o de maior atenção."}
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
          const isBest = hasPeriodContrast && bestPeriod !== null && period === bestPeriod;

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
                  <dd>{formatGust(period.maxGust)}</dd>
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
