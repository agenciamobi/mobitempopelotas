export type InmetAlertSeverity = "potential" | "danger" | "great-danger" | "unknown";
export type InmetAlertRelevance = "pelotas" | "regional" | "state";
export type InmetAlertPeriod = "active" | "upcoming";

export type InmetAlert = {
  id: string;
  event: string;
  headline: string;
  description: string;
  instruction: string;
  severity: InmetAlertSeverity;
  severityLabel: string;
  relevance: InmetAlertRelevance;
  period: InmetAlertPeriod;
  startsAt: string | null;
  expiresAt: string | null;
  sentAt: string | null;
  areas: string[];
  municipalities: string[];
  municipalityCodes: string[];
  officialUrl: string;
};

export type InmetAlertsData = {
  status: "live" | "unavailable";
  alerts: InmetAlert[];
  counts: { total: number; pelotas: number; regional: number; state: number };
  source: { name: string; feedUrl: string; portalUrl: string; fetchedAt: string };
  error: string | null;
};
