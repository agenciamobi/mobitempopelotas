import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const outputDirectory = path.resolve("artifacts/visual-exact-production");
const productionUrl = process.env.PRODUCTION_URL ?? "https://www.tempopelotas.com.br";
const lovableUrl = process.env.LOVABLE_URL ?? "https://mobitempopelotas.lovable.app";
const expectedLovableMarker = "site-shell--home-editorial";

const viewports = [
  { name: "desktop-1440", width: 1440, height: 1200, mobile: false },
  { name: "mobile-320", width: 320, height: 720, mobile: true },
  { name: "mobile-390", width: 390, height: 844, mobile: true },
  { name: "tablet-768", width: 768, height: 1024, mobile: true },
];

const targets = [
  { name: "producao-vercel", url: productionUrl, strict: false },
  { name: "lovable", url: lovableUrl, strict: true },
];

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForLovableDeployment() {
  let lastState = "sem resposta";

  for (let attempt = 1; attempt <= 24; attempt += 1) {
    try {
      const response = await fetch(lovableUrl, {
        headers: { "User-Agent": "TempoPelotas-Exact-VisualAudit/1.0" },
        signal: AbortSignal.timeout(20_000),
      });
      const html = await response.text();
      lastState = `HTTP ${response.status}`;
      if (response.ok && html.includes(expectedLovableMarker)) return;
    } catch (error) {
      lastState = error instanceof Error ? error.message : String(error);
    }

    console.log(
      `Aguardando publicação Lovable (${attempt}/24): ${lastState}; shell literal ainda ausente.`,
    );
    if (attempt < 24) await wait(10_000);
  }

  throw new Error(`A publicação Lovable não apresentou ${expectedLovableMarker}: ${lastState}.`);
}

function reportMarkdown(results) {
  const lines = [
    "# Auditoria visual do transplante literal",
    "",
    `- Produção Vercel: ${productionUrl}`,
    `- Lovable: ${lovableUrl}`,
    `- Executada em: ${new Date().toISOString()}`,
    "",
    "| Ambiente | Viewport | Overflow | Shell literal | Mapa | Embrapa | Águas | Exploração | Skip link | Navegação móvel | Rodapé |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
  ];

  for (const result of results) {
    const audit = result.audit;
    lines.push(
      `| ${result.target} | ${result.viewport.width}×${result.viewport.height} | ${audit.horizontalOverflow}px | ${audit.hasExactShell ? "sim" : "não"} | ${audit.hasMap ? "sim" : "não"} | ${audit.hasObservation ? "sim" : "não"} | ${audit.hasWater ? "sim" : "não"} | ${audit.hasExplore ? "sim" : "não"} | ${audit.skipLinkVisible ? "sim" : "não"} | ${audit.mobileNavigationVisible === null ? "n/a" : audit.mobileNavigationVisible ? "sim" : "não"} | ${audit.hasFooter ? "sim" : "não"} |`,
    );
  }

  lines.push("", "As capturas PNG completas estão neste artefato.");
  return `${lines.join("\n")}\n`;
}

async function auditPage(page, target, viewport) {
  await page.goto(target.url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => undefined);
  await page.waitForTimeout(2_000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.keyboard.press("Tab");
  await page.waitForTimeout(200);

  const audit = await page.evaluate(({ mobile }) => {
    const root = document.documentElement;
    const active = document.activeElement;
    const skipLink = document.querySelector(".skip-link");
    const skipRect = skipLink?.getBoundingClientRect() ?? null;
    const mobileNavigation = document.querySelector(".mobile-tab-bar");
    const mobileStyle = mobileNavigation ? window.getComputedStyle(mobileNavigation) : null;
    const mobileRect = mobileNavigation?.getBoundingClientRect() ?? null;
    const footer = document.querySelector(".site-footer-v3");
    const footerPanel = document.querySelector(".editorial-footer");
    const footerStyle = footer ? window.getComputedStyle(footer) : null;
    const footerPanelStyle = footerPanel ? window.getComputedStyle(footerPanel) : null;
    const navigationVisible = Boolean(
      mobileStyle && mobileStyle.display !== "none" && mobileRect && mobileRect.height > 0,
    );
    const navigationHeight = navigationVisible && mobileRect ? mobileRect.height : 0;
    const footerPaddingBottom = footerStyle
      ? Number.parseFloat(footerStyle.paddingBottom) || 0
      : 0;

    return {
      title: document.title,
      horizontalOverflow: Math.max(0, root.scrollWidth - root.clientWidth),
      hasExactShell: Boolean(document.querySelector(".site-shell--home-editorial")),
      hasHeader: Boolean(document.querySelector(".site-header--hero")),
      hasHero: Boolean(document.querySelector(".weather-hero")),
      hasForecast: Boolean(document.querySelector(".home-story--forecast")),
      hasMap: Boolean(document.querySelector(".home-map-story")),
      hasObservation: Boolean(document.querySelector(".home-observation-story")),
      hasWater: Boolean(document.querySelector(".home-story--water")),
      hasExplore: Boolean(document.querySelector("#explorar-portal")),
      hasFooter: Boolean(footer && footerPanel),
      footerBackground: footerPanelStyle?.backgroundColor ?? null,
      skipLinkFocused: active === skipLink,
      skipLinkVisible: Boolean(
        skipRect &&
          skipRect.width > 0 &&
          skipRect.height > 0 &&
          skipRect.top >= 0 &&
          skipRect.left >= 0,
      ),
      mobileNavigationVisible: mobile ? navigationVisible : null,
      navigationHeight,
      footerPaddingBottom,
      footerProtected: mobile && navigationVisible ? footerPaddingBottom >= navigationHeight : null,
    };
  }, { mobile: viewport.mobile });

  const failures = [];
  if (audit.horizontalOverflow > 2) failures.push(`overflow horizontal de ${audit.horizontalOverflow}px`);
  if (target.strict) {
    for (const [name, present] of [
      ["shell literal", audit.hasExactShell],
      ["header", audit.hasHeader],
      ["hero", audit.hasHero],
      ["previsão", audit.hasForecast],
      ["mapa", audit.hasMap],
      ["observação", audit.hasObservation],
      ["águas", audit.hasWater],
      ["exploração", audit.hasExplore],
      ["rodapé", audit.hasFooter],
    ]) {
      if (!present) failures.push(`${name} ausente`);
    }
    if (!audit.skipLinkFocused || !audit.skipLinkVisible) failures.push("skip link sem foco visível");
    if (viewport.mobile && audit.mobileNavigationVisible !== true) {
      failures.push("navegação móvel não visível");
    }
    if (audit.footerProtected === false) {
      failures.push(
        `rodapé sem proteção: ${audit.footerPaddingBottom}px para navegação de ${audit.navigationHeight}px`,
      );
    }
  }

  return { audit, failures };
}

await mkdir(outputDirectory, { recursive: true });
await waitForLovableDeployment();

const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const target of targets) {
    for (const viewport of viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      const { audit, failures } = await auditPage(page, target, viewport);
      const screenshot = `${target.name}--${viewport.name}.png`;
      await page.screenshot({
        path: path.join(outputDirectory, screenshot),
        fullPage: true,
        animations: "disabled",
      });
      results.push({ target: target.name, url: target.url, viewport, screenshot, audit, failures });
      await context.close();
    }
  }
} finally {
  await browser.close();
}

await writeFile(
  path.join(outputDirectory, "report.json"),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)}\n`,
);
await writeFile(path.join(outputDirectory, "README.md"), reportMarkdown(results));

const failures = results.flatMap((result) =>
  result.failures.map(
    (failure) => `${result.target} ${result.viewport.width}×${result.viewport.height}: ${failure}`,
  ),
);

for (const result of results) {
  console.log(
    `${result.target} ${result.viewport.width}×${result.viewport.height}: ${JSON.stringify(result.audit)}`,
  );
}

if (failures.length > 0) {
  throw new Error(`Falhas na auditoria visual:\n- ${failures.join("\n- ")}`);
}
