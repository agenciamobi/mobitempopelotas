import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import test from "node:test";

import { getCanonicalRedirectUrl } from "../src/lib/canonical-host.ts";
import { PUBLIC_ROUTES } from "../src/lib/public-routes.ts";
import { CANONICAL_SITE_URL, SITE_URL, absoluteUrl } from "../src/lib/site-config.ts";
import { createSitemapXml } from "../src/lib/sitemap.ts";

const technicalHosts = [
  ["mobitempopelotas", "lovable", "app"].join("."),
  ["tempopelotas", "vercel", "app"].join("."),
];
const wwwHost = ["www", "tempopelotas", "com", "br"].join(".");
const forbiddenHostFragments = [
  ...technicalHosts,
  ["vercel", "app"].join("."),
  wwwHost,
];
const ignoredDirectories = new Set([
  ".git",
  ".output",
  ".vinxi",
  "artifacts",
  "dist",
  "node_modules",
]);
const publicationRoots = ["src", "public"];
const sitemapRoute = readFileSync("src/routes/sitemap[.]xml.ts", "utf8");
const feedRoute = readFileSync("src/routes/feed.ts", "utf8");
const brandAliasRoute = readFileSync("src/routes/brand/tempo-pelotas-header.ts", "utf8");
const accountRoute = readFileSync("src/routes/conta.tsx", "utf8");

function listProjectFiles(directory = "."): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;

    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...listProjectFiles(target));
    if (entry.isFile()) files.push(target);
  }

  return files;
}

test("o domínio canônico é único e não depende de ambiente", () => {
  assert.equal(CANONICAL_SITE_URL, "https://tempopelotas.com.br");
  assert.equal(SITE_URL, CANONICAL_SITE_URL);
  assert.equal(absoluteUrl("/alertas"), "https://tempopelotas.com.br/alertas");
});

test("hosts técnicos redirecionam permanentemente preservando caminho e consulta", () => {
  for (const technicalHost of technicalHosts) {
    assert.equal(
      getCanonicalRedirectUrl(`https://${technicalHost}/chuva-em-pelotas?origem=busca`),
      "https://tempopelotas.com.br/chuva-em-pelotas?origem=busca",
    );
  }
});

test("www e http convergem para o domínio oficial em HTTPS", () => {
  assert.equal(
    getCanonicalRedirectUrl(`https://${wwwHost}/alertas`),
    "https://tempopelotas.com.br/alertas",
  );
  assert.equal(
    getCanonicalRedirectUrl("http://tempopelotas.com.br/"),
    "https://tempopelotas.com.br/",
  );
});

test("o domínio oficial e hosts locais não sofrem redirecionamento", () => {
  assert.equal(getCanonicalRedirectUrl("https://tempopelotas.com.br/vento-em-pelotas"), null);
  assert.equal(getCanonicalRedirectUrl("http://localhost:5173/"), null);
});

test("o sitemap contém somente URLs canônicas e todas as rotas públicas", () => {
  const sitemap = createSitemapXml();

  assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.equal((sitemap.match(/<url>/g) ?? []).length, PUBLIC_ROUTES.length);

  for (const forbiddenHost of forbiddenHostFragments) {
    assert.equal(sitemap.includes(forbiddenHost), false);
  }

  for (const route of PUBLIC_ROUTES) {
    assert.equal(sitemap.includes(`<loc>${absoluteUrl(route.path)}</loc>`), true);
  }
});

test("recursos técnicos permanecem acessíveis sem virar páginas de busca", () => {
  assert.match(feedRoute, /"X-Robots-Tag": "noindex, nofollow"/);
  assert.match(brandAliasRoute, /"X-Robots-Tag": "noindex, nofollow"/);
  assert.match(brandAliasRoute, /Location: "\/brand\/tempo-pelotas-header\.svg"/);
  assert.match(accountRoute, /src="\/brand\/tempo-pelotas-header\.svg"/);
  assert.doesNotMatch(accountRoute, /src="\/brand\/tempo-pelotas-header"(?!\.svg)/);
  assert.doesNotMatch(sitemapRoute, /"X-Robots-Tag": "index, follow"/);
});

test("nenhum arquivo publicável contém domínios obsoletos", () => {
  const offenders: string[] = [];

  for (const root of publicationRoots) {
    if (!existsSync(root)) continue;

    for (const file of listProjectFiles(root)) {
      try {
        const content = readFileSync(file, "utf8");
        if (forbiddenHostFragments.some((host) => content.includes(host))) offenders.push(file);
      } catch {
        // Arquivos binários não participam da verificação textual.
      }
    }
  }

  assert.deepEqual(offenders, []);
});