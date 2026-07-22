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

const windDirectionDegrees: Record<string, number> = {
  N: 0,
  NNE: 22.5,
  NE: 45,
  ENE: 67.5,
  E: 90,
  L: 90,
  ESE: 112.5,
  LSE: 112.5,
  SE: 135,
  SSE: 157.5,
  S: 180,
  SSO: 202.5,
  SSW: 202.5,
  SO: 225,
  SW: 225,
  OSO: 247.5,
  WSW: 247.5,
  O: 270,
  W: 270,
  ONO: 292.5,
  WNW: 292.5,
  NO: 315,
  NW: 315,
  NNO: 337.5,
  NNW: 337.5,
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
  const normalizedDirection = weather.current.windDirection.trim().toUpperCase();
  const directionRotation = windDirectionDegrees[normalizedDirection] ?? 0;

  return (
    <ForecastPageShell
      weather={weather}
      eyebrow="Vento em Pelotas"
      title="Veja como está o vento agora"
      description="Acompanhe a velocidade, a direção e os horários em que as rajadas podem ficar mais fortes."
      currentPath="/vento-em-pelotas"
      heroStat={{
        label: "Vento agora",
        value: `${weather.current.windSpeed} km/h`,
        detail: `de ${weather.current.windDirection} · rajadas de ${weather.current.windGust} km/h`,
        ariaLabel: `Vento de ${weather.current.windSpeed} quilômetros por hora, direção ${weather.current.windDirection}, com rajadas de ${weather.current.windGust} quilômetros por hora`,
        tone: "wind",
      }}
    >
      <section className="wind-hero wind-context-band" aria-labelledby="wind-now-title">
        <div className="wind-hero-icon">
          <WeatherIcon name="wind" title="Vento em Pelotas" />
        </div>
        <div>
          <span className="eyebrow">Direção e comportamento</span>
          <h2 id="wind-now-title">Vento de {weather.current.windDirection}</h2>
          <p>
            A bússola indica a direção observada. As rajadas atuais chegam a {weather.current.windGust} km/h e podem variar rapidamente.
          </p>
        </div>
        <div className="wind-direction" aria-label={`Direção do vento: ${weather.current.windDirection}`}>
          <span>N</span>
          <strong>{weather.current.windDirection}</strong>
          <i aria-hidden="true" style={{ transform: `rotate(${directionRotation}deg)` }}>↑</i>
        </div>
      </section>

      <section className="topic-metrics" aria-label="Pontos principais da previsão de vento">
        <article>
          <span>Maior rajada nas próximas horas</span>
          <strong>{peakHour?.windGust ?? 0} km/h</strong>
          <small>{peakHour?.time ?? "Horário indisponível"}</small>
        </article>
        <article>
          <span>Vento nesse horário</span>
          <strong>{peakHour?.windSpeed ?? weather.current.windSpeed} km/h</strong>
          <small>Velocidade sustentada prevista</small>
        </article>
        <article>
          <span>Rajada mais forte da semana</span>
          <strong>{peakDay?.windGust ?? 0} km/h</strong>
          <small>{peakDay?.weekday} · {peakDay?.date}</small>
        </article>
        <article>
          <span>Temperatura no dia mais ventoso</span>
          <strong>{peakDay?.max ?? weather.current.temperature}° / {peakDay?.min ?? weather.current.temperature}°</strong>
          <small>Máxima e mínima previstas</small>
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
            <article
              className={index === 0 ? "is-current" : ""}
              key={`${hour.time}-${index}`}
              aria-label={`${hour.time}: vento de ${hour.windSpeed} quilômetros por hora e rajadas de ${hour.windGust} quilômetros por hora`}
            >
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
        <div className="data-table data-table--responsive" role="table" aria-label="Previsão semanal de rajadas">
          <div className="data-table-head" role="row">
            <span role="columnheader">Dia</span>
            <span role="columnheader">Rajada mais forte</span>
            <span role="columnheader">Temperatura</span>
            <span role="columnheader">Tempo</span>
          </div>
          {weather.daily.map((day) => (
            <div className="data-table-row" role="row" key={`${day.weekday}-${day.date}`}>
              <span role="cell" data-label="Dia"><strong>{day.weekday}</strong><small>{day.date}</small></span>
              <span role="cell" data-label="Rajada mais forte">{day.windGust} km/h</span>
              <span role="cell" data-label="Temperatura">{day.max}° / {day.min}°</span>
              <span role="cell" data-label="Tempo"><WeatherIcon name={day.icon} title={`Condição em ${day.weekday}`} /></span>
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
