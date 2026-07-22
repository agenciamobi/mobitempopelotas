import {
  Children,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { HomeEditorialDashboard as HomeEditorialDashboardBase } from "@/components/home-editorial-dashboard";
import { WeatherIcon } from "@/components/weather-icon";
import type { EmbrapaObservationData } from "@/lib/embrapa-observation";
import type { GuaibaObservationData } from "@/lib/guaiba-monitor";
import type { LagoonMonitoringNetworkData } from "@/lib/lagoon-monitoring-network";
import type { LaranjalLevelData } from "@/lib/laranjal-level";
import type {
  ForecastNarrative,
  WeatherAiSummaries,
} from "@/lib/weather-ai-summary";
import type { WeatherData } from "@/lib/weather-data";
import type { AdvisoryLevel } from "@/lib/weather-insights";
import {
  getWaterLevelVisualState,
  type WaterLevelVisualState,
  waterLevelStateClass,
} from "@/lib/water-level-state";

type HomeEditorialDashboardProps = {
  weather: WeatherData;
  summaries: WeatherAiSummaries;
  advisoryLevel?: AdvisoryLevel;
  observation: EmbrapaObservationData;
  laranjal: LaranjalLevelData;
  guaiba: GuaibaObservationData;
  lagoon: LagoonMonitoringNetworkData;
};

type SemanticContext = {
  currentHour: boolean;
  laranjalUnavailable: boolean;
  stationUnavailable: boolean;
  guaibaContext: boolean;
};

type WaterVisualStates = {
  laranjal: WaterLevelVisualState;
  guaiba: WaterLevelVisualState;
};

type StationVisualState = {
  city: string;
  name: string;
  state: WaterLevelVisualState;
};

type ElementProps = Record<string, unknown> & {
  children?: ReactNode;
  className?: string;
  title?: string;
};

const stationStateLabels: Record<string, string> = {
  "Acima do nível de atenção": "Acima da cota local",
  "Perto do nível de atenção": "Próximo da cota local",
  "Sem sinal de atenção": "Abaixo da cota local",
};

const editorialCopyReplacements: Record<string, string> = {
  "Próximos dias": "Tendência do tempo",
  "Previsão para os próximos dias": "Como o tempo deve evoluir",
  "Resumo para amanhã": "Destaque da previsão",
};

function formatNumber(value: number, maximumFractionDigits = 1) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits,
    minimumFractionDigits: value % 1 === 0 ? 0 : 1,
  }).format(value);
}

function buildTomorrowFallback(weather: WeatherData): ForecastNarrative | null {
  const tomorrow = weather.daily[1];
  if (!tomorrow) return null;

  const headline =
    tomorrow.icon === "storm" || tomorrow.windGust >= 50
      ? "Amanhã exige atenção ao tempo"
      : tomorrow.rainChance >= 70
        ? "Chuva deve marcar o dia de amanhã"
        : tomorrow.rainChance >= 35
          ? "Amanhã pode ter períodos de chuva"
          : tomorrow.icon === "sun"
            ? "Amanhã terá períodos de sol"
            : "Amanhã terá variação de nuvens";

  const rainDescription =
    tomorrow.rainChance >= 70
      ? `A chance de chuva é alta, com ${formatNumber(tomorrow.precipitation)} mm previstos.`
      : tomorrow.rainChance >= 35
        ? `Há possibilidade de chuva, com ${formatNumber(tomorrow.precipitation)} mm previstos.`
        : "A chance de chuva é baixa e não há volume relevante indicado.";

  return {
    headline,
    summary: `${rainDescription} A temperatura deve variar entre ${tomorrow.min}° e ${tomorrow.max}°, com rajadas de até ${tomorrow.windGust} km/h.`,
  };
}

function TomorrowForecastSummary({
  weather,
  narrative,
}: {
  weather: WeatherData;
  narrative: ForecastNarrative | null;
}) {
  const tomorrow = weather.daily[1];
  const resolvedNarrative = narrative ?? buildTomorrowFallback(weather);
  if (!tomorrow || !resolvedNarrative) return null;

  return (
    <article
      className="home-next-days__tomorrow-summary"
      aria-labelledby="home-tomorrow-summary-title"
    >
      <div>
        <span>Destaque da previsão</span>
        <small>
          {tomorrow.weekday} · {tomorrow.date}
        </small>
      </div>
      <section>
        <h3 id="home-tomorrow-summary-title">{resolvedNarrative.headline}</h3>
        <p>{resolvedNarrative.summary}</p>
      </section>
    </article>
  );
}

function getTextContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(getTextContent).join("");
  }

  if (isValidElement<ElementProps>(node)) {
    return getTextContent(node.props.children);
  }

  return "";
}

function hasClass(className: string, token: string) {
  return className.split(/\s+/).includes(token);
}

function appendClass(className: string, token: string) {
  if (hasClass(className, token)) return className;
  return className ? `${className} ${token}` : token;
}

function normalizeTextNode(node: ReactNode): ReactNode {
  if (typeof node !== "string") return node;

  const trimmed = node.trim();
  if (trimmed === "por volta de Agora") return "neste momento";
  if (editorialCopyReplacements[trimmed]) {
    return node.replace(trimmed, editorialCopyReplacements[trimmed]);
  }

  return node;
}

function transformDashboardNode(
  node: ReactNode,
  context: SemanticContext,
  waterStates: WaterVisualStates,
  stationStates: StationVisualState[],
  tomorrowSummary: ReactNode,
): ReactNode {
  if (typeof node === "string") return normalizeTextNode(node);

  if (!isValidElement<ElementProps>(node)) {
    return node;
  }

  const props = node.props;
  const className = typeof props.className === "string" ? props.className : "";
  const isDomElement = typeof node.type === "string";
  const nextContext: SemanticContext = {
    currentHour:
      context.currentHour ||
      (node.type === "article" && hasClass(className, "is-current")),
    laranjalUnavailable:
      context.laranjalUnavailable ||
      (node.type === "article" &&
        hasClass(className, "home-water-focus") &&
        hasClass(className, "is-unavailable")),
    stationUnavailable:
      context.stationUnavailable ||
      (node.type === "article" && hasClass(className, "is-unavailable")),
    guaibaContext:
      context.guaibaContext || hasClass(className, "home-water-context"),
  };

  if (node.type === WeatherIcon && nextContext.currentHour) {
    return cloneElement(node as ReactElement<ElementProps>, {
      title: "Tempo agora",
    });
  }

  if (
    isDomElement &&
    node.type === "div" &&
    hasClass(className, "home-hourly-story__topline") &&
    nextContext.currentHour
  ) {
    const [timeLabel] = Children.toArray(props.children);
    return cloneElement(
      node as ReactElement<ElementProps>,
      undefined,
      transformDashboardNode(
        timeLabel,
        nextContext,
        waterStates,
        stationStates,
        tomorrowSummary,
      ),
    );
  }

  if (
    isDomElement &&
    node.type === "div" &&
    hasClass(className, "home-water-focus__reading") &&
    nextContext.laranjalUnavailable
  ) {
    return cloneElement(
      node as ReactElement<ElementProps>,
      undefined,
      <strong>Sem leitura</strong>,
    );
  }

  if (
    isDomElement &&
    node.type === "p" &&
    hasClass(className, "home-water-trend") &&
    hasClass(className, "is-unknown")
  ) {
    return cloneElement(
      node as ReactElement<ElementProps>,
      undefined,
      "Tendência indisponível",
    );
  }

  if (
    isDomElement &&
    node.type === "span" &&
    hasClass(className, "is-unknown")
  ) {
    return cloneElement(
      node as ReactElement<ElementProps>,
      undefined,
      "Tendência indisponível",
    );
  }

  const textContent = getTextContent(props.children);
  const normalizedText = textContent.trim();

  if (
    isDomElement &&
    node.type === "small" &&
    !nextContext.guaibaContext &&
    stationStateLabels[normalizedText]
  ) {
    return cloneElement(
      node as ReactElement<ElementProps>,
      undefined,
      stationStateLabels[normalizedText],
    );
  }

  const hasMissingValue = textContent.includes("—");

  if (isDomElement && hasMissingValue) {
    if (node.type === "dd") {
      return cloneElement(
        node as ReactElement<ElementProps>,
        undefined,
        "Indisponível",
      );
    }

    if (node.type === "strong" || node.type === "b") {
      return cloneElement(
        node as ReactElement<ElementProps>,
        undefined,
        "Sem leitura",
      );
    }

    if (node.type === "span") {
      const label = textContent.includes("Sensação")
        ? "Sensação indisponível"
        : "Indisponível";
      return cloneElement(node as ReactElement<ElementProps>, undefined, label);
    }
  }

  const transformedChildren = Children.map(props.children, (child) =>
    transformDashboardNode(
      child,
      nextContext,
      waterStates,
      stationStates,
      tomorrowSummary,
    ),
  );

  let normalizedClassName = className;

  if (hasClass(className, "home-water-focus")) {
    normalizedClassName = appendClass(
      normalizedClassName,
      waterLevelStateClass(waterStates.laranjal),
    );
  }

  if (hasClass(className, "home-water-context")) {
    normalizedClassName = appendClass(
      normalizedClassName,
      waterLevelStateClass(waterStates.guaiba),
    );
  }

  if (isDomElement && node.type === "article" && className.includes("risk-")) {
    const stationState = stationStates.find(
      (station) =>
        normalizedText.includes(station.city) &&
        normalizedText.includes(station.name),
    );

    if (stationState) {
      normalizedClassName = appendClass(
        normalizedClassName,
        waterLevelStateClass(stationState.state),
      );
    }
  }

  const nextProps =
    normalizedClassName !== className
      ? { className: normalizedClassName || undefined }
      : undefined;

  if (
    isDomElement &&
    node.type === "div" &&
    hasClass(className, "home-next-days") &&
    tomorrowSummary
  ) {
    return cloneElement(
      node as ReactElement<ElementProps>,
      nextProps,
      transformedChildren,
      tomorrowSummary,
    );
  }

  return cloneElement(
    node as ReactElement<ElementProps>,
    nextProps,
    transformedChildren,
  );
}

export function HomeEditorialDashboard({
  summaries,
  ...dashboardProps
}: HomeEditorialDashboardProps) {
  const dashboard = HomeEditorialDashboardBase(dashboardProps);
  const waterStates: WaterVisualStates = {
    laranjal: getWaterLevelVisualState({
      rate: dashboardProps.laranjal.trendCmPerHour,
      available:
        dashboardProps.laranjal.status !== "unavailable" &&
        dashboardProps.laranjal.currentLevel !== null,
    }),
    guaiba: getWaterLevelVisualState({
      rate: dashboardProps.guaiba.trendCmPerHour,
      available:
        dashboardProps.guaiba.status !== "unavailable" &&
        dashboardProps.guaiba.currentLevel !== null,
      currentLevel: dashboardProps.guaiba.currentLevel,
      threshold: dashboardProps.guaiba.floodReference,
    }),
  };
  const stationStates = dashboardProps.lagoon.observations.map((station) => ({
    city: station.station.city,
    name: station.station.name,
    state: getWaterLevelVisualState({
      rate: station.trendCmPerHour,
      available:
        station.status !== "unavailable" && station.currentLevelCm !== null,
      currentLevel: station.currentLevelCm,
      threshold: station.floodLevelCm,
    }),
  }));
  const tomorrowSummary = (
    <TomorrowForecastSummary
      weather={dashboardProps.weather}
      narrative={summaries.tomorrow}
    />
  );

  return transformDashboardNode(
    dashboard,
    {
      currentHour: false,
      laranjalUnavailable: false,
      stationUnavailable: false,
      guaibaContext: false,
    },
    waterStates,
    stationStates,
    tomorrowSummary,
  );
}
