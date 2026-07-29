import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, CloudRain, Compass, Wind } from "lucide-react";

import {
  REGIONAL_CITIES,
  isRegionalHomeCity,
  regionalCityPath,
  type RegionalCity,
} from "@/lib/regional-cities";
import {
  hasVerifiedRegionalAlertSemantics,
  regionalAlertPeriod,
  selectPriorityRegionalAlert,
} from "@/lib/weather/regional-alert-priority";
import type {
  RegionalCityAlert,
  RegionalCityWeatherData,
} from "@/lib/weather/regional-city-weather.types";
import { WeatherIcon } from "@/production/components/weather-icon";
import { RegionalCityHero } from "./RegionalCityHero";
import { RegionalCityHourlySection } from "./RegionalCityHourlySection";
import { formatRegionalDateTime } from "./regional-time-format";
import { regionalWeatherIcon } from "./regional-weather-presentation";

import "./RegionalCityPerformance.css";
import "./RegionalCityRefinements.css";
import styles from "./RegionalCityWeatherPage.module.css";
import "./RegionalCityEditorial.css";
import "./RegionalCityCascadeFix.css";

const regionalNumberFormat = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
});

const regionalSections = [
  {
    href: "#avisos-municipais",
    label: "Avisos",
    description: "INMET e orientações oficiais",
  },
  {
    href: "#previsao-horaria-regional",
    label: "Próximas horas",
    description: "Temperatura, chuva e vento",
  },
  {
    href: "#previsao-7-dias-regional",
    label: "Próximos 7 dias",
    description: "Tendência diária do município",
  },
  {
    href: "#como-interpretar-previsao-regional",
    label: "Como interpretar",
    description: "Limites e origem dos dados",
  },
  {
    href: "#cidades-proximas",
    label: "Cidades próximas",
    description: "Previsão para a região",
  },
] as const;

function metric(value: number | null, suffix: string) {
  return value === null || !Number.isFinite(value)
    ? "—"
    : `${regionalNumberFormat.format(value)}${suffix}`;
}

function maximum(values: Array<number | null>) {
  const usable = values.filter((value): value is number => value !== null && Number.isFinite(value));
  return usable.length > 0 ? Math.max(...usable) : null;
}

function severityColor(alert: RegionalCityAlert) {
  if (!hasVerifiedRegionalAlertSemantics(alert)) return "neutral";
  if (alert.severity === "great-danger") return "red";
  if (alert.severity === "danger") return "orange";
  if (alert.severity === "potential") return "yellow";
  return "neutral";
}

function alertTimingLabel(alert: RegionalCityAlert) {
  const period = regionalAlertPeriod(alert);
  if (period === "active") return "Em vigor agora";
  if (period === "upcoming") return "Aviso programado";
  return "Período em validação";
}

function RegionalSectionNavigation({ cityName }: { cityName: string }) {
  return (
    <nav className="regional-city-section-nav" aria-label={`Seções da previsão para ${cityName}`}>
      <span className="regional-city-section-nav__label">Nesta página</span>
      <div className="regional-city-section-nav__links">
        {regionalSections.map((section, index) => (
          <a href={section.href} key={section.href}>
            <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <span>
              <strong>{section.label}</strong>
              <small>{section.description}</small>
            </span>
          </a>
        ))}
      </div>
    </nav>
  );
}

function CityLink({ city }: { city: RegionalCity }) {
  if (isRegionalHomeCity(city)) {
    return (
      <Link to="/">
        <span>{city.name}</span>
        <small>{city.descriptor}</small>
        <ArrowRight aria-hidden="true" />
      </Link>
    );
  }

  return (
    <Link to="/tempo-em/$citySlug" params={{ citySlug: city.slug }}>
      <span>{city.name}</span>
      <small>{city.descriptor}</small>
      <ArrowRight aria-hidden="true" />
    </Link>
  );
}

export function RegionalCityWeatherPage({ data }: { data: RegionalCityWeatherData }) {
  const city = data.city;
  const current = data.current;
  const priorityAlert = selectPriorityRegionalAlert(data.alerts.items);
  const alertsUnavailable = data.alerts.status === "unavailable";
  const related = REGIONAL_CITIES.filter(
    (item) => item.slug !== city.slug && item.group === city.group,
  ).slice(0, 5);
  const title = `Tempo em ${city.name}, RS`;
  const highestRainChance = maximum(data.daily.map((day) => day.rainChance));
  const strongestGust = maximum(data.daily.map((day) => day.windGust));
  const alertToneClass = priorityAlert
    ? (styles[`alert${severityColor(priorityAlert)}`] ?? "")
    : "";
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
    <div className={`${styles.page} regional-city-page`}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <RegionalCityHero data={data} />
      <RegionalSectionNavigation cityName={city.name} />

      {priorityAlert ? (
        <section
          id="avisos-municipais"
          className={`${styles.alert} ${alertToneClass} regional-city-alert`}
        >
          <AlertTriangle aria-hidden="true" />
          <div>
            <span>
              {hasVerifiedRegionalAlertSemantics(priorityAlert)
                ? `${priorityAlert.severityLabel} · INMET · ${alertTimingLabel(priorityAlert)}`
                : "Aviso oficial do INMET · classificação em validação"}
            </span>
            <h2>{priorityAlert.event}</h2>
            <p>
              {priorityAlert.description ||
                `Aviso meteorológico com abrangência informada para ${city.name}.`}
            </p>
            {priorityAlert.instruction ? (
              <p>
                <strong>Orientações:</strong> {priorityAlert.instruction}
              </p>
            ) : null}
            <small>
              {hasVerifiedRegionalAlertSemantics(priorityAlert)
                ? `${formatRegionalDateTime(priorityAlert.startsAt)} até ${formatRegionalDateTime(priorityAlert.expiresAt)}`
                : "Período completo ainda não reconhecido pelo portal; confirme no aviso original."}
            </small>
          </div>
          <a
            href={priorityAlert.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Consultar o aviso oficial “${priorityAlert.event}” no site do INMET, em nova aba`}
          >
            Consultar aviso oficial <ArrowRight aria-hidden="true" />
          </a>
        </section>
      ) : alertsUnavailable ? (
        <section
          id="avisos-municipais"
          className={`${styles.noAlert} regional-city-alert regional-city-alert--unavailable`}
        >
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
        <section
          id="avisos-municipais"
          className={`${styles.noAlert} regional-city-alert regional-city-alert--clear`}
        >
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

      <section
        className={`${styles.summary} regional-city-summary`}
        aria-label="Resumo da previsão local"
      >
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
          <strong>
            {current?.windDirection ?? "—"} · {metric(current?.windSpeed ?? null, " km/h")}
          </strong>
        </article>
      </section>

      <RegionalCityHourlySection data={data} />

      <section
        id="previsao-7-dias-regional"
        className={`${styles.forecast} regional-city-forecast`}
        aria-labelledby="regional-forecast-title"
      >
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
                <header>
                  <strong>{day.weekday}</strong>
                  <small>{day.date.split("-").reverse().slice(0, 2).join("/")}</small>
                </header>
                <div className="regional-city-daily-condition">
                  <WeatherIcon
                    name={regionalWeatherIcon(day.condition)}
                    title={`Condição prevista: ${day.condition}`}
                  />
                  <h3>{day.condition}</h3>
                </div>
                <div className={styles.range}>
                  <strong>{metric(day.maximum, "°")}</strong>
                  <span>{metric(day.minimum, "°")}</span>
                </div>
                <dl>
                  <div>
                    <dt>Chuva</dt>
                    <dd>{metric(day.rainChance, "%")}</dd>
                  </div>
                  <div>
                    <dt>Volume</dt>
                    <dd>{metric(day.precipitationMm, " mm")}</dd>
                  </div>
                  <div>
                    <dt>Rajada</dt>
                    <dd>{metric(day.windGust, " km/h")}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.forecastUnavailable}>
            A previsão dos próximos dias está temporariamente indisponível.
          </p>
        )}
      </section>

      <section
        id="como-interpretar-previsao-regional"
        className={`${styles.context} regional-city-context`}
      >
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
          <li>
            <strong>Agora:</strong> estimativa horária do modelo para as coordenadas municipais.
          </li>
          <li>
            <strong>Previsão:</strong> tendência produzida por modelo numérico para o município.
          </li>
          <li>
            <strong>Aviso oficial:</strong> comunicado emitido pelo INMET para o código municipal.
          </li>
          <li>
            <strong>Emergência:</strong> siga Defesa Civil, INMET e autoridades locais.
          </li>
        </ul>
      </section>

      <section
        id="cidades-proximas"
        className={`${styles.related} regional-city-related`}
        aria-labelledby="related-cities-title"
      >
        <header>
          <div>
            <span className={styles.eyebrow}>{city.group}</span>
            <h2 id="related-cities-title">Consulte cidades próximas</h2>
          </div>
          <Link to="/tempo-na-regiao-sul-rs">
            Ver todas as cidades <ArrowRight aria-hidden="true" />
          </Link>
        </header>
        <div>{related.map((item) => <CityLink city={item} key={item.slug} />)}</div>
      </section>

      <footer className={`${styles.sources} regional-city-sources`}>
        <span>Fontes</span>
        <p>
          Previsão por coordenadas: Open-Meteo. Avisos municipais: Instituto Nacional de Meteorologia.
          Atualizado em {formatRegionalDateTime(data.source.fetchedAt)}. Apresentação: Tempo Pelotas.
        </p>
      </footer>
    </div>
  );
}
