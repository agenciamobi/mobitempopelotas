export type MoonPhaseName =
  | "Lua nova"
  | "Lua crescente"
  | "Quarto crescente"
  | "Crescente gibosa"
  | "Lua cheia"
  | "Minguante gibosa"
  | "Quarto minguante"
  | "Lua minguante";

export type MoonPhaseResolution = {
  name: MoonPhaseName;
  source: "INMET" | "Cálculo astronômico";
};

type PrincipalMoonPhase =
  | "Lua nova"
  | "Quarto crescente"
  | "Lua cheia"
  | "Quarto minguante";

type OfficialMoonEvent = {
  at: string;
  phase: PrincipalMoonPhase;
};

const SYNODIC_MONTH_DAYS = 29.530588853;
const NEW_MOON_EPOCH_JULIAN_DAY = 2451550.1;
const SAO_PAULO_TIME_ZONE = "America/Sao_Paulo";

// Calendário anual publicado pelo INMET em https://portal.inmet.gov.br/paginas/luas.
// Os horários abaixo são os apresentados para 2026 no portal oficial.
const INMET_MOON_EVENTS_2026: readonly OfficialMoonEvent[] = [
  { at: "2026-01-03T07:04:00-03:00", phase: "Lua cheia" },
  { at: "2026-01-10T12:49:00-03:00", phase: "Quarto minguante" },
  { at: "2026-01-18T16:53:00-03:00", phase: "Lua nova" },
  { at: "2026-01-26T01:48:00-03:00", phase: "Quarto crescente" },
  { at: "2026-02-01T19:10:00-03:00", phase: "Lua cheia" },
  { at: "2026-02-09T09:44:00-03:00", phase: "Quarto minguante" },
  { at: "2026-02-17T09:03:00-03:00", phase: "Lua nova" },
  { at: "2026-02-24T09:28:00-03:00", phase: "Quarto crescente" },
  { at: "2026-03-03T08:39:00-03:00", phase: "Lua cheia" },
  { at: "2026-03-11T06:41:00-03:00", phase: "Quarto minguante" },
  { at: "2026-03-18T22:26:00-03:00", phase: "Lua nova" },
  { at: "2026-03-25T16:19:00-03:00", phase: "Quarto crescente" },
  { at: "2026-04-01T23:13:00-03:00", phase: "Lua cheia" },
  { at: "2026-04-10T01:55:00-03:00", phase: "Quarto minguante" },
  { at: "2026-04-17T08:54:00-03:00", phase: "Lua nova" },
  { at: "2026-04-23T23:33:00-03:00", phase: "Quarto crescente" },
  { at: "2026-05-01T14:24:00-03:00", phase: "Lua cheia" },
  { at: "2026-05-09T18:13:00-03:00", phase: "Quarto minguante" },
  { at: "2026-05-16T17:03:00-03:00", phase: "Lua nova" },
  { at: "2026-05-23T08:12:00-03:00", phase: "Quarto crescente" },
  { at: "2026-05-31T05:46:00-03:00", phase: "Lua cheia" },
  { at: "2026-06-08T07:03:00-03:00", phase: "Quarto minguante" },
  { at: "2026-06-14T23:56:00-03:00", phase: "Lua nova" },
  { at: "2026-06-21T18:55:00-03:00", phase: "Quarto crescente" },
  { at: "2026-06-29T20:58:00-03:00", phase: "Lua cheia" },
  { at: "2026-07-07T16:30:00-03:00", phase: "Quarto minguante" },
  { at: "2026-07-14T06:45:00-03:00", phase: "Lua nova" },
  { at: "2026-07-21T08:05:00-03:00", phase: "Quarto crescente" },
  { at: "2026-07-29T11:37:00-03:00", phase: "Lua cheia" },
  { at: "2026-08-05T23:22:00-03:00", phase: "Quarto minguante" },
  { at: "2026-08-12T14:37:00-03:00", phase: "Lua nova" },
  { at: "2026-08-19T23:46:00-03:00", phase: "Quarto crescente" },
  { at: "2026-08-28T01:19:00-03:00", phase: "Lua cheia" },
  { at: "2026-09-04T04:52:00-03:00", phase: "Quarto minguante" },
  { at: "2026-09-11T00:27:00-03:00", phase: "Lua nova" },
  { at: "2026-09-18T17:44:00-03:00", phase: "Quarto crescente" },
  { at: "2026-09-26T13:50:00-03:00", phase: "Lua cheia" },
  { at: "2026-10-03T10:26:00-03:00", phase: "Quarto minguante" },
  { at: "2026-10-10T12:50:00-03:00", phase: "Lua nova" },
  { at: "2026-10-18T13:13:00-03:00", phase: "Quarto crescente" },
  { at: "2026-10-26T01:13:00-03:00", phase: "Lua cheia" },
  { at: "2026-11-01T17:30:00-03:00", phase: "Quarto minguante" },
  { at: "2026-11-09T04:02:00-03:00", phase: "Lua nova" },
  { at: "2026-11-17T08:48:00-03:00", phase: "Quarto crescente" },
  { at: "2026-11-24T11:55:00-03:00", phase: "Lua cheia" },
  { at: "2026-12-01T03:10:00-03:00", phase: "Quarto minguante" },
  { at: "2026-12-08T21:52:00-03:00", phase: "Lua nova" },
  { at: "2026-12-17T02:43:00-03:00", phase: "Quarto crescente" },
  { at: "2026-12-23T22:29:00-03:00", phase: "Lua cheia" },
  { at: "2026-12-30T16:00:00-03:00", phase: "Quarto minguante" },
] as const;

function toReferenceDate(value: string | null) {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T12:00:00-03:00`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  if (value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return new Date();
}

function localDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SAO_PAULO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function julianDay(date: Date) {
  return date.getTime() / 86_400_000 + 2_440_587.5;
}

function intermediatePhase(
  previous: PrincipalMoonPhase,
  next: PrincipalMoonPhase,
): MoonPhaseName | null {
  if (previous === "Lua nova" && next === "Quarto crescente") return "Lua crescente";
  if (previous === "Quarto crescente" && next === "Lua cheia") return "Crescente gibosa";
  if (previous === "Lua cheia" && next === "Quarto minguante") return "Minguante gibosa";
  if (previous === "Quarto minguante" && next === "Lua nova") return "Lua minguante";
  return null;
}

function resolveInmetMoonPhase(date: Date): MoonPhaseName | null {
  const dateKey = localDateKey(date);
  const exactDay = INMET_MOON_EVENTS_2026.find((event) =>
    event.at.startsWith(dateKey),
  );
  if (exactDay) return exactDay.phase;

  const timestamp = date.getTime();
  let previous: OfficialMoonEvent | null = null;
  let next: OfficialMoonEvent | null = null;

  for (const event of INMET_MOON_EVENTS_2026) {
    const eventTimestamp = new Date(event.at).getTime();
    if (eventTimestamp < timestamp) previous = event;
    if (eventTimestamp > timestamp) {
      next = event;
      break;
    }
  }

  if (!previous || !next) return null;
  return intermediatePhase(previous.phase, next.phase);
}

function calculateFallbackMoonPhase(date: Date): MoonPhaseName {
  const rawCycle = (julianDay(date) - NEW_MOON_EPOCH_JULIAN_DAY) / SYNODIC_MONTH_DAYS;
  const phase = ((rawCycle % 1) + 1) % 1;

  if (phase < 0.0625 || phase >= 0.9375) return "Lua nova";
  if (phase < 0.1875) return "Lua crescente";
  if (phase < 0.3125) return "Quarto crescente";
  if (phase < 0.4375) return "Crescente gibosa";
  if (phase < 0.5625) return "Lua cheia";
  if (phase < 0.6875) return "Minguante gibosa";
  if (phase < 0.8125) return "Quarto minguante";
  return "Lua minguante";
}

export function resolveMoonPhase(value: string | null): MoonPhaseResolution {
  const date = toReferenceDate(value);
  const officialPhase = resolveInmetMoonPhase(date);

  if (officialPhase) {
    return { name: officialPhase, source: "INMET" };
  }

  return {
    name: calculateFallbackMoonPhase(date),
    source: "Cálculo astronômico",
  };
}

export function calculateMoonPhase(value: string | null): MoonPhaseName {
  return resolveMoonPhase(value).name;
}
