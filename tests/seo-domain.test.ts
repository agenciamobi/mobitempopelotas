import assert from "node:assert/strict";
import test from "node:test";

import { getCanonicalRedirectUrl } from "../src/lib/canonical-host";
import { PUBLIC_ROUTES } from "../src/lib/public-routes";
import { CANONICAL_SITE_URL, SITE_URL, absoluteUrl } from "../src/lib/site-config";
import { createSitemapXml } from "../src/lib/sitemap";

const legacyHost = ["mobitempopelotas", "lovable", "app"].join(".");
const wwwHost = ["www", "tempopelotas", "com", "br"].join(".");
const wwwHost = ["www", "tempopelotas", "com", "br"].join(".");
const wwwHost = ["www", "tempopelotas", "com", "br"].join(".");

test("o domínio canônico é único e não depende de ambiente", () => {
  assert.equal(CANONICAL_SITE_URL, "https://tempopelotas.com.br");
  assert.equal(SITE_URL, CANONICAL_SITE_URL);
  assert.equal(absoluteUrl("/alertas"), "https://tempopelotas.com.br/alertas");
});

test("o endereço anterior redireciona permanentemente preservando caminho e consulta", () => {
  assert.equal(
    getCanonicalRedirectUrl(`https://${legacyHost}/chuva-em-pelotas?origem=busca`),
    "https://tempopelotas.com.br/chuva-em-pelotas?origem=busca",
  );
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
  assert.equal(sitemap.includes(legacyHost), false);
  assert.equal(sitemap.includes(wwwHost), false);

  for (const route of PUBLIC_ROUTES) {
    assert.equal(sitemap.includes(`<loc>${absoluteUrl(route.path)}</loc>`), true);
  }
});
