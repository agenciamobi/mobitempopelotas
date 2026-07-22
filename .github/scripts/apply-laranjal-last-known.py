from pathlib import Path


def replace(path: str, old: str, new: str) -> None:
    file = Path(path)
    text = file.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: esperado 1 trecho, encontrado {count}: {old[:120]!r}")
    file.write_text(text.replace(old, new, 1), encoding="utf-8")


replace(
    "src/lib/hydrology/laranjal-level.server.ts",
    '''export async function fetchLaranjalLevelData(): Promise<LaranjalLevelData> {
  const signal = AbortSignal.timeout(REQUEST_DEADLINE_MS);

  try {
    const token = await getPublicAccessToken(signal);
    const endTs = Date.now();
    const params = new URLSearchParams({
      keys: TELEMETRY_KEY,
      startTs: String(endTs - HISTORY_WINDOW_MS),
      endTs: String(endTs),
      limit: "50000",
      agg: "NONE",
      orderBy: "ASC",
    });
    const response = await fetch(
      `${THINGSBOARD_URL}/api/plugins/telemetry/DEVICE/${DEVICE_ID}/values/timeseries?${params}`,
      {
        headers: {
          Accept: "application/json",
          "X-Authorization": `Bearer ${token}`,
        },
        signal,
      },
    );

    if (!response.ok) {
      throw new Error(`Leituras do Laranjal responderam com status ${response.status}`);
    }

    return normalizeLaranjalTelemetry(await response.json());
  } catch (error) {
    console.error("[hydrology/laranjal] Falha ao consultar a estação", {
      message: error instanceof Error ? error.message : String(error),
    });
    return unavailableData("O nível da Lagoa está temporariamente indisponível.");
  }
}''',
    '''function telemetryPoints(payload: unknown) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return [];
  const points = (payload as Record<string, unknown>)[TELEMETRY_KEY];
  return Array.isArray(points) ? points : [];
}

function mergeTelemetryPayloads(payloads: unknown[]) {
  return {
    [TELEMETRY_KEY]: payloads.flatMap((payload) => telemetryPoints(payload)),
  };
}

function latestValidTelemetryEpoch(payload: unknown) {
  let latest: number | null = null;

  for (const rawPoint of telemetryPoints(payload)) {
    if (!rawPoint || typeof rawPoint !== "object" || Array.isArray(rawPoint)) continue;
    const point = rawPoint as Record<string, unknown>;
    const epoch = Number(point.ts);
    if (!Number.isFinite(epoch) || epoch <= 0 || calculateLevel(point.value) === null) continue;
    if (latest === null || epoch > latest) latest = epoch;
  }

  return latest;
}

async function fetchTelemetry(
  params: URLSearchParams,
  token: string,
  signal: AbortSignal,
): Promise<unknown> {
  const response = await fetch(
    `${THINGSBOARD_URL}/api/plugins/telemetry/DEVICE/${DEVICE_ID}/values/timeseries?${params}`,
    {
      headers: {
        Accept: "application/json",
        "X-Authorization": `Bearer ${token}`,
      },
      signal,
    },
  );

  if (!response.ok) {
    throw new Error(`Leituras do Laranjal responderam com status ${response.status}`);
  }

  return response.json();
}

export async function fetchLaranjalLevelData(): Promise<LaranjalLevelData> {
  const signal = AbortSignal.timeout(REQUEST_DEADLINE_MS);

  try {
    const token = await getPublicAccessToken(signal);
    const endTs = Date.now();
    const historyParams = new URLSearchParams({
      keys: TELEMETRY_KEY,
      startTs: String(endTs - HISTORY_WINDOW_MS),
      endTs: String(endTs),
      limit: "50000",
      agg: "NONE",
      orderBy: "ASC",
    });
    const latestParams = new URLSearchParams({
      keys: TELEMETRY_KEY,
      startTs: "0",
      endTs: String(endTs),
      limit: "50",
      agg: "NONE",
      orderBy: "DESC",
    });

    const [historyResult, latestResult] = await Promise.allSettled([
      fetchTelemetry(historyParams, token, signal),
      fetchTelemetry(latestParams, token, signal),
    ]);
    const payloads: unknown[] = [];

    if (historyResult.status === "fulfilled") payloads.push(historyResult.value);
    if (latestResult.status === "fulfilled") payloads.push(latestResult.value);

    const latestEpoch =
      latestResult.status === "fulfilled" ? latestValidTelemetryEpoch(latestResult.value) : null;
    if (latestEpoch !== null && latestEpoch < endTs - HISTORY_WINDOW_MS) {
      const previousHistoryParams = new URLSearchParams({
        keys: TELEMETRY_KEY,
        startTs: String(Math.max(0, latestEpoch - HISTORY_WINDOW_MS)),
        endTs: String(latestEpoch + 1),
        limit: "50000",
        agg: "NONE",
        orderBy: "ASC",
      });

      try {
        payloads.push(await fetchTelemetry(previousHistoryParams, token, signal));
      } catch (error) {
        console.warn("[hydrology/laranjal] Histórico anterior à última leitura indisponível", {
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (payloads.length === 0) {
      const reasons = [historyResult, latestResult]
        .filter((result) => result.status === "rejected")
        .map((result) => (result.status === "rejected" ? String(result.reason) : ""))
        .filter(Boolean)
        .join("; ");
      throw new Error(reasons || "A estação não devolveu telemetria.");
    }

    return normalizeLaranjalTelemetry(mergeTelemetryPayloads(payloads));
  } catch (error) {
    console.error("[hydrology/laranjal] Falha ao consultar a estação", {
      message: error instanceof Error ? error.message : String(error),
    });
    return unavailableData("O nível da Lagoa está temporariamente indisponível.");
  }
}''',
)

replace(
    "src/components/hydrology/HydrologyPages.tsx",
    '        aria-label="Variação do nível nas últimas 24 horas"',
    '''        aria-label={
          data.status === "stale"
            ? "Variação do nível nas 24 horas anteriores à última leitura"
            : "Variação do nível nas últimas 24 horas"
        }''',
)
replace(
    "src/components/hydrology/HydrologyPages.tsx",
    '''      <div className="hydrology-chart-labels">
        <span>Há 24 horas</span>
        <strong>
          {minimum.toFixed(2)} m a {maximum.toFixed(2)} m
        </strong>
        <span>Agora</span>
      </div>''',
    '''      <div className="hydrology-chart-labels">
        <span>{data.status === "stale" ? "24 h antes da leitura" : "Há 24 horas"}</span>
        <strong>
          {minimum.toFixed(2)} m a {maximum.toFixed(2)} m
        </strong>
        <span>{data.status === "stale" ? "Última leitura" : "Agora"}</span>
      </div>''',
)

print("Preservação da última leitura aplicada.")
