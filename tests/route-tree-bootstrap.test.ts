import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};
const packageLock = JSON.parse(readFileSync("package-lock.json", "utf8")) as {
  packages?: Record<
    string,
    {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    }
  >;
};
const generator = readFileSync("scripts/generate-route-tree.mjs", "utf8");

const GENERATOR_COMMAND = "node scripts/generate-route-tree.mjs";

test("route tree is generated before development, build, tests and typecheck", () => {
  assert.equal(packageJson.scripts?.["routes:generate"], GENERATOR_COMMAND);
  assert.equal(packageJson.scripts?.["routes:check"], `${GENERATOR_COMMAND} --check`);
  assert.match(packageJson.scripts?.dev ?? "", /^node scripts\/generate-route-tree\.mjs && vite dev$/);
  assert.match(packageJson.scripts?.build ?? "", /^node scripts\/generate-route-tree\.mjs && vite build$/);
  assert.match(
    packageJson.scripts?.["build:dev"] ?? "",
    /^node scripts\/generate-route-tree\.mjs && vite build --mode development$/,
  );
  assert.match(
    packageJson.scripts?.test ?? "",
    /^node scripts\/generate-route-tree\.mjs && node --test tests\/\*\*\/\*\.test\.ts$/,
  );
  assert.match(
    packageJson.scripts?.["test:routes"] ?? "",
    /^node scripts\/generate-route-tree\.mjs && node --test tests\/public-routes\.test\.ts$/,
  );
  assert.match(
    packageJson.scripts?.typecheck ?? "",
    /^node scripts\/generate-route-tree\.mjs && tsc --noEmit$/,
  );
});

test("route generator discovers all exported file routes recursively", () => {
  assert.match(generator, /readdir\(directory, \{ withFileTypes: true \}\)/);
  assert.match(generator, /CREATE_FILE_ROUTE_CALL_PATTERN/);
  assert.match(generator, /ROUTE_PATTERN/);
  assert.match(generator, /expectedRoutePath/);
  assert.match(generator, /deve declarar createFileRoute com um caminho literal/);
  assert.match(generator, /Caminho incompatível/);
  assert.match(generator, /Rota duplicada detectada/);
  assert.match(generator, /Identificador de rota duplicado/);
  assert.match(generator, /routeTree\.gen\.ts regenerado/);
  assert.match(generator, /_addFileChildren\(rootRouteChildren\)/);
  assert.match(generator, /_addFileTypes<FileRouteTypes>\(\)/);
});

test("package manifest remains compatible with npm ci lock metadata", () => {
  const lockedRoot = packageLock.packages?.[""];
  assert.ok(lockedRoot, "package-lock.json deve conter os metadados do projeto raiz");
  assert.deepEqual(packageJson.dependencies, lockedRoot.dependencies);
  assert.deepEqual(packageJson.devDependencies, lockedRoot.devDependencies);
});
