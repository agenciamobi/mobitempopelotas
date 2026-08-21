import { WeatherIcon } from "@/production/components/weather-icon";
import { weatherConditionLabels } from "@/production/lib/hero-weather-presentation";
import type { WeatherData } from "@/production/lib/weather-data";

import "./home-forecast-editorial.css";

type HomeForecastEditorialProps = {
  weather: WeatherData;
};

function formatNumber(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("pt-BR", { maximumFractionDigits }).format(value);
}

function hourlyRainReading(probability: number | null, precipitationMm: number | null | undefined) {
  const chance = probability === null ? null : `${probability}%`;
  const volume =
    precipitationMm === null || precipitationMm === undefined
      ? null
      : `${formatNumber(precipitationMm)} mm`;

  if (chance && volume) return { primary: chance, secondary: `chance · ${volume}` };
  if (chance) return { primary: chance, secondary: "chance" };
  if (volume) return { primary: volume, secondary: "volume previsto" };
  return { primary: "—", secondary: "chuva em atualização" };
}

export function HomeForecastEditorial({ weather }: HomeForecastEditorialProps) {
  const hourly = weather.hourly.slice(0, 7);
  const hoursWithRainChance = hourly.filter((hour) => hour.precipitation !== null);
  const peakHour = hoursWithRainChance.reduce<(typeof hourly)[number] | null>(
    (highest, hour) =>
      !highest || (hour.precipitation ?? -1) > (highest.precipitation ?? -1) ? hour : highest,
    null,
  );
  const hourlyGusts = hourly
    .map((hour) => hour.windGust)
    .filter((value): value is number => value !== null);
  const strongestHourlyGust = hourlyGusts.length > 0 ? Math.max(...hourlyGusts) : null;
  const astronomy = [
    weather.astronomy?.sunrise ? ["Nascer do sol", weather.astronomy.sunrise] : null,
    weather.astronomy?.sunset ? ["Pôr do sol", weather.astronomy.sunset] : null,
    weather.astronomy?.moonPhase ? ["Lua", weather.astronomy.moonPhase] : null,
    weather.astronomy?.season ? ["Estação", weather.astronomy.season] : null,
  ].filter((item): item is [string, string] => Boolean(item));

  return (
    <section className="tp-home-forecast" id="previsao-hoje" aria-labelledby="tp-home-forecast-title">
      <header className="tp-home-forecast__header">
        <div className="tp-home-forecast__heading">
          <span>Previsão</span>
          <h2 id="tp-home-forecast-title">Próximas horas em Pelotas</h2>
        </div>

        {astronomy.length > 0 ? (
          <dl className="tp-home-forecast__astronomy" aria-label="Contexto solar, lunar e sazonal de Pelotas">
            {astronomy.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </header>

      <dl className="tp-home-forecast__signals" aria-label="Destaques das próximas horas">
        <div>
          <dt>Maior chance de chuva</dt>
          <dd>{peakHour?.precipitation === null || !peakHour ? "—" : `${peakHour.precipitation}%`}</dd>
          <small>{peakHour ? `por volta de ${peakHour.time}` : "horário não informado"}</small>
        </div>
        <div>
          <dt>Rajada mais forte</dt>
          <dd>{strongestHourlyGust === null ? "—" : `${strongestHourlyGust} km/h`}</dd>
          <small>nas próximas horas</small>
        </div>
      </dl>

      <div className="tp-home-forecast__hours" role="list" aria-label="Tempo nas próximas horas">
        {hourly.map((hour, index) => {
          const isPeak = peakHour === hour && (hour.precipitation ?? 0) > 0;
          const condition = weatherConditionLabels[hour.icon];
          const timeLabel = index === 0 ? "Próxima hora" : hour.time;
          const rain = hourlyRainReading(hour.precipitation, hour.precipitationMm);

          return (
            <article
              className={`tp-home-forecast-hour${isPeak ? " is-rain-peak" : ""}`}
              key={`${hour.timestamp ?? hour.time}-${index}`}
              role="listitem"
              aria-label={`${hour.time}: ${condition.toLocaleLowerCase("pt-BR")}, ${hour.temperature} graus, ${rain.primary} ${rain.secondary} e ${hour.windGust === null ? "rajada não informada" : `rajadas de até ${hour.windGust} quilômetros por hora`}.`}
            >
              <div className="tp-home-forecast-hour__topline">
                <strong>{timeLabel}</strong>
                {isPeak ? <span>Maior chance</span> : null}
              </div>
              <div className="tp-home-forecast-hour__weather">
                <WeatherIcon name={hour.icon} title={condition} />
                <strong>{hour.temperature}°</strong>
              </div>
              <span className="tp-home-forecast-hour__condition">{condition}</span>
              <p className="tp-home-forecast-hour__rain">
                <strong>{rain.primary}</strong>
                <span> {rain.secondary}</span>
              </p>
              <small className="tp-home-forecast-hour__wind">
                {hour.windGust === null ? "Rajada não informada" : `Rajada de até ${hour.windGust} km/h`}
              </small>
            </article>
          );
        })}
      </div>
    </section>
  );
}
