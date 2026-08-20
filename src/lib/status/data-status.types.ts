export type ServiceState =
  | "operational"
  | "partial"
  | "maintenance"
  | "offline"
  | "implementation";

export type ServiceCategory = "Meteorologia e avisos" | "Radar e satélite" | "Hidrologia";

export type ServiceStatus = {
  id: string;
  name: string;
  provider: string;
  category: ServiceCategory;
  state: ServiceState;
  detail: string;
  checkedAt: string;
  sourceUrl?: string;
};

export type DataStatusOverview = {
  checkedAt: string;
  overall: "operational" | "partial" | "offline";
  services: ServiceStatus[];
};

export type DataStatusIncident = {
  id: number;
  serviceId: string;
  serviceName: string;
  provider: string;
  category: string;
  incidentKind: "partial" | "offline" | "maintenance";
  status: "open" | "resolved";
  openedState: "partial" | "offline" | "maintenance";
  currentState: ServiceState;
  worstState: "partial" | "offline" | "maintenance";
  title: string;
  detail: string;
  openedAt: string;
  lastSeenAt: string;
  resolvedAt: string | null;
  occurrenceCount: number;
  sourceUrl: string | null;
};

export type DataStatusMaintenance = {
  id: number;
  serviceId: string;
  title: string;
  message: string;
  startsAt: string;
  endsAt: string;
};

export type DataStatusAvailability = {
  serviceId: string;
  serviceName: string;
  provider: string;
  measuredChecks: number;
  operationalChecks: number;
  partialChecks: number;
  offlineChecks: number;
  availabilityPercent: number;
};

export type DataStatusAvailabilitySummary = {
  measuredChecks: number;
  operationalChecks: number;
  partialChecks: number;
  offlineChecks: number;
  availabilityPercent: number | null;
};

export type DataStatusHistory = {
  available: boolean;
  startedAt: string | null;
  incidents: DataStatusIncident[];
  maintenance: DataStatusMaintenance[];
  availability24h: DataStatusAvailability[];
  availability7d: DataStatusAvailability[];
  summary24h: DataStatusAvailabilitySummary;
  summary7d: DataStatusAvailabilitySummary;
  error: string | null;
};

export type DataStatusPageData = DataStatusOverview & {
  history: DataStatusHistory;
};
