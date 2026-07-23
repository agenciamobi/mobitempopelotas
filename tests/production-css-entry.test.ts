import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ROOT_ROUTE_PATH = new URL("../src/routes/__root.tsx", import.meta.url);
const PRODUCTION_CSS_PATH = new URL("../src/production/production-styles.css", import.meta.url);
const PRODUCTION_MANIFEST_PATH = new URL("../src/production/production-styles.ts", import.meta.url);

function extractStyleImports(content: string, pattern: RegExp) {
  return [...content.matchAll(pattern)].map((match) => match[1]);
}

test("carrega as folhas estruturais no head global antes da hidratação", async () => {
  const rootRoute = await readFile(ROOT_ROUTE_PATH, "utf8");

  assert.match(rootRoute, /import mapLibreCss from "maplibre-gl\/dist\/maplibre-gl\.css\?url";/);
  assert.match(
    rootRoute,
    /import productionCss from "@\/production\/production-styles\.css\?url";/,
  );

  const appLink = rootRoute.indexOf('{ rel: "stylesheet", href: appCss }');
  const mapLink = rootRoute.indexOf('{ rel: "stylesheet", href: mapLibreCss }');
  const productionLink = rootRoute.indexOf('{ rel: "stylesheet", href: productionCss }');

  assert.ok(appLink >= 0, "styles.css precisa estar no head global");
  assert.ok(mapLink > appLink, "MapLibre deve ser carregado depois do CSS base");
  assert.ok(
    productionLink > mapLink,
    "a pilha editorial deve ser a última para preservar a cascata de produção",
  );
});

test("mantém a entrada CSS global idêntica ao manifesto de produção", async () => {
  const [productionCss, productionManifest] = await Promise.all([
    readFile(PRODUCTION_CSS_PATH, "utf8"),
    readFile(PRODUCTION_MANIFEST_PATH, "utf8"),
  ]);

  const cssImports = extractStyleImports(productionCss, /@import "\.\/styles\/([^"]+\.css)";/g);
  const manifestImports = extractStyleImports(
    productionManifest,
    /import "\.\/styles\/([^"]+\.css)";/g,
  );

  assert.ok(cssImports.length >= 100, "a pilha editorial completa deve permanecer declarada");
  assert.deepEqual(
    cssImports,
    manifestImports,
    "a entrada global e o manifesto devem preservar os mesmos arquivos e a mesma ordem",
  );
});

test("componentes e rotas não carregam novamente a pilha editorial", async () => {
  const paths = [
    "../src/production/ProductionHome.tsx",
    "../src/routes/entrar.tsx",
    "../src/routes/minha-conta.tsx",
    "../src/routes/privacidade-e-dados.tsx",
  ];

  for (const relativePath of paths) {
    const content = await readFile(new URL(relativePath, import.meta.url), "utf8");
    assert.doesNotMatch(content, /production-styles/);
    assert.doesNotMatch(content, /maplibre-gl\/dist\/maplibre-gl\.css/);
  }
});
