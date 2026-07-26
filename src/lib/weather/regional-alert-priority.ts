import type { RegionalCityAlert } from "./regional-city-weather.types";

const severityWeight: Record<RegionalCityAlert["severity"], number> = {
  "great-danger": 3,
  danger: 2,
  potential: 1,
  unknown: 0,
};

function dateEpoch(value: string | null) {
  if (!value) return null;
  const epoch = new Date(value).getTime();
  return Number.isFinite(epoch) ? epoch : null;
}

export function hasVerifiedRegionalAlertSemantics(alert: RegionalCityAlert) {
  return (
    alert.severity !== "unknown" &&
    dateEpoch(alert.startsAt) !== null &&
    dateEpoch(alert.expiresAt) !== null
  );
}

export function regionalAlertPeriod(
  alert: RegionalCityAlert,
  now = Date.now(),
): "active" | "upcoming" | "unknown" {
  const startsAt = dateEpoch(alert.startsAt);
  const expiresAt = dateEpoch(alert.expiresAt);
  if (startsAt === null || expiresAt === null) return "unknown";
  if (now < startsAt) return "upcoming";
  return now <= expiresAt ? "active" : "unknown";
}

function periodWeight(alert: RegionalCityAlert, now: number) {
  const period = regionalAlertPeriod(alert, now);
  if (period === "active") return 3;
  if (period === "upcoming") return 2;
  return 1;
}

function officialSeverityWeight(alert: RegionalCityAlert) {
  return hasVerifiedRegionalAlertSemantics(alert) ? severityWeight[alert.severity] : 0;
}

function startEpoch(alert: RegionalCityAlert) {
  return dateEpoch(alert.startsAt) ?? Number.POSITIVE_INFINITY;
}

export function prioritizeRegionalAlerts(
  alerts: RegionalCityAlert[],
  now = Date.now(),
) {
  return [...alerts].sort((left, right) => {
    const periodDifference = periodWeight(right, now) - periodWeight(left, now);
    if (periodDifference !== 0) return periodDifference;

    const severityDifference =
      officialSeverityWeight(right) - officialSeverityWeight(left);
    if (severityDifference !== 0) return severityDifference;

    return startEpoch(left) - startEpoch(right);
  });
}

export function selectPriorityRegionalAlert(
  alerts: RegionalCityAlert[],
  now = Date.now(),
) {
  return prioritizeRegionalAlerts(alerts, now)[0] ?? null;
}
