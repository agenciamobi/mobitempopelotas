import { getGuaibaObservation } from "@/lib/hydrology/guaiba.functions";
import { getLaranjalLevelData } from "@/lib/hydrology/laranjal-level.functions";
import { getRedemetOverview } from "@/lib/redemet/redemet.functions";
import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";

import { getActiveMaintenanceWindows } from "./data-status-storage.server";
import type {
  DataStatusOverview,
  ServiceCategory,
  ServiceState,
  ServiceStatus,
} from "./data-status.types";

const weatherSourceMeta = [
  {
    key: "embrapa",
    name: "Observação meteorológica local",
    provider: "Embrapa Clima Temperado",
    category: "Meteorologia e avisos" as const,
  },
  {
    key: "inmet",
    name: "Avisos meteorológicos oficiais",
    provider: "INMET",
    category: "Meteorologia e avisos" as const,
  },
  {
    key: "cppmet",
    name: "Previsão e contexto regional",
    provider: "CPPMet / UFPel",
    category: "Meteorologia e avisos" as const,
  },
  {
    key: "open-meteo",
    name: "Previsão numérica principal",
    provider: "Open-Meteo",
    category: "Meteorologia e avisos" as const,
  },
  {
    key: "met-norway",
    name: "Previsão numérica complementar",
    provider: "MET Norway",
    category: "Meteorologia e avisos" as const,
  },
] as const;

export function detailForState(state: ServiceState) {
  if (state === "operational") return "A fonte respondeu normalmente na última verificação.";
  if (state === "partial") {
    return "A fonte respondeu, mas há atraso ou parte das informações não está atualizada.";
  }
  if (state === "maintenance") return "Serviço em manutenção programada pelo Tempo Pelotas.";
  if (state === "implementation") {
    return "Acesso concedido; integração pública ainda em implantação e validação.";
  }
  return "Não foi possível obter dados desta fonte na última verificação.";
}

function stateFromHealth(status: "live" | "partial" | "unavailable" | "stale", usable: boolean): ServiceState {
  if (status === "unavailable" || !usable) return "offline";
  if (status === "partial" || status === "stale") return "partial";
  return "operational";
}

function stateFromHydrology(status: "live" | "stale" | "unavailable"): ServiceState {
  if (status === "unavailable") return "offline";
  if (status === "stale") return "partial";
  return "operational";
}

function stateFromLayer(configured: boolean, available: boolean): ServiceState {
  return configured && available ? "operational" : "offline";
}

export function overallState(services: ServiceStatus[]): DataStatusOverview["overall"] {
  const runtimeServices = services.filter(
    (service) => service.state !== "implementation" && service.state !== "maintenance",
  );
  const offline = runtimeServices.filter((service) => service.state === "offline").length;
  const partial = runtimeServices.filter((service) => service.state === "partial").length;

  if (runtimeServices.length > 0 && offline === runtimeServices.length) return "offline";
  if (offline > 0 || partial > 0) return "partial";
  return "operational";
}

function unavailableWeatherServices(checkedAt: string): ServiceStatus[] {
  return weatherSourceMeta.map((meta) => ({
    id: `weather-${meta.key}`,
    name: meta.name,
    provider: meta.provider,
    category: meta.category,
    state: "offline",
    detail: detailForState("offline"),
    checkedAt,
  }));
}

function unavailableRedemetServices(checkedAt: string): ServiceStatus[] {
  return [
    ["redemet-radar", "Radar meteorológico", "REDEMET / DECEA"],
    ["redemet-satellite", "Imagem de satélite", "REDEMET / DECEA"],
    ["redemet-stsc", "Ocorrências de trovoadas — STSC", "REDEMET / DECEA"],
    ["inmet-satellite", "Satélite meteorológico complementar", "INMET"],
  ].map(([id, name, provider]) => ({
    id,
    name,
    provider,
    category: "Radar e satélite" as ServiceCategory,
    state: "offline" as ServiceState,
    detail: detailForState("offline"),
    checkedAt,
  }));
}

function applyMaintenanceWindows(services: ServiceStatus[], maintenance: Awaited<ReturnType<typeof getActiveMaintenanceWindows>>) {
  if (maintenance.length === 0) return services;
  const byService = new Map(maintenance.map((window) => [window.serviceId, window]));

  return services.map((service) => {
    const window = byService.get(service.id);
    if (!window) return service;
    return {
      ...service,
      state: "maintenance" as const,
      detail: window.message || window.title,
    };
  });
}

export async function collectDataStatus(): Promise<DataStatusOverview> {
  const checkedAt = new Date().toISOString();
  const [weatherResult, redemetResult, laranjalResult, guaibaResult] = await Promise.allSettled([
    getWeatherIntelligence(),
    getRedemetOverview(),
    getLaranjalLevelData(),
    getGuaibaObservation(),
  ]);

  const services: ServiceStatus[] = [];

  if (weatherResult.status === "fulfilled") {
    for (const meta of weatherSourceMeta) {
      const health = weatherResult.value.weather.sources[meta.key];
      const state = stateFromHealth(health.status, health.usable);
      services.push({
        id: `weather-${meta.key}`,
        name: meta.name,
        provider: meta.provider,
        category: meta.category,
        state,
        detail: detailForState(state),
        checkedAt: health.fetchedAt || checkedAt,
      });
    }
  } else {
    services.push(...unavailableWeatherServices(checkedAt));
  }

  if (redemetResult.status === "fulfilled") {
    const layers = [
      {
        id: "redemet-radar",
        name: "Radar meteorológico",
        provider: redemetResult.value.radar.provider,
        layer: redemetResult.value.radar,
      },
      {
        id: "redemet-satellite",
        name: "Imagem de satélite",
        provider: redemetResult.value.satellite.provider,
        layer: redemetResult.value.satellite,
      },
      {
        id: "redemet-stsc",
        name: "Ocorrências de trovoadas — STSC",
        provider: redemetResult.value.storms.provider,
        layer: redemetResult.value.storms,
      },
      {
        id: "inmet-satellite",
        name: "Satélite meteorológico complementar",
        provider: redemetResult.value.inmetSatellite.provider,
        layer: redemetResult.value.inmetSatellite,
      },
    ];

    for (const item of layers) {
      const state = stateFromLayer(item.layer.configured, item.layer.available);
      services.push({
        id: item.id,
        name: item.name,
        provider: item.provider,
        category: "Radar e satélite",
        state,
        detail: detailForState(state),
        checkedAt: item.layer.updatedAt || checkedAt,
        sourceUrl: "officialUrl" in item.layer ? item.layer.officialUrl : undefined,
      });
    }
  } else {
    services.push(...unavailableRedemetServices(checkedAt));
  }

  if (laranjalResult.status === "fulfilled") {
    const state = stateFromHydrology(laranjalResult.value.status);
    services.push({
      id: "laranjal-level",
      name: "Nível da Lagoa dos Patos no Laranjal",
      provider: laranjalResult.value.source.name,
      category: "Hidrologia",
      state,
      detail: detailForState(state),
      checkedAt: laranjalResult.value.source.fetchedAt || checkedAt,
      sourceUrl: laranjalResult.value.source.url,
    });
  } else {
    services.push({
      id: "laranjal-level",
      name: "Nível da Lagoa dos Patos no Laranjal",
      provider: "LabHidroSens / UFPel",
      category: "Hidrologia",
      state: "offline",
      detail: detailForState("offline"),
      checkedAt,
    });
  }

  if (guaibaResult.status === "fulfilled") {
    const state = stateFromHydrology(guaibaResult.value.status);
    services.push({
      id: "guaiba-level",
      name: "Nível do Guaíba",
      provider: guaibaResult.value.source.name,
      category: "Hidrologia",
      state,
      detail: detailForState(state),
      checkedAt: guaibaResult.value.source.fetchedAt || checkedAt,
      sourceUrl: guaibaResult.value.source.url,
    });
  } else {
    services.push({
      id: "guaiba-level",
      name: "Nível do Guaíba",
      provider: "MetSul / TideSat Global",
      category: "Hidrologia",
      state: "offline",
      detail: detailForState("offline"),
      checkedAt,
    });
  }

  services.push({
    id: "ana-rhn",
    name: "Rede Hidrometeorológica Nacional",
    provider: "ANA / SNIRH / RHN",
    category: "Hidrologia",
    state: "implementation",
    detail: detailForState("implementation"),
    checkedAt,
    sourceUrl: "https://www.snirh.gov.br/hidroweb/",
  });

  const maintainedServices = applyMaintenanceWindows(
    services,
    await getActiveMaintenanceWindows(new Date(checkedAt)),
  );

  return {
    checkedAt,
    overall: overallState(maintainedServices),
    services: maintainedServices,
  };
}
