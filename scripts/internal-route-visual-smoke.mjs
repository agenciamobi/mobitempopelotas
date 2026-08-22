/* global process, document, window, HTMLElement, console */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const baseUrl = process.env.CANDIDATE_URL ?? "http://127.0.0.1:4173";
const outputDirectory = path.resolve("artifacts/visual-parity/internal-routes");

const routes = [
  {
    name: "tempo-hoje",
    path: "/tempo-hoje-pelotas",
    marker: ".internal-weather-shell--today",
  },
  {
    name: "chuva",
    path: "/chuva-em-pelotas",
    marker: ".internal-weather-shell--rain",
    neutralSelectors: [".rain-hourly-volume-context"],
  },
  {
    name: "vento",
    path: "/vento-em-pelotas",
    marker: ".internal-weather-shell--wind",
    neutralSelectors: [".wind-direction-context"],
  },
  {
    name: "clima",
    path: "/clima-em-pelotas",
    marker: ".internal-weather-shell--climate",
  },
  {
    name: "meteograma",
    path: "/meteograma-pelotas",
    marker: ".internal-weather-shell--meteogram",
  },
  {
    name: "historico-climatico",
    path: "/historico-climatico-pelotas",
    marker: ".internal-weather-shell--history",
  },
  {
    name: "enchente-2024",
    path: "/enchente-2024-pelotas-laranjal",
    marker: ".internal-weather-shell--flood-history",
  },
  {
    name: "estacao-embrapa",
    path: "/estacao-embrapa-pelotas",
    marker: ".internal-weather-shell--embrapa",
  },
  {
    name: "situacao-hidrologica",
    path: "/situacao-hidrologica-pelotas",
    marker: ".internal-weather-shell--hydrology",
  },
];

const viewports = [
  { name: "desktop-1280", width: 1280, height: 900 },
  { name: "mobile-320", width: 320, height: 720 },
];

function markdownReport(results) {
  const lines = [
    "# Smoke visual das páginas internas",
    "",
    `- Candidato: ${baseUrl}`,
    `- Executado em: ${new Date().toISOString()}`,
    "",
    "| Página | Viewport | HTTP | Shell | H1 | Overflow | Main contido | Superfícies neutras | Estado |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|",
  ];

  for (const result of results) {
    lines.push(
      `| ${result.route} | ${result.viewport} | ${result.audit.httpStatus} | ${result.audit.hasRouteMarker ? "sim" : "não"} | ${result.audit.h1Count} | ${result.audit.horizontalOverflow}px | ${result.audit.mainContained ? "sim" : "não"} | ${result.audit.neutralViolations.length === 0 ? "ok" : result.audit.neutralViolations.length} | ${result.failures.length === 0 ? "aprovado" : "falhou"} |`,
    );
  }

  const failures = results.flatMap((result) =>
    result.failures.map((failure) => `- ${result.route} ${result.viewport}: ${failure}`),
  );

  if (failures.length > 0) {
    lines.push("", "## Falhas", "", ...failures);
  }

  lines.push("", "As capturas completas de cada rota e viewport ficam neste mesmo artefato.");
  return `${lines.join("\n")}\n`;
}

function emptyAudit() {
  return {
    httpStatus: 0,
    hasRouteMarker: false,
    hasHeader: false,
    hasFooter: false,
    mainCount: 0,
    h1Count: 0,
    horizontalOverflow: 0,
    mainContained: false,
    neutralViolations: [],
  };
}

function buildFailures(audit) {
  const failures = [];

  if (audit.httpStatus < 200 || audit.httpStatus >= 400) {
    failures.push(`HTTP ${audit.httpStatus}`);
  }
  if (!audit.hasRouteMarker) failures.push("namespace visual da rota ausente");
  if (!audit.hasHeader) failures.push("header editorial ausente");
  if (!audit.hasFooter) failures.push("footer editorial ausente");
  if (audit.mainCount !== 1) failures.push(`quantidade de landmarks main: ${audit.mainCount}`);
  if (audit.h1Count !== 1) failures.push(`quantidade de títulos H1: ${audit.h1Count}`);
  if (audit.horizontalOverflow > 2) {
    failures.push(`overflow horizontal de ${audit.horizontalOverflow}px`);
  }
  if (!audit.mainContained) failures.push("conteúdo principal ultrapassa o viewport");
  failures.push(...audit.neutralViolations);

  return failures;
}

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();

    try {
      for (const route of routes) {
        const screenshotName = `${route.name}--${viewport.name}.png`;

        try {
          const response = await page.goto(new URL(route.path, baseUrl).toString(), {
            waitUntil: "domcontentloaded",
            timeout: 60_000,
          });

          if (!response) {
            throw new Error("navegação concluída sem resposta HTTP");
          }

          await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => undefined);
          await page.waitForTimeout(400);

          const audit = await page.evaluate(
            ({ marker, neutralSelectors, httpStatus }) => {
              const root = document.documentElement;
              const main = document.querySelector("main#conteudo-principal");
              const mainRect = main?.getBoundingClientRect() ?? null;
              const visible = (element) => {
                if (!(element instanceof HTMLElement)) return false;
                const style = window.getComputedStyle(element);
                const rect = element.getBoundingClientRect();
                return (
                  style.display !== "none" &&
                  style.visibility !== "hidden" &&
                  rect.width > 0 &&
                  rect.height > 0
                );
              };
              const h1Count = Array.from(document.querySelectorAll("h1")).filter(visible).length;
              const neutralViolations = [];

              for (const selector of neutralSelectors) {
                const element = document.querySelector(selector);
                if (!element || !visible(element)) continue;
                const style = window.getComputedStyle(element);

                if (style.backgroundImage !== "none") {
                  neutralViolations.push(`${selector}: fundo decorativo reapareceu`);
                }
                if (style.boxShadow !== "none") {
                  neutralViolations.push(`${selector}: sombra decorativa reapareceu`);
                }
              }

              return {
                httpStatus,
                hasRouteMarker: Boolean(document.querySelector(marker)),
                hasHeader: Boolean(document.querySelector(".tp-home-header")),
                hasFooter: Boolean(document.querySelector(".tp-home-footer-shell")),
                mainCount: document.querySelectorAll("main").length,
                h1Count,
                horizontalOverflow: Math.max(0, root.scrollWidth - root.clientWidth),
                mainContained: Boolean(
                  mainRect && mainRect.left >= -1 && mainRect.right <= window.innerWidth + 1,
                ),
                neutralViolations,
              };
            },
            {
              marker: route.marker,
              neutralSelectors: route.neutralSelectors ?? [],
              httpStatus: response.status(),
            },
          );

          const failures = buildFailures(audit);
          await page.screenshot({
            path: path.join(outputDirectory, screenshotName),
            fullPage: true,
            animations: "disabled",
          });

          results.push({
            route: route.name,
            path: route.path,
            viewport: viewport.name,
            screenshot: screenshotName,
            audit,
            failures,
          });
        } catch (error) {
          await page
            .screenshot({
              path: path.join(outputDirectory, `${route.name}--${viewport.name}--erro.png`),
              fullPage: true,
              animations: "disabled",
            })
            .catch(() => undefined);

          results.push({
            route: route.name,
            path: route.path,
            viewport: viewport.name,
            screenshot: screenshotName,
            audit: emptyAudit(),
            failures: [error instanceof Error ? error.message : String(error)],
          });
        }
      }
    } finally {
      await page.close();
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
    (failure) => `${result.route} ${result.viewport}: ${failure}`,
  ),
);

for (const result of results) {
  console.log(
    `${result.route} ${result.viewport}: HTTP=${result.audit.httpStatus} shell=${result.audit.hasRouteMarker} h1=${result.audit.h1Count} overflow=${result.audit.horizontalOverflow}px mainContained=${result.audit.mainContained} neutral=${result.audit.neutralViolations.length}`,
  );
}

if (failures.length > 0) {
  throw new Error(`Falhas no smoke visual interno:\n- ${failures.join("\n- ")}`);
}
