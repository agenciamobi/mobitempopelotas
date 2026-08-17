import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { InternalPageChapters } from "@/components/weather/InternalWeatherWidgets";
import { HomeForecastStory } from "@/components/weather/HomeForecastStory";
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
import type { RegionalCityWeatherData } from "@/lib/weather/regional-city-weather.types";
import { RegionalCityHero } from "./RegionalCityHero";
import { toRegionalForecastStory } from "./regional-city-forecast-story";
import { formatRegionalDateTime } from "./regional-time-format";

import "./RegionalCityPerformance.css";
import styles from "./RegionalCityWeatherPage.module.css";
import "./RegionalCityIdentity.css";

const regionalSections = [
  {
    href: "#avisos-municipais",
    label: "Avisos",
    detail: "INMET e orientações oficiais",
  },
  {
    href: "#previsao-hoje",
    label: "Próximas horas",
    detail: "Temperatura, chuva e vento",
  },
  {
    href: "#tendencia",
    label: "Próximos dias",
    detail: "Tendência diária do município",
  },
  {
    href: "#como-interpretar-previsao-regional",
    label: "Entenda os dados",
    detail: "Limites e origem da previsão",
  },
  {
    href: "#cidades-proximas",
    label: "Cidades próximas",
    detail: "Previsão para a região",
  },
];

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

function RegionalOfficialAlertPanel({ data }: { data: RegionalCityWeatherData }) {
  const alert = selectPriorityRegionalAlert(data.alerts.items);
  const verified = alert ? hasVerifiedRegionalAlertSemantics(alert) : false;
  const period = alert ? regionalAlertPeriod(alert) : null;
  const severityClass = alert && verified ? `severity-${alert.severity}` : "advisory-normal";
  const statusLabel = alert
    ? verified
      ? alert.severityLabel
      : "Classificação em validação"
    : data.alerts.status === "unavailable"
      ? "Consulta indisponível"
      : "Atualizado";
  const title = alert
    ? `Aviso meteorológico: ${alert.event}`
    : data.alerts.status === "unavailable"
      ? "Não foi possível consultar os avisos municipais agora"
      : `Nenhum aviso municipal ativo encontrado para ${data.city.name}`;
  const validity = alert
    ? verified
      ? `${formatRegionalDateTime(alert.startsAt)} até ${formatRegionalDateTime(alert.expiresAt)}`
      : "Período completo ainda não reconhecido; confirme no aviso original"
    : data.alerts.status === "unavailable"
      ? "A situação deve ser confirmada nos canais oficiais"
      : `Consulta atualizada em ${formatRegionalDateTime(data.source.fetchedAt)}`;
  const officialUrl = alert?.officialUrl ?? data.alerts.sourceUrl;

  return (
    <section
      id="avisos-municipais"
      className={`home-inmet-alerts ${severityClass}${verified ? " is-officially-classified" : " is-unverified"} regional-city-official-alert`}
      data-alert-period={period ?? "none"}
      data-alert-severity={alert?.severity ?? "unknown"}
      data-alert-official-semantics={verified ? "verified" : "unverified"}
      aria-labelledby="regional-inmet-title"
    >
      <div className="home-inmet-alerts__main">
        <div className="home-inmet-alerts__mark" aria-hidden="true">
          <small>INMET</small>
          <strong>{alert ? "!" : "✓"}</strong>
        </div>
        <div className="home-inmet-alerts__copy">
          <div className="home-inmet-alerts__topline">
            <span>Aviso oficial do INMET</span>
            <b>{statusLabel}</b>
          </div>
          <h2 id="regional-inmet-title">{title}</h2>
          <div className="home-inmet-alerts__meta">
            <span>
              <small>Abrangência</small>
              <strong>Município de {data.city.name}</strong>
            </span>
            <span>
              <small>Validade</small>
              <strong>{validity}</strong>
            </span>
          </div>
        </div>
      </div>
      <div className="home-inmet-alerts__aside">
        <strong>Áreas e orientações oficiais</strong>
        <small>
          {alert
            ? `Aviso com abrangência informada para ${data.city.name}`
            : "A consulta automática é atualizada periodicamente"}
        </small>
        <a
          href={officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Consultar o aviso oficial do INMET para ${data.city.name} em nova aba`}
        >
          Consultar avisos <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}

export function RegionalCityWeatherPage({ data }: { data: RegionalCityWeatherData }) {
  const city = data.city;
  const related = REGIONAL_CITIES.filter(
    (item) => item.slug !== city.slug && item.group === city.group,
  ).slice(0, 5);
  const title = `Tempo em ${city.name}, RS`;
  const forecastStory = toRegionalForecastStory(data);
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
      <RegionalOfficialAlertPanel data={data} />
      <InternalPageChapters
        items={regionalSections}
        label={`Navegação da previsão para ${city.name}`}
      />

      <div className="internal-forecast-widget regional-city-shared-forecast">
        <HomeForecastStory
          data={forecastStory}
          context="regional-page"
          locationName={city.name}
          showLinks={false}
        />
      </div>

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
