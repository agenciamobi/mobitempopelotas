import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const rootRoute = readFileSync("src/routes/__root.tsx", "utf8");
const router = readFileSync("src/router.tsx", "utf8");
const scrollRoot = readFileSync("src/components/layout/ViewportScrollRoot.tsx", "utf8");
const scrollStyles = readFileSync("src/production/styles/document-scroll.css", "utf8");
const productionCss = readFileSync("src/production/production-styles.css", "utf8");
const productionManifest = readFileSync("src/production/production-styles.ts", "utf8");

test("monta um viewport próprio para toda a aplicação", () => {
  assert.match(rootRoute, /import \{ ViewportScrollRoot \}/);
  assert.match(rootRoute, /<ViewportScrollRoot>[\s\S]*<SiteLayout>/);
  assert.match(scrollRoot, /id="page-scroll-root"/);
  assert.match(scrollRoot, /data-scroll-viewport="true"/);
});

test("garante wheel e teclas de navegação no viewport dedicado", () => {
  assert.match(scrollRoot, /window\.addEventListener\("wheel", handleWheel/);
  assert.match(scrollRoot, /passive: false/);
  assert.match(scrollRoot, /event\.preventDefault\(\)/);
  assert.match(scrollRoot, /root\.scrollTop \+= deltaY/);
  assert.match(scrollRoot, /case "ArrowDown"/);
  assert.match(scrollRoot, /case "PageDown"/);
  assert.match(scrollRoot, /case "PageUp"/);
  assert.match(scrollRoot, /case "Home"/);
  assert.match(scrollRoot, /case "End"/);
  assert.match(scrollRoot, /root\.scrollTo\(\{ top: destination, behavior: "auto" \}\)/);
});

test("reseta a rota nova no topo do viewport real sem restauração concorrente", () => {
  assert.match(router, /scrollRestoration:\s*false/);
  assert.match(router, /defaultPreloadDelay:\s*0/);
  assert.match(scrollRoot, /useLayoutEffect/);
  assert.match(scrollRoot, /window\.history\.scrollRestoration = "manual"/);
  assert.match(scrollRoot, /root\.scrollTop = 0/);
  assert.match(scrollRoot, /root\.scrollLeft = 0/);
  assert.match(scrollRoot, /window\.requestAnimationFrame/);
  assert.match(scrollRoot, /\}, \[pathname\]\);/);
  assert.match(scrollStyles, /overflow-anchor:\s*none/);
  assert.match(scrollStyles, /scroll-behavior:\s*auto/);
});

test("preserva campos editáveis, modais e scroll interno", () => {
  assert.match(scrollRoot, /EDITABLE_SELECTOR/);
  assert.match(scrollRoot, /MODAL_SELECTOR/);
  assert.match(scrollRoot, /hasScrollableAncestor/);
  assert.match(scrollRoot, /isModalOpen\(\)/);
  assert.match(scrollRoot, /shouldPreserveKeyboardBehavior/);
});

test("desativa scroll concorrente em html e body e aplica scrollbar editorial", () => {
  assert.match(scrollStyles, /html,[\s\S]*body \{[\s\S]*overflow: hidden !important;/);
  assert.match(scrollStyles, /\.page-scroll-root \{[\s\S]*overflow-y: scroll;/);
  assert.match(scrollStyles, /scrollbar-color: var\(--document-scrollbar-end\)/);
  assert.match(scrollStyles, /\.page-scroll-root::\-webkit-scrollbar-thumb/);
  assert.match(scrollStyles, /linear-gradient\([\s\S]*--document-scrollbar-start/);
});

test("carrega a camada de scrollbar na entrada CSS e no manifesto", () => {
  assert.match(productionCss, /@import "\.\/styles\/document-scroll\.css";/);
  assert.match(productionManifest, /import "\.\/styles\/document-scroll\.css";/);
});
