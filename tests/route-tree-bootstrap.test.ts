import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  scripts?: Record<string, string>;
};
const generator = readFileSync("scripts/generate-route-tree.mjs", "utf8");

test("route tree is generated before development, build and typecheck", () => {
  assert.equal(packageJson.scripts?.["routes:generate"], "node scripts/generate-route-tree.mjs");
  assert.match(packageJson.scripts?.dev ?? "", /^node scripts\/generate-route-tree\.mjs && vite dev$/);
  assert.match(packageJson.scripts?.build ?? "", /^node scripts\/generate-route-tree\.mjs && vite build$/);
  assert.match(
    packageJson.scripts?.["build:dev"] ?? "",
    /^node scripts\/generate-route-tree\.mjs && vite build --mode development$/,
  );
  assert.match(
    packageJson.scripts?.typecheck ?? "",
    /^node scripts\/generate-route-tree\.mjs && tsc --noEmit$/,
  );
});

test("route generator discovers all exported file routes recursively", () => {
  assert.match(generator, /readdir\(directory, \{ withFileTypes: true \}\)/);
  assert.match(generator, /createFileRoute/);
  assert.match(generator, /ROUTE_PATTERN/);
  assert.match(generator, /Rota duplicada detectada/);
  assert.match(generator, /Identificador de rota duplicado/);
  assert.match(generator, /routeTree\.gen\.ts regenerado/);
  assert.match(generator, /_addFileChildren\(rootRouteChildren\)/);
  assert.match(generator, /_addFileTypes<FileRouteTypes>\(\)/);
});
