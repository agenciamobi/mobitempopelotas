import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.110.8";
import { unzipSync } from "npm:fflate@0.8.2";

const COLLECTOR_KEY = "inmet-historical-backfill";
const STATION_CODE = "A887";
const STATION_KEY = "inmet-a887-capao-do-leao-pelotas";
const MIN_YEAR = 2000;
const REQUEST_TIMEOUT_MS = 100_000;
const UPSERT_BATCH_SIZE = 500;

type JsonRecord = Record<string, unknown>;
type ObservationRow = {
  station_key: string;
  station_code: string;
  observed_at: string;
  source_date: string;
  source_hour_utc: number;
  precipitation_mm: number | null;
  pressure_hpa: number | null;
  pressure_max_hpa: number | null;
  pressure_min_hpa: number | null;
  global_radiation_kj_m2: number | null;
  temperature_c: number | null;
  dew_point_c: number | null;
  temperature_max_c: number | null;
  temperature_min_c: number | null;
  dew_point_max_c: number | null;
  dew_point_min_c: number | null;
  humidity_max_percent: number | null;
  humidity_min_percent: number | null;
  humidity_percent: number | null;
  wind_direction_deg: number | null;
  wind_gust_ms: number | null;
  wind_speed_ms: number | null;
  quality_flag: string;
  source_file: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\u00ba/g, "o")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeCsv(bytes: Uint8Array) {
  const utf8 = new TextDecoder("utf-8").decode(bytes);
  const replacementRatio = (utf8.match(/�/g)?.length ?? 0) / Math.max(1, utf8.length);
  return replacementRatio < 0.0001
    ? utf8
    : new TextDecoder("windows-1252").decode(bytes);
}

function splitCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (character === ";" && !quoted) {
      values.push(current.trim());
      current = "";
      continue;
    }
    current += character;
  }

  values.push(current.trim());
  return values;
}

function parseNumber(value: string | undefined) {
  if (!value) return null;
  const normalized = value.trim().replace(",", ".");
  if (!normalized || /^(null|nan|na|n\/a)$/i.test(normalized)) return null;
  const numeric = Number(normalized);
  return !Number.isFinite(numeric) || Math.abs(numeric) >= 9999 ? null : numeric;
}

function parseDate(value: string | undefined) {
  if (!value) return null;
  const match = value.trim().match(/^(\d{4})[-/](\d{2})[-/](\d{2})$/);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

function parseHour(value: string | undefined) {
  if (!value) return null;
  const digits = value.replace(/[^0-9]/g, "");
  if (digits.length < 2) return null;
  const hour = Number(digits.slice(0, 2));
  return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : null;
}

function findHeader(headers: string[], includes: string[], excludes: string[] = []) {
  return headers.findIndex((header) => {
    const normalized = normalizeText(header);
    return includes.every((term) => normalized.includes(term))
      && excludes.every((term) => !normalized.includes(term));
  });
}

function valueAt(values: string[], index: number) {
  return index >= 0 ? parseNumber(values[index]) : null;
}

function columnIndexes(headers: string[]) {
  return {
    date: findHeader(headers, ["data"]),
    hour: findHeader(headers, ["hora", "utc"]),
    precipitation: findHeader(headers, ["precipitacao", "total", "horario"]),
    pressure: findHeader(headers, ["pressao", "atmosferica", "nivel", "estacao", "horaria"], ["max", "min"]),
    pressureMax: findHeader(headers, ["pressao", "max", "hora"]),
    pressureMin: findHeader(headers, ["pressao", "min", "hora"]),
    radiation: findHeader(headers, ["radiacao", "global"]),
    temperature: findHeader(headers, ["temperatura", "ar", "bulbo", "seco", "horaria"]),
    dewPoint: findHeader(headers, ["temperatura", "ponto", "orvalho"], ["max", "min"]),
    temperatureMax: findHeader(headers, ["temperatura", "max", "hora"], ["orvalho"]),
    temperatureMin: findHeader(headers, ["temperatura", "min", "hora"], ["orvalho"]),
    dewPointMax: findHeader(headers, ["temperatura", "orvalho", "max", "hora"]),
    dewPointMin: findHeader(headers, ["temperatura", "orvalho", "min", "hora"]),
    humidityMax: findHeader(headers, ["umidade", "rel", "max", "hora"]),
    humidityMin: findHeader(headers, ["umidade", "rel", "min", "hora"]),
    humidity: findHeader(headers, ["umidade", "relativa", "ar", "horaria"], ["max", "min"]),
    windDirection: findHeader(headers, ["vento", "direcao", "horaria"]),
    windGust: findHeader(headers, ["vento", "rajada", "maxima"]),
    windSpeed: findHeader(headers, ["vento", "velocidade", "horaria"]),
  };
}

function hasUsefulObservation(row: ObservationRow) {
  return [
    row.precipitation_mm,
    row.pressure_hpa,
    row.pressure_max_hpa,
    row.pressure_min_hpa,
    row.global_radiation_kj_m2,
    row.temperature_c,
    row.dew_point_c,
    row.temperature_max_c,
    row.temperature_min_c,
    row.dew_point_max_c,
    row.dew_point_min_c,
    row.humidity_max_percent,
    row.humidity_min_percent,
    row.humidity_percent,
    row.wind_direction_deg,
    row.wind_gust_ms,
    row.wind_speed_ms,
  ].some((value) => value !== null);
}

function parseStationCsv(content: string, sourceFile: string) {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/).map((line) => line.trimEnd());
  const headerIndex = lines.findIndex((line) => {
    const normalized = normalizeText(line);
    return normalized.includes("data") && normalized.includes("hora utc") && line.includes(";");
  });
  if (headerIndex < 0) throw new Error("Cabeçalho horário do INMET não foi encontrado no CSV.");

  const headers = splitCsvLine(lines[headerIndex]);
  const indexes = columnIndexes(headers);
  if (indexes.date < 0 || indexes.hour < 0) {
    throw new Error("Colunas Data/Hora UTC não foram reconhecidas no CSV do INMET.");
  }

  const rows: ObservationRow[] = [];
  let malformedCount = 0;
  let emptyCount = 0;

  for (const line of lines.slice(headerIndex + 1)) {
    if (!line.trim()) continue;
    const values = splitCsvLine(line);
    const sourceDate = parseDate(values[indexes.date]);
    const hour = parseHour(values[indexes.hour]);
    if (!sourceDate || hour === null) {
      malformedCount += 1;
      continue;
    }

    const observedAt = new Date(`${sourceDate}T${String(hour).padStart(2, "0")}:00:00Z`);
    if (Number.isNaN(observedAt.getTime())) {
      malformedCount += 1;
      continue;
    }

    const row: ObservationRow = {
      station_key: STATION_KEY,
      station_code: STATION_CODE,
      observed_at: observedAt.toISOString(),
      source_date: sourceDate,
      source_hour_utc: hour,
      precipitation_mm: valueAt(values, indexes.precipitation),
      pressure_hpa: valueAt(values, indexes.pressure),
      pressure_max_hpa: valueAt(values, indexes.pressureMax),
      pressure_min_hpa: valueAt(values, indexes.pressureMin),
      global_radiation_kj_m2: valueAt(values, indexes.radiation),
      temperature_c: valueAt(values, indexes.temperature),
      dew_point_c: valueAt(values, indexes.dewPoint),
      temperature_max_c: valueAt(values, indexes.temperatureMax),
      temperature_min_c: valueAt(values, indexes.temperatureMin),
      dew_point_max_c: valueAt(values, indexes.dewPointMax),
      dew_point_min_c: valueAt(values, indexes.dewPointMin),
      humidity_max_percent: valueAt(values, indexes.humidityMax),
      humidity_min_percent: valueAt(values, indexes.humidityMin),
      humidity_percent: valueAt(values, indexes.humidity),
      wind_direction_deg: valueAt(values, indexes.windDirection),
      wind_gust_ms: valueAt(values, indexes.windGust),
      wind_speed_ms: valueAt(values, indexes.windSpeed),
      quality_flag: "raw-unvalidated",
      source_file: sourceFile,
    };

    if (!hasUsefulObservation(row)) {
      emptyCount += 1;
      continue;
    }
    rows.push(row);
  }

  return { rows, headers, malformedCount, emptyCount };
}

async function fetchAnnualZip(year: number) {
  const url = `https://portal.inmet.gov.br/uploads/dadoshistoricos/${year}.zip`;
  const response = await fetch(url, {
    headers: {
      Accept: "application/zip, application/octet-stream;q=0.9, */*;q=0.1",
      "User-Agent": "MOBI-Tempo-Pelotas-INMET-Backfill/1.0 (+https://tempopelotas.com.br)",
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`INMET ${year} respondeu HTTP ${response.status}.`);
  return { bytes: new Uint8Array(await response.arrayBuffer()) };
}

function stationFileFromZip(bytes: Uint8Array) {
  const files = unzipSync(bytes, {
    filter: (file) => file.name.toUpperCase().includes(STATION_CODE),
  });
  const entry = Object.entries(files).find(([name]) =>
    name.toUpperCase().includes(STATION_CODE) && name.toLowerCase().endsWith(".csv")
  );
  return entry ? { name: entry[0], bytes: entry[1] } : null;
}

async function upsertBatches(supabase: ReturnType<typeof createClient>, rows: ObservationRow[]) {
  let storedCount = 0;
  for (let index = 0; index < rows.length; index += UPSERT_BATCH_SIZE) {
    const batch = rows.slice(index, index + UPSERT_BATCH_SIZE);
    const { data, error } = await supabase
      .from("inmet_hourly_observations")
      .upsert(batch, { onConflict: "station_code,observed_at" })
      .select("id");
    if (error) throw new Error(`Falha ao persistir lote INMET: ${error.message}`);
    storedCount += data?.length ?? batch.length;
  }
  return storedCount;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return json({ success: false, error: "Método não permitido." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ success: false, error: "Ambiente do Supabase incompleto." }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const receivedToken = request.headers.get("x-collector-token")?.trim() ?? "";
  const { data: settings, error: settingsError } = await supabase
    .from("historical_collector_settings")
    .select("collector_token,enabled")
    .eq("collector_key", COLLECTOR_KEY)
    .maybeSingle();

  if (
    settingsError || !settings?.enabled || !receivedToken
    || !constantTimeEqual(receivedToken, settings.collector_token)
  ) {
    return json({ success: false, error: "Não autorizado." }, 401);
  }

  const body = await request.json().catch(() => ({}));
  const year = isRecord(body) && typeof body.year === "number" ? Math.trunc(body.year) : NaN;
  const stationCode = isRecord(body) && typeof body.stationCode === "string"
    ? body.stationCode.trim().toUpperCase()
    : STATION_CODE;
  const currentYear = new Date().getUTCFullYear();
  if (!Number.isInteger(year) || year < MIN_YEAR || year > currentYear || stationCode !== STATION_CODE) {
    return json({ success: false, error: "Ano ou estação não suportados." }, 400);
  }

  const sourceUrl = `https://portal.inmet.gov.br/uploads/dadoshistoricos/${year}.zip`;
  const { data: run, error: runError } = await supabase
    .from("inmet_historical_backfill_runs")
    .insert({ station_code: STATION_CODE, year, source_url: sourceUrl })
    .select("id")
    .maybeSingle();
  if (runError || !run?.id) {
    return json({ success: false, error: runError?.message ?? "Falha ao abrir run." }, 500);
  }
  const runId = Number(run.id);

  try {
    const annual = await fetchAnnualZip(year);
    const stationFile = stationFileFromZip(annual.bytes);
    if (!stationFile) {
      const message = `A estação ${STATION_CODE} não está presente no arquivo anual de ${year}.`;
      await supabase
        .from("inmet_historical_backfill_runs")
        .update({ finished_at: new Date().toISOString(), success: false, error: message })
        .eq("id", runId);
      return json({ success: false, year, stationCode: STATION_CODE, status: "station-not-found", error: message }, 404);
    }

    const parsed = parseStationCsv(decodeCsv(stationFile.bytes), stationFile.name);
    if (!parsed.rows.length) {
      throw new Error("O CSV da estação não contém observações úteis reconhecidas.");
    }

    const storedCount = await upsertBatches(supabase, parsed.rows);
    const firstObservedAt = parsed.rows[0].observed_at;
    const lastObservedAt = parsed.rows.at(-1)?.observed_at ?? firstObservedAt;
    const finishedAt = new Date().toISOString();

    await supabase
      .from("inmet_historical_backfill_runs")
      .update({
        source_file: stationFile.name,
        finished_at: finishedAt,
        success: true,
        stored_count: storedCount,
        first_observed_at: firstObservedAt,
        last_observed_at: lastObservedAt,
        error: null,
        metadata: {
          parsedRows: parsed.rows.length,
          malformedRows: parsed.malformedCount,
          emptyRows: parsed.emptyCount,
          zipBytes: annual.bytes.byteLength,
          csvBytes: stationFile.bytes.byteLength,
          headerColumns: parsed.headers.length,
          sourceTimezone: "UTC",
          dataQuality: "raw-unvalidated",
        },
      })
      .eq("id", runId);

    const { data: coverage } = await supabase
      .from("inmet_hourly_observations")
      .select("observed_at")
      .eq("station_code", STATION_CODE)
      .order("observed_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (coverage?.observed_at) {
      await supabase
        .from("historical_data_sources")
        .update({ coverage_start: coverage.observed_at })
        .eq("source_key", "inmet-historical");
    }

    return json({
      success: true,
      year,
      stationCode: STATION_CODE,
      sourceFile: stationFile.name,
      storedCount,
      firstObservedAt,
      lastObservedAt,
      malformedRows: parsed.malformedCount,
      emptyRows: parsed.emptyCount,
      zipBytes: annual.bytes.byteLength,
      csvBytes: stationFile.bytes.byteLength,
      completedAt: finishedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await supabase
      .from("inmet_historical_backfill_runs")
      .update({ finished_at: new Date().toISOString(), success: false, error: message })
      .eq("id", runId);
    console.error("[inmet-historical-backfill] Falha", { year, stationCode: STATION_CODE, message });
    return json({ success: false, year, stationCode: STATION_CODE, error: message }, 502);
  }
});
