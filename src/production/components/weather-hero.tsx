import Link from "@/production/compat/NextLink";
import type { ReactNode } from "react";
import type { CppmetForecastItem } from "@/production/lib/cppmet-forecast";
import type { WeatherData } from "@/production/lib/weather-data";
import { getWeatherAdvisory, type AdvisoryLevel } from "@/production/lib/weather-insights";

type WeatherHeroProps = {
  weather: WeatherData;
  advisoryLevel?: AdvisoryLevel;
  officialAlertCount?: number;
  cppmetForecast?: {
    item: CppmetForecastItem;
    sourceUrl: string;
  } | null;
};

type HeroMetricIconName = "humidity" | "wind" | "pressure" | "direction";

type HeroPresentation = {
  title: string;
  highlightedTitle: string;
  description: string;
  primaryAction: {
    href: string;
    label: string;
  };
  secondaryAction: {
    href: string;
    label: string;
  };
  photoHref: string;
  photoCredit: string;
};

const heroPresentationByLevel = {
  normal: {
    title: "Veja as condições para hoje.",
    highlightedTitle: "Planeje o restante do dia.",
    description:
      "Consulte a medição local disponível e veja a previsão para as próximas horas.",
    primaryAction: {
      href: "/tempo-hoje-pelotas",
      label: "Ver previsão de hoje",
    },
    secondaryAction: {
      href: "/previsao-7-dias-pelotas",
      label: "Ver previsão para 7 dias",
    },
    photoHref: "https://commons.wikimedia.org/wiki/File:Amanhecer_na_Praia_do_Laranjal.jpg",
    photoCredit: "Foto: Sebastian2112 / CC BY-SA 4.0",
  },
  attention: {
    title: "O tempo pode mudar nas próximas horas.",
    highlightedTitle: "Confira quando as condições pioram.",
    description:
      "Veja quando a chance de chuva e de rajadas aumenta e consulte os avisos oficiais antes de sair.",
    primaryAction: {
      href: "/alertas",
      label: "Consultar avisos oficiais",
    },
    secondaryAction: {
      href: "/tempo-hoje-pelotas",
      label: "Ver previsão por hora",
    },
    photoHref: "https://commons.wikimedia.org/wiki/File:Sunset_over_Calm_Lake.jpg",
    photoCredit: "Foto: Kane Morley / CC BY-SA 4.0",
  },
  warning: {
    title: "Há risco de tempo forte.",
    highlightedTitle: "Acompanhe chuva, vento e alertas.",
    description:
      "Consulte os avisos oficiais e os horários com maior risco de chuva intensa, temporal ou rajadas fortes.",
    primaryAction: {
      href: "/alertas",
      label: "Consultar avisos oficiais",
    },
    secondaryAction: {
      href: "/tempo-hoje-pelotas",
      label: "Ver previsão por hora",
    },
    photoHref: "https://commons.wikimedia.org/wiki/File:Heavy_Rain.jpg",
    photoCredit: "Foto: Pridatko Oleksandr / domínio público",
  },
} satisfies Record<AdvisoryLevel, HeroPresentation>;

function capitalizeSentence(value: string) {
  return value.replace(/^./, (character) => character.toUpperCase());
}

function normalizeForMatch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function getDynamicTitle(weather: WeatherData, level: AdvisoryLevel, cppmetSummary: string | null) {
  const today = weather.daily[0];
  const normalizedSummary = normalizeForMatch(cppmetSummary ?? "");
  const has = (pattern: RegExp) => pattern.test(normalizedSummary);

  if (level === "warning") {
    return {
      title: "Há risco de tempo forte.",
      highlightedTitle: "Acompanhe chuva, vento e alertas.",
    };
  }

  if (level === "attention") {
    if ((today?.windGust ?? 0) >= 50 || has(/vento|rajada/)) {
      return {
        title: "O vento pode ganhar força.",
        highlightedTitle: "Veja os horários com rajadas mais intensas.",
      };
    }

    return {
      title: "A chuva pode ganhar intensidade.",
      highlightedTitle: "Veja os horários mais instáveis.",
    };
  }

  if (has(/temporal|trovoada|pancada|instabil/)) {
    return {
      title: "O tempo pode ficar instável.",
      highlightedTitle: "Acompanhe chuva, vento e trovoadas.",
    };
  }

  if ((today?.rainChance ?? 0) >= 60 || has(/chuva|garoa|precipit/)) {
    return {
      title: "A chuva deve marcar o dia.",
      highlightedTitle: "Veja quando a intensidade aumenta.",
    };
  }

  if (has(/nevoeiro|nevoa|visibilidade/)) {
    return {
      title: "A visibilidade pode ficar reduzida.",
      highlightedTitle: "Consulte as condições antes de sair.",
    };
  }

  if (has(/nublado|encoberto|muitas nuvens|nebulosidade/)) {
    return {
      title: "O céu permanece com muitas nuvens.",
      highlightedTitle: "Acompanhe a evolução ao longo do dia.",
    };
  }

  if (has(/sol|ensolarado|ceu claro|poucas nuvens/)) {
    return {
      title: "O dia terá períodos de sol.",
      highlightedTitle: "Confira temperatura e vento.",
    };
  }

  if (today && today.max <= 15) {
    return {
      title: "O frio permanece em Pelotas.",
      highlightedTitle: "Confira mínima e máxima previstas.",
    };
  }

  if (today && today.max >= 30) {
    return {
      title: "O calor ganha destaque.",
      highlightedTitle: "Planeje os horários do dia.",
    };
  }

  return {
    title: "Veja as condições para hoje.",
    highlightedTitle: "Planeje o restante do dia.",
  };
}

function getCurrentSourceMeta(current: WeatherData["current"]) {
  if (!current.available) return "Medição recente indisponível · Embrapa Clima Temperado";

  const updateTime = current.source.observedAt
    ? `Leitura das ${current.source.observedAt}`
    : current.updatedAt
      ? `Atualizada em ${current.updatedAt}`
      : "Leitura recente";

  return `${updateTime} · ${current.source.name}`;
}

function getOfficialAlertReason(count: number) {
  return count === 1
    ? "Pelotas está incluída em um aviso oficial do INMET"
    : `Pelotas está incluída em ${count} avisos oficiais do INMET`;
}

function HeroMetricIcon({ name }: { name: HeroMetricIconName }) {
  const paths = {
    humidity: <path d="M12 3.2S6.8 9.3 6.8 13.7a5.2 5.2 0 0 0 10.4 0C17.2 9.3 12 3.2 12 3.2Z" />,
    wind: (
      <path d="M3 8h10.5c3.8 0 3.8-5.5.2-5.5-1.9 0-2.9 1-2.9 2.8M3 13h15.5c3.8 0 3.8 6.5.2 6.5-1.9 0-2.9-1-2.9-2.8M3 18h7.5" />
    ),
    pressure: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="m12 12 3.2-3.2M8 16h8" />
      </>
    ),
    direction: (
      <>
        <path d="m12 3 5 13-5-2-5 2 5-13Z" />
        <path d="M12 14v7" />
      </>
    ),
  } satisfies Record<HeroMetricIconName, ReactNode>;

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths[name]}
      </g>
    </svg>
  );
}

function StationObservationIcon() {
  return (
    <svg viewBox="0 0 96 96" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
        <path d="M48 18v43" />
        <circle cx="48" cy="68" r="13" />
        <path d="M48 25h11M48 38h8M48 51h11" />
      </g>
    </svg>
  );
}

function HeroMetric({
  icon,
  label,
  value,
}: {
  icon: HeroMetricIconName;
  label: string;
  value: string;
}) {
  return (
    <div className="weather-hero-metric">
      <HeroMetricIcon name={icon} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function metricValue(value: number | null, unit: string) {
  return value === null ? "Não informado" : `${value}${unit}`;
}

export function WeatherHero({
  weather,
  advisoryLevel,
  officialAlertCount = 0,
  cppmetForecast = null,
}: WeatherHeroProps) {
  const { current } = weather;
  const advisory = getWeatherAdvisory(weather);
  const resolvedLevel = advisoryLevel ?? advisory.level;
  const presentation = heroPresentationByLevel[resolvedLevel];
  const today = weather.daily[0];
  const dynamicTitle = getDynamicTitle(
    weather,
    resolvedLevel,
    cppmetForecast?.item.summary ?? null,
  );
  const description = cppmetForecast?.item.summary ?? presentation.description;
  const officialAlertReason =
    officialAlertCount > 0 ? getOfficialAlertReason(officialAlertCount) : null;
  const weatherReasons =
    advisory.level === "normal" ? [] : advisory.reasons.map(capitalizeSentence);
  const reasons = [officialAlertReason, ...weatherReasons]
    .filter((reason): reason is string => Boolean(reason))
    .slice(0, 2);
  const currentSourceMeta = getCurrentSourceMeta(current);

  return (
    <section
      className={`weather-hero weather-hero--${resolvedLevel}`}
      data-official-alerts={officialAlertCount > 0 ? "true" : "false"}
      aria-labelledby="weather-hero-title"
    >
      <div className="weather-hero-photo" aria-hidden="true" />
      <div className="weather-hero-overlay" aria-hidden="true" />
      <div className="weather-hero-orbit weather-hero-orbit--one" aria-hidden="true" />
      <div className="weather-hero-orbit weather-hero-orbit--two" aria-hidden="true" />

      <div className="weather-hero-content">
        <div className="weather-hero-copy">
          <h1 id="weather-hero-title">
            {dynamicTitle.title} <span>{dynamicTitle.highlightedTitle}</span>
          </h1>
          <p className="weather-hero-description">{description}</p>
          {cppmetForecast ? (
            <p className="weather-hero-description-source">
              Previsão elaborada pelo{" "}
              <a href={cppmetForecast.sourceUrl} target="_blank" rel="noreferrer">
                CPPMet/UFPel <span aria-hidden="true">↗</span>
              </a>
            </p>
          ) : null}

          {today ? (
            <dl className="weather-hero-daily-facts" aria-label="Resumo da previsão de hoje">
              <div>
                <dt>Máx. e mín. previstas</dt>
                <dd>
                  {today.max}° <small>/ {today.min}°</small>
                </dd>
              </div>
              <div>
                <dt>Chance máxima de chuva</dt>
                <dd>{today.rainChance === null ? "Não informada" : `${today.rainChance}%`}</dd>
              </div>
              <div>
                <dt>Rajada máxima prevista</dt>
                <dd>
                  {today.windGust === null ? (
                    "Não informada"
                  ) : (
                    <>
                      {today.windGust} <small>km/h</small>
                    </>
                  )}
                </dd>
              </div>
            </dl>
          ) : null}

          {reasons.length > 0 ? (
            <div className="weather-hero-reasons" aria-label="Fatores considerados na avaliação">
              {reasons.map((reason) => (
                <span key={reason}>{reason}</span>
              ))}
            </div>
          ) : null}

          <div className="weather-hero-actions">
            <Link className="weather-hero-primary" href={presentation.primaryAction.href}>
              {presentation.primaryAction.label}
              <span aria-hidden="true">→</span>
            </Link>
            <Link className="weather-hero-secondary" href={presentation.secondaryAction.href}>
              {presentation.secondaryAction.label}
            </Link>
          </div>
        </div>

        <div
          className={`weather-hero-now${current.available ? "" : " is-unavailable"}`}
          aria-label={
            current.available
              ? "Medição atual da Embrapa em Pelotas"
              : "Medição atual da Embrapa indisponível"
          }
        >
          <div className="weather-hero-now-heading">
            <div>
              <span>Pelotas, RS</span>
              <small>{currentSourceMeta}</small>
            </div>
            <span className="weather-hero-live">
              <i aria-hidden="true" /> {current.available ? "Medição" : "Indisponível"}
            </span>
          </div>

          {current.available ? (
            <>
              <div className="weather-hero-visual">
                <div className="weather-hero-icon weather-hero-icon--station">
                  <StationObservationIcon />
                </div>

                <div className="weather-hero-temperature">
                  <strong>{metricValue(current.temperature, "°")}</strong>
                  <div>
                    <span>Medição da estação</span>
                    <small>
                      {current.feelsLike === null
                        ? "Sensação não informada"
                        : `Sensação de ${current.feelsLike}°`}
                    </small>
                  </div>
                </div>
              </div>

              <div className="weather-hero-metrics">
                <HeroMetric
                  icon="humidity"
                  label="Umidade"
                  value={metricValue(current.humidity, "%")}
                />
                <HeroMetric
                  icon="wind"
                  label="Vento medido"
                  value={metricValue(current.windSpeed, " km/h")}
                />
                <HeroMetric
                  icon="pressure"
                  label="Pressão"
                  value={metricValue(current.pressure, " hPa")}
                />
                <HeroMetric
                  icon="direction"
                  label="Direção"
                  value={current.windDirection ?? "Não informada"}
                />
              </div>
            </>
          ) : (
            <div className="weather-hero-current-unavailable">
              <div className="weather-hero-icon weather-hero-icon--station">
                <StationObservationIcon />
              </div>
              <strong>Medição atual indisponível</strong>
              <p>
                A Embrapa não forneceu uma leitura recente e verificável. Nenhum valor de previsão foi
                usado como condição atual.
              </p>
              <Link href="/estacao-embrapa-pelotas">Consultar a estação</Link>
            </div>
          )}
        </div>
      </div>

      <a
        className="weather-hero-credit"
        href={presentation.photoHref}
        target="_blank"
        rel="noreferrer"
      >
        {presentation.photoCredit}
      </a>
    </section>
  );
}
