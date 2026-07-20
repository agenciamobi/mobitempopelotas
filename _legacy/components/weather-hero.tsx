import Link from "next/link";
import type { ReactNode } from "react";
import { WeatherIcon } from "@/components/weather-icon";
import type { WeatherData } from "@/lib/weather-data";
import {
  getWeatherAdvisory,
  type AdvisoryLevel,
  type WeatherAdvisory,
} from "@/lib/weather-insights";

type WeatherHeroProps = {
  weather: WeatherData;
};

type HeroMetricIconName = "humidity" | "wind" | "gust" | "visibility";

type HeroPresentation = {
  badge: string;
  kicker: string;
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
    badge: "Informações atualizadas",
    kicker: "Agora em Pelotas",
    title: "Entenda o tempo.",
    highlightedTitle: "Planeje o seu dia.",
    description:
      "Veja como está o tempo agora, o que muda nas próximas horas e se há chuva, vento forte ou avisos para Pelotas.",
    primaryAction: {
      href: "/tempo-hoje-pelotas",
      label: "Ver o tempo de hoje",
    },
    secondaryAction: {
      href: "/alertas",
      label: "Ver avisos oficiais",
    },
    photoHref:
      "https://commons.wikimedia.org/wiki/File:Amanhecer_na_Praia_do_Laranjal.jpg",
    photoCredit: "Foto: Sebastian2112 / CC BY-SA 4.0",
  },
  attention: {
    badge: "Atenção nas próximas horas",
    kicker: "Atenção em Pelotas",
    title: "O tempo pode mudar.",
    highlightedTitle: "Acompanhe as próximas horas.",
    description:
      "A chuva e o vento podem aumentar. Veja quando isso pode acontecer e acompanhe os avisos oficiais.",
    primaryAction: {
      href: "/alertas",
      label: "Ver o que pode acontecer",
    },
    secondaryAction: {
      href: "/tempo-hoje-pelotas",
      label: "Ver previsão completa",
    },
    photoHref:
      "https://commons.wikimedia.org/wiki/File:Sunset_over_Calm_Lake.jpg",
    photoCredit: "Foto: Kane Morley / CC BY-SA 4.0",
  },
  warning: {
    badge: "Atenção redobrada",
    kicker: "Atenção em Pelotas",
    title: "O tempo exige cuidado.",
    highlightedTitle: "Redobre a atenção.",
    description:
      "Há chance de temporal, chuva forte ou vento intenso. Confira os horários de maior risco e siga as orientações oficiais.",
    primaryAction: {
      href: "/alertas",
      label: "Ver avisos e orientações",
    },
    secondaryAction: {
      href: "/tempo-hoje-pelotas",
      label: "Ver previsão completa",
    },
    photoHref: "https://commons.wikimedia.org/wiki/File:Heavy_Rain.jpg",
    photoCredit: "Foto: Pridatko Oleksandr / domínio público",
  },
} satisfies Record<AdvisoryLevel, HeroPresentation>;

function getHeroPresentation(advisory: WeatherAdvisory): HeroPresentation {
  const presentation = heroPresentationByLevel[advisory.level];

  if (advisory.level === "normal") return presentation;

  return {
    ...presentation,
    badge: advisory.eyebrow,
  };
}

function capitalizeSentence(value: string) {
  return value.replace(/^./, (character) => character.toUpperCase());
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

function HeroMetricIcon({ name }: { name: HeroMetricIconName }) {
  const paths = {
    humidity: <path d="M12 3.2S6.8 9.3 6.8 13.7a5.2 5.2 0 0 0 10.4 0C17.2 9.3 12 3.2 12 3.2Z" />,
    wind: <path d="M3 8h10.5c3.8 0 3.8-5.5.2-5.5-1.9 0-2.9 1-2.9 2.8M3 13h15.5c3.8 0 3.8 6.5.2 6.5-1.9 0-2.9-1-2.9-2.8M3 18h7.5" />,
    gust: <path d="M4 7.5h10.8M4 12h16M4 16.5h12.5M17.5 5.2l2.5 2.3-2.5 2.3" />,
    visibility: <path d="M2.5 12s3.4-5.5 9.5-5.5 9.5 5.5 9.5 5.5-3.4 5.5-9.5 5.5S2.5 12 2.5 12Zm9.5-2.8a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z" />,
  } satisfies Record<HeroMetricIconName, ReactNode>;

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
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

export function WeatherHero({ weather }: WeatherHeroProps) {
  const { current } = weather;
  const advisory = getWeatherAdvisory(weather);
  const presentation = getHeroPresentation(advisory);
  const reasons = advisory.level === "normal" ? [] : advisory.reasons.slice(0, 2);
  const currentSourceMeta = getCurrentSourceMeta(current);

  return (
    <section
      className={`weather-hero weather-hero--${advisory.level}`}
      aria-labelledby="weather-hero-title"
    >
      <div className="weather-hero-photo" aria-hidden="true" />
      <div className="weather-hero-overlay" aria-hidden="true" />
      <div className="weather-hero-orbit weather-hero-orbit--one" aria-hidden="true" />
      <div className="weather-hero-orbit weather-hero-orbit--two" aria-hidden="true" />

      <div className="weather-hero-content">
        <div className="weather-hero-copy">
          <span className={`weather-hero-status weather-hero-status--${advisory.level}`}>
            <i aria-hidden="true" />
            {presentation.badge}
          </span>

          <p className="weather-hero-kicker">{presentation.kicker}</p>
          <h1 id="weather-hero-title">
            {presentation.title} <span>{presentation.highlightedTitle}</span>
          </h1>
          <p className="weather-hero-description">{presentation.description}</p>

          {reasons.length > 0 ? (
            <div className="weather-hero-reasons" aria-label="Por que é preciso atenção">
              {reasons.map((reason) => (
                <span key={reason}>{capitalizeSentence(reason)}</span>
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

        <div className="weather-hero-now" aria-label="Tempo agora em Pelotas">
          <div className="weather-hero-now-heading">
            <div>
              <span>Pelotas, RS</span>
              <small>{currentSourceMeta}</small>
            </div>
            <span className="weather-hero-live"><i aria-hidden="true" /> Agora</span>
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
            <HeroMetric icon="humidity" label="Umidade" value={`${current.humidity}%`} />
            <HeroMetric icon="wind" label="Vento" value={`${current.windSpeed} km/h`} />
            <HeroMetric icon="gust" label="Vento mais forte" value={`${current.windGust} km/h`} />
            <HeroMetric icon="visibility" label="Até onde se vê" value={`${current.visibility} km`} />
          </div>
        </div>
      </div>

      <div className="weather-hero-scroll">
        <span>Veja a previsão abaixo</span>
        <i aria-hidden="true">↓</i>
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
