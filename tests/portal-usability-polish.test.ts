import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const cssEntry = readFileSync("src/production/production-styles.css", "utf8");
const tsEntry = readFileSync("src/production/production-styles.ts", "utf8");
const polish = readFileSync("src/production/styles/portal-usability-polish.css", "utf8");

function assertLoadedLast(entry: string) {
  const barrier = entry.indexOf("internal-editorial-precedence-barrier.css");
  const polishIndex = entry.indexOf("portal-usability-polish.css");
  assert.ok(barrier >= 0);
  assert.ok(polishIndex > barrier);
}

test("portal usability polish is the final production layer in both entrypoints", () => {
  assertLoadedLast(cssEntry);
  assertLoadedLast(tsEntry);
  assert.doesNotMatch(polish, /!\s*important\s*;/);
});

test("global navigation and standalone controls keep 44px touch targets", () => {
  assert.match(polish, /\.tp-home-header \.header-account-link,[\s\S]*min-height:\s*44px/);
  assert.match(polish, /\.tp-home-header__alert[\s\S]*min-height:\s*44px/);
  assert.match(polish, /\.tp-home-footer \.tp-home-footer-group a,[\s\S]*min-height:\s*44px/);
  assert.match(polish, /\.tp-public-service-strip \.tp-public-service-civil-defense__identity > a,[\s\S]*min-height:\s*44px/);
  assert.match(polish, /\.pwa-launcher\.pwa-launcher[\s\S]*min-height:\s*44px/);
  assert.match(polish, /\.pwa-dialog \.pwa-dialog-close[\s\S]*width:\s*44px[\s\S]*height:\s*44px/);
});

test("technical weather controls keep 44px targets and stable focus states", () => {
  assert.match(polish, /\.sace-filter-buttons button[\s\S]*min-height:\s*44px/);
  assert.match(polish, /\.sace-system-grid button:hover,[\s\S]*transform:\s*none/);
  assert.match(polish, /\.meteogram-window-toggle button,[\s\S]*\.meteogram-quick-actions button[\s\S]*min-height:\s*44px/);
  assert.match(polish, /\.frost-v2-filters button,[\s\S]*min-height:\s*44px/);
  assert.match(polish, /\.history-chart-tabs button,[\s\S]*\.history-period button[\s\S]*min-height:\s*44px/);
  assert.match(polish, /\.alerts-official-link[\s\S]*min-height:\s*44px/);
});

test("narrow screens keep real header offsets and avoid clipped weather summaries", () => {
  assert.match(polish, /\.page-scroll-root\s*\{[\s\S]*scroll-padding-top:\s*84px/);
  assert.match(polish, /@media \(max-width: 1040px\)[\s\S]*scroll-padding-top:\s*116px/);
  assert.match(polish, /@media \(max-width: 720px\)[\s\S]*scroll-padding-top:\s*112px/);
  assert.match(polish, /@media \(max-width: 360px\)[\s\S]*width:\s*140px/);
  assert.match(polish, /\.embrapa-history__summary :is\(span, small, strong\)[\s\S]*text-overflow:\s*clip[\s\S]*white-space:\s*normal/);
});

test("shared forecast and microcopy retain a readable floor", () => {
  assert.match(polish, /\.home-tomorrow-spotlight > a,[\s\S]*\.home-forecast-links > a[\s\S]*min-height:\s*44px/);
  assert.match(polish, /font-size:\s*max\(0\.6rem, 10px\)/);
  assert.match(polish, /\.alerts-card-meta span/);
  assert.match(polish, /\.tp-home-footer-status small/);
  assert.match(polish, /overscroll-behavior-inline:\s*contain/);
});
