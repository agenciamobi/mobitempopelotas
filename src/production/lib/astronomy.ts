export type MoonPhaseName =
  | "Lua nova"
  | "Quarto crescente"
  | "Lua cheia"
  | "Quarto minguante";

const SYNODIC_MONTH_DAYS = 29.530588853;
const NEW_MOON_EPOCH_JULIAN_DAY = 2451550.1;

function toReferenceDate(value: string | null) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T12:00:00-03:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return new Date();
}

function julianDay(date: Date) {
  return date.getTime() / 86_400_000 + 2_440_587.5;
}

export function calculateMoonPhase(value: string | null): MoonPhaseName {
  const date = toReferenceDate(value);
  const rawCycle = (julianDay(date) - NEW_MOON_EPOCH_JULIAN_DAY) / SYNODIC_MONTH_DAYS;
  const phase = ((rawCycle % 1) + 1) % 1;

  if (phase < 0.125 || phase >= 0.875) return "Lua nova";
  if (phase < 0.375) return "Quarto crescente";
  if (phase < 0.625) return "Lua cheia";
  return "Quarto minguante";
}
