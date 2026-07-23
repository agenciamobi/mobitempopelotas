/* global process, fetch, AbortSignal, console, document, window, HTMLImageElement, setTimeout */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const outputDirectory = path.resolve("artifacts/visual-parity");
const productionUrl =
  process.env.PRODUCTION_URL ?? "https://www.tempopelotas.com.br";
const candidateUrl =
  process.env.CANDIDATE_URL ??
  process.env.LOVABLE_URL ??
  "https://mobitempopelotas.lovable.app";
const candidateName = process.env.CANDIDATE_NAME ?? "revisao";
const expectedCandidateMarker =
  process.env.EXPECTED_CANDIDATE_MARKER ??
  "Encontre o que precisa acompanhar";
const shouldWaitForCandidate =
  process.env.WAIT_FOR_CANDIDATE_DEPLOYMENT !== "false";
const auditRevision = process.env.AUDIT_REVISION ?? "não informada";

const viewports = [
  { name: "desktop-1440", width: 1440, height: 1200, mobile: false },
  { name: "mobile-320", width: 320, height: 720, mobile: true },
  { name: "mobile-390", width: 390, height: 844, mobile: true },
  { name: "tablet-768", width: 768, height: 1024, mobile: true },
];

const targets = [
  {
    name: "producao-vercel",
    url: productionUrl,
    expectExplore: true,
    strictLayout: false,
  },
  {
    name: candidateName,
    url: candidateUrl,
    expectExplore: true,
    strictLayout: true,
  },
];

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForCandidateDeployment() {
  if (!shouldWaitForCandidate) return;

  let lastStatus = "sem resposta";

  for (let attempt = 1; attempt <= 24; attempt += 1) {
    try {
      const response = await fetch(candidateUrl, {
        headers: { "User-Agent": "TempoPelotas-VisualAudit/2.0" },
        signal: AbortSignal.timeout(20_000),
      });
      const html = await response.text();
      lastStatus = `HTTP ${response.status}`;

      if (response.ok && html.includes(expectedCandidateMarker)) {
        console.log(`Revisão reconhecida na tentativa ${attempt}.`);
        return;
      }
    } catch (error) {
      lastStatus = error instanceof Error ? error.message : String(error);
    }

    console.log(
      `Aguardando revisão (${attempt}/24): ${lastStatus}; marcador ainda ausente.`,
    );
    if (attempt < 24) await wait(10_000);
  }

  throw new Error(
    `A revisão não apresentou o marcador esperado: ${expectedCandidateMarker}. Último estado: ${lastStatus}.`,
  );
}

function markdownReport(results) {
  const lines = [
    "# Auditoria visual de paridade",
    "",
    `- Produção Vercel: ${productionUrl}`,
    `- Revisão auditada: ${candidateUrl}`,
    `- SHA: ${auditRevision}`,
    `- Executada em: ${new Date().toISOString()}`,
    "",
    "| Ambiente | Viewport | HTTP | Overflow | Estrutura | Marca | Estado | Exploração | Skip link | Rodapé claro | Área móvel segura |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|",
  ];

  for (const result of results) {
    lines.push(
      `| ${result.target} | ${result.viewport.width}×${result.viewport.height} | ${result.audit.httpStatus} | ${result.audit.horizontalOverflow}px | ${result.audit.hasCoreStructure ? "sim" : "não"} | ${result.audit.brandLoaded ? "sim" : "não"} | ${result.audit.weatherUnavailable ? "contingência" : "dados"} | ${result.audit.hasExplore ? "sim" : "não"} | ${result.audit.skipLinkVisible ? "sim" : "não"} | ${result.audit.footerLight === null ? "n/a" : result.audit.footerLight ? "sim" : "não"} | ${result.audit.footerProtected === null ? "n/a" : result.audit.footerProtected ? "sim" : "não"} |`,
    );
  }

  lines.push(
    "",
    "As capturas PNG completas de cada ambiente e viewport estão no mesmo artefato.",
  );

  return `${lines.join("\n")}\n`;
}

async function auditPage(page, target, viewport) {
  const response = await page.goto(target.url, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });

  if (!response) {
    throw new Error(`${target.name}: navegação concluída sem resposta HTTP.`);
  }

  if (!response.ok()) {
    throw new Error(
      `${target.name}: homepage respondeu HTTP ${response.status()}.`,
    );
  }

  await page
    .waitForLoadState("networkidle", { timeout: 15_000 })
    .catch(() => undefined);
  await page.waitForTimeout(2_000);

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.keyboard.press("Tab");
  await page.waitForTimeout(150);

  const audit = await page.evaluate(
    ({ mobile, strictLayout, httpStatus }) => {
      const root = document.documentElement;
      const active = document.activeElement;
      const skipLink = document.querySelector(".skip-link");
      const skipRect = skipLink?.getBoundingClientRect() ?? null;
      const mobileNavigation = document.querySelector(".mobile-tab-bar");
      const footer = document.querySelector(".site-footer-v3");
      const footerPanel = document.querySelector(".editorial-footer");
      const brand = document.querySelector(
        "img.brand-logo, .editorial-footer__brand img",
      );
      const mobileNavigationStyle = mobileNavigation
        ? window.getComputedStyle(mobileNavigation)
        : null;
      const footerStyle = footer ? window.getComputedStyle(footer) : null;
      const footerPanelStyle = footerPanel
        ? window.getComputedStyle(footerPanel)
        : null;
      const footerBackground = footerPanelStyle?.backgroundColor ?? null;
      const navigationRect =
        mobileNavigation?.getBoundingClientRect() ?? null;
      const navigationVisible = Boolean(
        mobileNavigationStyle &&
          mobileNavigationStyle.display !== "none" &&
          navigationRect &&
          navigationRect.height > 0,
      );
      const navigationHeight =
        navigationVisible && navigationRect ? navigationRect.height : 0;
      const footerPaddingBottom = footerStyle
        ? Number.parseFloat(footerStyle.paddingBottom) || 0
        : 0;
      const weatherUnavailable = Boolean(
        document.querySelector(".production-weather-unavailable"),
      );
      const hasWeatherState = Boolean(
        document.querySelector(
          ".weather-hero, .production-weather-unavailable",
        ),
      );
      const hasCoreStructure = Boolean(
        document.querySelector(".site-shell--home-editorial") &&
          document.querySelector("#conteudo-principal") &&
          hasWeatherState &&
          footer &&
          footerPanel,
      );
      const brandImage = brand instanceof HTMLImageElement ? brand : null;

      return {
        httpStatus,
        title: document.title,
        horizontalOverflow: Math.max(
          0,
          root.scrollWidth - root.clientWidth,
        ),
        hasCoreStructure,
        hasWeatherState,
        weatherUnavailable,
        hasExplore: Boolean(document.querySelector("#explorar-portal")),
        exploreHeading:
          document
            .querySelector("#home-explore-portal-title")
            ?.textContent?.trim() ?? null,
        hasFooter: Boolean(footer),
        footerBackground,
        footerLight: strictLayout
          ? footerBackground === "rgb(248, 250, 248)"
          : null,
        brandLoaded: Boolean(
          brandImage?.complete && brandImage.naturalWidth > 0,
        ),
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
    {
      mobile: viewport.mobile,
      strictLayout: target.strictLayout,
      httpStatus: response.status(),
    },
  );

  const failures = [];
  if (!audit.title) failures.push("documento sem título");
  if (!audit.hasCoreStructure) {
    failures.push("estrutura principal da homepage ausente");
  }
  if (!audit.brandLoaded) failures.push("logotipo editorial não carregou");
  if (audit.horizontalOverflow > 2) {
    failures.push(`overflow horizontal de ${audit.horizontalOverflow}px`);
  }
  if (
    target.expectExplore &&
    !audit.hasExplore &&
    !audit.weatherUnavailable
  ) {
    failures.push("seção de exploração ausente");
  }
  if (target.strictLayout && !audit.hasFooter) {
    failures.push("rodapé editorial ausente");
  }
  if (target.strictLayout && audit.footerLight !== true) {
    failures.push(
      `rodapé publicado não está claro: ${audit.footerBackground ?? "cor ausente"}`,
    );
  }
  if (
    target.strictLayout &&
    (!audit.skipLinkFocused || !audit.skipLinkVisible)
  ) {
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
await waitForCandidateDeployment();

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

      try {
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
      } catch (error) {
        const screenshotName = `${target.name}--${viewport.name}--erro.png`;
        await page
          .screenshot({
            path: path.join(outputDirectory, screenshotName),
            fullPage: true,
            animations: "disabled",
          })
          .catch(() => undefined);

        results.push({
          target: target.name,
          url: target.url,
          viewport,
          screenshot: screenshotName,
          audit: {
            httpStatus: 0,
            horizontalOverflow: 0,
            hasCoreStructure: false,
            brandLoaded: false,
            weatherUnavailable: false,
            hasExplore: false,
            skipLinkVisible: false,
            footerLight: null,
            footerProtected: null,
          },
          failures: [error instanceof Error ? error.message : String(error)],
        });
      } finally {
        await context.close();
      }
    }
  }
} finally {
  await browser.close();
}

await writeFile(
  path.join(outputDirectory, "report.json"),
  `${JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      revision: auditRevision,
      results,
    },
    null,
    2,
  )}\n`,
);
await writeFile(
  path.join(outputDirectory, "README.md"),
  markdownReport(results),
);

const failures = results.flatMap((result) =>
  result.failures.map(
    (failure) =>
      `${result.target} ${result.viewport.width}×${result.viewport.height}: ${failure}`,
  ),
);

for (const result of results) {
  console.log(
    `${result.target} ${result.viewport.width}×${result.viewport.height}: HTTP=${result.audit.httpStatus} overflow=${result.audit.horizontalOverflow}px core=${result.audit.hasCoreStructure} brand=${result.audit.brandLoaded} unavailable=${result.audit.weatherUnavailable} explore=${result.audit.hasExplore} skip=${result.audit.skipLinkVisible} footerLight=${result.audit.footerLight} footerProtected=${result.audit.footerProtected}`,
  );
}

if (failures.length > 0) {
  throw new Error(`Falhas na auditoria visual:\n- ${failures.join("\n- ")}`);
}
