import Link from "next/link";
import { WeatherIcon } from "@/components/weather-icon";
import { WeatherTrendChart } from "@/components/weather-trend-chart";
import type { WeatherData } from "@/lib/weather-data";
import { getWeatherAdvisory } from "@/lib/weather-insights";

function MetricIcon({ type }: { type: "humidity" | "pressure" | "wind" | "visibility" }) {
  const paths = {
    humidity: <path d="M12 3S6.5 9.5 6.5 14a5.5 5.5 0 0 0 11 0C17.5 9.5 12 3 12 3Z" />,
    pressure: <path d="M4 15a8 8 0 1 1 16 0M12 15l4-5M7 19h10" />,
    wind: <path d="M3 8h11c4 0 4-6 0-6-2 0-3 1-3 3M3 13h16c4 0 4 7 0 7-2 0-3-1-3-3M3 18h8" />,
    visibility: <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Zm10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />,
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {paths[type]}
      </g>
    </svg>
  );
}

type WeatherDashboardProps = {
  weather: WeatherData;
  showCurrent?: boolean;
};

export function WeatherDashboard({ weather, showCurrent = true }: WeatherDashboardProps) {
  const { current, hourly, daily } = weather;
  const advisory = getWeatherAdvisory(weather);

  return (
    <div className="weather-content">
      {showCurrent ? (
        <section className="current-weather" id="agora" aria-labelledby="current-title">
          <div className="current-topline">
            <div>
              <span className="eyebrow">Tempo agora</span>
              <h1 id="current-title">
                {current.city}, <span>{current.state}</span>
              </h1>
            </div>
            <span className="demo-badge">{current.updatedAt} · {current.source.name}</span>
          </div>

          <div className="current-main">
            <div className="temperature-block">
              <span className="temperature-value">{current.temperature}°</span>
              <div>
                <strong>{current.condition}</strong>
                <span>Sensação de {current.feelsLike}°</span>
              </div>
            </div>

            <div className="hero-weather-icon">
              <WeatherIcon name={current.icon} title={current.condition} />
            </div>
          </div>

          <div className="metrics-grid" aria-label="Tempo agora em Pelotas">
            <article>
              <MetricIcon type="humidity" />
              <div><span>Umidade do ar</span><strong>{current.humidity}%</strong></div>
            </article>
            <article>
              <MetricIcon type="pressure" />
              <div><span>Pressão do ar</span><strong>{current.pressure} hPa</strong></div>
            </article>
            <article>
              <MetricIcon type="wind" />
              <div><span>Rajadas de {current.windGust} km/h</span><strong>{current.windSpeed} km/h {current.windDirection}</strong></div>
            </article>
            <article>
              <MetricIcon type="visibility" />
              <div><span>Até onde é possível enxergar</span><strong>{current.visibility} km</strong></div>
            </article>
          </div>
        </section>
      ) : null}

      <section className="hourly-section" id="horas" aria-labelledby="hourly-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Hora por hora</span>
            <h2 id="hourly-title">Como fica o tempo hoje</h2>
          </div>
          <div className="sun-times" aria-label="Horários do nascer e pôr do sol">
            <span>Nascer do sol <strong>{current.sunrise}</strong></span>
            <span>Pôr do sol <strong>{current.sunset}</strong></span>
          </div>
        </div>

        <div className="hourly-list">
          {hourly.map((hour, index) => (
            <article className={index === 0 ? "is-current" : ""} key={`${hour.time}-${index}`}>
              <span>{hour.time}</span>
              <WeatherIcon name={hour.icon} title={`Condição às ${hour.time}`} />
              <strong>{hour.temperature}°</strong>
              <small>{hour.precipitation}% de chuva</small>
            </article>
          ))}
        </div>
      </section>

      <WeatherTrendChart hourly={hourly} />

      <section className={`alert-card alert-card--${advisory.level}`} id="alertas" aria-labelledby="alert-title">
        <div className="alert-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 3 2 20h20L12 3Zm0 6v5m0 3v.01" /></svg>
        </div>
        <div>
          <span className="eyebrow">{advisory.eyebrow}</span>
          <h2 id="alert-title">{advisory.title}</h2>
          <p>{advisory.reasons[0] ?? advisory.description}</p>
        </div>
        <Link href="/alertas">Ver condições de atenção</Link>
      </section>

      <section className="weekly-section" id="semana" aria-labelledby="weekly-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Durante a semana</span>
            <h2 id="weekly-title">Próximos 7 dias</h2>
          </div>
          <p>Veja as temperaturas mais altas e mais baixas e a chance de chuva em Pelotas.</p>
        </div>

        <div className="daily-list">
          {daily.map((day, index) => (
            <article className={index === 0 ? "is-today" : ""} key={`${day.weekday}-${day.date}`}>
              <div className="daily-day"><strong>{day.weekday}</strong><span>{day.date}</span></div>
              <WeatherIcon name={day.icon} title={`Previsão para ${day.weekday}`} />
              <div className="daily-rain"><span aria-hidden="true">●</span>{day.rainChance}%</div>
              <div className="daily-temp"><strong>{day.max}°</strong><span>{day.min}°</span></div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
