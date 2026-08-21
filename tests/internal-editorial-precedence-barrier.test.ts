import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const barrier = readFileSync(
  "src/production/styles/internal-editorial-precedence-barrier.css",
  "utf8",
);
const productionCss = readFileSync("src/production/production-styles.css", "utf8");
const productionManifest = readFileSync("src/production/production-styles.ts", "utf8");
const todayHeroRefinement = readFileSync(
  "src/components/weather/TodayRetailHeroRefinement.css",
  "utf8",
);
const tomorrowHeroCss = readFileSync(
  "src/components/weather/TomorrowRetailHero.css",
  "utf8",
);
const sevenDayHeroCss = readFileSync(
  "src/components/weather/SevenDayRetailHero.css",
  "utf8",
);
const sevenDayHero = readFileSync(
  "src/components/weather/SevenDayRetailHero.tsx",
  "utf8",
);
const rainHeroCss = readFileSync(
  "src/components/weather/RainRetailHero.css",
  "utf8",
);

test("editorial precedence barrier is the final production style layer", () => {
  const cssImports = productionCss
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("@import "));
  const tsImports = productionManifest
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("import "));

  assert.equal(
    cssImports.at(-2),
    '@import "./styles/internal-dedicated-page-stabilization.css";',
  );
  assert.equal(
    cssImports.at(-1),
    '@import "./styles/internal-editorial-precedence-barrier.css";',
  );
  assert.equal(
    tsImports.at(-2),
    'import "./styles/internal-dedicated-page-stabilization.css";',
  );
  assert.equal(
    tsImports.at(-1),
    'import "./styles/internal-editorial-precedence-barrier.css";',
  );
});

test("lazy internal weather sections cannot restore legacy gradients or shadows", () => {
  assert.match(barrier, /site-shell--home-editorial\.internal-weather-shell/);
  assert.match(barrier, /> \[class\$="-page"\]/);
  assert.match(barrier, /background-image:\s*none !important/);
  assert.match(barrier, /box-shadow:\s*none !important/);
  assert.match(barrier, /border-radius:\s*var\(--route-editorial-radius\) !important/);
});

test("retail forecast heroes may use deliberate color without restoring old outer chrome", () => {
  for (const namespace of [
    "internal-weather-shell--today",
    "internal-weather-shell--tomorrow",
    "internal-weather-shell--seven-day",
    "internal-weather-shell--rain",
  ]) {
    assert.match(barrier, new RegExp(`\\.${namespace}`));
  }

  assert.match(
    barrier,
    /:is\(\.today-retail-hero, \.tomorrow-retail-hero, \.seven-day-retail-hero, \.rain-retail-hero\)[\s\S]*?border:\s*0 !important[\s\S]*?box-shadow:\s*none !important/,
  );
  assert.doesNotMatch(
    barrier,
    /:is\(\.tomorrow-retail-hero, \.rain-retail-hero\)[\s\S]*?background-image:\s*none !important/,
  );
  assert.match(
    barrier,
    /:is\(\.today-retail-hero, \.tomorrow-retail-hero, \.seven-day-retail-hero, \.rain-retail-hero\)::before,[\s\S]*?::after[\s\S]*?display:\s*none !important/,
  );
});

test("Today hero uses a controlled chromatic break and differentiated summary tiles", () => {
  assert.match(
    todayHeroRefinement,
    /\.internal-weather-shell--today \.today-retail-hero[\s\S]*?radial-gradient[\s\S]*?linear-gradient/,
  );
  assert.match(todayHeroRefinement, /\.today-retail-hero__current[\s\S]*?min-height:\s*21rem/);
  assert.match(todayHeroRefinement, /\.today-retail-hero__tiles article\.is-rain/);
  assert.match(todayHeroRefinement, /\.today-retail-hero__tiles article\.is-wind/);
  assert.match(todayHeroRefinement, /\.today-retail-hero__tiles article\.is-sun/);
});

test("Tomorrow hero keeps warm planning accents without returning to a promotional megacard", () => {
  assert.match(tomorrowHeroCss, /warmer planning accent/);
  assert.match(tomorrowHeroCss, /\.tomorrow-retail-hero[\s\S]*?radial-gradient[\s\S]*?linear-gradient/);
  assert.match(tomorrowHeroCss, /\.tomorrow-retail-hero__current[\s\S]*?min-height:\s*21\.5rem/);
  assert.match(tomorrowHeroCss, /\.tomorrow-retail-hero__tiles article:first-child/);
  assert.match(tomorrowHeroCss, /\.tomorrow-retail-hero__tiles article\.is-rain/);
  assert.match(tomorrowHeroCss, /\.tomorrow-retail-hero__tiles article\.is-wind/);
  assert.match(tomorrowHeroCss, /\.tomorrow-retail-hero__tiles article\.is-sun/);
});

test("7-day hero has a concise weekly hierarchy and semantic color accents", () => {
  assert.match(sevenDayHero, /Previsão de <span>7 dias<\/span> para Pelotas/);
  assert.match(sevenDayHero, /className="is-maximum"/);
  assert.match(sevenDayHero, /className="is-cold"/);
  assert.match(sevenDayHero, /className="is-source"/);
  assert.match(sevenDayHeroCss, /\.seven-day-retail-hero[\s\S]*?radial-gradient[\s\S]*?linear-gradient/);
  assert.match(
    sevenDayHeroCss,
    /\.today-retail-hero__primary[\s\S]*?linear-gradient\(135deg, #5e2ced 0%, #e70b85 100%\)/,
  );
  assert.match(sevenDayHeroCss, /\.seven-day-retail-hero__tiles article\.is-maximum/);
  assert.match(sevenDayHeroCss, /\.seven-day-retail-hero__tiles article\.is-rain/);
  assert.match(sevenDayHeroCss, /\.seven-day-retail-hero__tiles article\.is-cold/);
  assert.match(sevenDayHeroCss, /\.seven-day-retail-hero__tiles article\.is-source/);
});

test("Rain hero uses a cool monitoring palette and keeps adjacent readings distinct", () => {
  assert.match(rainHeroCss, /cool monitoring accent/);
  assert.match(rainHeroCss, /\.rain-retail-hero[\s\S]*?radial-gradient[\s\S]*?linear-gradient/);
  assert.match(
    rainHeroCss,
    /\.today-retail-hero__primary[\s\S]*?linear-gradient\(135deg, #168fa3 0%, #5e2ced 100%\)/,
  );
  assert.match(rainHeroCss, /\.rain-retail-hero__current[\s\S]*?min-height:\s*21\.5rem/);
  assert.match(rainHeroCss, /\.rain-retail-hero__tiles article\.is-rain/);
  assert.match(rainHeroCss, /\.rain-retail-hero__tiles article:nth-child\(2\)/);
  assert.match(rainHeroCss, /\.rain-retail-hero__tiles article\.is-wind/);
  assert.match(rainHeroCss, /\.rain-retail-hero__tiles article\.is-sun/);
});

test("climate and hydrology custom heroes follow the Home split-surface contract", () => {
  assert.match(barrier, /\.internal-weather-shell--climate \.climate-hero/);
  assert.match(barrier, /\.internal-weather-shell--hydrology \.hydrology-v2-hero/);
  assert.match(
    barrier,
    /grid-template-columns:\s*minmax\(0, 1\.12fr\) minmax\(320px, 0\.66fr\) !important/,
  );
  assert.match(
    barrier,
    /\.climate-hero__content,[\s\S]*?\.hydrology-v2-hero__content[\s\S]*?background-color:\s*var\(--route-editorial-surface\) !important/,
  );
  assert.match(
    barrier,
    /\.climate-hero__panel,[\s\S]*?\.hydrology-v2-hero__reading[\s\S]*?border-left:\s*1px solid var\(--route-editorial-line\) !important/,
  );
  assert.match(
    barrier,
    /\.climate-hero__content h1,[\s\S]*?\.hydrology-v2-hero__content h1[\s\S]*?color:\s*var\(--route-editorial-ink\) !important/,
  );
  assert.match(
    barrier,
    /@media \(max-width: 720px\)[\s\S]*?\.internal-weather-shell--climate \.climate-hero,[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) !important/,
  );
});

test("standalone status and privacy pages keep Home geometry after route CSS loads", () => {
  assert.match(barrier, /\.data-status-shell/);
  assert.match(barrier, /\.privacy-data-shell/);
  assert.match(
    barrier,
    /\.data-status-page,[\s\S]*?\.privacy-page[\s\S]*?--tp-home-container-max, 1440px/,
  );
  assert.match(
    barrier,
    /\.data-status-hero,[\s\S]*?\.privacy-hero[\s\S]*?background-image:\s*none !important[\s\S]*?box-shadow:\s*none !important/,
  );
  assert.match(barrier, /\.data-status-groups[\s\S]*?margin-top:\s*0 !important/);
  assert.match(barrier, /@media \(max-width: 1240px\)[\s\S]*?\.data-status-page/);
  assert.match(barrier, /@media \(max-width: 720px\)[\s\S]*?\.privacy-page/);
});

test("topic and dedicated pages receive the same Home surface protection", () => {
  assert.match(barrier, /\.site-shell--topic/);
  assert.match(barrier, /\.hydrology-editorial-route > section/);
  assert.match(barrier, /\.radar-satellite-page > section/);
  assert.match(barrier, /\.redemet-page > section/);
  assert.match(barrier, /internal-weather-shell--cameras/);
  assert.match(barrier, /internal-weather-shell--meteogram/);
  assert.match(barrier, /internal-weather-shell--embrapa/);
  assert.match(barrier, /internal-weather-shell--history/);
});

test("functional visualizations are not flattened by the editorial barrier", () => {
  assert.match(barrier, /maplibregl-map/);
  assert.match(barrier, /iframe/);
  assert.match(barrier, /video/);
  assert.match(barrier, /canvas/);
  assert.match(barrier, /svg\[data-chart\]/);
});
