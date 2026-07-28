import { Children, cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

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

type HomeEditorialDashboardProps = {
  weather: WeatherData;
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

const stationStateLabels: Record<string, string> = {
  "Acima do nível de atenção": "Acima da cota local",
  "Perto do nível de atenção": "Próximo da cota local",
  "Sem sinal de atenção": "Abaixo da cota local",
};

const editorialCopyReplacements: Record<string, string> = {
  "Próximos dias": "Tendência do tempo",
  "Previsão para os próximos dias": "Como o tempo deve evoluir na semana",
  "Veja como o tempo deve mudar ao longo do dia":
    "Veja como o tempo deve mudar nas próximas horas",
};

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
      transformDashboardNode(timeLabel, nextContext, waterStates, stationStates),
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
    transformDashboardNode(child, nextContext, waterStates, stationStates),
  );

  let normalizedClassName = className;
  let normalizedId = typeof props.id === "string" ? props.id : undefined;

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

  if (isDomElement && node.type === "section" && hasClass(className, "home-map-story")) {
    normalizedId = "regiao";
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
  const idChanged = normalizedId !== props.id;
  const nextProps =
    classChanged || idChanged
      ? {
          ...(classChanged ? { className: normalizedClassName || undefined } : {}),
          ...(idChanged ? { id: normalizedId } : {}),
        }
      : undefined;

  return cloneElement(node as ReactElement<ElementProps>, nextProps, transformedChildren);
}

export function HomeEditorialDashboard(dashboardProps: HomeEditorialDashboardProps) {
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
    guaibaReferenceLabel: dashboardProps.guaiba.station,
  };
  const stationStates = dashboardProps.lagoon.observations.map((station) => ({
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
  );
}
