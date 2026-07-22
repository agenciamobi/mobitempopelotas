from pathlib import Path


def replace(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: esperado 1 trecho, encontrado {count}: {old[:100]!r}")
    file.write_text(text.replace(old, new, 1), encoding="utf-8")


replace(
    "src/lib/hydrology/laranjal-level.server.ts",
    "  updatedAt: string | null;\n  trendCmPerHour: number | null;",
    "  updatedAt: string | null;\n  ageMinutes: number | null;\n  trendCmPerHour: number | null;",
)
replace(
    "src/lib/hydrology/laranjal-level.server.ts",
    "    updatedAt: null,\n    trendCmPerHour: null,",
    "    updatedAt: null,\n    ageMinutes: null,\n    trendCmPerHour: null,",
)
replace(
    "src/lib/hydrology/laranjal-level.server.ts",
    "    currentLevel: current.level,\n    updatedAt: current.timestamp,\n    trendCmPerHour:",
    "    currentLevel: current.level,\n    updatedAt: current.timestamp,\n    ageMinutes: Math.round(ageMinutes),\n    trendCmPerHour:",
)
replace(
    "src/lib/hydrology/laranjal-level.server.ts",
    '    error: stale ? "A última leitura disponível está atrasada." : null,',
    '    error: stale ? "A estação deixou de enviar novas medições." : null,',
)

replace(
    "src/components/hydrology/HydrologyPages.tsx",
    '''function formatSigned(value: number | null, suffix: string) {
  if (value === null) return "—";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value}${suffix}`;
}''',
    '''function formatReadingAge(value: number | null) {
  if (value === null) return null;
  if (value < 1) return "menos de 1 minuto";

  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
}

function formatSigned(value: number | null, suffix: string) {
  if (value === null) return "—";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value}${suffix}`;
}''',
)
replace(
    "src/components/hydrology/HydrologyPages.tsx",
    '''function SourceStatus({ level }: { level: LaranjalLevelData }) {
  const live = level.status === "live";
  const stale = level.status === "stale";

  return (
    <div className={`hydrology-source-status hydrology-source-status-${level.status}`}>
      {live ? (
        <CheckCircle2 aria-hidden="true" />
      ) : stale ? (
        <Clock3 aria-hidden="true" />
      ) : (
        <Info aria-hidden="true" />
      )}
      <div>
        <strong>
          {live
            ? "Telemetria atualizada"
            : stale
              ? "Última leitura atrasada"
              : "Telemetria indisponível"}
        </strong>
        <span>
          {level.updatedAt
            ? `Medição registrada em ${formatDateTime(level.updatedAt)}`
            : level.error || "O portal tentará consultar novamente automaticamente."}
        </span>
      </div>
    </div>
  );
}''',
    '''function SourceStatus({ level }: { level: LaranjalLevelData }) {
  const live = level.status === "live";
  const stale = level.status === "stale";
  const age = formatReadingAge(level.ageMinutes);

  return (
    <div className={`hydrology-source-status hydrology-source-status-${level.status}`}>
      {live ? (
        <CheckCircle2 aria-hidden="true" />
      ) : stale ? (
        <Clock3 aria-hidden="true" />
      ) : (
        <Info aria-hidden="true" />
      )}
      <div>
        <strong>
          {live
            ? "Telemetria atualizada"
            : stale
              ? "Sensor sem nova medição"
              : "Telemetria indisponível"}
        </strong>
        <span>
          {live && level.updatedAt
            ? `Medição registrada em ${formatDateTime(level.updatedAt)}`
            : stale && level.updatedAt
              ? `${age ? `Sem nova medição há ${age}. ` : ""}Última leitura em ${formatDateTime(level.updatedAt)}.`
              : level.error || "O portal tentará consultar novamente automaticamente."}
        </span>
      </div>
    </div>
  );
}''',
)
replace(
    "src/components/hydrology/HydrologyPages.tsx",
    '''          <p className="hydrology-kicker">Estação Laranjal · UFPel</p>
          <h2 id="hydrology-level-title">Leitura local da Lagoa dos Patos</h2>''',
    '''          <p className="hydrology-kicker">Estação Laranjal · UFPel</p>
          <h2 id="hydrology-level-title">
            {level.status === "stale"
              ? "Última leitura conhecida da Lagoa dos Patos"
              : "Leitura local da Lagoa dos Patos"}
          </h2>''',
)
replace(
    "src/components/hydrology/HydrologyPages.tsx",
    '''          <strong>{level.currentLevel === null ? "—" : level.currentLevel.toFixed(2)}</strong>
          <span>metros na referência do sensor</span>''',
    '''          <strong>{level.currentLevel === null ? "—" : level.currentLevel.toFixed(2)}</strong>
          <span>
            {level.status === "stale"
              ? "metros na última leitura do sensor"
              : "metros na referência do sensor"}
          </span>''',
)

print("Transparência da telemetria aplicada.")
