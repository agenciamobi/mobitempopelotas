import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const shellCss = readFileSync("src/production/styles/home-editorial-shell.css", "utf8");
const headerCss = readFileSync("src/production/components/home-editorial-header.css", "utf8");
const footerCss = readFileSync("src/production/components/site-footer-home.css", "utf8");
const homeSource = readFileSync("src/production/ProductionHome.tsx", "utf8");

test("homepage follows the same 1440px container used by the header", () => {
  assert.match(shellCss, /--tp-home-container-max:\s*1440px/);
  assert.match(shellCss, /--tp-home-container-gutter:\s*48px/);
  assert.match(shellCss, /--tp-home-container-compact-max:\s*1180px/);
  assert.match(shellCss, /--tp-home-container-compact-gutter:\s*32px/);
  assert.match(shellCss, /--tp-home-container-mobile-gutter:\s*20px/);
  assert.match(shellCss, />\s*header\s*\+\s*div[\s\S]*#conteudo-principal\s*>\s*\*/);

  for (const css of [headerCss, footerCss]) {
    assert.match(css, /var\(--tp-home-container-max,\s*1440px\)/);
    assert.match(css, /var\(--tp-home-container-gutter,\s*48px\)/);
    assert.match(css, /var\(--tp-home-container-compact-max,\s*1180px\)/);
    assert.match(css, /var\(--tp-home-container-compact-gutter,\s*32px\)/);
    assert.match(css, /var\(--tp-home-container-mobile-gutter,\s*20px\)/);
  }
});

test("homepage keeps the header responsive gutters from hero through footer", () => {
  assert.match(
    shellCss,
    /@media \(max-width:\s*1240px\)[\s\S]*var\(--tp-home-container-compact-gutter\)[\s\S]*var\(--tp-home-container-compact-max\)/,
  );
  assert.match(
    shellCss,
    /@media \(max-width:\s*720px\)[\s\S]*var\(--tp-home-container-mobile-gutter\)/,
  );

  for (const css of [shellCss, headerCss, footerCss]) {
    assert.doesNotMatch(css, /!important/);
  }
});

test("the hero remains the visual block between the home header and main content", () => {
  const headerIndex = homeSource.indexOf("<SiteHeader");
  const heroIndex = homeSource.indexOf("tp-home-hero-shell", headerIndex);
  const mainIndex = homeSource.indexOf("<main className={mainClassName}", heroIndex);

  assert.ok(headerIndex >= 0);
  assert.ok(heroIndex > headerIndex);
  assert.ok(mainIndex > heroIndex);
});
