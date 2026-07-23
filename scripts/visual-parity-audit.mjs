import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const outputDirectory = path.resolve("artifacts/visual-parity");
const productionUrl = process.env.PRODUCTION_URL ?? "https://www.tempopelotas.com.br";
const lovableUrl = process.env.LOVABLE_URL ?? "https://mobitempopelotas.lovable.app";
const targets = [
  { name: "lovable", url: lovableUrl, strict: true },
  { name: "producao-vercel", url: productionUrl, strict: false },
];
const viewports = [
  { name: "desktop-1440", width: 1440, height: 1200, mobile: false },
  { name: "mobile-320", width: 320, height: 720, mobile: true },
  { name: "mobile-390", width: 390, height: 844, mobile: true },
  { name: "tablet-768", width: 768, height: 1024, mobile: true },
];
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForDeployment() {
  for (let attempt = 1; attempt <= 24; attempt += 1) {
    try {
      const response = await fetch(lovableUrl, {
        headers: { "User-Agent": "TempoPelotas-CssStackAudit/2.0" },
        signal: AbortSignal.timeout(20_000),
      });
      const html = await response.text();
      if (response.ok && html.includes("site-shell--home-editorial")) return;
    } catch {
      // Repete abaixo.
    }
    console.log(`Aguardando publicação Lovable (${attempt}/24).`);
    if (attempt < 24) await wait(10_000);
  }
  throw new Error("A publicação Lovable não apresentou a homepage literal dentro do prazo.");
}

async function audit(target, viewport) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    reducedMotion: "reduce",
    ignoreHTTPSErrors: true,
    serviceWorkers: "block",
  });
  const page = await context.newPage();

  try {
    await page.goto(target.url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => undefined);
    await page.waitForTimeout(2_000);

    const metrics = await page.evaluate(
      ({ mobile }) => {
        const root = document.documentElement;
        const mobileNavigation = document.querySelector(".mobile-tab-bar");
        const mobileStyle = mobileNavigation ? window.getComputedStyle(mobileNavigation) : null;
        const mobileRect = mobileNavigation?.getBoundingClientRect() ?? null;
        const footer = document.querySelector(".site-footer-v3");
        const footerStyle = footer ? window.getComputedStyle(footer) : null;
        const navigationVisible = Boolean(
          mobileStyle && mobileStyle.display !== "none" && mobileRect && mobileRect.height > 0,
        );
        const navigationHeight = navigationVisible && mobileRect ? mobileRect.height : 0;
        const footerPaddingBottom = footerStyle
          ? Number.parseFloat(footerStyle.paddingBottom) || 0
          : 0;

        return {
          title: document.title,
          clientWidth: root.clientWidth,
          scrollWidth: root.scrollWidth,
          horizontalOverflow: Math.max(0, root.scrollWidth - root.clientWidth),
          hasShell: Boolean(document.querySelector(".site-shell--home-editorial")),
          hasHeader: Boolean(document.querySelector(".site-header--hero")),
          hasHero: Boolean(document.querySelector(".weather-hero")),
          hasForecast: Boolean(document.querySelector(".home-story--forecast")),
          hasMap: Boolean(document.querySelector(".home-map-story")),
          hasObservation: Boolean(document.querySelector(".home-observation-story")),
          hasWater: Boolean(document.querySelector(".home-story--water")),
          hasExplore: Boolean(document.querySelector("#explorar-portal")),
          hasFooter: Boolean(footer && document.querySelector(".editorial-footer")),
          mobileNavigationVisible: mobile ? navigationVisible : null,
          navigationHeight,
          footerPaddingBottom,
          footerProtected:
            mobile && navigationVisible ? footerPaddingBottom >= navigationHeight : null,
        };
      },
      { mobile: viewport.mobile },
    );

    await page.screenshot({
      path: path.join(outputDirectory, `${target.name}--${viewport.name}--top.png`),
      fullPage: false,
      animations: "disabled",
    });
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(300);
    await page.screenshot({
      path: path.join(outputDirectory, `${target.name}--${viewport.name}--footer.png`),
      fullPage: false,
      animations: "disabled",
    });

    const failures = [];
    if (metrics.horizontalOverflow > 2) {
      failures.push(`overflow horizontal de ${metrics.horizontalOverflow}px`);
    }
    if (target.strict) {
      for (const [label, present] of [
        ["shell", metrics.hasShell],
        ["header", metrics.hasHeader],
        ["hero", metrics.hasHero],
        ["previsão", metrics.hasForecast],
        ["mapa", metrics.hasMap],
        ["Embrapa", metrics.hasObservation],
        ["águas", metrics.hasWater],
        ["exploração", metrics.hasExplore],
        ["footer", metrics.hasFooter],
      ]) {
        if (!present) failures.push(`${label} ausente`);
      }
      if (viewport.mobile && metrics.mobileNavigationVisible !== true) {
        failures.push("navegação móvel ausente");
      }
      if (viewport.mobile && metrics.navigationHeight > 100) {
        failures.push(`navegação móvel com ${metrics.navigationHeight}px`);
      }
      if (metrics.footerProtected === false) {
        failures.push(
          `footer com ${metrics.footerPaddingBottom}px para navegação de ${metrics.navigationHeight}px`,
        );
      }
    }

    return { target: target.name, url: target.url, viewport, metrics, failures };
  } finally {
    await context.close();
    await browser.close();
  }
}

await mkdir(outputDirectory, { recursive: true });
await waitForDeployment();

const results = [];
for (const target of targets) {
  for (const viewport of viewports) {
    const result = await audit(target, viewport);
    results.push(result);
    console.log(`${target.name} ${viewport.width}×${viewport.height}: ${JSON.stringify(result.metrics)}`);
  }
}

await writeFile(
  path.join(outputDirectory, "report.json"),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)}\n`,
);

const failures = results.flatMap((result) =>
  result.failures.map(
    (failure) => `${result.target} ${result.viewport.width}×${result.viewport.height}: ${failure}`,
  ),
);

if (failures.length > 0) {
  throw new Error(`Falhas na pilha CSS:\n- ${failures.join("\n- ")}`);
}
