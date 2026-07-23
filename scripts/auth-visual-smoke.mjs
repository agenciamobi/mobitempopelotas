/* global process, document */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const baseUrl = process.env.CANDIDATE_URL ?? "http://127.0.0.1:4173";
const outputDirectory = path.resolve("artifacts/visual-parity/auth");
const viewports = [
  { name: "desktop-1440", width: 1440, height: 1100 },
  { name: "mobile-320", width: 320, height: 720 },
];
const routes = [
  {
    name: "entrar",
    path: "/entrar?next=%2Fminha-conta",
    expectedHeading: "Personalize alertas sem perder o acesso público",
  },
  {
    name: "minha-conta-sem-configuracao",
    path: "/minha-conta",
    expectedHeading: "A área de conta ainda não está ativa neste ambiente",
  },
];

await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();

    for (const route of routes) {
      const response = await page.goto(new URL(route.path, baseUrl).toString(), {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });

      if (!response?.ok()) {
        throw new Error(`${route.name} respondeu HTTP ${response?.status() ?? "desconhecido"}.`);
      }

      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
      await page.waitForTimeout(500);

      const audit = await page.evaluate((expectedHeading) => {
        const root = document.documentElement;
        const heading = document.querySelector(".login-card h1");
        const robots = document.querySelector('meta[name="robots"]')?.getAttribute("content") ?? "";

        return {
          title: document.title,
          heading: heading?.textContent?.trim() ?? null,
          hasLoginCard: Boolean(document.querySelector(".login-card")),
          noindex: robots.includes("noindex"),
          horizontalOverflow: Math.max(0, root.scrollWidth - root.clientWidth),
          headingMatches: heading?.textContent?.trim() === expectedHeading,
        };
      }, route.expectedHeading);

      if (!audit.title) throw new Error(`${route.name}: documento sem título.`);
      if (!audit.hasLoginCard) throw new Error(`${route.name}: cartão editorial ausente.`);
      if (!audit.noindex) throw new Error(`${route.name}: meta robots não está como noindex.`);
      if (!audit.headingMatches) {
        throw new Error(`${route.name}: título principal inesperado: ${audit.heading ?? "ausente"}.`);
      }
      if (audit.horizontalOverflow > 2) {
        throw new Error(`${route.name}: overflow horizontal de ${audit.horizontalOverflow}px.`);
      }

      const screenshotPath = path.join(outputDirectory, `${route.name}-${viewport.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      results.push({ route: route.name, viewport: viewport.name, ...audit });
    }

    await context.close();
  }
} finally {
  await browser.close();
}

await writeFile(
  path.join(outputDirectory, "report.json"),
  `${JSON.stringify({ baseUrl, results }, null, 2)}\n`,
  "utf8",
);

console.log(`Smoke visual da autenticação concluído: ${results.length} verificações.`);
