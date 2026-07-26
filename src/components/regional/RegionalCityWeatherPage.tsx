import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, CloudRain, Compass, MapPin, Wind } from "lucide-react";

import { REGIONAL_CITIES, regionalCityPath } from "@/lib/regional-cities";
import type { RegionalCityWeatherData } from "@/lib/weather/regional-city-weather.types";
import { RegionalCityHourlySection } from "./RegionalCityHourlySection";
import { formatRegionalDateTime } from "./regional-time-format";

import styles from "./RegionalCityWeatherPage.module.css";

function metric(value: number | null, suffix: string) {
  return value === null || !Number.isFinite(value) ? "—" : `${value}${suffix}`;
}

function maximum(values: Array<number | null>) {
  const usable = values.filter((value): value is number => value !== null && Number.isFinite(value));
  return usable.length > 0 ? Math.max(...usable) : null;
}

function severityColor(severity: string) {
  if (severity === "great-danger") return "red";
  if (severity === "danger") return "orange";
  if (severity === "potential") return "yellow";
  return "neutral";
}

export function RegionalCityWeatherPage({ data }: { data: RegionalCityWeatherData }) {
  const city = data.city;
  const current = data.current;
  const activeAlert = data.alerts.items[0] ?? null;
  const alertsUnavailable = data.alerts.status === "unavailable";
  const related = REGIONAL_CITIES.filter(
    (item) => item.slug !== city.slug && item.group === city.group,
  ).slice(0, 5);
  const title = `Tempo em ${city.name}, RS`;
  const highestRainChance = maximum(data.daily.map((day) => day.rainChance));
  const strongestGust = maximum(data.daily.map((day) => day.windGust));
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description: `Previsão do tempo, chuva, vento e avisos meteorológicos para ${city.name}, Rio Grande do Sul.`,
    url: `https://tempopelotas.com.br${regionalCityPath(city)}`,
    dateModified: data.source.fetchedAt,
    about: {
      "@type": "Place",
      name: `${city.name}, Rio Grande do Sul`,
      geo: { "@type": "GeoCoordinates", latitude: city.latitude, longitude: city.longitude },
    },
    isPartOf: { "@type": "WebSite", name: "Tempo Pelotas", url: "https://tempopelotas.com.br" },
  };

  return (
    <main className={styles.page} id="conteudo-principal">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <Link className={styles.back} to="/">
            Tempo Pelotas <ArrowRight aria-hidden="true" />
          </Link>
          <span className={styles.eyebrow}>Central meteorológica regional</span>
          <h1>{title}</h1>
          <p>
            Consulte a condição estimada agora, a previsão para as próximas horas e sete dias, chuva,
            vento e avisos do INMET para {city.name}. {city.name} é {city.descriptor}.
          </p>
          <div className={styles.location}>
            <MapPin aria-hidden="true" /> {city.group} · Rio Grande do Sul
          </div>
        </div>

        <article className={styles.nowCard}>
          <header>
            <div>
              <span>Estimativa atual</span>
              <strong>{city.name}, RS</strong>
            </div>
            <small>{current ? formatRegionalDateTime(current.observedAt) : "em atualização"}</small>
          </header>
          <div className={styles.temperatureRow}>
            <strong>{metric(current?.temperature ?? null, "°")}</strong>
            <div>
              <span>{current?.condition ?? "Condição indisponível"}</span>
              <small>Sensação de {metric(current?.feelsLike ?? null, "°")}</small>
            </div>
          </div>
          <dl>
            <div><dt>Umidade</dt><dd>{metric(current?.humidity ?? null, "%")}</dd></div>
            <div><dt>Vento</dt><dd>{metric(current?.windSpeed ?? null, " km/h")}</dd></div>
            <div><dt>Pressão</dt><dd>{metric(current?.pressure ?? null, " hPa")}</dd></div>
          </dl>
          <p>
            Modelo para as coordenadas centrais. Chuva agora: {metric(current?.precipitationMm ?? null, " mm")}.
            Não representa medição de uma estação local.
          </p>
        </article>
      </section>

      {activeAlert ? (
        <section className={`${styles.alert} ${styles[`alert${severityColor(activeAlert.severity)}`]}`}>
          <AlertTriangle aria-hidden="true" />
          <div>
            <span>{activeAlert.severityLabel} · INMET</span>
            <h2>{activeAlert.event}</h2>
            <p>{activeAlert.description || `Aviso meteorológico com abrangência informada para ${city.name}.`}</p>
            {activeAlert.instruction ? <p><strong>Orientações:</strong> {activeAlert.instruction}</p> : null}
            <small>{formatRegionalDateTime(activeAlert.startsAt)} até {formatRegionalDateTime(activeAlert.expiresAt)}</small>
          </div>
          <a href={activeAlert.officialUrl} target="_blank" rel="noopener noreferrer">
            Consultar aviso oficial <ArrowRight aria-hidden="true" />
          </a>
        </section>
      ) : alertsUnavailable ? (
        <section className={styles.noAlert}>
          <AlertTriangle aria-hidden="true" />
          <div>
            <strong>Consulta municipal ao INMET temporariamente indisponível</strong>
            <p>
              Não é possível afirmar que {city.name} está sem avisos neste momento. Consulte o portal
              oficial do INMET e os canais da Defesa Civil até a próxima atualização automática.
            </p>
          </div>
        </section>
      ) : (
        <section className={styles.noAlert}>
          <span aria-hidden="true" />
          <div>
            <strong>Nenhum aviso municipal ativo encontrado</strong>
            <p>
              A consulta automática ao INMET não retornou alerta vigente para {city.name} nesta
              atualização. A ausência de resultado não substitui os canais oficiais de emergência.
            </p>
          </div>
        </section>
      )}

      <section className={styles.summary} aria-label="Resumo da previsão local">
        <article>
          <CloudRain aria-hidden="true" />
          <span>Maior chance de chuva</span>
          <strong>{metric(highestRainChance, "%")}</strong>
        </article>
        <article>
          <Wind aria-hidden="true" />
          <span>Rajada mais forte</span>
          <strong>{metric(strongestGust, " km/h")}</strong>
        </article>
        <article>
          <Compass aria-hidden="true" />
          <span>Vento agora</span>
          <strong>{current?.windDirection ?? "—"} · {metric(current?.windSpeed ?? null, " km/h")}</strong>
        </article>
      </section>

      <RegionalCityHourlySection data={data} />

      <section className={styles.forecast} aria-labelledby="regional-forecast-title">
        <header>
          <div>
            <span className={styles.eyebrow}>Próximos dias</span>
            <h2 id="regional-forecast-title">Previsão para {city.name}</h2>
          </div>
          <small>Modelo Open-Meteo · atualização automática</small>
        </header>
        {data.daily.length > 0 ? (
          <div className={styles.forecastGrid}>
            {data.daily.map((day) => (
              <article key={day.date}>
                <header><strong>{day.weekday}</strong><small>{day.date.split("-").reverse().slice(0, 2).join("/")}</small></header>
                <h3>{day.condition}</h3>
                <div className={styles.range}><strong>{metric(day.maximum, "°")}</strong><span>{metric(day.minimum, "°")}</span></div>
                <dl>
                  <div><dt>Chuva</dt><dd>{metric(day.rainChance, "%")}</dd></div>
                  <div><dt>Volume</dt><dd>{metric(day.precipitationMm, " mm")}</dd></div>
                  <div><dt>Rajada</dt><dd>{metric(day.windGust, " km/h")}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.forecastUnavailable}>A previsão dos próximos dias está temporariamente indisponível.</p>
        )}
      </section>

      <section className={styles.context}>
        <div>
          <span className={styles.eyebrow}>Leitura local</span>
          <h2>Como interpretar o tempo em {city.name}</h2>
          <p>
            A previsão representa a grade meteorológica correspondente às coordenadas centrais do
            município. Bairros, áreas rurais, litoral, serras e baixadas podem registrar condições
            diferentes, principalmente em chuva localizada, vento, nevoeiro e temperatura mínima.
          </p>
        </div>
        <ul>
          <li><strong>Agora:</strong> estimativa horária do modelo para as coordenadas municipais.</li>
          <li><strong>Previsão:</strong> tendência produzida por modelo numérico para o município.</li>
          <li><strong>Aviso oficial:</strong> comunicado emitido pelo INMET para o código municipal.</li>
          <li><strong>Emergência:</strong> siga Defesa Civil, INMET e autoridades locais.</li>
        </ul>
      </section>

      <section className={styles.related} aria-labelledby="related-cities-title">
        <header>
          <div>
            <span className={styles.eyebrow}>{city.group}</span>
            <h2 id="related-cities-title">Consulte cidades próximas</h2>
          </div>
          <a href="/tempo-na-regiao-sul-rs">Ver todas as cidades <ArrowRight aria-hidden="true" /></a>
        </header>
        <div>
          {related.map((item) => (
            <a href={regionalCityPath(item)} key={item.slug}>
              <span>{item.name}</span>
              <small>{item.descriptor}</small>
              <ArrowRight aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>

      <footer className={styles.sources}>
        <span>Fontes</span>
        <p>
          Previsão por coordenadas: Open-Meteo. Avisos municipais: Instituto Nacional de Meteorologia.
          Atualizado em {formatRegionalDateTime(data.source.fetchedAt)}. Apresentação: Tempo Pelotas.
        </p>
      </footer>
    </main>
  );
}
