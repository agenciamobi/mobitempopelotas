import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { PUBLIC_ROUTES } from "../src/lib/public-routes.ts";

const CRITICAL_PUBLIC_ROUTES = [
  "/",
  "/tempo-hoje-pelotas",
  "/tempo-amanha-pelotas",
  "/previsao-7-dias-pelotas",
  "/alertas",
  "/radar-e-satelite-pelotas",
  "/situacao-hidrologica-pelotas",
  "/nivel-da-lagoa-dos-patos-laranjal",
  "/cameras-ao-vivo-pelotas",
  "/tempo-na-regiao-sul-rs",
  "/metodologia",
  "/privacidade-e-dados",
] as const;

function routeModuleUrl(path: string) {
  if (path.startsWith("/tempo-em/")) {
    return new URL("../src/routes/tempo-em/$citySlug.tsx", import.meta.url);
  }
  const filename = path === "/" ? "index.tsx" : `${path.slice(1)}.tsx`;
  return new URL(`../src/routes/${filename}`, import.meta.url);
}

function generatedRoutePath(path: string) {
  return path.startsWith("/tempo-em/") ? "/tempo-em/$citySlug" : path;
}

function generatedRoutePaths() {
  const routeTree = readFileSync(new URL("../src/routeTree.gen.ts", import.meta.url), "utf8");

  return new Set(
    Array.from(routeTree.matchAll(/\bpath:\s*["']([^"']+)["']/g), (match) => match[1]),
  );
}

test("mantém caminhos públicos únicos e absolutos", () => {
  const paths = PUBLIC_ROUTES.map((route) => route.path);

  assert.equal(new Set(paths).size, paths.length);
  for (const path of paths) {
    assert.ok(path.startsWith("/"), `${path} deve começar com /`);
    assert.equal(path.includes("?"), false, `${path} não deve conter query string`);
    assert.equal(path.includes("#"), false, `${path} não deve conter fragmento`);
    if (path !== "/") {
      assert.equal(path.endsWith("/"), false, `${path} não deve terminar com /`);
    }
  }
});

test("mantém prioridades de sitemap dentro do intervalo válido", () => {
  for (const route of PUBLIC_ROUTES) {
    assert.ok(route.priority >= 0 && route.priority <= 1, `${route.path} tem prioridade inválida`);
  }
});

test("cada URL do sitemap possui um módulo de rota real", () => {
  for (const route of PUBLIC_ROUTES) {
    assert.equal(
      existsSync(routeModuleUrl(route.path)),
      true,
      `módulo de rota ausente para ${route.path}`,
    );
  }
});

test("o sitemap corresponde à árvore gerada pelo TanStack Router", () => {
  const routerPaths = generatedRoutePaths();

  for (const route of PUBLIC_ROUTES) {
    const expectedPath = generatedRoutePath(route.path);
    assert.ok(routerPaths.has(expectedPath), `a árvore gerada não contém ${expectedPath}`);
  }
});

test("preserva páginas essenciais para visitantes leigos", () => {
  const paths = new Set(PUBLIC_ROUTES.map((route) => route.path));

  for (const route of CRITICAL_PUBLIC_ROUTES) {
    assert.ok(paths.has(route), `rota pública essencial ausente: ${route}`);
  }
});

test("mantém atualização frequente nas páginas operacionais", () => {
  const routeMap = new Map(PUBLIC_ROUTES.map((route) => [route.path, route]));
  const hourlyRoutes = [
    "/",
    "/tempo-hoje-pelotas",
    "/alertas",
    "/radar-e-satelite-pelotas",
    "/situacao-hidrologica-pelotas",
    "/nivel-da-lagoa-dos-patos-laranjal",
    "/cameras-ao-vivo-pelotas",
  ];

  for (const path of hourlyRoutes) {
    assert.equal(routeMap.get(path)?.changeFrequency, "hourly", `${path} deve ser horária`);
  }

  for (const route of PUBLIC_ROUTES.filter((item) => item.path.startsWith("/tempo-em/"))) {
    assert.equal(route.changeFrequency, "hourly", `${route.path} deve ser horária`);
  }
});
