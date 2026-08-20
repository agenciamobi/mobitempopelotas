import type { InmetAlertSeverity } from "./official-sources.types";

export type InmetSeverityClassification = {
  severity: InmetAlertSeverity;
  label: string;
  colorLabel: string;
};

export const INMET_SEVERITY_META: Record<InmetAlertSeverity, InmetSeverityClassification> = {
  potential: {
    severity: "potential",
    label: "Perigo potencial",
    colorLabel: "Amarelo",
  },
  danger: {
    severity: "danger",
    label: "Perigo",
    colorLabel: "Laranja",
  },
  "great-danger": {
    severity: "great-danger",
    label: "Grande perigo",
    colorLabel: "Vermelho",
  },
  unknown: {
    severity: "unknown",
    label: "Aviso meteorológico",
    colorLabel: "Classificação não informada",
  },
};

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * Classificação oficial de avisos do INMET.
 *
 * A ordem é deliberada: "Perigo Potencial" contém a palavra "Perigo" e,
 * portanto, precisa ser testado antes do nível laranja para não ser promovido
 * indevidamente de amarelo para laranja.
 */
export function classifyInmetSeverityText(value: string): InmetSeverityClassification {
  const normalized = normalize(value);
  const compact = normalized.replace(/\s+/g, "");

  if (
    compact === "3" ||
    /grande perigo|extreme|extremo|vermelh|ff0000|dc2626|rgb\(?255,?0,?0/.test(normalized)
  ) {
    return INMET_SEVERITY_META["great-danger"];
  }

  if (
    compact === "1" ||
    /perigo potencial|potential|potencial|moderate|moderado|amarel|fffe00|ffff00|ffcc00|facc15|rgb\(?255,?(?:204|254|255),?0/.test(
      normalized,
    )
  ) {
    return INMET_SEVERITY_META.potential;
  }

  if (
    compact === "2" ||
    /(?:^|\b)perigo(?:\b|$)|severe|severo|laranja|ff9900|ffa500|ff8c00|rgb\(?255,?(?:140|153|165),?0/.test(
      normalized,
    )
  ) {
    return INMET_SEVERITY_META.danger;
  }

  return INMET_SEVERITY_META.unknown;
}
