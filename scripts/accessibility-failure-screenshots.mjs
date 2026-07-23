/* global process */

import { readFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const baseUrl = process.env.CANDIDATE_URL ?? "http://127.0.0.1:4173";
const outputDirectory = path.resolve("artifacts/visual-parity/accessibility");
const reportPath = path.join(outputDirectory, "report.json");
const viewportSizes = new Map([
  ["desktop-1280", { width: 1280, height: 900 }],
  ["mobile-320", { width: 320, height: 720 }],
]);

const report = JSON.parse(await readFile(reportPath, "utf8"));
const failedResults = report.results.filter(
  (result) => Array.isArray(result.failures) && result.failures.length > 0,
);

if (failedResults.length === 0) {
  console.log("Nenhuma falha contratual exige captura adicional.");
  process.exit(0);
}

const browser = await chromium.launch({ headless: true });

try {
  for (const result of failedResults) {
    const viewport = viewportSizes.get(result.viewport);
    if (!viewport) {
      console.warn(`Viewport desconhecida para captura: ${result.viewport}`);
      continue;
    }

    const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
    const page = await context.newPage();
    const screenshot = path.join(
      outputDirectory,
      `${result.route}-${result.viewport}-falha.png`,
    );

    try {
      await page.goto(new URL(result.path, baseUrl).toString(), {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
      await page.waitForTimeout(500);
      await page.screenshot({ path: screenshot, fullPage: true });
      console.log(`Captura diagnóstica criada: ${screenshot}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`Não foi possível capturar ${result.route} ${result.viewport}: ${message}`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
