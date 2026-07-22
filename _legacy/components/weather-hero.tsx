import Link from "next/link";
import type { ReactNode } from "react";
import { WeatherIcon } from "@/components/weather-icon";
import type { CppmetForecastItem } from "@/lib/cppmet-forecast";
import type { WeatherData } from "@/lib/weather-data";
import {
  getWeatherAdvisory,
  type AdvisoryLevel,
} from "@/lib/weather-insights";

type WeatherHeroProps = {
  weather: WeatherData;
  advisoryLevel?: AdvisoryLevel;
  officialAlertCount?: number;
  cppmetForecast?: {
    item: CppmetForecastItem;
    sourceUrl: string;
  } | null;
};

type HeroMetricIconName = "humidity" | "wind" | "gust" | "visibility";

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
      "Consulte a temperatura, a chuva e o vento agora e veja a previsão para as próximas horas.",
    primaryAction: {
      href: "/tempo-hoje-pelotas",
      label: "Ver previsão de hoje",
    },
    secondaryAction: {
      href: "/previsao-7-dias-pelotas",
      label: "Ver previsão para 7 dias",
    },
    photoHref:
      "https://commons.wikimedia.org/wiki/File:Amanhecer_na_Praia_do_Laranjal.jpg",
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
    photoHref:
      "https://commons.wikimedia.org/wiki/File:Sunset_over_Calm_Lake.jpg",
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

function getDynamicTitle(
  weather: WeatherData,
  level: AdvisoryLevel,
  cppmetSummary: string | null,
) {
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
    if ((today?.windGust ?? weather.current.windGust) >= 50 || has(/vento|rajada/)) {
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

  if ((today?.max ?? weather.current.temperature) <= 15) {
    return {
      title: "O frio permanece em Pelotas.",
      highlightedTitle: "Confira mínima, máxima e sensação.",
    };
  }

  if ((today?.max ?? weather.current.temperature) >= 30) {
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
  if (current.source.kind === "observation") {
    const updateTime = current.source.observedAt
      ? `Atualizado às ${current.source.observedAt}`
      : "Dados atualizados";

    return `${updateTime} · ${current.source.name}`;
  }

  return `${current.updatedAt} · ${current.source.name}`;
}

function getOfficialAlertReason(count: number) {
  return count === 1
    ? "Pelotas está incluída em um aviso oficial do INMET"
    : `Pelotas está incluída em ${count} avisos oficiais do INMET`;
}

function HeroMetricIcon({ name }: { name: HeroMetricIconName }) {
  const paths = {
    humidity: (
      <path d="M12 3.2S6.8 9.3 6.8 13.7a5.2 5.2 0 0 0 10.4 0C17.2 9.3 12 3.2 12 3.2Z" />
    ),
    wind: (
      <path d="M3 8h10.5c3.8 0 3.8-5.5.2-5.5-1.9 0-2.9 1-2.9 2.8M3 13h15.5c3.8 0 3.8 6.5.2 6.5-1.9 0-2.9-1-2.9-2.8M3 18h7.5" />
    ),
    gust: (
      <path d="M4 7.5h10.8M4 12h16M4 16.5h12.5M17.5 5.2l2.5 2.3-2.5 2.3" />
    ),
    visibility: (
      <path d="M2.5 12s3.4-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.4 5.5-9.5 5.5S2.5 12 2.5 12Zm9.5-2.8a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z" />
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
    advisory.level === "normal"
      ? []
      : advisory.reasons.map(capitalizeSentence);
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
      <div
        className="weather-hero-orbit weather-hero-orbit--one"
        aria-hidden="true"
      />
      <div
        className="weather-hero-orbit weather-hero-orbit--two"
        aria-hidden="true"
      />

      <div className="weather-hero-content">
        <div className="weather-hero-copy">
          <h1 id="weather-hero-title">
            {dynamicTitle.title}{" "}
            <span>{dynamicTitle.highlightedTitle}</span>
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
            <dl
              className="weather-hero-daily-facts"
              aria-label="Resumo da previsão de hoje"
            >
              <div>
                <dt>Máx. e mín. previstas</dt>
                <dd>
                  {today.max}° <small>/ {today.min}°</small>
                </dd>
              </div>
              <div>
                <dt>Chance máxima de chuva</dt>
                <dd>{today.rainChance}%</dd>
              </div>
              <div>
                <dt>Rajada máxima prevista</dt>
                <dd>
                  {today.windGust} <small>km/h</small>
                </dd>
              </div>
            </dl>
          ) : null}

          {reasons.length > 0 ? (
            <div
              className="weather-hero-reasons"
              aria-label="Fatores considerados na avaliação"
            >
              {reasons.map((reason) => (
                <span key={reason}>{reason}</span>
              ))}
            </div>
          ) : null}

          <div className="weather-hero-actions">
            <Link
              className="weather-hero-primary"
              href={presentation.primaryAction.href}
            >
              {presentation.primaryAction.label}
              <span aria-hidden="true">→</span>
            </Link>
            <Link
              className="weather-hero-secondary"
              href={presentation.secondaryAction.href}
            >
              {presentation.secondaryAction.label}
            </Link>
          </div>
        </div>

        <div className="weather-hero-now" aria-label="Tempo agora em Pelotas">
          <div className="weather-hero-now-heading">
            <div>
              <span>Pelotas, RS</span>
              <small>{currentSourceMeta}</small>
            </div>
            <span className="weather-hero-live">
              <i aria-hidden="true" /> Agora
            </span>
          </div>

          <div className="weather-hero-visual">
            <div className="weather-hero-icon">
              <WeatherIcon name={current.icon} title={current.condition} />
            </div>

            <div className="weather-hero-temperature">
              <strong>{current.temperature}°</strong>
              <div>
                <span>{current.condition}</span>
                <small>Sensação de {current.feelsLike}°</small>
              </div>
            </div>
          </div>

          <div className="weather-hero-metrics">
            <HeroMetric
              icon="humidity"
              label="Umidade"
              value={`${current.humidity}%`}
            />
            <HeroMetric
              icon="wind"
              label="Vento"
              value={`${current.windSpeed} km/h`}
            />
            <HeroMetric
              icon="gust"
              label="Rajada"
              value={`${current.windGust} km/h`}
            />
            <HeroMetric
              icon="visibility"
              label="Visibilidade"
              value={`${current.visibility} km`}
            />
          </div>
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
