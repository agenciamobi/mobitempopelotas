import Link from "@/production/compat/NextLink";
import { WeatherIcon } from "@/production/components/weather-icon";
import { weatherConditionLabels } from "@/production/lib/hero-weather-presentation";
import type { ForecastNarrative } from "@/production/lib/weather-ai-summary";
import type {
  DailyForecast,
  WeatherData,
  WeatherIconName,
} from "@/production/lib/weather-data";

import "./home-forecast-trend.css";

type HomeForecastTrendProps = {
  weather: WeatherData;
  narrative: ForecastNarrative | null;
};

const conditionHeadlines: Record<WeatherIconName, string> = {
  sun: "Tempo firme com períodos de sol",
  moon: "Noite com céu aberto",
  "partly-cloudy": "Sol aparece entre nuvens",
  "partly-cloudy-night": "Noite com variação de nuvens",
  cloud: "Predomínio de nuvens ao longo do dia",
  rain: "Períodos de chuva são esperados",
  storm: "Trovoadas podem ocorrer",
  wind: "Vento ganha destaque",
};

function formatNumber(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

function buildDaySummary(day: DailyForecast): ForecastNarrative {
  const rain =
    day.rainChance === null
      ? `${formatNumber(day.precipitation)} mm previstos.`
      : `${day.rainChance}% de chance de chuva e ${formatNumber(day.precipitation)} mm previstos.`;
  const wind = day.windGust === null ? "" : ` Rajadas de até ${day.windGust} km/h.`;

  return {
    headline: conditionHeadlines[day.icon],
    summary: `${rain}${wind}`,
  };
}

function buildTomorrowFallback(weather: WeatherData): ForecastNarrative | null {
  const tomorrow = weather.daily[1];
  if (!tomorrow) return null;

  const hasStrongWind = (tomorrow.windGust ?? -1) >= 50;
  const headline =
    tomorrow.icon === "storm" || hasStrongWind
      ? "Amanhã exige atenção ao tempo"
      : tomorrow.rainChance !== null && tomorrow.rainChance >= 70
        ? "Chuva deve marcar o dia de amanhã"
        : tomorrow.rainChance !== null && tomorrow.rainChance >= 35
          ? "Amanhã pode ter períodos de chuva"
          : tomorrow.icon === "sun"
            ? "Amanhã terá períodos de sol"
            : "Amanhã terá variação de nuvens";

  const rainDescription =
    tomorrow.rainChance === null
      ? `Probabilidade de chuva não informada; volume previsto de ${formatNumber(tomorrow.precipitation)} mm.`
      : tomorrow.rainChance >= 70
        ? `Chance alta de chuva, com ${formatNumber(tomorrow.precipitation)} mm previstos.`
        : tomorrow.rainChance >= 35
          ? `Possibilidade de chuva, com ${formatNumber(tomorrow.precipitation)} mm previstos.`
          : "Chance baixa de chuva, sem volume relevante indicado.";
  const gustDescription =
    tomorrow.windGust === null
      ? "Rajada máxima não informada."
      : `Rajadas de até ${tomorrow.windGust} km/h.`;

  return {
    headline,
    summary: `${rainDescription} Temperaturas entre ${tomorrow.min}° e ${tomorrow.max}°. ${gustDescription}`,
  };
}

function rainChanceLabel(value: number | null) {
  if (value === null) return "Chuva não informada";
  if (value === 0) return "Sem chuva indicada";
  if (value < 20) return "Chance baixa";
  if (value < 50) return "Chance moderada";
  if (value < 80) return "Chance alta";
  return "Chance muito alta";
}

export function HomeForecastTrend({ weather, narrative }: HomeForecastTrendProps) {
  const nextDays = weather.daily.slice(1, 5);
  const dayRainChances = nextDays
    .map((day) => day.rainChance)
    .filter((value): value is number => value !== null);
  const rainiestDayChance = dayRainChances.length > 0 ? Math.max(...dayRainChances) : null;
  const summaries = nextDays.map((day, index) =>
    index === 0 ? narrative ?? buildTomorrowFallback(weather) ?? buildDaySummary(day) : buildDaySummary(day),
  );

  if (nextDays.length === 0) return null;

  return (
    <section className="tp-home-trend" aria-labelledby="tp-home-trend-title">
      <header className="tp-home-trend__header">
        <span>Tendência do tempo</span>
        <h2 id="tp-home-trend-title">Como o tempo deve evoluir na semana</h2>
      </header>

      <div className="tp-home-trend__list">
        {nextDays.map((day, index) => {
          const summary = summaries[index] ?? buildDaySummary(day);
          const isRainiest =
            rainiestDayChance !== null &&
            day.rainChance === rainiestDayChance &&
            day.rainChance !== null &&
            day.rainChance >= 20;
          const condition = weatherConditionLabels[day.icon];

          return (
            <article
              className={`tp-home-trend-day${isRainiest ? " is-rainiest" : ""}`}
              key={`${day.weekday}-${day.date}`}
              aria-label={`${day.weekday}, ${day.date}: máxima de ${day.max} graus, mínima de ${day.min} graus e ${day.rainChance === null ? "probabilidade de chuva não informada" : `${day.rainChance}% de chance de chuva`}.`}
            >
              <div className="tp-home-trend-day__topline">
                <div>
                  <strong>{day.weekday}</strong>
                  <span>{day.date}</span>
                </div>
                {isRainiest ? <b>Maior chance</b> : null}
              </div>

              <div className="tp-home-trend-day__condition">
                <WeatherIcon name={day.icon} title={condition} />
                <span>{condition}</span>
              </div>

              <div className="tp-home-trend-day__summary">
                <strong>{summary.headline}</strong>
                <p>{summary.summary}</p>
              </div>

              <dl className="tp-home-trend-day__metrics">
                <div>
                  <dt>Chuva</dt>
                  <dd>{day.rainChance === null ? "—" : `${day.rainChance}%`}</dd>
                  <small>{rainChanceLabel(day.rainChance)}</small>
                </div>
                <div>
                  <dt>Máx.</dt>
                  <dd>{day.max}°</dd>
                </div>
                <div>
                  <dt>Mín.</dt>
                  <dd>{day.min}°</dd>
                </div>
              </dl>
            </article>
          );
        })}
      </div>

      <div className="tp-home-trend__links">
        <Link href="/tempo-hoje-pelotas">
          Ver previsão completa de hoje <span aria-hidden="true">→</span>
        </Link>
        <Link href="/previsao-7-dias-pelotas">Ver previsão para 7 dias</Link>
      </div>
    </section>
  );
}
