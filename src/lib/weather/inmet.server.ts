import type {
  InmetAlert,
  InmetAlertRelevance,
  InmetAlertSeverity,
  InmetAlerts,
} from "./official-sources.types";
import { WEATHER_SOURCE_REQUEST_TIMEOUT_MS } from "./source-policy.ts";

const PELOTAS_IBGE_CODE = "4314407";
const MUNICIPAL_ALERTS_URL = `https://apiprevmet3.inmet.gov.br/avisos/getByGeocode/${PELOTAS_IBGE_CODE}`;
const FEED_URLS = [
  "https://apiprevmet3.inmet.gov.br/avisos/rss",
  "https://avisos.inmet.gov.br/cap_12/rss/alert-as.rss",
] as const;
const PORTAL_URL = "https://avisos.inmet.gov.br/";
const MAX_DETAIL_REQUESTS = 40;

type JsonRecord = Record<string, unknown>;

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'");
}

function cleanText(value: string) {
  return decodeXml(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[\t\r ]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .trim();
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizeKey(value: string) {
  return normalizeText(value).replace(/[^a-z0-9]/g, "");
}

function asRecord(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null;
}

function asText(value: unknown) {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const text = cleanText(String(value));
  return text || null;
}

function findValue(record: JsonRecord, aliases: readonly string[]) {
  const normalized = new Map(Object.entries(record).map(([key, value]) => [normalizeKey(key), value]));
  for (const alias of aliases) {
    const value = normalized.get(normalizeKey(alias));
    if (value !== undefined && value !== null) return value;
  }
  return null;
}

function collectRecords(value: unknown): JsonRecord[] {
  if (Array.isArray(value)) return value.flatMap(collectRecords);
  const record = asRecord(value);
  if (!record) return [];
  return [record, ...Object.values(record).flatMap(collectRecords)];
}

function tagBlocks(xml: string, tag: string) {
  const pattern = new RegExp(
    `<(?:[\\w-]+:)?${tag}\\b[^>]*>([\\s\\S]*?)<\\/(?:[\\w-]+:)?${tag}>`,
    "gi",
  );
  return Array.from(xml.matchAll(pattern), (match) => match[1]);
}

function tagText(xml: string, tag: string) {
  const block = tagBlocks(xml, tag)[0];
  return block ? cleanText(block) : "";
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function safeDate(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.trim();
  const brazilian = normalized.match(/^(\d{2})\/(\d{2})\/(20\d{2})(?:\s+(\d{2}):(\d{2}))?/);
  const date = brazilian
    ? new Date(
        `${brazilian[3]}-${brazilian[2]}-${brazilian[1]}T${brazilian[4] ?? "00"}:${brazilian[5] ?? "00"}:00-03:00`,
      )
    : new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function safeOfficialUrl(rawValue: string, baseUrl: string) {
  const value = cleanText(rawValue);
  if (!value) return null;
  try {
    const url = new URL(value, baseUrl);
    return url.hostname.endsWith("inmet.gov.br") ? url.toString() : null;
  } catch {
    return null;
  }
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.1",
      "User-Agent": "TEMPO-Pelotas/2.0 (+https://tempopelotas.com.br)",
    },
    signal: AbortSignal.timeout(WEATHER_SOURCE_REQUEST_TIMEOUT_MS.inmet),
  });
  if (!response.ok) throw new Error(`INMET respondeu com HTTP ${response.status}.`);
  const text = await response.text();
  if (!text.includes("<") || normalizeText(text).includes("limite de requisicoes")) {
    throw new Error("O feed do INMET não retornou XML utilizável.");
  }
  return text;
}

async function fetchJson(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "pt-BR,pt;q=0.9",
      "User-Agent": "TEMPO-Pelotas/2.0 (+https://tempopelotas.com.br)",
    },
    signal: AbortSignal.timeout(WEATHER_SOURCE_REQUEST_TIMEOUT_MS.inmet),
  });
  if (!response.ok) throw new Error(`INMET respondeu com HTTP ${response.status}.`);
  return (await response.json()) as unknown;
}

function severityFromText(value: string): { severity: InmetAlertSeverity; label: string } {
  const normalized = normalizeText(value);
  if (/grande perigo|extreme|extremo|vermelh|ff0000/.test(normalized)) {
    return { severity: "great-danger", label: "Grande perigo" };
  }
  if (/perigo|severe|severo|laranja|ff9900|ffa500/.test(normalized)) {
    return { severity: "danger", label: "Perigo" };
  }
  if (/potencial|moderate|moderado|amarel|ffff00/.test(normalized)) {
    return { severity: "potential", label: "Perigo potencial" };
  }
  return { severity: "unknown", label: "Aviso meteorológico" };
}

function relevanceFrom(text: string, codes: string[]): InmetAlertRelevance | null {
  const normalized = normalizeText(text);
  if (codes.includes(PELOTAS_IBGE_CODE) || /\bpelotas\b/.test(normalized)) return "pelotas";
  const isRs =
    codes.some((code) => code.startsWith("43")) ||
    normalized.includes("rio grande do sul") ||
    /(?:^|[\s,;|/()-])rs(?:$|[\s,;|/()-])/.test(normalized);
  if (!isRs) return null;
  const regional = ["zona sul", "litoral sul", "campanha", "regiao de pelotas"].some((term) =>
    normalized.includes(term),
  );
  return regional ? "regional" : "state";
}

function parameterValues(infoXml: string, includes: string) {
  return tagBlocks(infoXml, "parameter").flatMap((block) => {
    const name = normalizeText(tagText(block, "valueName"));
    return name.includes(includes) ? [tagText(block, "value")] : [];
  });
}

function parseCapAlert(xml: string, fallbackUrl: string): InmetAlert | null {
  const infoBlocks = tagBlocks(xml, "info");
  const info =
    infoBlocks.find((block) => normalizeText(tagText(block, "language")).startsWith("pt")) ??
    infoBlocks[0];
  if (!info) return null;

  const areaBlocks = tagBlocks(info, "area");
  const areas = unique(areaBlocks.map((area) => tagText(area, "areaDesc")));
  const municipalityValues = parameterValues(info, "municip");
  const searchable = [info, ...municipalityValues].join(" ");
  const municipalityCodes = unique(searchable.match(/\b\d{7}\b/g) ?? []);
  const municipalities = unique(
    municipalityValues
      .flatMap((value) => cleanText(value).split(/[,;|\n]+/))
      .filter((value) => !/^\d+$/.test(value.trim())),
  );
  const event = tagText(info, "event") || tagText(info, "headline") || "Aviso meteorológico";
  const headline = tagText(info, "headline") || event;
  const description = tagText(info, "description");
  const instruction = tagText(info, "instruction");
  const relevance = relevanceFrom(
    [event, headline, description, instruction, areas.join(" "), municipalities.join(" ")].join(" "),
    municipalityCodes,
  );
  if (!relevance) return null;

  const startsAt = safeDate(tagText(info, "onset") || tagText(info, "effective"));
  const expiresAt = safeDate(tagText(info, "expires"));
  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) return null;
  const severity = severityFromText(
    [tagText(info, "severity"), ...parameterValues(info, "cor"), ...parameterValues(info, "color")].join(" "),
  );

  return {
    id: tagText(xml, "identifier") || fallbackUrl,
    event,
    headline,
    description,
    instruction,
    severity: severity.severity,
    severityLabel: severity.label,
    relevance,
    period: startsAt && new Date(startsAt).getTime() > Date.now() ? "upcoming" : "active",
    startsAt,
    expiresAt,
    sentAt: safeDate(tagText(xml, "sent")),
    areas,
    municipalities,
    municipalityCodes,
    officialUrl: safeOfficialUrl(tagText(info, "web"), fallbackUrl) ?? fallbackUrl,
  };
}

function toTextArray(value: unknown) {
  if (Array.isArray(value)) return unique(value.flatMap((item) => toTextArray(item)));
  const text = asText(value);
  return text ? unique(text.split(/[,;|\n]+/)) : [];
}

function parseJsonAlert(record: JsonRecord, index: number): InmetAlert | null {
  const event = asText(findValue(record, ["evento", "event", "tipo", "aviso", "titulo", "headline"]));
  const headline = asText(findValue(record, ["headline", "titulo", "aviso", "evento", "event"])) ?? event;
  if (!event && !headline) return null;

  const description = asText(findValue(record, ["descricao", "description", "riscos", "risco", "detalhes"])) ?? "";
  const instruction =
    asText(findValue(record, ["instrucoes", "instruction", "recomendacoes", "orientacoes"])) ?? "";
  const startsAt = safeDate(
    asText(findValue(record, ["inicio", "onset", "effective", "data_inicio", "dataInicial"])),
  );
  const expiresAt = safeDate(
    asText(findValue(record, ["fim", "expires", "data_fim", "dataFinal", "validade"])),
  );
  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) return null;

  const municipalities = toTextArray(
    findValue(record, ["municipios", "municipalities", "cidades", "areas", "area"]),
  );
  const searchable = [event, headline, description, instruction, municipalities.join(" ")].join(" ");
  const municipalityCodes = unique([
    PELOTAS_IBGE_CODE,
    ...(searchable.match(/\b\d{7}\b/g) ?? []),
  ]);
  const severity = severityFromText(
    asText(findValue(record, ["severidade", "severity", "grau", "nivel", "cor", "color"])) ?? "",
  );
  const identifier =
    asText(findValue(record, ["id", "identifier", "codigo", "codigo_aviso"])) ??
    `inmet-pelotas-${startsAt ?? index}`;
  const officialUrl =
    safeOfficialUrl(
      asText(findValue(record, ["url", "link", "web", "link_aviso"])) ?? "",
      PORTAL_URL,
    ) ?? PORTAL_URL;

  return {
    id: identifier,
    event: event ?? headline ?? "Aviso meteorológico",
    headline: headline ?? event ?? "Aviso meteorológico",
    description,
    instruction,
    severity: severity.severity,
    severityLabel: severity.label,
    relevance: "pelotas",
    period: startsAt && new Date(startsAt).getTime() > Date.now() ? "upcoming" : "active",
    startsAt,
    expiresAt,
    sentAt: safeDate(asText(findValue(record, ["enviado", "sent", "data_envio", "publicado"]))),
    areas: municipalities,
    municipalities: municipalities.length ? municipalities : ["Pelotas"],
    municipalityCodes,
    officialUrl,
  };
}

function detailUrls(feedXml: string, feedUrl: string) {
  const values = [
    ...tagBlocks(feedXml, "item").flatMap((item) => [tagText(item, "link"), tagText(item, "guid")]),
    ...Array.from(feedXml.matchAll(/https?:\/\/[^\s<>"']+/gi), (match) => decodeXml(match[0])),
  ];
  return unique(values)
    .map((value) => safeOfficialUrl(value, feedUrl))
    .filter((value): value is string => Boolean(value))
    .filter((url) => /(?:avisos\/rss\/\d+|\.xml(?:\?|$)|cap_12)/i.test(url))
    .slice(0, MAX_DETAIL_REQUESTS);
}

function response(alerts: InmetAlert[], feedUrl: string): InmetAlerts {
  const normalized = alerts
    .filter((alert, index, all) => all.findIndex((item) => item.id === alert.id) === index)
    .sort((first, second) => {
      const relevanceRank = { pelotas: 0, regional: 1, state: 2 } as const;
      return relevanceRank[first.relevance] - relevanceRank[second.relevance];
    });

  return {
    status: "live",
    alerts: normalized,
    counts: {
      total: normalized.length,
      pelotas: normalized.filter((alert) => alert.relevance === "pelotas").length,
      regional: normalized.filter((alert) => alert.relevance === "regional").length,
      state: normalized.filter((alert) => alert.relevance === "state").length,
    },
    source: { name: "INMET", feedUrl, portalUrl: PORTAL_URL, fetchedAt: new Date().toISOString() },
    error: null,
  };
}

function unavailable(error: string, feedUrl = MUNICIPAL_ALERTS_URL): InmetAlerts {
  return {
    status: "unavailable",
    alerts: [],
    counts: { total: 0, pelotas: 0, regional: 0, state: 0 },
    source: { name: "INMET", feedUrl, portalUrl: PORTAL_URL, fetchedAt: new Date().toISOString() },
    error,
  };
}

async function fetchMunicipalAlerts() {
  const payload = await fetchJson(MUNICIPAL_ALERTS_URL);
  const records = collectRecords(payload);
  const alerts = records.flatMap((record, index) => {
    const parsed = parseJsonAlert(record, index);
    return parsed ? [parsed] : [];
  });

  const payloadIsEmpty = Array.isArray(payload) && payload.length === 0;
  if (!payloadIsEmpty && records.length > 0 && alerts.length === 0) {
    throw new Error("O endpoint municipal do INMET retornou uma estrutura não reconhecida.");
  }
  return response(alerts, MUNICIPAL_ALERTS_URL);
}

async function fetchRssAlerts() {
  const attempts = await Promise.allSettled(
    FEED_URLS.map(async (feedUrl) => {
      const feedXml = await fetchText(feedUrl);
      const urls = detailUrls(feedXml, feedUrl);
      const settled = await Promise.allSettled(
        urls.map(async (url) => parseCapAlert(await fetchText(url), url)),
      );
      const alerts = settled.flatMap((result) =>
        result.status === "fulfilled" && result.value ? [result.value] : [],
      );
      return response(alerts, feedUrl);
    }),
  );

  for (const attempt of attempts) {
    if (attempt.status === "fulfilled") return attempt.value;
  }
  throw new Error(
    unique(
      attempts.flatMap((attempt) =>
        attempt.status === "rejected" && attempt.reason instanceof Error
          ? [attempt.reason.message]
          : [],
      ),
    ).join(" ") || "Os feeds do INMET não puderam ser consultados.",
  );
}

export async function fetchInmetAlerts(): Promise<InmetAlerts> {
  try {
    return await fetchMunicipalAlerts();
  } catch (municipalError) {
    try {
      return await fetchRssAlerts();
    } catch (rssError) {
      const messages = [municipalError, rssError]
        .map((error) => (error instanceof Error ? error.message : null))
        .filter((message): message is string => Boolean(message));
      return unavailable(unique(messages).join(" ") || "Os avisos do INMET não puderam ser consultados.");
    }
  }
}
