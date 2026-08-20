import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shellCss = readFileSync("src/production/styles/home-editorial-shell.css", "utf8");
const homeSource = readFileSync("src/production/ProductionHome.tsx", "utf8");

test("homepage sections share one 1220px editorial container", () => {
  assert.match(shellCss, /--tp-home-content-width:\s*1220px/);
  assert.match(shellCss, /--tp-home-content-space:\s*48px/);
  assert.match(shellCss, />\s*header\s*\+\s*div[\s\S]*#conteudo-principal\s*>\s*\*/);
  assert.match(
    shellCss,
    /width:\s*min\([\s\S]*var\(--tp-home-content-width\)[\s\S]*calc\(100%\s*-\s*var\(--tp-home-content-space\)\)[\s\S]*\)/,
  );
});

test("homepage container keeps responsive horizontal breathing room", () => {
  assert.match(shellCss, /@media \(max-width:\s*1240px\)[\s\S]*--tp-home-content-space:\s*32px/);
  assert.match(shellCss, /@media \(max-width:\s*720px\)[\s\S]*--tp-home-content-space:\s*24px/);
  assert.doesNotMatch(shellCss, /!important/);
});

test("the hero remains the visual block between the home header and main content", () => {
  const headerIndex = homeSource.indexOf("<SiteHeader");
  const heroIndex = homeSource.indexOf("tp-home-hero-shell", headerIndex);
  const mainIndex = homeSource.indexOf("<main className={mainClassName}", heroIndex);

  assert.ok(headerIndex >= 0);
  assert.ok(heroIndex > headerIndex);
  assert.ok(mainIndex > heroIndex);
});
