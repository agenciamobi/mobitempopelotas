import { Sunrise, Sunset } from "lucide-react";

import type { RegionalCityWeatherData } from "@/lib/weather/regional-city-weather.types";

import styles from "./RegionalCityHourlySection.module.css";
import { formatRegionalHour } from "./regional-time-format";

function metric(value: number | null, suffix: string) {
  return value === null || !Number.isFinite(value)
    ? "—"
    : `${String(value).replace(".", ",")}${suffix}`;
}

export function RegionalCityHourlySection({ data }: { data: RegionalCityWeatherData }) {
  return (
    <section className={styles.section} aria-labelledby="regional-hourly-title">
      <header className={styles.header}>
        <div>
          <span>Próximas horas</span>
          <h2 id="regional-hourly-title">Como o tempo deve evoluir em {data.city.name}</h2>
        </div>
        <div className={styles.astronomy} aria-label="Horários do sol">
          <span>
            <Sunrise aria-hidden="true" /> Nascer do sol
            <strong>{formatRegionalHour(data.astronomy.sunrise)}</strong>
          </span>
          <span>
            <Sunset aria-hidden="true" /> Pôr do sol
            <strong>{formatRegionalHour(data.astronomy.sunset)}</strong>
          </span>
        </div>
      </header>

      {data.hourly.length > 0 ? (
        <div className={styles.grid}>
          {data.hourly.map((hour, index) => (
            <article key={hour.time}>
              <header>
                <strong>{index === 0 ? "Agora" : formatRegionalHour(hour.time)}</strong>
                <small>{hour.condition}</small>
              </header>
              <div className={styles.temperature}>{metric(hour.temperature, "°")}</div>
              <dl>
                <div><dt>Chance</dt><dd>{metric(hour.rainChance, "%")}</dd></div>
                <div><dt>Volume</dt><dd>{metric(hour.precipitationMm, " mm")}</dd></div>
                <div><dt>Vento</dt><dd>{metric(hour.windSpeed, " km/h")}</dd></div>
                <div><dt>Rajada</dt><dd>{metric(hour.windGust, " km/h")}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <p className={styles.unavailable}>A previsão horária está temporariamente indisponível.</p>
      )}
    </section>
  );
}
