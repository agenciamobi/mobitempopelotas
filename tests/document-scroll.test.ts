import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rootRoute = readFileSync("src/routes/__root.tsx", "utf8");
const scrollStyles = readFileSync("src/production/styles/document-scroll.css", "utf8");
const productionCss = readFileSync("src/production/production-styles.css", "utf8");
const productionManifest = readFileSync("src/production/production-styles.ts", "utf8");

test("remove locks residuais de overflow quando não existe modal ativo", () => {
  assert.match(rootRoute, /function restoreDocumentScrollIfUnlocked\(\)/);
  assert.match(rootRoute, /document\.querySelector\(ACTIVE_MODAL_SELECTOR\)/);
  assert.match(rootRoute, /removeStaleOverflowLock\(document\.documentElement\)/);
  assert.match(rootRoute, /removeStaleOverflowLock\(document\.body\)/);
  assert.match(rootRoute, /window\.addEventListener\("pageshow", scheduleRestore\)/);
});

test("mantém a página rolável e aplica scrollbar editorial", () => {
  assert.match(scrollStyles, /html \{[\s\S]*overflow-y: auto;/);
  assert.match(scrollStyles, /scrollbar-color: var\(--document-scrollbar-end\)/);
  assert.match(scrollStyles, /html::\-webkit-scrollbar-thumb/);
  assert.match(scrollStyles, /linear-gradient\([\s\S]*--document-scrollbar-start/);
});

test("carrega a scrollbar na entrada CSS e no manifesto", () => {
  assert.match(productionCss, /@import "\.\/styles\/document-scroll\.css";/);
  assert.match(productionManifest, /import "\.\/styles\/document-scroll\.css";/);
});
