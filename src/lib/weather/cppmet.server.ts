import type { CppmetForecast, CppmetForecastItem } from "./official-sources.types";

const SOURCE_URL = "https://wp.ufpel.edu.br/cppmet/";
const FALLBACK_URLS = [
  SOURCE_URL,
  "https://wp.ufpel.edu.br/cppmet/estacoes-do-inmet/",
  "https://wp.ufpel.edu.br/cppmet/estacoes-do-ano/",
] as const;
const REQUEST_TIMEOUT_MS = 8_000;
const WEEKDAY_PATTERN =
  /^(segunda(?:-feira)?|terça(?:-feira)?|terca(?:-feira)?|quarta(?:-feira)?|quinta(?:-feira)?|sexta(?:-feira)?|sábado|sabado|domingo)\s*:\s*/i;

function decodeHtml(value: string) {
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
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 10)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&([a-z]+);/gi, (entity, name: string) => entities[name.toLowerCase()] ?? entity);
}

function cleanText(value: string) {
  return decodeHtml(
    value
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?\s*>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function parseTemperature(value: string | undefined) {
  if (!value) return null;
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeDay(value: string) {
  const normalized = value.trim().toLocaleLowerCase("pt-BR");
  const labels: Record<string, string> = {
    segunda: "Segunda-feira",
    "segunda-feira": "Segunda-feira",
    terça: "Terça-feira",
    terca: "Terça-feira",
    "terça-feira": "Terça-feira",
    "terca-feira": "Terça-feira",
    quarta: "Quarta-feira",
    "quarta-feira": "Quarta-feira",
    quinta: "Quinta-feira",
    "quinta-feira": "Quinta-feira",
    sexta: "Sexta-feira",
    "sexta-feira": "Sexta-feira",
    sábado: "Sábado",
    sabado: "Sábado",
    domingo: "Domingo",
  };
  return labels[normalized] ?? value.trim();
}

function parseItem(text: string): CppmetForecastItem | null {
  const dayMatch = text.match(WEEKDAY_PATTERN);
  if (!dayMatch) return null;
  const minimumMatch = text.match(/M[ií]n\.?\s*(-?\d+(?:[.,]\d+)?)/i);
  const maximumMatch = text.match(/M[aá]x\.?\s*(-?\d+(?:[.,]\d+)?)/i);
  const summary = text
    .replace(WEEKDAY_PATTERN, "")
    .replace(
      /\s*[-–—]?\s*M[ií]n\.?\s*-?\d+(?:[.,]\d+)?\s*[-–—]\s*M[aá]x\.?\s*-?\d+(?:[.,]\d+)?\s*$/i,
      "",
    )
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();
  if (!summary || (!minimumMatch && !maximumMatch)) return null;
  return {
    day: normalizeDay(dayMatch[1]),
    summary,
    minimum: parseTemperature(minimumMatch?.[1]),
    maximum: parseTemperature(maximumMatch?.[1]),
    text,
  };
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function parseCppmetForecastHtml(html: string) {
  const normalized = decodeHtml(html);
  const heading = normalized.match(/Previs[aã]o\s+para\s+Pelotas/i);
  if (heading?.index === undefined) return [];
  const region = normalized.slice(heading.index, heading.index + 30_000);
  const listItems = Array.from(region.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi), (match) =>
    cleanText(match[1]),
  );
  const items: CppmetForecastItem[] = [];
  const seen = new Set<string>();
  for (const listItem of listItems) {
    const parsed = parseItem(listItem);
    if (!parsed || seen.has(parsed.day)) continue;
    seen.add(parsed.day);
    items.push(parsed);
    if (items.length === 7) break;
  }
  return items;
}

function unavailable(error: string): CppmetForecast {
  return {
    status: "unavailable",
    items: [],
    fingerprint: null,
    source: {
      name: "CPPMet / UFPel",
      url: SOURCE_URL,
      fetchedAt: new Date().toISOString(),
      lastModified: null,
    },
    error,
  };
}

export async function fetchCppmetForecast(): Promise<CppmetForecast> {
  let lastError = "A previsão textual do CPPMet não pôde ser localizada.";
  for (const url of FALLBACK_URLS) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "pt-BR,pt;q=0.9",
          "User-Agent": "TEMPO-Pelotas/2.0 (+https://www.tempopelotas.com.br)",
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      if (!response.ok) {
        lastError = `CPPMet respondeu com HTTP ${response.status}.`;
        continue;
      }
      const items = parseCppmetForecastHtml(await response.text());
      if (items.length < 2) {
        lastError = "A estrutura da previsão do CPPMet não foi reconhecida.";
        continue;
      }
      return {
        status: "live",
        items,
        fingerprint: await sha256(items.map((item) => item.text).join("\n")),
        source: {
          name: "CPPMet / UFPel",
          url: SOURCE_URL,
          fetchedAt: new Date().toISOString(),
          lastModified: response.headers.get("last-modified"),
        },
        error: null,
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Falha desconhecida ao consultar o CPPMet.";
    }
  }
  return unavailable(lastError);
}
