import type {
  InmetAlert,
  InmetAlertRelevance,
  InmetAlertSeverity,
  InmetAlerts,
} from "./official-sources.types";

const FEED_URLS = [
  "https://apiprevmet3.inmet.gov.br/avisos/rss",
  "https://avisos.inmet.gov.br/cap_12/rss/alert-as.rss",
] as const;
const PORTAL_URL = "https://avisos.inmet.gov.br/";
const PELOTAS_IBGE_CODE = "4314407";
const REQUEST_TIMEOUT_MS = 12_000;
const MAX_DETAIL_REQUESTS = 40;

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
      "User-Agent": "TEMPO-Pelotas/2.0 (+https://www.tempopelotas.com.br)",
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`INMET respondeu com HTTP ${response.status}.`);
  const text = await response.text();
  if (!text.includes("<") || normalizeText(text).includes("limite de requisicoes")) {
    throw new Error("O feed do INMET não retornou XML utilizável.");
  }
  return text;
}

function parameterValues(infoXml: string, includes: string) {
  return tagBlocks(infoXml, "parameter").flatMap((block) => {
    const name = normalizeText(tagText(block, "valueName"));
    return name.includes(includes) ? [tagText(block, "value")] : [];
  });
}

function severityFrom(infoXml: string): { severity: InmetAlertSeverity; label: string } {
  const severity = normalizeText(tagText(infoXml, "severity"));
  const colors = [...parameterValues(infoXml, "cor"), ...parameterValues(infoXml, "color")]
    .join(" ")
    .toLowerCase();
  if (severity.includes("extreme") || colors.includes("ff0000")) {
    return { severity: "great-danger", label: "Grande perigo" };
  }
  if (severity.includes("severe") || colors.includes("ff9900") || colors.includes("ffa500")) {
    return { severity: "danger", label: "Perigo" };
  }
  if (severity.includes("moderate") || colors.includes("ffff00")) {
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
    [event, headline, description, instruction, areas.join(" "), municipalities.join(" ")].join(
      " ",
    ),
    municipalityCodes,
  );
  if (!relevance) return null;
  const startsAt = safeDate(tagText(info, "onset") || tagText(info, "effective"));
  const expiresAt = safeDate(tagText(info, "expires"));
  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) return null;
  const severity = severityFrom(info);
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

function unavailable(error: string, feedUrl = FEED_URLS[0]): InmetAlerts {
  return {
    status: "unavailable",
    alerts: [],
    counts: { total: 0, pelotas: 0, regional: 0, state: 0 },
    source: { name: "INMET", feedUrl, portalUrl: PORTAL_URL, fetchedAt: new Date().toISOString() },
    error,
  };
}

export async function fetchInmetAlerts(): Promise<InmetAlerts> {
  let lastError = "Os avisos do INMET não puderam ser consultados.";
  for (const feedUrl of FEED_URLS) {
    try {
      const feedXml = await fetchText(feedUrl);
      const urls = detailUrls(feedXml, feedUrl);
      const settled = await Promise.allSettled(
        urls.map(async (url) => parseCapAlert(await fetchText(url), url)),
      );
      const alerts = settled
        .flatMap((result) => (result.status === "fulfilled" && result.value ? [result.value] : []))
        .filter((alert, index, all) => all.findIndex((item) => item.id === alert.id) === index)
        .sort((a, b) => {
          const relevanceRank = { pelotas: 0, regional: 1, state: 2 } as const;
          return relevanceRank[a.relevance] - relevanceRank[b.relevance];
        });
      return {
        status: "live",
        alerts,
        counts: {
          total: alerts.length,
          pelotas: alerts.filter((alert) => alert.relevance === "pelotas").length,
          regional: alerts.filter((alert) => alert.relevance === "regional").length,
          state: alerts.filter((alert) => alert.relevance === "state").length,
        },
        source: {
          name: "INMET",
          feedUrl,
          portalUrl: PORTAL_URL,
          fetchedAt: new Date().toISOString(),
        },
        error: null,
      };
    } catch (error) {
      lastError =
        error instanceof Error ? error.message : "Falha desconhecida ao consultar o INMET.";
    }
  }
  return unavailable(lastError);
}
