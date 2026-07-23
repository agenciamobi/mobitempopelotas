import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const rawBaseUrl = process.env.BASE_URL ?? process.argv[2] ?? "https://www.tempopelotas.com.br";
const parsedBaseUrl = new URL(rawBaseUrl);
const baseUrl = `${parsedBaseUrl.protocol}//${parsedBaseUrl.host}`;
const outputDirectory = path.resolve("artifacts/cutover-smoke");

const publicRoutes = [
  "/",
  "/tempo-hoje-pelotas",
  "/tempo-amanha-pelotas",
  "/previsao-7-dias-pelotas",
  "/chuva-em-pelotas",
  "/vento-em-pelotas",
  "/alertas",
  "/radar-e-satelite-pelotas",
  "/situacao-hidrologica-pelotas",
  "/nivel-da-lagoa-dos-patos-laranjal",
  "/estacao-embrapa-pelotas",
  "/historico-climatico-pelotas",
  "/cameras-ao-vivo-pelotas",
  "/metodologia",
];

const redemetEndpoints = [
  ["radar", "/api/redemet/radar?frames=2"],
  ["satélite", "/api/redemet/satellite?type=realcada&frames=2"],
  ["trovoadas", "/api/redemet/storms?frames=2"],
];

const forbiddenMarkers = [
  "REDEMET_API_KEY",
  "GOOGLE_OAUTH_CLIENT_SECRET",
  "GEMINI_API_KEY",
  "LOVABLE_API_KEY",
  "process.env.",
  "stack trace",
];

const results = [];
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function absoluteUrl(route) {
  return new URL(route, `${baseUrl}/`).href;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertNoSensitiveMarkers(content, context) {
  for (const marker of forbiddenMarkers) {
    assert(!content.includes(marker), `${context}: marcador sensível exposto: ${marker}`);
  }
}

function canonicalFromHtml(html) {
  const linkTags = html.match(/<link\b[^>]*>/gi) ?? [];
  const canonicalTag = linkTags.find((tag) => /\brel=["']canonical["']/i.test(tag));
  return canonicalTag?.match(/\bhref=["']([^"']+)["']/i)?.[1] ?? null;
}

async function request(route, options = {}, attempts = 3) {
  let lastError;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(absoluteUrl(route), {
        ...options,
        headers: {
          Accept: "*/*",
          "User-Agent": "TempoPelotas-Cutover-Smoke/1.0",
          ...options.headers,
        },
        signal: AbortSignal.timeout(25_000),
      });

      return response;
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await wait(3_000);
    }
  }

  throw lastError;
}

async function check(name, operation) {
  const startedAt = Date.now();

  try {
    const details = await operation();
    const durationMs = Date.now() - startedAt;
    results.push({ name, status: "passed", durationMs, details });
    console.log(`PASS ${name} (${durationMs} ms)${details ? ` — ${details}` : ""}`);
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, status: "failed", durationMs, error: message });
    console.error(`FAIL ${name} (${durationMs} ms) — ${message}`);
  }
}

for (const route of publicRoutes) {
  await check(`Página ${route}`, async () => {
    const response = await request(route, {
      headers: { Accept: "text/html" },
    });
    const html = await response.text();
    const contentType = response.headers.get("content-type") ?? "";

    assert(response.status === 200, `HTTP ${response.status}`);
    assert(contentType.includes("text/html"), `Content-Type inesperado: ${contentType}`);
    assert(/<title>[^<]+<\/title>/i.test(html), "Título HTML ausente");
    assertNoSensitiveMarkers(html, route);

    const canonical = canonicalFromHtml(html);
    assert(canonical !== null, "Canonical ausente");
    assert(canonical === absoluteUrl(route), `Canonical incorreto: ${canonical}`);

    return `HTTP 200; canonical ${canonical}`;
  });
}

await check("Redirect legado /clima-em-pelotas", async () => {
  const response = await request("/clima-em-pelotas", { redirect: "manual" });
  const location = response.headers.get("location");

  assert([301, 308].includes(response.status), `HTTP ${response.status}`);
  assert(location !== null, "Cabeçalho Location ausente");
  assert(
    new URL(location, `${baseUrl}/`).pathname === "/historico-climatico-pelotas",
    `Destino inesperado: ${location}`,
  );

  return `HTTP ${response.status}; ${location}`;
});

await check("robots.txt", async () => {
  const response = await request("/robots.txt", {
    headers: { Accept: "text/plain" },
  });
  const content = await response.text();
  const contentType = response.headers.get("content-type") ?? "";

  assert(response.status === 200, `HTTP ${response.status}`);
  assert(contentType.includes("text/plain"), `Content-Type inesperado: ${contentType}`);
  assert(content.includes("Disallow: /api/"), "Bloqueio de /api/ ausente");
  assert(content.includes(`Sitemap: ${absoluteUrl("/sitemap.xml")}`), "Sitemap incorreto");
  assertNoSensitiveMarkers(content, "robots.txt");

  return "Sitemap e regras de API corretos";
});

await check("sitemap.xml", async () => {
  const response = await request("/sitemap.xml", {
    headers: { Accept: "application/xml,text/xml" },
  });
  const content = await response.text();

  assert(response.status === 200, `HTTP ${response.status}`);
  for (const route of publicRoutes) {
    assert(content.includes(`<loc>${absoluteUrl(route)}</loc>`), `Rota ausente: ${route}`);
  }
  assertNoSensitiveMarkers(content, "sitemap.xml");

  return `${publicRoutes.length} rotas públicas presentes`;
});

await check("feed JSON 1.1", async () => {
  const response = await request("/feed", {
    headers: { Accept: "application/feed+json,application/json" },
  });
  const raw = await response.text();
  const payload = JSON.parse(raw);

  assert(response.status === 200, `HTTP ${response.status}`);
  assert(payload.version === "https://jsonfeed.org/version/1.1", "Versão JSON Feed incorreta");
  assert(payload.home_page_url === absoluteUrl("/"), "home_page_url incorreta");
  assert(payload.feed_url === absoluteUrl("/feed"), "feed_url incorreta");
  assert(Array.isArray(payload.items) && payload.items.length >= 4, "Itens insuficientes");
  assertNoSensitiveMarkers(raw, "feed");

  return `${payload.items.length} itens`;
});

await check("pelotas.json schema 2.0", async () => {
  const response = await request("/pelotas.json", {
    headers: { Accept: "application/json" },
  });
  const raw = await response.text();
  const payload = JSON.parse(raw);
  const cors = response.headers.get("access-control-allow-origin");

  assert(response.status === 200, `HTTP ${response.status}`);
  assert(payload.schema_version === "2.0", "schema_version incorreta");
  assert(payload.location?.city === "Pelotas", "Localização incorreta");
  assert(payload.links?.home === absoluteUrl("/"), "Link principal incorreto");
  assert(payload.links?.public_data === absoluteUrl("/pelotas.json"), "Link público incorreto");
  assert(cors === "*", `CORS inesperado: ${cors}`);
  assertNoSensitiveMarkers(raw, "pelotas.json");

  return `status ${payload.status}; CORS público`;
});

const redemetResults = [];
for (const [name, route] of redemetEndpoints) {
  await check(`REDEMET ${name}`, async () => {
    const response = await request(route, {
      headers: { Accept: "application/json" },
    });
    const raw = await response.text();
    const payload = JSON.parse(raw);

    assert(response.status === 200, `HTTP ${response.status}`);
    assert(payload.provider === "REDEMET / DECEA", "Provedor inesperado");
    assert(payload.configured === true, "REDEMET_API_KEY não reconhecida no runtime");
    assert(Array.isArray(payload.frames), "Coleção de quadros ausente");
    assertNoSensitiveMarkers(raw, `REDEMET ${name}`);

    redemetResults.push({ name, available: payload.available, frames: payload.frames.length });
    return `available=${payload.available}; frames=${payload.frames.length}`;
  });
}

await check("Disponibilidade mínima REDEMET", async () => {
  const available = redemetResults.filter((result) => result.available);
  assert(available.length > 0, "Nenhum produto REDEMET respondeu com dados utilizáveis");
  return `${available.length}/${redemetEndpoints.length} produtos disponíveis`;
});

await mkdir(outputDirectory, { recursive: true });
const report = {
  generatedAt: new Date().toISOString(),
  baseUrl,
  passed: results.filter((result) => result.status === "passed").length,
  failed: results.filter((result) => result.status === "failed").length,
  results,
};
await writeFile(path.join(outputDirectory, "report.json"), `${JSON.stringify(report, null, 2)}\n`);

console.log(`\nResultado: ${report.passed} aprovados; ${report.failed} reprovados.`);
console.log(`Relatório: ${path.join(outputDirectory, "report.json")}`);

if (report.failed > 0) process.exitCode = 1;
