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
const viteConfig = readFileSync("vite.config.ts", "utf8");
const routeTree = readFileSync("src/routeTree.gen.ts", "utf8");
const qualityWorkflow = readFileSync(".github/workflows/quality.yml", "utf8");

function workflowStepPosition(command: string) {
  const position = qualityWorkflow.indexOf(command);
  assert.notEqual(position, -1, `workflow deve executar ${command}`);
  return position;
}

test("TanStack/Lovable owns route generation for development, build and checks", () => {
  assert.equal(packageJson.scripts?.["routes:generate"], "vite build");
  assert.equal(
    packageJson.scripts?.["routes:check"],
    "vite build && git diff --exit-code -- src/routeTree.gen.ts",
  );
  assert.equal(packageJson.scripts?.dev, "vite dev");
  assert.equal(packageJson.scripts?.build, "vite build");
  assert.equal(packageJson.scripts?.["build:dev"], "vite build --mode development");
  assert.equal(packageJson.scripts?.test, "vite build && node --test tests/**/*.test.ts");
  assert.equal(packageJson.scripts?.["test:routes"], "vite build && node --test tests/public-routes.test.ts");
  assert.equal(packageJson.scripts?.typecheck, "vite build && tsc --noEmit");
});

test("Vite uses the Lovable TanStack config without a duplicate custom route generator", () => {
  assert.match(viteConfig, /from "@lovable\.dev\/vite-tanstack-config"/);
  assert.match(viteConfig, /export default defineConfig/);
  assert.match(viteConfig, /tanstackStart:/);
  assert.match(viteConfig, /server:\s*\{\s*entry:\s*"server"\s*\}/);
  assert.doesNotMatch(viteConfig, /execFileSync|generate-route-tree\.mjs/);
});

test("committed TanStack route tree contains generated route metadata", () => {
  assert.match(routeTree, /routeTree/);
  assert.match(routeTree, /FileRoutesByPath|FileRoutesByTo|FileRoutesById/);
  assert.match(routeTree, /createFileRoute|_addFileChildren|rootRouteChildren/);
});

test("quality workflow checks the committed tree before production build", () => {
  assert.ok(
    workflowStepPosition("npm run routes:check") < workflowStepPosition("npm run build"),
    "routes:check deve executar antes do build",
  );
});

test("package manifest remains compatible with npm ci lock metadata", () => {
  const lockedRoot = packageLock.packages?.[""];
  assert.ok(lockedRoot, "package-lock.json deve conter os metadados do projeto raiz");
  assert.deepEqual(packageJson.dependencies, lockedRoot.dependencies);
  assert.deepEqual(packageJson.devDependencies, lockedRoot.devDependencies);
});
