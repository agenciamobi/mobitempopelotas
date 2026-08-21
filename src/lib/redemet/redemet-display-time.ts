const DISPLAY_TIMEZONE = "America/Sao_Paulo";
export const REDEMET_FUTURE_TOLERANCE_MS = 5 * 60_000;

export type RedemetFreshnessTone = "recent" | "attention" | "stale" | "unknown";

type ObservedFrame = {
  observedAt: string | null;
};

function parsedObservedDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isUsableRedemetObservedAt(value: string | null, now = Date.now()) {
  const date = parsedObservedDate(value);
  if (!date) return false;
  return date.getTime() <= now + REDEMET_FUTURE_TOLERANCE_MS;
}

export function formatRedemetDateTime(value: string | null, now = Date.now()) {
  const date = parsedObservedDate(value);
  if (!date) return "Horário não informado";
  if (date.getTime() > now + REDEMET_FUTURE_TOLERANCE_MS) {
    return "Horário da fonte em verificação";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: DISPLAY_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function latestReportedRedemetFrameTime(frames: readonly ObservedFrame[]) {
  const values = frames
    .map((frame) => frame.observedAt)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()))
    .sort((first, second) => second.getTime() - first.getTime());

  return values[0]?.toISOString() ?? null;
}

export function latestUsableRedemetFrameTime(
  frames: readonly ObservedFrame[],
  now = Date.now(),
) {
  const values = frames
    .map((frame) => frame.observedAt)
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value))
    .filter(
      (value) =>
        !Number.isNaN(value.getTime()) &&
        value.getTime() <= now + REDEMET_FUTURE_TOLERANCE_MS,
    )
    .sort((first, second) => second.getTime() - first.getTime());

  return values[0]?.toISOString() ?? null;
}

export function getRedemetFreshness(value: string | null, now = Date.now()): {
  tone: RedemetFreshnessTone;
  label: string;
  relative: string;
} {
  const date = parsedObservedDate(value);
  if (!date) {
    return {
      tone: "unknown",
      label: "Horário não informado",
      relative: "Sem horário disponível",
    };
  }

  if (date.getTime() > now + REDEMET_FUTURE_TOLERANCE_MS) {
    return {
      tone: "unknown",
      label: "Horário da fonte em verificação",
      relative: "Aguardando confirmação do horário informado pela fonte",
    };
  }

  const ageMinutes = Math.max(0, Math.floor((now - date.getTime()) / 60_000));
  const relative =
    ageMinutes < 1
      ? "Atualizado agora"
      : ageMinutes < 60
        ? `Atualizado há ${ageMinutes} min`
        : ageMinutes < 1_440
          ? `Atualizado há ${Math.floor(ageMinutes / 60)} h`
          : "Atualizado há mais de 1 dia";

  if (ageMinutes <= 30) return { tone: "recent", label: "Imagem recente", relative };
  if (ageMinutes <= 120) return { tone: "attention", label: "Confira o horário", relative };
  return { tone: "stale", label: "Imagem com mais de 2 h", relative };
}

export function redemetFrameDisplayLabel(
  frame: { label: string; observedAt: string | null },
  now = Date.now(),
) {
  return isUsableRedemetObservedAt(frame.observedAt, now)
    ? frame.label
    : "Horário da fonte em verificação";
}
