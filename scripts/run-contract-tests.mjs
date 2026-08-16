import { spawnSync } from "node:child_process";

const groups = [
  [
    "tests/water-level-state.test.ts",
    "tests/push-http.test.ts",
    "tests/database-security.test.ts",
    "tests/auth-account-security.test.ts",
    "tests/embrapa-centralization.test.ts",
  ],
  [
    "tests/forecast-accuracy.test.ts",
    "tests/open-meteo-edge.test.ts",
    "tests/runtime-readiness.test.ts",
    "tests/lovable-runtime-readiness.test.ts",
    "tests/pwa-scroll-lock.test.ts",
  ],
  [
    "tests/document-scroll.test.ts",
    "tests/production-css-entry.test.ts",
    "tests/weather-traceability.test.ts",
    "tests/current-observation.test.ts",
    "tests/production-weather-integrity.test.ts",
  ],
  [
    "tests/inmet-official-sources.test.ts",
    "tests/daily-temperature-reconciliation.test.ts",
    "tests/onesignal-integration.test.ts",
    "tests/redemet-performance.test.ts",
    "tests/internal-editorial-cohesion.test.ts",
  ],
  [
    "tests/homepage-coherence.test.ts",
    "tests/today-home-visual.test.ts",
    "tests/today-typography.test.ts",
    "tests/tomorrow-retail-visual.test.ts",
    "tests/seven-day-retail-visual.test.ts",
  ],
  [
    "tests/rain-retail-visual.test.ts",
    "tests/wind-copy.test.ts",
    "tests/visitor-language-menu-pages.test.ts",
    "tests/radar-satellite-retail.test.ts",
    "tests/atmospheric-intelligence.test.ts",
  ],
  [
    "tests/meteogram-page.test.ts",
    "tests/climate-page.test.ts",
    "tests/weather-history-page.test.ts",
    "tests/embrapa-station-page.test.ts",
    "tests/camera-monitoring-page.test.ts",
  ],
  [
    "tests/frost-monitoring-page.test.ts",
    "tests/hydrology-overview-page.test.ts",
    "tests/internal-weather-widgets.test.ts",
    "tests/regional-city-browser-recovery.test.ts",
    "tests/regional-city-editorial.test.ts",
  ],
  [
    "tests/seo-domain.test.ts",
    "tests/seo-content-accessibility.test.ts",
    "tests/embed-alerts-hydrology-regional.test.ts",
    "tests/sace-guaiba-integration.test.ts",
    "tests/route-tree-bootstrap.test.ts",
  ],
];

for (const [index, files] of groups.entries()) {
  console.log(`\n[contracts] grupo ${index + 1}/${groups.length}`);

  const result = spawnSync(process.execPath, ["--test", ...files], {
    stdio: "inherit",
    env: process.env,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
