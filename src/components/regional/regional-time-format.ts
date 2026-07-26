const TIMEZONE = "America/Sao_Paulo";
const LOCAL_MODEL_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/;

export function formatRegionalHour(value: string | null) {
  if (!value) return "—";
  const local = value.match(LOCAL_MODEL_TIME);
  if (local) return `${local[4]}:${local[5]}`;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIMEZONE,
  }).format(date);
}

export function formatRegionalDateTime(value: string | null) {
  if (!value) return "horário não informado";
  const local = value.match(LOCAL_MODEL_TIME);
  if (local) return `${local[3]}/${local[2]}/${local[1]}, ${local[4]}:${local[5]}`;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: TIMEZONE,
  }).format(date);
}
