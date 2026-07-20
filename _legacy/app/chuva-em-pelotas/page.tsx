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
    >
      <section className="topic-metrics" aria-label="Resumo da chuva prevista">
        <article>
          <span>Maior chance hoje</span>
          <strong>{today?.rainChance ?? 0}%</strong>
          <small>Possibilidade de chuva durante o dia</small>
        </article>
        <article>
          <span>Volume previsto hoje</span>
          <strong>{formatMillimeters(today?.precipitation ?? 0)} mm</strong>
          <small>Quanto pode chover no total</small>
        </article>
        <article>
          <span>Horário com maior chance</span>
          <strong>{peakHour?.precipitation ?? 0}%</strong>
          <small>{peakHour?.time ?? "Horário indisponível"}</small>
        </article>
        <article>
          <span>Dia com mais chuva na semana</span>
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
              <div className="rain-progress" aria-label={`${hour.precipitation}% de chance de chuva`}>
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
        <div className="data-table" role="table" aria-label="Previsão semanal de chuva">
          <div className="data-table-head" role="row">
            <span role="columnheader">Dia</span>
            <span role="columnheader">Chance de chuva</span>
            <span role="columnheader">Volume previsto</span>
            <span role="columnheader">Tempo</span>
          </div>
          {weather.daily.map((day) => (
            <div className="data-table-row" role="row" key={`${day.weekday}-${day.date}`}>
              <span role="cell"><strong>{day.weekday}</strong><small>{day.date}</small></span>
              <span role="cell">{day.rainChance}%</span>
              <span role="cell">{formatMillimeters(day.precipitation)} mm</span>
              <span role="cell"><WeatherIcon name={day.icon} title={`Condição em ${day.weekday}`} /></span>
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
