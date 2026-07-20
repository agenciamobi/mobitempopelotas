import { Link } from "@tanstack/react-router";
import {
  Cloud,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSun,
  Droplets,
  Eye,
  Gauge,
  Moon,
  Navigation,
  Sun,
  Sunrise,
  Sunset,
  Wind,
  type LucideIcon,
} from "lucide-react";

import type { WeatherHomeData, WeatherIconName } from "@/lib/weather/types";

const iconMap: Record<WeatherIconName, LucideIcon> = {
  sun: Sun,
  moon: Moon,
  "partly-cloudy": CloudSun,
  "partly-cloudy-night": CloudMoon,
  cloud: Cloud,
  rain: CloudRain,
  storm: CloudLightning,
  wind: Wind,
};

function WeatherIcon({ name, size = 28 }: { name: WeatherIconName; size?: number }) {
  const Icon = iconMap[name];
  return <Icon aria-hidden="true" size={size} strokeWidth={1.8} />;
}

function formatFetchedAt(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

export function WeatherHome({ data }: { data: WeatherHomeData }) {
  if (data.status === "unavailable" || !data.current) {
    return (
      <section className="weather-unavailable" aria-labelledby="weather-unavailable-title">
        <p className="weather-kicker">Tempo em Pelotas</p>
        <h1 id="weather-unavailable-title">Dados temporariamente indisponíveis</h1>
        <p>{data.message}</p>
        <p className="weather-source-note">
          Fonte consultada:{" "}
          <a href={data.source.url} target="_blank" rel="noreferrer">
            {data.source.name}
          </a>
        </p>
      </section>
    );
  }

  const current = data.current;

  return (
    <div className="weather-home">
      <section className="weather-current" aria-labelledby="weather-current-title">
        <div className="weather-current-copy">
          <p className="weather-kicker">Condições atuais</p>
          <h1 id="weather-current-title">
            Tempo agora em {current.city}, {current.state}
          </h1>
          <p className="weather-condition">{current.condition}</p>
          <p className="weather-update">
            Atualizado às {current.observedAt} · previsão meteorológica
          </p>
        </div>

        <div className="weather-temperature" aria-label={`${current.temperature} graus Celsius`}>
          <WeatherIcon name={current.icon} size={58} />
          <strong>{current.temperature}°</strong>
          <span>Sensação de {current.feelsLike}°</span>
        </div>
      </section>

      <section className="weather-metrics" aria-label="Detalhes das condições atuais">
        <article>
          <Droplets aria-hidden="true" />
          <span>Umidade</span>
          <strong>{current.humidity}%</strong>
        </article>
        <article>
          <Wind aria-hidden="true" />
          <span>Vento</span>
          <strong>{current.windSpeed} km/h</strong>
          <small>Rajadas de {current.windGust} km/h</small>
        </article>
        <article>
          <Navigation aria-hidden="true" />
          <span>Direção</span>
          <strong>{current.windDirection}</strong>
        </article>
        <article>
          <Gauge aria-hidden="true" />
          <span>Pressão</span>
          <strong>{current.pressure} hPa</strong>
        </article>
        <article>
          <Eye aria-hidden="true" />
          <span>Visibilidade</span>
          <strong>{current.visibilityKm} km</strong>
        </article>
        <article>
          <Sunrise aria-hidden="true" />
          <span>Nascer do sol</span>
          <strong>{current.sunrise}</strong>
        </article>
        <article>
          <Sunset aria-hidden="true" />
          <span>Pôr do sol</span>
          <strong>{current.sunset}</strong>
        </article>
      </section>

      <section className="weather-section" aria-labelledby="hourly-title">
        <div className="weather-section-heading">
          <div>
            <p className="weather-kicker">Próximas horas</p>
            <h2 id="hourly-title">Evolução do tempo</h2>
          </div>
          <Link to="/tempo-hoje-pelotas">Ver previsão de hoje</Link>
        </div>

        <div className="hourly-forecast">
          {data.hourly.map((hour) => (
            <article key={hour.time}>
              <span>{hour.time}</span>
              <WeatherIcon name={hour.icon} />
              <strong>{hour.temperature}°</strong>
              <small>{hour.precipitationProbability}% de chuva</small>
            </article>
          ))}
        </div>
      </section>

      <section className="weather-section" aria-labelledby="daily-title">
        <div className="weather-section-heading">
          <div>
            <p className="weather-kicker">Previsão estendida</p>
            <h2 id="daily-title">Próximos 7 dias</h2>
          </div>
          <Link to="/previsao-7-dias-pelotas">Ver detalhes</Link>
        </div>

        <div className="daily-forecast">
          {data.daily.map((day) => (
            <article key={`${day.weekday}-${day.date}`}>
              <div>
                <strong>{day.weekday}</strong>
                <span>{day.date}</span>
              </div>
              <WeatherIcon name={day.icon} />
              <span>{day.rainChance}% chuva</span>
              <span>{day.precipitationMm} mm</span>
              <span>Rajadas {day.windGust} km/h</span>
              <strong>
                {day.min}° / {day.max}°
              </strong>
            </article>
          ))}
        </div>
      </section>

      <p className="weather-source-note">
        Fonte:{" "}
        <a href={data.source.url} target="_blank" rel="noreferrer">
          {data.source.name}
        </a>
        . Consulta realizada em {formatFetchedAt(data.source.fetchedAt)}. Dados de previsão, não uma
        observação oficial de estação local.
      </p>
    </div>
  );
}
