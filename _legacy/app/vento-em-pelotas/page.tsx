import type { Metadata } from "next";
import { ForecastPageShell } from "@/components/forecast-page-shell";
import { WeatherIcon } from "@/components/weather-icon";
import { WeatherTrendChart } from "@/components/weather-trend-chart";
import { getPelotasWeather } from "@/lib/weather-service";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Vento em Pelotas agora e previsão de rajadas",
  description:
    "Consulte a velocidade e a direção do vento em Pelotas, além das rajadas previstas para as próximas horas e dias.",
  alternates: { canonical: "/vento-em-pelotas" },
  openGraph: {
    title: "Vento e rajadas em Pelotas",
    description:
      "Veja como está o vento agora e quando ele pode ficar mais forte em Pelotas, RS.",
    url: "/vento-em-pelotas",
  },
};

export default async function VentoEmPelotasPage() {
  const weather = await getPelotasWeather();
  const peakHour = weather.hourly.reduce<(typeof weather.hourly)[number] | undefined>(
    (selected, hour) =>
      !selected || hour.windGust > selected.windGust ? hour : selected,
    undefined,
  );
  const peakDay = weather.daily.reduce<(typeof weather.daily)[number] | undefined>(
    (selected, day) =>
      !selected || day.windGust > selected.windGust ? day : selected,
    undefined,
  );

  return (
    <ForecastPageShell
      weather={weather}
      eyebrow="Vento em Pelotas"
      title="Veja como está o vento agora"
      description="Acompanhe a velocidade, a direção e os horários em que as rajadas podem ficar mais fortes."
      currentPath="/vento-em-pelotas"
    >
      <section className="wind-hero" aria-labelledby="wind-now-title">
        <div className="wind-hero-icon">
          <WeatherIcon name="wind" title="Vento em Pelotas" />
        </div>
        <div>
          <span className="eyebrow">Agora</span>
          <h2 id="wind-now-title">{weather.current.windSpeed} km/h</h2>
          <p>Vento de {weather.current.windDirection}, com rajadas de até {weather.current.windGust} km/h.</p>
        </div>
        <div className="wind-direction" aria-label={`Direção do vento: ${weather.current.windDirection}`}>
          <span>N</span>
          <strong>{weather.current.windDirection}</strong>
          <i aria-hidden="true">↑</i>
        </div>
      </section>

      <section className="topic-metrics" aria-label="Resumo do vento">
        <article>
          <span>Vento agora</span>
          <strong>{weather.current.windSpeed} km/h</strong>
          <small>Direção {weather.current.windDirection}</small>
        </article>
        <article>
          <span>Rajada agora</span>
          <strong>{weather.current.windGust} km/h</strong>
          <small>Pico rápido do vento</small>
        </article>
        <article>
          <span>Rajada mais forte nas próximas horas</span>
          <strong>{peakHour?.windGust ?? 0} km/h</strong>
          <small>{peakHour?.time ?? "Horário indisponível"}</small>
        </article>
        <article>
          <span>Vento mais forte da semana</span>
          <strong>{peakDay?.windGust ?? 0} km/h</strong>
          <small>{peakDay?.weekday} · {peakDay?.date}</small>
        </article>
      </section>

      <WeatherTrendChart hourly={weather.hourly} initialMetric="windGust" />

      <section className="topic-section" aria-labelledby="wind-hours-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Hora por hora</span>
            <h2 id="wind-hours-title">Quando o vento pode ficar mais forte</h2>
          </div>
          <p>A rajada é um aumento rápido do vento e pode ser mais forte que a velocidade mostrada como vento normal.</p>
        </div>
        <div className="wind-hourly-grid">
          {weather.hourly.map((hour, index) => (
            <article className={index === 0 ? "is-current" : ""} key={`${hour.time}-${index}`}>
              <strong>{hour.time}</strong>
              <WeatherIcon name={hour.icon} title={`Condição às ${hour.time}`} />
              <dl>
                <div><dt>Vento</dt><dd>{hour.windSpeed} km/h</dd></div>
                <div><dt>Rajadas</dt><dd>{hour.windGust} km/h</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="topic-section" aria-labelledby="wind-week-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Próximos 7 dias</span>
            <h2 id="wind-week-title">Rajadas previstas para a semana</h2>
          </div>
        </div>
        <div className="data-table" role="table" aria-label="Previsão semanal de rajadas">
          <div className="data-table-head" role="row">
            <span role="columnheader">Dia</span>
            <span role="columnheader">Rajada mais forte</span>
            <span role="columnheader">Temperatura</span>
            <span role="columnheader">Tempo</span>
          </div>
          {weather.daily.map((day) => (
            <div className="data-table-row" role="row" key={`${day.weekday}-${day.date}`}>
              <span role="cell"><strong>{day.weekday}</strong><small>{day.date}</small></span>
              <span role="cell">{day.windGust} km/h</span>
              <span role="cell">{day.max}° / {day.min}°</span>
              <span role="cell"><WeatherIcon name={day.icon} title={`Condição em ${day.weekday}`} /></span>
            </div>
          ))}
        </div>
      </section>

      <section className="topic-section topic-copy" aria-labelledby="wind-care-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Cuidados importantes</span>
            <h2 id="wind-care-title">Como se proteger em dias de vento forte</h2>
          </div>
        </div>
        <div className="copy-columns">
          <div>
            <h3>Recolha objetos soltos</h3>
            <p>Guarde objetos de sacadas, pátios e telhados. Evite permanecer perto de árvores, placas, estruturas metálicas e fios de energia durante rajadas fortes.</p>
          </div>
          <div>
            <h3>Siga os avisos oficiais</h3>
            <p>A previsão pode mudar. Quando houver risco, siga as orientações da Defesa Civil, do INMET e das autoridades locais.</p>
          </div>
        </div>
      </section>
    </ForecastPageShell>
  );
}
