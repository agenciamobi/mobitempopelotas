import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const UX_PATH = new URL("../src/production/styles/home-editorial-ux.css", import.meta.url);
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

test("mantém requisitos mínimos de acessibilidade e mobile na home", async () => {
  const css = await readFile(UX_PATH, "utf8");

  assert.match(css, /:focus-visible/);
  assert.match(css, /outline:\s*2px solid var\(--ux-focus\)/);
  assert.match(css, /@media \(pointer: coarse\)/);
  assert.match(css, /min-height:\s*44px/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css, /home-section-navigation__links/);
  assert.match(css, /overflow-x:\s*auto/);
});
