import type { Metadata } from "next";
import { ForecastPageShell } from "@/components/forecast-page-shell";
import { WeatherIcon } from "@/components/weather-icon";
import { WeatherTrendChart } from "@/components/weather-trend-chart";
import { formatMillimeters } from "@/lib/weather-insights";
import { getPelotasWeather } from "@/lib/weather-service";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Chuva em Pelotas hoje e nos próximos dias",
  description:
    "Veja a chance de chuva em Pelotas por hora, o volume previsto e a previsão para os próximos 7 dias.",
  alternates: { canonical: "/chuva-em-pelotas" },
  openGraph: {
    title: "Previsão de chuva em Pelotas",
    description:
      "Veja quando pode chover e qual volume é esperado para Pelotas, RS.",
    url: "/chuva-em-pelotas",
  },
};

export default async function ChuvaEmPelotasPage() {
  const weather = await getPelotasWeather();
  const today = weather.daily[0];
  const peakHour = weather.hourly.reduce<(typeof weather.hourly)[number] | undefined>(
    (selected, hour) =>
      !selected || hour.precipitation > selected.precipitation ? hour : selected,
    undefined,
  );
  const wettestDay = weather.daily.reduce<(typeof weather.daily)[number] | undefined>(
    (selected, day) =>
      !selected || day.precipitation > selected.precipitation ? day : selected,
    undefined,
  );

  return (
    <ForecastPageShell
      weather={weather}
      eyebrow="Chuva em Pelotas"
      title="Quando pode chover e quanto é esperado"
      description="Veja a chance de chuva em cada horário e o volume previsto para hoje e para os próximos dias."
      currentPath="/chuva-em-pelotas"
      heroStat={{
        label: "Maior chance hoje",
        value: `${today?.rainChance ?? 0}%`,
        detail: `${formatMillimeters(today?.precipitation ?? 0)} mm previstos`,
        ariaLabel: `Maior chance de chuva hoje: ${today?.rainChance ?? 0}%, com ${formatMillimeters(today?.precipitation ?? 0)} milímetros previstos`,
        tone: "rain",
      }}
    >
      <section className="topic-metrics" aria-label="Pontos principais da chuva prevista">
        <article>
          <span>Horário mais provável</span>
          <strong>{peakHour?.time ?? "—"}</strong>
          <small>{peakHour?.precipitation ?? 0}% de chance</small>
        </article>
        <article>
          <span>Temperatura nesse horário</span>
          <strong>{peakHour?.temperature ?? weather.current.temperature}°C</strong>
          <small>Condição prevista no pico</small>
        </article>
        <article>
          <span>Rajadas nesse horário</span>
          <strong>{peakHour?.windGust ?? weather.current.windGust} km/h</strong>
          <small>Vento previsto no período</small>
        </article>
        <article>
          <span>Dia com mais volume</span>
          <strong>{formatMillimeters(wettestDay?.precipitation ?? 0)} mm</strong>
          <small>{wettestDay?.weekday} · {wettestDay?.date}</small>
        </article>
      </section>

      <WeatherTrendChart hourly={weather.hourly} initialMetric="precipitation" />

      <section className="topic-section" aria-labelledby="rain-hours-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Hora por hora</span>
            <h2 id="rain-hours-title">Chance de chuva nas próximas horas</h2>
          </div>
          <p>Quanto maior a porcentagem, maior a possibilidade de chover naquele horário.</p>
        </div>
        <div className="rain-bars">
          {weather.hourly.map((hour, index) => (
            <article key={`${hour.time}-${index}`}>
              <div>
                <strong>{hour.time}</strong>
                <WeatherIcon name={hour.icon} title={`Condição às ${hour.time}`} />
              </div>
              <div
                className="rain-progress"
                role="meter"
                aria-label={`Chance de chuva às ${hour.time}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={hour.precipitation}
                aria-valuetext={`${hour.precipitation}%`}
              >
                <span style={{ width: `${Math.min(100, hour.precipitation)}%` }} />
              </div>
              <strong>{hour.precipitation}%</strong>
              <small>{hour.temperature}°C</small>
            </article>
          ))}
        </div>
      </section>

      <section className="topic-section" aria-labelledby="rain-week-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Próximos 7 dias</span>
            <h2 id="rain-week-title">Chuva prevista para a semana</h2>
          </div>
        </div>
        <div className="data-table data-table--responsive" role="table" aria-label="Previsão semanal de chuva">
          <div className="data-table-head" role="row">
            <span role="columnheader">Dia</span>
            <span role="columnheader">Chance de chuva</span>
            <span role="columnheader">Volume previsto</span>
            <span role="columnheader">Tempo</span>
          </div>
          {weather.daily.map((day) => (
            <div className="data-table-row" role="row" key={`${day.weekday}-${day.date}`}>
              <span role="cell" data-label="Dia"><strong>{day.weekday}</strong><small>{day.date}</small></span>
              <span role="cell" data-label="Chance de chuva">{day.rainChance}%</span>
              <span role="cell" data-label="Volume previsto">{formatMillimeters(day.precipitation)} mm</span>
              <span role="cell" data-label="Tempo"><WeatherIcon name={day.icon} title={`Condição em ${day.weekday}`} /></span>
            </div>
          ))}
        </div>
      </section>

      <section className="topic-section topic-copy" aria-labelledby="rain-explain-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Entenda os números</span>
            <h2 id="rain-explain-title">Chance de chuva não mostra quanto vai chover</h2>
          </div>
        </div>
        <div className="copy-columns">
          <div>
            <h3>Chance de chuva</h3>
            <p>Mostra a possibilidade de chover durante o período. Uma chance alta não significa necessariamente chuva forte.</p>
          </div>
          <div>
            <h3>Volume em milímetros</h3>
            <p>Mostra quanto pode chover. Como referência, 1 mm representa aproximadamente 1 litro de água em cada metro quadrado.</p>
          </div>
        </div>
      </section>
    </ForecastPageShell>
  );
}
