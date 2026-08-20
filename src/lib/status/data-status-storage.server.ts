import type { SupabaseClient } from "@supabase/supabase-js";

import {
  createSupabaseAdminClient,
  getSupabaseServerConfig,
} from "@/lib/supabase/server-client.server";
import type { Database, Json } from "@/lib/supabase/database.types";

import type {
  DataStatusAvailability,
  DataStatusAvailabilitySummary,
  DataStatusHistory,
  DataStatusIncident,
  DataStatusMaintenance,
  DataStatusOverview,
  ServiceState,
} from "./data-status.types";

type DataSourceIncidentRow = {
  category: string;
  created_at: string;
  current_state: string;
  detail: string;
  id: number;
  incident_kind: string;
  last_seen_at: string;
  occurrence_count: number;
  opened_at: string;
  opened_state: string;
  provider: string;
  resolved_at: string | null;
  service_id: string;
  service_name: string;
  source_url: string | null;
  status: string;
  title: string;
  updated_at: string;
  worst_state: string;
};

type DataSourceMaintenanceRow = {
  cancelled_at: string | null;
  created_at: string;
  ends_at: string;
  id: number;
  message: string;
  service_id: string;
  starts_at: string;
  title: string;
  updated_at: string;
};

type DataSourceCheckRow = {
  category: string;
  checked_at: string;
  created_at: string;
  detail: string;
  id: number;
  provider: string;
  service_id: string;
  service_name: string;
  source_checked_at: string | null;
  source_url: string | null;
  state: string;
};

type AvailabilityRow = {
  availability_percent: number;
  measured_checks: number;
  offline_checks: number;
  operational_checks: number;
  partial_checks: number;
  provider: string;
  service_id: string;
  service_name: string;
};

type DataStatusDatabase = Omit<Database, "public"> & {
  public: Omit<Database["public"], "Tables" | "Functions"> & {
    Tables: Database["public"]["Tables"] & {
      data_source_incidents: {
        Row: DataSourceIncidentRow;
        Insert: Omit<DataSourceIncidentRow, "id" | "created_at" | "updated_at"> & {
          id?: never;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<DataSourceIncidentRow, "id">> & { id?: never };
        Relationships: [];
      };
      data_source_maintenance_windows: {
        Row: DataSourceMaintenanceRow;
        Insert: Omit<DataSourceMaintenanceRow, "id" | "created_at" | "updated_at" | "cancelled_at"> & {
          id?: never;
          created_at?: string;
          updated_at?: string;
          cancelled_at?: string | null;
        };
        Update: Partial<Omit<DataSourceMaintenanceRow, "id">> & { id?: never };
        Relationships: [];
      };
      data_source_status_checks: {
        Row: DataSourceCheckRow;
        Insert: Omit<DataSourceCheckRow, "id" | "created_at"> & {
          id?: never;
          created_at?: string;
        };
        Update: Partial<Omit<DataSourceCheckRow, "id">> & { id?: never };
        Relationships: [];
      };
    };
    Functions: Database["public"]["Functions"] & {
      get_data_source_availability: {
        Args: { p_since: string };
        Returns: AvailabilityRow[];
      };
      record_data_source_status: {
        Args: { p_checked_at: string; p_services: Json };
        Returns: Json;
      };
    };
  };
};

function adminClient() {
  return createSupabaseAdminClient() as unknown as SupabaseClient<DataStatusDatabase>;
}

function emptySummary(): DataStatusAvailabilitySummary {
  return {
    measuredChecks: 0,
    operationalChecks: 0,
    partialChecks: 0,
    offlineChecks: 0,
    availabilityPercent: null,
  };
}

function emptyHistory(error: string | null = null): DataStatusHistory {
  return {
    available: false,
    startedAt: null,
    incidents: [],
    maintenance: [],
    availability24h: [],
    availability7d: [],
    summary24h: emptySummary(),
    summary7d: emptySummary(),
    error,
  };
}

function isServiceState(value: string): value is ServiceState {
  return ["operational", "partial", "maintenance", "offline", "implementation"].includes(value);
}

function incidentState(value: string): "partial" | "offline" | "maintenance" {
  return value === "offline" || value === "maintenance" ? value : "partial";
}

function mapIncident(row: DataSourceIncidentRow): DataStatusIncident {
  return {
    id: row.id,
    serviceId: row.service_id,
    serviceName: row.service_name,
    provider: row.provider,
    category: row.category,
    incidentKind: incidentState(row.incident_kind),
    status: row.status === "open" ? "open" : "resolved",
    openedState: incidentState(row.opened_state),
    currentState: isServiceState(row.current_state) ? row.current_state : "offline",
    worstState: incidentState(row.worst_state),
    title: row.title,
    detail: row.detail,
    openedAt: row.opened_at,
    lastSeenAt: row.last_seen_at,
    resolvedAt: row.resolved_at,
    occurrenceCount: row.occurrence_count,
    sourceUrl: row.source_url,
  };
}

function mapMaintenance(row: DataSourceMaintenanceRow): DataStatusMaintenance {
  return {
    id: row.id,
    serviceId: row.service_id,
    title: row.title,
    message: row.message,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  };
}

function mapAvailability(row: AvailabilityRow): DataStatusAvailability {
  return {
    serviceId: row.service_id,
    serviceName: row.service_name,
    provider: row.provider,
    measuredChecks: Number(row.measured_checks),
    operationalChecks: Number(row.operational_checks),
    partialChecks: Number(row.partial_checks),
    offlineChecks: Number(row.offline_checks),
    availabilityPercent: Number(row.availability_percent),
  };
}

function summarizeAvailability(rows: DataStatusAvailability[]): DataStatusAvailabilitySummary {
  const summary = rows.reduce(
    (accumulator, row) => ({
      measuredChecks: accumulator.measuredChecks + row.measuredChecks,
      operationalChecks: accumulator.operationalChecks + row.operationalChecks,
      partialChecks: accumulator.partialChecks + row.partialChecks,
      offlineChecks: accumulator.offlineChecks + row.offlineChecks,
    }),
    {
      measuredChecks: 0,
      operationalChecks: 0,
      partialChecks: 0,
      offlineChecks: 0,
    },
  );

  return {
    ...summary,
    availabilityPercent:
      summary.measuredChecks > 0
        ? Math.round((summary.operationalChecks / summary.measuredChecks) * 1_000) / 10
        : null,
  };
}

export async function getActiveMaintenanceWindows(now = new Date()) {
  if (!getSupabaseServerConfig().isAdminConfigured) return [] as DataStatusMaintenance[];

  try {
    const { data, error } = await adminClient()
      .from("data_source_maintenance_windows")
      .select("id, service_id, title, message, starts_at, ends_at, cancelled_at, created_at, updated_at")
      .is("cancelled_at", null)
      .lte("starts_at", now.toISOString())
      .gt("ends_at", now.toISOString())
      .order("starts_at", { ascending: true });

    if (error) throw error;
    return (data ?? []).map(mapMaintenance);
  } catch (error) {
    console.error("[data-status] Não foi possível consultar manutenções ativas", {
      message: error instanceof Error ? error.message : String(error),
    });
    return [] as DataStatusMaintenance[];
  }
}

export async function recordDataStatusOverview(overview: DataStatusOverview) {
  if (!getSupabaseServerConfig().isAdminConfigured) {
    throw new Error("Persistência do histórico de status não configurada no runtime.");
  }

  const services = overview.services.map((service) => ({
    id: service.id,
    name: service.name,
    provider: service.provider,
    category: service.category,
    state: service.state,
    detail: service.detail,
    checkedAt: service.checkedAt,
    sourceUrl: service.sourceUrl ?? null,
  })) as Json;

  const { data, error } = await adminClient().rpc("record_data_source_status", {
    p_checked_at: overview.checkedAt,
    p_services: services,
  });

  if (error) throw error;
  return data;
}

export async function getDataStatusHistory(now = new Date()): Promise<DataStatusHistory> {
  if (!getSupabaseServerConfig().isAdminConfigured) {
    return emptyHistory("Histórico operacional ainda não configurado neste ambiente.");
  }

  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1_000).toISOString();
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1_000).toISOString();

  try {
    const client = adminClient();
    const [incidentsResult, maintenanceResult, firstCheckResult, availability24hResult, availability7dResult] =
      await Promise.all([
        client
          .from("data_source_incidents")
          .select(
            "id, service_id, service_name, provider, category, incident_kind, status, opened_state, current_state, worst_state, title, detail, opened_at, last_seen_at, resolved_at, occurrence_count, source_url, created_at, updated_at",
          )
          .order("opened_at", { ascending: false })
          .limit(40),
        client
          .from("data_source_maintenance_windows")
          .select("id, service_id, title, message, starts_at, ends_at, cancelled_at, created_at, updated_at")
          .is("cancelled_at", null)
          .gte("ends_at", now.toISOString())
          .order("starts_at", { ascending: true })
          .limit(20),
        client
          .from("data_source_status_checks")
          .select("checked_at")
          .order("checked_at", { ascending: true })
          .limit(1)
          .maybeSingle(),
        client.rpc("get_data_source_availability", { p_since: since24h }),
        client.rpc("get_data_source_availability", { p_since: since7d }),
      ]);

    for (const result of [
      incidentsResult,
      maintenanceResult,
      firstCheckResult,
      availability24hResult,
      availability7dResult,
    ]) {
      if (result.error) throw result.error;
    }

    const availability24h = (availability24hResult.data ?? []).map(mapAvailability);
    const availability7d = (availability7dResult.data ?? []).map(mapAvailability);

    return {
      available: true,
      startedAt: firstCheckResult.data?.checked_at ?? null,
      incidents: (incidentsResult.data ?? []).map(mapIncident),
      maintenance: (maintenanceResult.data ?? []).map(mapMaintenance),
      availability24h,
      availability7d,
      summary24h: summarizeAvailability(availability24h),
      summary7d: summarizeAvailability(availability7d),
      error: null,
    };
  } catch (error) {
    console.error("[data-status] Não foi possível carregar o histórico operacional", {
      message: error instanceof Error ? error.message : String(error),
    });
    return emptyHistory("O histórico operacional está temporariamente indisponível.");
  }
}
