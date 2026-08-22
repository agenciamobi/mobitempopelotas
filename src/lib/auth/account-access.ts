export type AccountTier = "free" | "pro";
export type AccountAccessStatus = "active" | "suspended" | "expired";

export type AccountEntitlements = {
  panelAccess: boolean;
  favorites: boolean;
  preferences: boolean;
  historyAccessDays: number | null;
  historyFull: boolean;
  historyCompare: boolean;
  stationCompare: boolean;
  variableCompare: boolean;
  dataExport: boolean;
  radarExtended: boolean;
  radarArchive: boolean;
  satelliteExtended: boolean;
  satelliteArchive: boolean;
  forecastAccuracy: boolean;
  advancedCharts: boolean;
};

export type EffectiveAccountAccess = {
  tier: AccountTier;
  label: "Free" | "PRO";
  status: AccountAccessStatus;
  source: string;
  validUntil: string | null;
  entitlements: AccountEntitlements;
};

const FREE_ENTITLEMENTS: AccountEntitlements = {
  panelAccess: true,
  favorites: true,
  preferences: true,
  historyAccessDays: 60,
  historyFull: false,
  historyCompare: false,
  stationCompare: false,
  variableCompare: false,
  dataExport: false,
  radarExtended: false,
  radarArchive: false,
  satelliteExtended: false,
  satelliteArchive: false,
  forecastAccuracy: false,
  advancedCharts: false,
};

const PRO_ENTITLEMENTS: AccountEntitlements = {
  panelAccess: true,
  favorites: true,
  preferences: true,
  historyAccessDays: null,
  historyFull: true,
  historyCompare: true,
  stationCompare: true,
  variableCompare: true,
  dataExport: true,
  radarExtended: true,
  radarArchive: true,
  satelliteExtended: true,
  satelliteArchive: true,
  forecastAccuracy: true,
  advancedCharts: true,
};

function hasExpired(validUntil: string | null, now: Date) {
  if (!validUntil) return false;
  const timestamp = Date.parse(validUntil);
  return Number.isFinite(timestamp) && timestamp <= now.getTime();
}

export function resolveAccountAccess(
  access:
    | {
        tier?: string | null;
        status?: string | null;
        source?: string | null;
        validUntil?: string | null;
      }
    | null
    | undefined,
  now = new Date(),
): EffectiveAccountAccess {
  const storedStatus: AccountAccessStatus =
    access?.status === "suspended" || access?.status === "expired" ? access.status : "active";
  const validUntil = access?.validUntil ?? null;
  const expired = hasExpired(validUntil, now);
  const effectiveStatus: AccountAccessStatus = expired ? "expired" : storedStatus;
  const proActive = access?.tier === "pro" && effectiveStatus === "active";
  const tier: AccountTier = proActive ? "pro" : "free";

  return {
    tier,
    label: tier === "pro" ? "PRO" : "Free",
    status: effectiveStatus,
    source: access?.source?.trim() || "system",
    validUntil,
    entitlements: tier === "pro" ? { ...PRO_ENTITLEMENTS } : { ...FREE_ENTITLEMENTS },
  };
}
