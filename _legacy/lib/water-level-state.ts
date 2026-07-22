export type WaterLevelTrendDirection =
  | "rising"
  | "falling"
  | "stable"
  | "unavailable";

export type WaterLevelVisualState = WaterLevelTrendDirection | "flood";

type WaterLevelVisualStateInput = {
  rate: number | null;
  available?: boolean;
  currentLevel?: number | null;
  threshold?: number | null;
  stableThreshold?: number;
};

export function getWaterLevelTrendDirection(
  rate: number | null,
  stableThreshold = 0.1,
): WaterLevelTrendDirection {
  if (rate === null || !Number.isFinite(rate)) return "unavailable";
  if (Math.abs(rate) < stableThreshold) return "stable";
  return rate > 0 ? "rising" : "falling";
}

export function getWaterLevelVisualState({
  rate,
  available = true,
  currentLevel = null,
  threshold = null,
  stableThreshold = 0.1,
}: WaterLevelVisualStateInput): WaterLevelVisualState {
  // A cota tem prioridade visual sobre a tendência momentânea.
  if (
    currentLevel !== null &&
    threshold !== null &&
    Number.isFinite(currentLevel) &&
    Number.isFinite(threshold) &&
    currentLevel >= threshold
  ) {
    return "flood";
  }

  if (!available) return "unavailable";

  return getWaterLevelTrendDirection(rate, stableThreshold);
}

export function waterLevelStateClass(state: WaterLevelVisualState) {
  return `level-state--${state}`;
}
