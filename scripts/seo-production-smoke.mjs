import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const rawBaseUrl = process.env.BASE_URL ?? "https://tempopelotas.com.br";
const parsedBaseUrl = new URL(rawBaseUrl);
const baseUrl = `${parsedBaseUrl.protocol}//${parsedBaseUrl.host}`;
const outputDirectory = path.resolve("artifacts/cutover-smoke");
const results = [];
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

class ExternalWarning extends Error {
  constructor(message, details = message) {
    super(message);
    this.name = "ExternalWarning";
    this.details = details;
  }
}

function absoluteUrl(route) {
  return new URL(route, `${baseUrl}/`).href;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function metaContent(html, attribute, expectedValue) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const match = tag.match(new RegExp(`\\b${attribute}=["']([^"']+)["']`, "i"));
    if (match?.[1] !== expectedValue) continue;
    return tag.match(/\bcontent=["']([^"']*)["']/i)?.[1] ?? null;
  }
  return null;
}

function redirectTarget(response, sourceUrl) {
  const location = response.headers.get("location");
  return location ? new URL(location, sourceUrl).href : null;
}

async function request(url, options = {}) {
  return fetch(url, {
    ...options,
    headers: {
      Accept: "*/*",
      "User-Agent": "TempoPelotas-SEO-Production-Smoke/1.0",
      ...options.headers,
    },
    signal: AbortSignal.timeout(25_000),
  });
}

async function eventually(operation, attempts = 9, delayMs = 10_000) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await wait(delayMs);
    }
  }
  throw lastError;
}

async function check(name, operation) {
  const startedAt = Date.now();
  try {
    const details = await operation();
    results.push({ name, status: "passed", durationMs: Date.now() - startedAt, details });
    console.log(`PASS ${name} — ${details}`);
  } catch (error) {
    if (error instanceof ExternalWarning) {
      results.push({
        name,
        status: "warning",
        durationMs: Date.now() - startedAt,
        warning: error.message,
        details: error.details,
      });
      console.warn(`WARN ${name} — ${error.message}`);
      return;
    }

    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, status: "failed", durationMs: Date.now() - startedAt, error: message });
    console.error(`FAIL ${name} — ${message}`);
  }
}

await check("www converge para o host canônico", async () => {
  const source = new URL("/metodologia?origem=seo-smoke", `${baseUrl}/`);
  source.hostname = `www.${parsedBaseUrl.hostname}`;
  const response = await request(source.href, { redirect: "manual" });
  const target = redirectTarget(response, source.href);

  assert([301, 302, 307, 308].includes(response.status), `HTTP ${response.status}`);
  assert(target === absoluteUrl("/metodologia?origem=seo-smoke"), `Destino incorreto: ${target}`);

  if ([302, 307].includes(response.status)) {
    throw new ExternalWarning(
      `HTTP ${response.status}; destino canônico correto, mas o redirecionamento ainda é temporário na camada externa`,
      `HTTP ${response.status}; ${target}`,
    );
  }

  return `HTTP ${response.status}; redirecionamento permanente; ${target}`;
});

await check("alias técnico da marca continua não indexável", async () => {
  const source = absoluteUrl("/brand/tempo-pelotas-header");
  const response = await request(source, { redirect: "manual" });
  const target = redirectTarget(response, source);
  const robots = (response.headers.get("x-robots-tag") ?? "").toLowerCase();
  assert(response.status === 308, `HTTP ${response.status}`);
  assert(target === absoluteUrl("/brand/tempo-pelotas-header.svg"), `Destino incorreto: ${target}`);
  assert(robots.includes("noindex") && robots.includes("nofollow"), `X-Robots-Tag: ${robots}`);
  return `HTTP 308; noindex,nofollow; ${target}`;
});

await check("feed técnico continua não indexável", async () => {
  const response = await request(absoluteUrl("/feed"), { redirect: "manual" });
  const robots = (response.headers.get("x-robots-tag") ?? "").toLowerCase();
  assert(response.status === 200, `HTTP ${response.status}`);
  assert(robots.includes("noindex") && robots.includes("nofollow"), `X-Robots-Tag: ${robots}`);
  return "HTTP 200; noindex,nofollow";
});

await check("sitemap publica apenas o host canônico", async () => {
  const response = await request(absoluteUrl("/sitemap.xml"), { headers: { Accept: "application/xml" } });
  const xml = await response.text();
  const wwwOrigin = `${parsedBaseUrl.protocol}//www.${parsedBaseUrl.hostname}`;
  assert(response.status === 200, `HTTP ${response.status}`);
  assert(!xml.includes(wwwOrigin), "Sitemap contém host www");
  assert(xml.includes(absoluteUrl("/")), "Home canônica ausente");
  return "sem URLs www; host canônico presente";
});

await check("Open Graph da Home usa o PNG social", async () =>
  eventually(async () => {
    const response = await request(absoluteUrl("/"), { headers: { Accept: "text/html" } });
    const html = await response.text();
    assert(response.status === 200, `HTTP ${response.status}`);
    assert(metaContent(html, "property", "og:image") === absoluteUrl("/brand/tempo-pelotas-social.png"), "og:image incorreto");
    assert(metaContent(html, "property", "og:image:width") === "1200", "og:image:width incorreto");
    assert(metaContent(html, "property", "og:image:height") === "630", "og:image:height incorreto");
    assert(metaContent(html, "property", "og:image:type") === "image/png", "og:image:type incorreto");
    assert(metaContent(html, "name", "twitter:image") === absoluteUrl("/brand/tempo-pelotas-social.png"), "twitter:image incorreto");
    return "og:image 1200×630 image/png; Twitter alinhado";
  }),
);

await check("imagem social está publicada em 1200x630", async () =>
  eventually(async () => {
    const response = await request(absoluteUrl("/brand/tempo-pelotas-social.png"), { headers: { Accept: "image/png" } });
    const contentType = response.headers.get("content-type") ?? "";
    const image = Buffer.from(await response.arrayBuffer());
    assert(response.status === 200, `HTTP ${response.status}`);
    assert(contentType.includes("image/png"), `Content-Type: ${contentType}`);
    assert(image.length >= 24, `PNG inválido: ${image.length} bytes`);
    assert(image.subarray(1, 4).toString("ascii") === "PNG", "Assinatura PNG inválida");
    assert(image.readUInt32BE(16) === 1200, `Largura: ${image.readUInt32BE(16)}`);
    assert(image.readUInt32BE(20) === 630, `Altura: ${image.readUInt32BE(20)}`);
    return `HTTP 200; image/png; ${image.readUInt32BE(16)}×${image.readUInt32BE(20)}`;
  }),
);

await mkdir(outputDirectory, { recursive: true });
const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  passed: results.filter((result) => result.status === "passed").length,
  warnings: results.filter((result) => result.status === "warning").length,
  failed: results.filter((result) => result.status === "failed").length,
  results,
};
await writeFile(path.join(outputDirectory, "seo-report.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(
  `\nSEO produção: ${report.passed} aprovados; ${report.warnings} avisos externos; ${report.failed} reprovados.`,
);
if (report.failed > 0) process.exitCode = 1;
