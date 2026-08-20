import type {
  InmetAlert,
  InmetAlertRelevance,
  InmetAlerts,
} from "./official-sources.types";
import { classifyInmetSeverityText } from "./inmet-severity";
import { fetchInmetAlerts as fetchBaseInmetAlerts } from "./inmet.server";
import { WEATHER_SOURCE_REQUEST_TIMEOUT_MS } from "./source-policy.ts";

const PELOTAS_IBGE_CODE = "4314407";
const INMET_RSS_URL = "https://apiprevmet3.inmet.gov.br/avisos/rss";
const INMET_PORTAL_URL = "https://avisos.inmet.gov.br/";
const MAX_RSS_DETAIL_REQUESTS = 48;

type RssAlert = InmetAlert & {
  numericIds: string[];
};

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
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
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

function safeDate(value: string) {
  const raw = cleanText(value);
  if (!raw) return null;

  const brazilian = raw.match(
    /^(\d{2})[\/-](\d{2})[\/-](20\d{2})(?:[ T]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/,
  );
  if (brazilian) {
    const date = new Date(
      `${brazilian[3]}-${brazilian[2]}-${brazilian[1]}T${(brazilian[4] ?? "00").padStart(2, "0")}:${brazilian[5] ?? "00"}:${brazilian[6] ?? "00"}-03:00`,
    );
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function safeOfficialUrl(value: string, fallback = INMET_PORTAL_URL) {
  const raw = cleanText(value);
  if (!raw) return fallback;

  try {
    const url = new URL(raw, fallback);
    return url.hostname.endsWith("inmet.gov.br") ? url.toString() : fallback;
  } catch {
    return fallback;
  }
}

function parameterValues(infoXml: string, includes: string) {
  return tagBlocks(infoXml, "parameter").flatMap((block) => {
    const name = normalizeText(tagText(block, "valueName"));
    return name.includes(includes) ? [tagText(block, "value")] : [];
  });
}

function numericIds(...values: string[]) {
  return unique(values.flatMap((value) => value.match(/\b\d{5,8}\b/g) ?? []));
}

function relevanceFromCap(info: string, municipalityCodes: string[]): InmetAlertRelevance | null {
  const normalized = normalizeText(info);
  if (municipalityCodes.includes(PELOTAS_IBGE_CODE) || /\bpelotas\b/.test(normalized)) {
    return "pelotas";
  }

  const isRs =
    municipalityCodes.some((code) => code.startsWith("43")) ||
    normalized.includes("rio grande do sul") ||
    /(?:^|[\s,;|/()-])rs(?:$|[\s,;|/()-])/.test(normalized);

  if (!isRs) return null;

  return ["zona sul", "litoral sul", "campanha", "regiao de pelotas"].some((term) =>
    normalized.includes(term),
  )
    ? "regional"
    : "state";
}

async function fetchText(url: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.1",
      "User-Agent": "TEMPO-Pelotas/2.0 (+https://tempopelotas.com.br)",
    },
    signal: AbortSignal.timeout(WEATHER_SOURCE_REQUEST_TIMEOUT_MS.inmet),
  });

  if (!response.ok) throw new Error(`INMET RSS respondeu com HTTP ${response.status}.`);
  const text = await response.text();
  if (!text.includes("<")) throw new Error("O RSS do INMET não retornou XML utilizável.");
  return text;
}

function extractDetailUrls(feedXml: string) {
  const ids = unique([
    ...Array.from(
      feedXml.matchAll(/apiprevmet3\.inmet\.gov\.br\/avisos\/rss\/(\d{5,8})/gi),
      (match) => match[1],
    ),
    ...Array.from(
      feedXml.matchAll(/avisos\.inmet\.gov\.br\/(\d{5,8})(?:\b|[/?#])/gi),
      (match) => match[1],
    ),
  ]).slice(0, MAX_RSS_DETAIL_REQUESTS);

  return ids.map((id) => `${INMET_RSS_URL}/${id}`);
}

function parseCapAlert(xml: string, detailUrl: string): RssAlert | null {
  const infoBlocks = tagBlocks(xml, "info");
  const info =
    infoBlocks.find((block) => normalizeText(tagText(block, "language")).startsWith("pt")) ??
    infoBlocks[0];
  if (!info) return null;

  const municipalityValues = parameterValues(info, "municip");
  const municipalityCodes = unique(
    [info, ...municipalityValues].join(" ").match(/\b\d{7}\b/g) ?? [],
  );
  const relevance = relevanceFromCap(
    [info, ...municipalityValues].join(" "),
    municipalityCodes,
  );
  if (!relevance) return null;

  const areas = unique(tagBlocks(info, "area").map((area) => tagText(area, "areaDesc")));
  const municipalities = unique(
    municipalityValues
      .flatMap((value) => cleanText(value).split(/[,;|\n]+/))
      .filter((value) => value && !/^\d+$/.test(value)),
  );
  const event = tagText(info, "event") || tagText(info, "headline") || "Aviso meteorológico";
  const headline = tagText(info, "headline") || event;
  const description = tagText(info, "description");
  const instruction = tagText(info, "instruction");
  const severity = classifyInmetSeverityText(
    [
      tagText(info, "severity"),
      ...parameterValues(info, "cor"),
      ...parameterValues(info, "color"),
      headline,
    ].join(" "),
  );
  const startsAt = safeDate(tagText(info, "onset") || tagText(info, "effective"));
  const expiresAt = safeDate(tagText(info, "expires"));
  if (expiresAt && new Date(expiresAt).getTime() < Date.now()) return null;

  const id = tagText(xml, "identifier") || detailUrl;
  const officialUrl = safeOfficialUrl(tagText(info, "web"), detailUrl);

  return {
    id,
    numericIds: numericIds(id, detailUrl, officialUrl),
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
    officialUrl,
  };
}

async function fetchRssAlerts() {
  const feedXml = await fetchText(INMET_RSS_URL);
  const detailUrls = extractDetailUrls(feedXml);
  if (!detailUrls.length) return [];

  const settled = await Promise.allSettled(
    detailUrls.map(async (detailUrl) => parseCapAlert(await fetchText(detailUrl), detailUrl)),
  );

  return settled.flatMap((result) =>
    result.status === "fulfilled" && result.value ? [result.value] : [],
  );
}

function idsForAlert(alert: InmetAlert) {
  return numericIds(alert.id, alert.officialUrl);
}

function textClassification(alert: InmetAlert) {
  return classifyInmetSeverityText(
    [alert.severityLabel, alert.headline, alert.event].filter(Boolean).join(" "),
  );
}

function sameAlertById(base: InmetAlert, rss: RssAlert) {
  const baseIds = idsForAlert(base);
  return baseIds.some((id) => rss.numericIds.includes(id));
}

function uniqueEventMatch(base: InmetAlert, rssAlerts: RssAlert[]) {
  const event = normalizeText(base.event);
  if (!event) return null;

  const candidates = rssAlerts.filter((rss) => normalizeText(rss.event) === event);
  return candidates.length === 1 ? candidates[0] : null;
}

function enrichAlert(base: InmetAlert, rssAlerts: RssAlert[]) {
  const rss = rssAlerts.find((candidate) => sameAlertById(base, candidate)) ?? uniqueEventMatch(base, rssAlerts);
  const localClassification = textClassification(base);

  if (!rss) {
    return localClassification.severity === "unknown"
      ? base
      : {
          ...base,
          severity: localClassification.severity,
          severityLabel: localClassification.label,
        };
  }

  return {
    ...base,
    event: rss.event || base.event,
    headline: rss.headline || base.headline,
    description: base.description || rss.description,
    instruction: base.instruction || rss.instruction,
    severity: rss.severity,
    severityLabel: rss.severityLabel,
    startsAt: rss.startsAt ?? base.startsAt,
    expiresAt: rss.expiresAt ?? base.expiresAt,
    sentAt: rss.sentAt ?? base.sentAt,
    areas: base.areas.length ? base.areas : rss.areas,
    municipalities: base.municipalities.length ? base.municipalities : rss.municipalities,
    municipalityCodes: unique([...base.municipalityCodes, ...rss.municipalityCodes]),
    officialUrl: rss.officialUrl || base.officialUrl,
  } satisfies InmetAlert;
}

function dedupeAlerts(alerts: InmetAlert[]) {
  return alerts.filter((alert, index, all) => {
    const ids = idsForAlert(alert);
    if (!ids.length) return all.findIndex((candidate) => candidate.id === alert.id) === index;

    return (
      all.findIndex((candidate) => {
        const candidateIds = idsForAlert(candidate);
        return candidateIds.some((candidateId) => ids.includes(candidateId));
      }) === index
    );
  });
}

function summarize(base: InmetAlerts, alerts: InmetAlert[], rssUsed: boolean): InmetAlerts {
  const normalized = dedupeAlerts(alerts);
  return {
    ...base,
    alerts: normalized,
    counts: {
      total: normalized.length,
      pelotas: normalized.filter((alert) => alert.relevance === "pelotas").length,
      regional: normalized.filter((alert) => alert.relevance === "regional").length,
      state: normalized.filter((alert) => alert.relevance === "state").length,
    },
    source: {
      ...base.source,
      feedUrl: rssUsed ? INMET_RSS_URL : base.source.feedUrl,
      fetchedAt: new Date().toISOString(),
    },
  };
}

/**
 * Mantém o endpoint municipal como filtro direto de Pelotas e usa o RSS/CAP
 * oficial para estabilizar severidade, cor e validade dos avisos quando os
 * identificadores permitem o cruzamento.
 */
export async function fetchStableInmetAlerts(): Promise<InmetAlerts> {
  const base = await fetchBaseInmetAlerts();
  const baseAlerts = base.alerts.map((alert) => enrichAlert(alert, []));

  try {
    const rssAlerts = await fetchRssAlerts();
    if (!rssAlerts.length) return summarize(base, baseAlerts, false);

    const enriched = baseAlerts.map((alert) => enrichAlert(alert, rssAlerts));
    const rssPelotas = rssAlerts.filter((alert) => alert.relevance === "pelotas");
    const combined = enriched.length ? enriched : rssPelotas;

    return summarize(base, combined, true);
  } catch (error) {
    console.error("[weather/inmet-stable] Falha ao enriquecer avisos pelo RSS", {
      message: error instanceof Error ? error.message : String(error),
    });
    return summarize(base, baseAlerts, false);
  }
}
