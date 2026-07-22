import type { ReactNode } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WeatherNarrativeBand } from "@/components/weather-ai-summary";
import { WeatherNavigation } from "@/components/weather-navigation";
import { getWeatherAiSummaries } from "@/lib/weather-ai-summary";
import type { WeatherData } from "@/lib/weather-data";
import { getWeatherAdvisory } from "@/lib/weather-insights";

type HeroStatTone =
  | "weather"
  | "forecast"
  | "rain"
  | "wind"
  | "water"
  | "alerts"
  | "camera"
  | "station"
  | "history"
  | "information";

type HeroStat = {
  label: string;
  value: ReactNode;
  detail: string;
  ariaLabel?: string;
  tone?: HeroStatTone;
};

type ForecastPageShellProps = {
  weather: WeatherData;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  currentPath: string;
  heroStat?: HeroStat;
};

const contextualHeroStats: Record<string, HeroStat> = {
  alertas: {
    label: "Referência principal",
    value: "INMET",
    detail: "avisos oficiais primeiro",
    ariaLabel: "Avisos oficiais do INMET são a referência principal",
    tone: "alerts",
  },
  "situacao-hidrologica-pelotas": {
    label: "Ordem de leitura",
    value: "01",
    detail: "comece pela Estação Laranjal",
    ariaLabel: "Primeiro consulte a Estação Laranjal",
    tone: "water",
  },
  "nivel-da-lagoa-dos-patos-laranjal": {
    label: "Medição local",
    value: "Laranjal",
    detail: "nível da Lagoa dos Patos",
    ariaLabel: "Medição local da Lagoa dos Patos no Laranjal",
    tone: "water",
  },
  "estacao-embrapa-pelotas": {
    label: "Fonte observada",
    value: "Embrapa",
    detail: "estação meteorológica em Pelotas",
    ariaLabel: "Dados observados pela estação da Embrapa em Pelotas",
    tone: "station",
  },
  "historico-climatico-pelotas": {
    label: "Período analisado",
    value: "30",
    detail: "dias recentes",
    ariaLabel: "Histórico dos últimos 30 dias",
    tone: "history",
  },
  "cameras-ao-vivo-pelotas": {
    label: "Observação visual",
    value: "Ao vivo",
    detail: "quando a câmera está disponível",
    ariaLabel: "Observação visual por câmeras quando disponíveis",
    tone: "camera",
  },
  metodologia: {
    label: "Transparência",
    value: "Fontes",
    detail: "origem, limites e atualização",
    ariaLabel: "Fontes, limites e atualização das informações",
    tone: "information",
  },
};

export async function ForecastPageShell({
  weather,
  eyebrow,
  title,
  description,
  children,
  currentPath,
  heroStat,
}: ForecastPageShellProps) {
  const advisoryLevel = getWeatherAdvisory(weather).level;
  const topicKey = currentPath.split("/").filter(Boolean)[0] ?? "geral";
  const summaryPeriod = currentPath === "/tempo-hoje-pelotas"
    ? "today"
    : currentPath === "/tempo-amanha-pelotas"
      ? "tomorrow"
      : null;
  const summaries = summaryPeriod
    ? await getWeatherAiSummaries(weather)
    : null;
  const defaultWeatherStat: HeroStat = {
    label: `${weather.current.updatedAt} · ${weather.current.source.name}`,
    value: `${weather.current.temperature}°`,
    detail: weather.current.condition,
    ariaLabel: "Tempo agora em Pelotas",
    tone: "weather",
  };
  const resolvedHeroStat = heroStat ?? contextualHeroStats[topicKey] ?? defaultWeatherStat;

  return (
    <div className="site-shell site-shell--topic" data-topic={topicKey}>
      <SiteHeader advisoryLevel={advisoryLevel} />

      <main className="topic-page" id="conteudo-principal" tabIndex={-1}>
        <section className="topic-hero">
          <div>
            <span className="eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div
            className={`topic-hero-status topic-hero-status--${resolvedHeroStat.tone ?? "information"}`}
            aria-label={resolvedHeroStat.ariaLabel ?? `${resolvedHeroStat.label}: ${resolvedHeroStat.detail}`}
          >
            <span>{resolvedHeroStat.label}</span>
            <strong>{resolvedHeroStat.value}</strong>
            <small>{resolvedHeroStat.detail}</small>
          </div>
        </section>

        {summaryPeriod && summaries ? (
          <WeatherNarrativeBand
            period={summaryPeriod}
            narrative={summaryPeriod === "today" ? summaries.today : summaries.tomorrow}
          />
        ) : null}

        {children}

        <WeatherNavigation currentPath={currentPath} />
      </main>

      <SiteFooter source={weather.source} />
    </div>
  );
}
