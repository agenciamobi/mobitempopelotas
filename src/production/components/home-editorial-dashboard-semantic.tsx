import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";

import { HomeEditorialDashboard as HomeEditorialDashboardBase } from "@/production/components/home-editorial-dashboard";
import { WeatherIcon } from "@/production/components/weather-icon";
import type { EmbrapaObservationData } from "@/production/lib/embrapa-observation";
import type { GuaibaObservationData } from "@/production/lib/guaiba-monitor";
import type { LagoonMonitoringNetworkData } from "@/production/lib/lagoon-monitoring-network";
import type { LaranjalLevelData } from "@/production/lib/laranjal-level";
import type { WeatherData } from "@/production/lib/weather-data";
import type { AdvisoryLevel } from "@/production/lib/weather-insights";
import {
  getWaterLevelVisualState,
  type WaterLevelVisualState,
  waterLevelStateClass,
} from "@/production/lib/water-level-state";

import "./home-editorial-dashboard-direction.css";

type HomeEditorialDashboardProps = {
  weather: WeatherData;
  advisoryLevel?: AdvisoryLevel;
  observation: EmbrapaObservationData;
  laranjal: LaranjalLevelData;
  guaiba: GuaibaObservationData;
  lagoon: LagoonMonitoringNetworkData;
  afterForecast?: ReactNode;
};

type SemanticContext = {
  currentHour: boolean;
  laranjalUnavailable: boolean;
  stationUnavailable: boolean;
  guaibaContext: boolean;
  waterFooter: boolean;
};

type WaterVisualStates = {
  laranjal: WaterLevelVisualState;
  guaiba: WaterLevelVisualState;
  guaibaReferenceLabel: string;
};

type StationVisualState = {
  city: string;
  name: string;
  state: WaterLevelVisualState;
};

type ElementProps = Record<string, unknown> & {
  children?: ReactNode;
  className?: string;
  id?: string;
  title?: string;
};

const HOME_LAGOON_STATION_PRIORITY = ["sao-lourenco-do-sul", "furg-ccmar", "itapua"] as const;

const stationStateLabels: Record<string, string> = {
  "Acima do nível de atenção": "Acima da cota local",
  "Perto do nível de atenção": "Próximo da cota local",
  "Sem sinal de atenção": "Abaixo da cota local",
};

const editorialCopyReplacements: Record<string, string> = {
  "Próximos dias": "Tendência do tempo",
  "Previsão para os próximos dias": "Como o tempo deve evoluir na semana",
  "Veja como o tempo deve mudar ao longo do dia": "Próximas horas em Pelotas",
};

function summarizeLagoonForHome(lagoon: LagoonMonitoringNetworkData): LagoonMonitoringNetworkData {
  const prioritized = HOME_LAGOON_STATION_PRIORITY.flatMap((stationId) =>
    lagoon.observations.filter((observation) => observation.station.id === stationId),
  );
  const prioritizedIds = new Set(prioritized.map((observation) => observation.station.id));
  const fallback = lagoon.observations.filter(
    (observation) => !prioritizedIds.has(observation.station.id),
  );

  return {
    ...lagoon,
    observations: [...prioritized, ...fallback].slice(0, 3),
  };
}

function WaterTrendLegend() {
  return (
    <div
      className="home-water-trend-legend"
      role="list"
      aria-label="Legenda das tendências do nível da água"
    >
      <span className="is-falling" role="listitem">
        <i aria-hidden="true" />
        Baixando
      </span>
      <span className="is-rising" role="listitem">
        <i aria-hidden="true" />
        Subindo
      </span>
      <span className="is-stable" role="listitem">
        <i aria-hidden="true" />
        Estável
      </span>
      <small>As cores indicam a direção da tendência; cada local usa uma régua própria.</small>
    </div>
  );
}

function getTextContent(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getTextContent).join("");
  if (isValidElement<ElementProps>(node)) return getTextContent(node.props.children);
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
  afterForecast: ReactNode,
): ReactNode {
  if (typeof node === "string") return normalizeTextNode(node);
  if (!isValidElement<ElementProps>(node)) return node;

  const props = node.props;
  const className = typeof props.className === "string" ? props.className : "";
  const isDomElement = typeof node.type === "string";

  if (isDomElement && node.type === "section" && hasClass(className, "home-explore-story")) {
    return null;
  }

  const nextContext: SemanticContext = {
    currentHour:
      context.currentHour || (node.type === "article" && hasClass(className, "is-current")),
    laranjalUnavailable:
      context.laranjalUnavailable ||
      (node.type === "article" &&
        hasClass(className, "home-water-focus") &&
        hasClass(className, "is-unavailable")),
    stationUnavailable:
      context.stationUnavailable ||
      (node.type === "article" && hasClass(className, "is-unavailable")),
    guaibaContext: context.guaibaContext || hasClass(className, "home-water-context"),
    waterFooter: context.waterFooter || hasClass(className, "home-water-story__footer"),
  };

  if (node.type === WeatherIcon && nextContext.currentHour) {
    return cloneElement(node as ReactElement<ElementProps>, { title: "Tempo agora" });
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
      transformDashboardNode(timeLabel, nextContext, waterStates, stationStates, afterForecast),
    );
  }

  if (
    isDomElement &&
    node.type === "div" &&
    hasClass(className, "home-water-focus__reading") &&
    nextContext.laranjalUnavailable
  ) {
    return cloneElement(node as ReactElement<ElementProps>, undefined, <strong>Sem leitura</strong>);
  }

  if (
    isDomElement &&
    node.type === "p" &&
    hasClass(className, "home-water-trend") &&
    hasClass(className, "is-unknown")
  ) {
    return cloneElement(node as ReactElement<ElementProps>, undefined, "Tendência indisponível");
  }

  if (isDomElement && node.type === "span" && hasClass(className, "is-unknown")) {
    return cloneElement(node as ReactElement<ElementProps>, undefined, "Tendência indisponível");
  }

  const textContent = getTextContent(props.children);
  const normalizedText = textContent.trim();

  if (
    isDomElement &&
    node.type === "div" &&
    normalizedText.startsWith("Vento mais forte hoje")
  ) {
    return null;
  }

  if (
    isDomElement &&
    node.type === "span" &&
    nextContext.guaibaContext &&
    normalizedText === "Referência adicional"
  ) {
    return cloneElement(
      node as ReactElement<ElementProps>,
      undefined,
      waterStates.guaibaReferenceLabel,
    );
  }

  if (
    isDomElement &&
    node.type === "p" &&
    nextContext.waterFooter &&
    normalizedText.startsWith("Compare a tendência de cada estação")
  ) {
    return <WaterTrendLegend />;
  }

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
      return cloneElement(node as ReactElement<ElementProps>, undefined, "Indisponível");
    }

    if (node.type === "strong" || node.type === "b") {
      return cloneElement(node as ReactElement<ElementProps>, undefined, "Sem leitura");
    }

    if (node.type === "span") {
      const label = textContent.includes("Sensação") ? "Sensação indisponível" : "Indisponível";
      return cloneElement(node as ReactElement<ElementProps>, undefined, label);
    }
  }

  const transformedChildren = Children.map(props.children, (child) =>
    transformDashboardNode(child, nextContext, waterStates, stationStates, afterForecast),
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
      (station) => normalizedText.includes(station.city) && normalizedText.includes(station.name),
    );

    if (stationState) {
      normalizedClassName = appendClass(
        normalizedClassName,
        waterLevelStateClass(stationState.state),
      );
    }
  }

  const classChanged = normalizedClassName !== className;
  const nextProps = classChanged ? { className: normalizedClassName || undefined } : undefined;
  const transformedElement = cloneElement(
    node as ReactElement<ElementProps>,
    nextProps,
    transformedChildren,
  );

  if (
    afterForecast &&
    isDomElement &&
    node.type === "section" &&
    hasClass(className, "home-story--forecast")
  ) {
    return (
      <Fragment key="forecast-with-official-source">
        {transformedElement}
        {afterForecast}
      </Fragment>
    );
  }

  return transformedElement;
}

export function HomeEditorialDashboard(dashboardProps: HomeEditorialDashboardProps) {
  const { afterForecast = null, ...baseProps } = dashboardProps;
  const homeLagoon = summarizeLagoonForHome(baseProps.lagoon);
  const dashboard = HomeEditorialDashboardBase({ ...baseProps, lagoon: homeLagoon });
  const waterStates: WaterVisualStates = {
    laranjal: getWaterLevelVisualState({
      rate: baseProps.laranjal.trendCmPerHour,
      available:
        baseProps.laranjal.status !== "unavailable" && baseProps.laranjal.currentLevel !== null,
    }),
    guaiba: getWaterLevelVisualState({
      rate: baseProps.guaiba.trendCmPerHour,
      available:
        baseProps.guaiba.status !== "unavailable" && baseProps.guaiba.currentLevel !== null,
      currentLevel: baseProps.guaiba.currentLevel,
      threshold: baseProps.guaiba.floodReference,
    }),
    guaibaReferenceLabel: baseProps.guaiba.station,
  };
  const stationStates = homeLagoon.observations.map((station) => ({
    city: station.station.city,
    name: station.station.name,
    state: getWaterLevelVisualState({
      rate: station.trendCmPerHour,
      available: station.status !== "unavailable" && station.currentLevelCm !== null,
      currentLevel: station.currentLevelCm,
      threshold: station.floodLevelCm,
    }),
  }));

  return transformDashboardNode(
    dashboard,
    {
      currentHour: false,
      laranjalUnavailable: false,
      stationUnavailable: false,
      guaibaContext: false,
      waterFooter: false,
    },
    waterStates,
    stationStates,
    afterForecast,
  );
}
