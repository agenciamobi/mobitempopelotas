import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const UX_PATH = new URL("../src/production/styles/home-editorial-ux.css", import.meta.url);
const INDEX_PATH = new URL("../src/production/components/home-section-navigation.css", import.meta.url);
const CSS_ENTRY_PATH = new URL("../src/production/production-styles.css", import.meta.url);
const TS_ENTRY_PATH = new URL("../src/production/production-styles.ts", import.meta.url);

test("carrega a camada de UX depois da composição editorial atual", async () => {
  const [cssEntry, tsEntry] = await Promise.all([
    readFile(CSS_ENTRY_PATH, "utf8"),
    readFile(TS_ENTRY_PATH, "utf8"),
  ]);

  for (const entry of [cssEntry, tsEntry]) {
    const currentIndex = entry.indexOf("home-editorial-current.css");
    const uxIndex = entry.indexOf("home-editorial-ux.css");

    assert.ok(currentIndex >= 0, "a composição editorial atual precisa permanecer carregada");
    assert.ok(uxIndex > currentIndex, "a camada de UX deve vir depois da composição atual");
  }
});

test("mantém requisitos mínimos de acessibilidade na camada transversal", async () => {
  const css = await readFile(UX_PATH, "utf8");

  assert.match(css, /:focus-visible/);
  assert.match(css, /outline:\s*2px solid var\(--ux-focus\)/);
  assert.match(css, /@media \(pointer: coarse\)/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});

test("índice da Home possui rolagem mobile na fonte local do componente", async () => {
  const css = await readFile(INDEX_PATH, "utf8");

  assert.match(css, /\.tp-home-index__links/);
  assert.match(css, /overflow-x:\s*auto/);
  assert.match(css, /scroll-snap-type:\s*x proximity/);
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.doesNotMatch(css, /\.home-section-navigation/);
});
