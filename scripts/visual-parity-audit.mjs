import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const outputDirectory = path.resolve("artifacts/visual-parity");
const productionUrl = process.env.PRODUCTION_URL ?? "https://tempopelotas.com.br";
const lovableUrl = process.env.LOVABLE_URL ?? "https://mobitempopelotas.lovable.app";
const expectedLovableMarker = "Encontre o que precisa acompanhar";

const viewports = [
  { name: "desktop-1440", width: 1440, height: 1200, mobile: false },
  { name: "mobile-320", width: 320, height: 720, mobile: true },
  { name: "mobile-390", width: 390, height: 844, mobile: true },
  { name: "tablet-768", width: 768, height: 1024, mobile: true },
];

const targets = [
  { name: "producao-vercel", url: productionUrl, expectExplore: true, strictLayout: false },
  { name: "lovable", url: lovableUrl, expectExplore: true, strictLayout: true },
];

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForLovableDeployment() {
  let lastStatus = "sem resposta";

  for (let attempt = 1; attempt <= 24; attempt += 1) {
    try {
      const response = await fetch(lovableUrl, {
        headers: { "User-Agent": "TempoPelotas-VisualAudit/1.0" },
        signal: AbortSignal.timeout(20_000),
      });
      const html = await response.text();
      lastStatus = `HTTP ${response.status}`;

      if (response.ok && html.includes(expectedLovableMarker)) {
        console.log(`Publicação Lovable reconhecida na tentativa ${attempt}.`);
        return;
      }
    } catch (error) {
      lastStatus = error instanceof Error ? error.message : String(error);
    }

    console.log(
      `Aguardando publicação Lovable (${attempt}/24): ${lastStatus}; marcador ainda ausente.`,
    );
    if (attempt < 24) await wait(10_000);
  }

  throw new Error(
    `A publicação Lovable não apresentou o marcador esperado: ${expectedLovableMarker}. Último estado: ${lastStatus}.`,
  );
}

function markdownReport(results) {
  const lines = [
    "# Auditoria visual de paridade",
    "",
    `- Produção Vercel: ${productionUrl}`,
    `- Publicação Lovable: ${lovableUrl}`,
    `- Executada em: ${new Date().toISOString()}`,
    "",
    "| Ambiente | Viewport | Overflow horizontal | Exploração | Skip link | Rodapé protegido |",
    "|---|---:|---:|---:|---:|---:|",
  ];

  for (const result of results) {
    lines.push(
      `| ${result.target} | ${result.viewport.width}×${result.viewport.height} | ${result.audit.horizontalOverflow}px | ${result.audit.hasExplore ? "sim" : "não"} | ${result.audit.skipLinkVisible ? "sim" : "não"} | ${result.audit.footerProtected === null ? "n/a" : result.audit.footerProtected ? "sim" : "não"} |`,
    );
  }

  lines.push("", "As capturas PNG completas de cada ambiente e viewport estão no mesmo artefato.");

  return `${lines.join("\n")}\n`;
}

async function auditPage(page, target, viewport) {
  await page.goto(target.url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
  await page.waitForTimeout(2_000);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.keyboard.press("Tab");

  const audit = await page.evaluate(
    ({ mobile, strictLayout }) => {
      const root = document.documentElement;
      const active = document.activeElement;
      const skipLink = document.querySelector(".skip-link");
      const skipRect = skipLink?.getBoundingClientRect() ?? null;
      const mobileNavigation = document.querySelector(".production-mobile-navigation");
      const footer = document.querySelector(".editorial-footer-shell");
      const mobileNavigationStyle = mobileNavigation
        ? window.getComputedStyle(mobileNavigation)
        : null;
      const footerStyle = footer ? window.getComputedStyle(footer) : null;
      const navigationRect = mobileNavigation?.getBoundingClientRect() ?? null;
      const navigationVisible = Boolean(
        mobileNavigationStyle &&
        mobileNavigationStyle.display !== "none" &&
        navigationRect &&
        navigationRect.height > 0,
      );
      const navigationHeight = navigationVisible && navigationRect ? navigationRect.height : 0;
      const footerPaddingBottom = footerStyle
        ? Number.parseFloat(footerStyle.paddingBottom) || 0
        : 0;

      return {
        title: document.title,
        horizontalOverflow: Math.max(0, root.scrollWidth - root.clientWidth),
        hasExplore: Boolean(document.querySelector("#explorar-portal")),
        exploreHeading:
          document.querySelector("#home-explore-portal-title")?.textContent?.trim() ?? null,
        hasFooter: Boolean(footer),
        skipLinkFocused: active === skipLink,
        skipLinkVisible: Boolean(
          skipRect &&
          skipRect.width > 0 &&
          skipRect.height > 0 &&
          skipRect.top >= 0 &&
          skipRect.left >= 0,
        ),
        navigationVisible,
        navigationHeight,
        footerPaddingBottom,
        footerProtected:
          mobile && strictLayout && navigationVisible
            ? footerPaddingBottom >= navigationHeight
            : null,
      };
    },
    { mobile: viewport.mobile, strictLayout: target.strictLayout },
  );

  const failures = [];
  if (audit.horizontalOverflow > 2) {
    failures.push(`overflow horizontal de ${audit.horizontalOverflow}px`);
  }
  if (target.expectExplore && !audit.hasExplore) {
    failures.push("seção de exploração ausente");
  }
  if (target.strictLayout && !audit.hasFooter) {
    failures.push("rodapé editorial ausente");
  }
  if (target.strictLayout && (!audit.skipLinkFocused || !audit.skipLinkVisible)) {
    failures.push("skip link não recebeu foco visível");
  }
  if (audit.footerProtected === false) {
    failures.push(
      `rodapé sem proteção suficiente: ${audit.footerPaddingBottom}px para navegação de ${audit.navigationHeight}px`,
    );
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
      const screenshotName = `${target.name}--${viewport.name}.png`;

      await page.screenshot({
        path: path.join(outputDirectory, screenshotName),
        fullPage: true,
        animations: "disabled",
      });

      results.push({
        target: target.name,
        url: target.url,
        viewport,
        screenshot: screenshotName,
        audit,
        failures,
      });

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
await writeFile(path.join(outputDirectory, "README.md"), markdownReport(results));

const failures = results.flatMap((result) =>
  result.failures.map(
    (failure) => `${result.target} ${result.viewport.width}×${result.viewport.height}: ${failure}`,
  ),
);

for (const result of results) {
  console.log(
    `${result.target} ${result.viewport.width}×${result.viewport.height}: overflow=${result.audit.horizontalOverflow}px explore=${result.audit.hasExplore} skip=${result.audit.skipLinkVisible} footerProtected=${result.audit.footerProtected}`,
  );
}

if (failures.length > 0) {
  throw new Error(`Falhas na auditoria visual:\n- ${failures.join("\n- ")}`);
}
