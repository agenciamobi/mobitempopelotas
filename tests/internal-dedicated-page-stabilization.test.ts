import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const stabilizationCss = readFileSync(
  "src/production/styles/internal-dedicated-page-stabilization.css",
  "utf8",
);
const cssEntry = readFileSync("src/production/production-styles.css", "utf8");
const tsEntry = readFileSync("src/production/production-styles.ts", "utf8");

test("dedicated-page stabilization is the last production visual contract", () => {
  for (const entry of [cssEntry, tsEntry]) {
    const standaloneIndex = entry.indexOf("standalone-home-surface-contract.css");
    const stabilizationIndex = entry.indexOf("internal-dedicated-page-stabilization.css");
    assert.ok(standaloneIndex >= 0);
    assert.ok(stabilizationIndex > standaloneIndex);
  }
});

test("REDEMET light hero keeps readable freshness states", () => {
  assert.match(stabilizationCss, /\.redemet-hero \.redemet-freshness \{/);
  assert.match(stabilizationCss, /color:\s*#17633b/);
  assert.match(stabilizationCss, /background:\s*#eaf7ef/);
  assert.match(stabilizationCss, /\.redemet-freshness\.is-attention/);
  assert.match(stabilizationCss, /\.redemet-freshness\.is-stale/);
  assert.match(stabilizationCss, /\.redemet-freshness\.is-unknown/);
});

test("REDEMET supporting cards keep the flat Home interaction language", () => {
  assert.match(stabilizationCss, /\.redemet-source-summary/);
  assert.match(stabilizationCss, /\.redemet-explainer article/);
  assert.match(stabilizationCss, /\.redemet-related > a/);
  assert.match(stabilizationCss, /border-radius:\s*14px/);
  assert.match(stabilizationCss, /box-shadow:\s*none/);
  assert.match(stabilizationCss, /\.redemet-related > a:hover[\s\S]*?transform:\s*none/);
});
