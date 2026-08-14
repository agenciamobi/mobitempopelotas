const CPPMET_SITE_URL = "https://wp.ufpel.edu.br/cppmet/";
export const CPPMET_RSS_URL = "https://wp.ufpel.edu.br/cppmet/feed/";

const FEED_URLS = [CPPMET_RSS_URL, "https://wp.ufpel.edu.br/cppmet/feed"] as const;
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_ITEMS = 12;

export type CppmetNewsItem = {
  title: string;
  url: string;
  publishedAt: string | null;
  excerpt: string;
  categories: string[];
};

export type CppmetNewsFeed = {
  status: "live" | "unavailable";
  items: CppmetNewsItem[];
  source: {
    name: "CPPMet / UFPel";
    siteUrl: string;
    feedUrl: string;
    fetchedAt: string;
    lastModified: string | null;
  };
  error: string | null;
};

function decodeXml(value: string) {
  const entities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
    aacute: "á",
    acirc: "â",
    agrave: "à",
    atilde: "ã",
    ccedil: "ç",
    eacute: "é",
    ecirc: "ê",
    iacute: "í",
    oacute: "ó",
    ocirc: "ô",
    otilde: "õ",
    uacute: "ú",
  };

  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&([a-z]+);/gi, (entity, name: string) => entities[name.toLowerCase()] ?? entity);
}

function stripHtml(value: string) {
  return decodeXml(value)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readTag(block: string, tag: string) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return block.match(new RegExp(`<${escaped}\\b[^>]*>([\\s\\S]*?)<\\/${escaped}>`, "i"))?.[1] ?? null;
}

function readTags(block: string, tag: string) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return Array.from(
    block.matchAll(new RegExp(`<${escaped}\\b[^>]*>([\\s\\S]*?)<\\/${escaped}>`, "gi")),
    (match) => stripHtml(match[1]),
  ).filter(Boolean);
}

function normalizeDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(stripHtml(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeSourceUrl(value: string | null) {
  if (!value) return null;
  const cleaned = stripHtml(value);
  try {
    const url = new URL(cleaned);
    if (url.protocol !== "https:" || url.hostname !== "wp.ufpel.edu.br") return null;
    if (!url.pathname.startsWith("/cppmet/")) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

function makeExcerpt(value: string | null) {
  const text = value ? stripHtml(value) : "";
  if (text.length <= 260) return text;
  return `${text.slice(0, 257).trimEnd()}…`;
}

export function parseCppmetRss(xml: string): CppmetNewsItem[] {
  const items: CppmetNewsItem[] = [];
  const seen = new Set<string>();

  for (const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)) {
    const block = match[1];
    const title = stripHtml(readTag(block, "title") ?? "");
    const url = normalizeSourceUrl(readTag(block, "link") ?? readTag(block, "guid"));
    if (!title || !url || seen.has(url)) continue;

    seen.add(url);
    items.push({
      title,
      url,
      publishedAt: normalizeDate(readTag(block, "pubDate")),
      excerpt: makeExcerpt(readTag(block, "description")),
      categories: Array.from(new Set(readTags(block, "category"))).slice(0, 4),
    });

    if (items.length === MAX_ITEMS) break;
  }

  return items;
}

function unavailable(error: string): CppmetNewsFeed {
  return {
    status: "unavailable",
    items: [],
    source: {
      name: "CPPMet / UFPel",
      siteUrl: CPPMET_SITE_URL,
      feedUrl: CPPMET_RSS_URL,
      fetchedAt: new Date().toISOString(),
      lastModified: null,
    },
    error,
  };
}

export async function fetchCppmetNews(): Promise<CppmetNewsFeed> {
  const errors: string[] = [];

  for (const feedUrl of FEED_URLS) {
    try {
      const response = await fetch(feedUrl, {
        headers: {
          Accept: "application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.5",
          "Accept-Language": "pt-BR,pt;q=0.9",
          "User-Agent": "TEMPO-Pelotas/2.0 (+https://tempopelotas.com.br)",
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });

      if (!response.ok) {
        errors.push(`RSS do CPPMet respondeu com HTTP ${response.status}.`);
        continue;
      }

      const items = parseCppmetRss(await response.text());
      if (items.length === 0) {
        errors.push("O RSS do CPPMet respondeu, mas nenhum item publicável foi reconhecido.");
        continue;
      }

      return {
        status: "live",
        items,
        source: {
          name: "CPPMet / UFPel",
          siteUrl: CPPMET_SITE_URL,
          feedUrl,
          fetchedAt: new Date().toISOString(),
          lastModified: response.headers.get("last-modified"),
        },
        error: null,
      };
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Falha desconhecida ao consultar o RSS do CPPMet.");
    }
  }

  return unavailable(Array.from(new Set(errors)).join(" ") || "O RSS do CPPMet está indisponível.");
}
