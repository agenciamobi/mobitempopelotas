const INMET_FEED_URLS = [
  "https://apiprevmet3.inmet.gov.br/avisos/rss",
  "https://avisos.inmet.gov.br/cap_12/rss/alert-as.rss",
] as const;

const INMET_PORTAL_URL = "https://avisos.inmet.gov.br/";
const CACHE_SECONDS = 900;
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_DETAIL_REQUESTS = 60;
const PELOTAS_IBGE_CODE = "4314407";

export type InmetAlertSeverity = "potential" | "danger" | "great-danger" | "unknown";
export type InmetAlertRelevance = "pelotas" | "regional" | "state";
export type InmetAlertPeriod = "active" | "upcoming";

export type InmetAlert = {
  id: string;
  event: string;
  headline: string;
  description: string;
  instruction: string;
  severity: InmetAlertSeverity;
  severityLabel: string;
  relevance: InmetAlertRelevance;
  period: InmetAlertPeriod;
  startsAt: string | null;
  expiresAt: string | null;
  sentAt: string | null;
  areas: string[];
  municipalities: string[];
  municipalityCodes: string[];
  officialUrl: string;
};

export type InmetAlertsData = {
  status: "live" | "unavailable";
  source: {
    name: "INMET";
    feedUrl: string;
    portalUrl: string;
    fetchedAt: string;
  };
  alerts: InmetAlert[];
  counts: {
    total: number;
    pelotas: number;
    regional: number;
    state: number;
  };
  error: string | null;
};

function decodeXml(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
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
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function detailUrl(rawValue: string, baseUrl: string) {
  const value = cleanText(rawValue).trim();
  if (!value) return null;

  try {
    const url = new URL(value, baseUrl);
    if (!url.hostname.endsWith("inmet.gov.br")) return null;
    return url.toString();
  } catch {
    const id = value.match(/(?:avisos\/rss\/)?(\d{3,})/)?.[1];
    return id ? `https://apiprevmet3.inmet.gov.br/avisos/rss/${id}` : null;
  }
}

async function fetchInmetText(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.1",
        "User-Agent": "TempoPelotas/1.0 (+https://tempopelotas.agenciamobi.com.br)",
      },
      next: { revalidate: CACHE_SECONDS },
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`INMET respondeu com HTTP ${response.status}`);
    const text = await response.text();
    const normalized = normalizeText(text);

    if (
      normalized.includes("limite de requisicoes") ||
      normalized.includes("enable javascript") ||
      (!text.includes("<") && text.length < 500)
    ) {
      throw new Error("O feed do INMET não retornou XML utilizável");
    }

    return text;
  } finally {
    clearTimeout(timeout);
  }
}

function parameterMap(infoXml: string) {
  const result = new Map<string, string[]>();

  for (const block of tagBlocks(infoXml, "parameter")) {
    const name = normalizeText(tagText(block, "valueName"));
    const value = tagText(block, "value");
    if (!name || !value) continue;
    result.set(name, [...(result.get(name) ?? []), value]);
  }

  return result;
}

function severityFrom(infoXml: string, parameters: Map<string, string[]>) {
  const capSeverity = normalizeText(tagText(infoXml, "severity"));
  const colorValues = Array.from(parameters.entries())
    .filter(([name]) => name.includes("cor") || name.includes("color"))
    .flatMap(([, values]) => values)
    .join(" ")
    .toLowerCase();

  if (capSeverity.includes("extreme") || colorValues.includes("ff0000")) {
    return { severity: "great-danger" as const, label: "Grande perigo" };
  }
  if (capSeverity.includes("severe") || colorValues.includes("ff9900") || colorValues.includes("ffa500")) {
    return { severity: "danger" as const, label: "Perigo" };
  }
  if (capSeverity.includes("moderate") || colorValues.includes("ffff00")) {
    return { severity: "potential" as const, label: "Perigo potencial" };
  }
  return { severity: "unknown" as const, label: "Aviso meteorológico" };
}

function getMunicipalityData(infoXml: string, parameters: Map<string, string[]>) {
  const parameterMunicipalities = Array.from(parameters.entries())
    .filter(([name]) => name.includes("municip"))
    .flatMap(([, values]) => values);
  const combined = [infoXml, ...parameterMunicipalities].join(" ");
  const municipalityCodes = unique(combined.match(/\b\d{7}\b/g) ?? []);
  const municipalities = unique(
    parameterMunicipalities
      .flatMap((value) => cleanText(value).split(/[,;|\n]+/))
      .filter((value) => !/^\d+$/.test(value.trim())),
  );

  return { municipalityCodes, municipalities };
}

function getRelevance(
  searchableText: string,
  municipalityCodes: string[],
): InmetAlertRelevance | null {
  const normalized = normalizeText(searchableText);
  const hasPelotas = municipalityCodes.includes(PELOTAS_IBGE_CODE) || /\bpelotas\b/.test(normalized);
  if (hasPelotas) return "pelotas";

  const isRs = municipalityCodes.some((code) => code.startsWith("43")) ||
    normalized.includes("rio grande do sul") ||
    /(?:^|[\s,;|/()-])rs(?:$|[\s,;|/()-])/.test(normalized);
  if (!isRs) return null;

  const regionalTerms = [
    "zona sul",
    "sudeste rio-grandense",
    "sudeste riograndense",
    "litoral sul",
    "campanha",
    "regiao de pelotas",
  ];
  return regionalTerms.some((term) => normalized.includes(term)) ? "regional" : "state";
}

function chooseInfoBlock(alertXml: string) {
  const blocks = tagBlocks(alertXml, "info");
  return blocks.find((block) => normalizeText(tagText(block, "language")).startsWith("pt")) ?? blocks[0] ?? "";
}

function parseCapAlert(alertXml: string, fallbackUrl: string): InmetAlert | null {
  const info = chooseInfoBlock(alertXml);
  if (!info) return null;

  const parameters = parameterMap(info);
  const areaBlocks = tagBlocks(info, "area");
  const areas = unique(areaBlocks.map((area) => tagText(area, "areaDesc")));
  const { municipalityCodes, municipalities } = getMunicipalityData(info, parameters);
  const event = tagText(info, "event") || tagText(info, "headline") || "Aviso meteorológico";
  const headline = tagText(info, "headline") || event;
  const description = tagText(info, "description");
  const instruction = tagText(info, "instruction");
  const identifier = tagText(alertXml, "identifier") || fallbackUrl;
  const officialUrl = detailUrl(tagText(info, "web"), fallbackUrl) ?? fallbackUrl ?? INMET_PORTAL_URL;
  const startsAt = safeDate(tagText(info, "onset") || tagText(info, "effective"));
  const expiresAt = safeDate(tagText(info, "expires"));
  const sentAt = safeDate(tagText(alertXml, "sent"));
  const searchable = [event, headline, description, instruction, areas.join(" "), municipalities.join(" "), municipalityCodes.join(" ")].join(" ");
  const relevance = getRelevance(searchable, municipalityCodes);
  if (!relevance) return null;

  const now = Date.now();
  if (expiresAt && new Date(expiresAt).getTime() < now) return null;
  const period: InmetAlertPeriod = startsAt && new Date(startsAt).getTime() > now ? "upcoming" : "active";
  const severity = severityFrom(info, parameters);

  return {
    id: identifier,
    event,
    headline,
    description,
    instruction,
    severity: severity.severity,
    severityLabel: severity.label,
    relevance,
    period,
    startsAt,
    expiresAt,
    sentAt,
    areas,
    municipalities,
    municipalityCodes,
    officialUrl,
  };
}

function parseGenericRssItem(itemXml: string, feedUrl: string): InmetAlert | null {
  const title = tagText(itemXml, "title") || "Aviso meteorológico";
  const description = tagText(itemXml, "description");
  const link = detailUrl(tagText(itemXml, "link") || tagText(itemXml, "guid"), feedUrl) ?? INMET_PORTAL_URL;
  const text = [title, description].join(" ");
  const codes = unique(text.match(/\b\d{7}\b/g) ?? []);
  const relevance = getRelevance(text, codes);
  if (!relevance) return null;

  return {
    id: tagText(itemXml, "guid") || link || title,
    event: title.replace(/^aviso\s+de\s+/i, ""),
    headline: title,
    description,
    instruction: "",
    severity: "unknown",
    severityLabel: "Aviso meteorológico",
    relevance,
    period: "active",
    startsAt: safeDate(tagText(itemXml, "pubDate")),
    expiresAt: null,
    sentAt: safeDate(tagText(itemXml, "pubDate")),
    areas: [],
    municipalities: [],
    municipalityCodes: codes,
    officialUrl: link,
  };
}

function getDetailUrls(feedXml: string, feedUrl: string) {
  const items = tagBlocks(feedXml, "item");
  const candidates = items.flatMap((item) => [tagText(item, "link"), tagText(item, "guid")]);
  const embeddedUrls = Array.from(
    feedXml.matchAll(/https?:\/\/[^\s<>"']+/gi),
    (match) => decodeXml(match[0]),
  );

  return unique([...candidates, ...embeddedUrls])
    .map((value) => detailUrl(value, feedUrl))
    .filter((value): value is string => Boolean(value))
    .filter((url) => /(?:avisos\/rss\/\d+|\.xml(?:\?|$)|cap_12)/i.test(url))
    .slice(0, MAX_DETAIL_REQUESTS);
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, mapper: (item: T) => Promise<R>) {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await mapper(items[index]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

function sortAlerts(alerts: InmetAlert[]) {
  const relevanceRank: Record<InmetAlertRelevance, number> = { pelotas: 0, regional: 1, state: 2 };
  const severityRank: Record<InmetAlertSeverity, number> = { "great-danger": 0, danger: 1, potential: 2, unknown: 3 };

  return alerts.sort((a, b) =>
    relevanceRank[a.relevance] - relevanceRank[b.relevance] ||
    severityRank[a.severity] - severityRank[b.severity] ||
    (a.startsAt ?? "").localeCompare(b.startsAt ?? ""),
  );
}

async function readFeed(feedUrl: string) {
  const feedXml = await fetchInmetText(feedUrl);
  const directAlerts = tagBlocks(feedXml, "alert")
    .map((block) => parseCapAlert(`<alert>${block}</alert>`, feedUrl))
    .filter((alert): alert is InmetAlert => Boolean(alert));

  const detailUrls = getDetailUrls(feedXml, feedUrl);
  const detailedAlerts = detailUrls.length
    ? (await mapWithConcurrency(detailUrls, 4, async (url) => {
        try {
          const xml = await fetchInmetText(url);
          const blocks = tagBlocks(xml, "alert");
          if (blocks.length) return blocks.map((block) => parseCapAlert(`<alert>${block}</alert>`, url));
          return [parseCapAlert(xml, url)];
        } catch {
          return [];
        }
      })).flat().filter((alert): alert is InmetAlert => Boolean(alert))
    : [];

  const genericAlerts = tagBlocks(feedXml, "item")
    .map((item) => parseGenericRssItem(item, feedUrl))
    .filter((alert): alert is InmetAlert => Boolean(alert));

  const byId = new Map<string, InmetAlert>();
  for (const alert of [...directAlerts, ...detailedAlerts, ...genericAlerts]) {
    const existing = byId.get(alert.id);
    if (!existing || existing.severity === "unknown") byId.set(alert.id, alert);
  }

  return sortAlerts(Array.from(byId.values())).slice(0, 40);
}

export async function getInmetAlerts(): Promise<InmetAlertsData> {
  const fetchedAt = new Date().toISOString();
  let lastError = "O serviço de avisos do INMET não respondeu.";

  for (const feedUrl of INMET_FEED_URLS) {
    try {
      const alerts = await readFeed(feedUrl);
      return {
        status: "live",
        source: { name: "INMET", feedUrl, portalUrl: INMET_PORTAL_URL, fetchedAt },
        alerts,
        counts: {
          total: alerts.length,
          pelotas: alerts.filter((alert) => alert.relevance === "pelotas").length,
          regional: alerts.filter((alert) => alert.relevance === "regional").length,
          state: alerts.filter((alert) => alert.relevance === "state").length,
        },
        error: null,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : lastError;
    }
  }

  return {
    status: "unavailable",
    source: { name: "INMET", feedUrl: INMET_FEED_URLS[0], portalUrl: INMET_PORTAL_URL, fetchedAt },
    alerts: [],
    counts: { total: 0, pelotas: 0, regional: 0, state: 0 },
    error: lastError,
  };
}
