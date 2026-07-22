import "server-only";

import { createHash } from "node:crypto";

const CPPMET_SOURCE_URL = "https://wp.ufpel.edu.br/cppmet/";
const CPPMET_FALLBACK_URLS = [
  CPPMET_SOURCE_URL,
  "https://wp.ufpel.edu.br/cppmet/estacoes-do-inmet/",
  "https://wp.ufpel.edu.br/cppmet/estacoes-do-ano/",
] as const;

const WEEKDAY_PATTERN =
  /^(segunda(?:-feira)?|terça(?:-feira)?|terca(?:-feira)?|quarta(?:-feira)?|quinta(?:-feira)?|sexta(?:-feira)?|sábado|sabado|domingo)\s*:\s*/i;

export type CppmetForecastItem = {
  day: string;
  summary: string;
  minimum: number | null;
  maximum: number | null;
  text: string;
};

export type CppmetForecastData = {
  status: "live" | "unavailable";
  items: CppmetForecastItem[];
  fingerprint: string | null;
  source: {
    name: "CPPMet / UFPel";
    url: string;
    fetchedAt: string;
    lastModified: string | null;
  };
  error: string | null;
};

function decodeHtml(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
    aacute: "á",
    Aacute: "Á",
    acirc: "â",
    Acirc: "Â",
    agrave: "à",
    Agrave: "À",
    atilde: "ã",
    Atilde: "Ã",
    ccedil: "ç",
    Ccedil: "Ç",
    eacute: "é",
    Eacute: "É",
    ecirc: "ê",
    Ecirc: "Ê",
    iacute: "í",
    Iacute: "Í",
    oacute: "ó",
    Oacute: "Ó",
    ocirc: "ô",
    Ocirc: "Ô",
    otilde: "õ",
    Otilde: "Õ",
    uacute: "ú",
    Uacute: "Ú",
  };

  return value
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 10)),
    )
    .replace(/&#x([\da-f]+);/gi, (_, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&([a-z]+);/gi, (entity, name: string) =>
      Object.hasOwn(namedEntities, name) ? namedEntities[name] : entity,
    );
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
  const description = text
    .replace(WEEKDAY_PATTERN, "")
    .replace(
      /\s*[-–—]?\s*M[ií]n\.?\s*-?\d+(?:[.,]\d+)?\s*[-–—]\s*M[aá]x\.?\s*-?\d+(?:[.,]\d+)?\s*$/i,
      "",
    )
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:!?])/g, "$1")
    .trim();

  if (!description || (!minimumMatch && !maximumMatch)) return null;

  return {
    day: normalizeDay(dayMatch[1]),
    summary: description,
    minimum: parseTemperature(minimumMatch?.[1]),
    maximum: parseTemperature(maximumMatch?.[1]),
    text,
  };
}

export function parseCppmetForecastHtml(html: string) {
  const normalizedHtml = decodeHtml(html);
  const headingMatch = normalizedHtml.match(/Previs[aã]o\s+para\s+Pelotas/i);
  if (!headingMatch?.index) return [];

  const forecastRegion = normalizedHtml.slice(
    headingMatch.index,
    headingMatch.index + 30_000,
  );
  const listItems = Array.from(
    forecastRegion.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi),
    (match) => cleanText(match[1]),
  );

  const items: CppmetForecastItem[] = [];
  const seenDays = new Set<string>();

  for (const listItem of listItems) {
    const parsed = parseItem(listItem);
    if (!parsed || seenDays.has(parsed.day)) continue;

    seenDays.add(parsed.day);
    items.push(parsed);

    if (items.length === 7) break;
  }

  return items;
}

export function getCppmetForecastItemForDate(
  data: CppmetForecastData,
  date = new Date(),
) {
  if (data.status !== "live" || data.items.length === 0) return null;

  const weekday = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    weekday: "long",
  }).format(date);
  const normalizedWeekday = normalizeDay(weekday);

  return data.items.find((item) => item.day === normalizedWeekday) ?? data.items[0] ?? null;
}

function unavailableData(error: string): CppmetForecastData {
  return {
    status: "unavailable",
    items: [],
    fingerprint: null,
    source: {
      name: "CPPMet / UFPel",
      url: CPPMET_SOURCE_URL,
      fetchedAt: new Date().toISOString(),
      lastModified: null,
    },
    error,
  };
}

export async function getCppmetForecast(): Promise<CppmetForecastData> {
  let lastError = "A previsão textual do CPPMet não pôde ser localizada.";

  for (const sourceUrl of CPPMET_FALLBACK_URLS) {
    try {
      const response = await fetch(sourceUrl, {
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "pt-BR,pt;q=0.9",
          "User-Agent":
            "TEMPO-Pelotas/1.0 (+https://www.tempopelotas.com.br; contato@agenciamobi.com.br)",
        },
        next: {
          revalidate: 600,
          tags: ["cppmet-forecast"],
        },
        signal: AbortSignal.timeout(8_000),
      });

      if (!response.ok) {
        lastError = `CPPMet respondeu com HTTP ${response.status}.`;
        continue;
      }

      const html = await response.text();
      const items = parseCppmetForecastHtml(html);

      if (items.length < 2) {
        lastError = "A estrutura da previsão do CPPMet não foi reconhecida.";
        continue;
      }

      const fingerprint = createHash("sha256")
        .update(items.map((item) => item.text).join("\n"))
        .digest("hex");

      return {
        status: "live",
        items,
        fingerprint,
        source: {
          name: "CPPMet / UFPel",
          url: CPPMET_SOURCE_URL,
          fetchedAt: new Date().toISOString(),
          lastModified: response.headers.get("last-modified"),
        },
        error: null,
      };
    } catch (error) {
      lastError =
        error instanceof Error
          ? error.message
          : "Falha desconhecida ao consultar o CPPMet.";
    }
  }

  console.warn("[cppmet-forecast] unavailable", { reason: lastError });
  return unavailableData(lastError);
}
