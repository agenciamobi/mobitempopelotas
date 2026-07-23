/* global process, document, window, HTMLElement, HTMLInputElement, HTMLImageElement */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const baseUrl = process.env.CANDIDATE_URL ?? "http://127.0.0.1:4173";
const outputDirectory = path.resolve("artifacts/visual-parity/accessibility");
const routes = [
  { name: "inicio", path: "/" },
  { name: "alertas", path: "/alertas" },
  { name: "radar-satelite", path: "/radar-e-satelite-pelotas" },
  { name: "situacao-hidrologica", path: "/situacao-hidrologica-pelotas" },
  { name: "cameras", path: "/cameras-ao-vivo-pelotas" },
  { name: "privacidade", path: "/privacidade-e-dados" },
];
const viewports = [
  { name: "desktop-1280", width: 1280, height: 900 },
  { name: "mobile-320", width: 320, height: 720 },
];

function markdownReport(results) {
  const lines = [
    "# Smoke de acessibilidade editorial",
    "",
    `- Candidato: ${baseUrl}`,
    `- Executado em: ${new Date().toISOString()}`,
    "",
    "| Página | Viewport | H1 | Landmarks | Nomes acessíveis | Rótulos | IDs | Overflow | Estado |",
    "|---|---:|---:|---:|---:|---:|---:|---:|---:|",
  ];

  for (const result of results) {
    lines.push(
      `| ${result.route} | ${result.viewport} | ${result.audit.h1Count} | ${result.audit.hasLandmarks ? "sim" : "não"} | ${result.audit.unnamedInteractive.length === 0 ? "ok" : result.audit.unnamedInteractive.length} | ${result.audit.unlabelledFields.length === 0 ? "ok" : result.audit.unlabelledFields.length} | ${result.audit.duplicateIds.length === 0 ? "ok" : result.audit.duplicateIds.length} | ${result.audit.horizontalOverflow}px | ${result.failures.length === 0 ? "aprovado" : "falhou"} |`,
    );
  }

  const warnings = results.flatMap((result) =>
    result.warnings.map((warning) => `- ${result.route} ${result.viewport}: ${warning}`),
  );
  if (warnings.length > 0) {
    lines.push("", "## Avisos não bloqueantes", "", ...warnings);
  }

  return `${lines.join("\n")}\n`;
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

      await page.evaluate(() => window.scrollTo(0, 0));
      await page.keyboard.press("Tab");
      await page.waitForTimeout(100);

      const audit = await page.evaluate(() => {
        const normalizedText = (value) => value?.replace(/\s+/g, " ").trim() ?? "";
        const visible = (element) => {
          if (!(element instanceof HTMLElement)) return false;
          const style = window.getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return (
            style.display !== "none" &&
            style.visibility !== "hidden" &&
            style.opacity !== "0" &&
            rect.width > 0 &&
            rect.height > 0 &&
            element.getAttribute("aria-hidden") !== "true"
          );
        };
        const labelledByText = (element) => {
          const ids = element.getAttribute("aria-labelledby")?.split(/\s+/).filter(Boolean) ?? [];
          return normalizedText(
            ids.map((id) => document.getElementById(id)?.textContent ?? "").join(" "),
          );
        };
        const associatedLabelText = (element) => {
          if (!(element instanceof HTMLInputElement) && !element.matches("select, textarea")) {
            return "";
          }

          const id = element.id;
          const explicit = id
            ? normalizedText(document.querySelector(`label[for="${CSS.escape(id)}"]`)?.textContent)
            : "";
          const implicit = normalizedText(element.closest("label")?.textContent);
          return explicit || implicit;
        };
        const accessibleName = (element) => {
          const ariaLabel = normalizedText(element.getAttribute("aria-label"));
          const labelledBy = labelledByText(element);
          const label = associatedLabelText(element);
          const text = normalizedText(element.textContent);
          const title = normalizedText(element.getAttribute("title"));
          const inputValue =
            element instanceof HTMLInputElement &&
            ["button", "submit", "reset"].includes(element.type)
              ? normalizedText(element.value)
              : "";
          const imageAlt = normalizedText(
            element.querySelector("img") instanceof HTMLImageElement
              ? element.querySelector("img")?.getAttribute("alt")
              : "",
          );

          return ariaLabel || labelledBy || label || text || title || inputValue || imageAlt;
        };
        const describe = (element) => {
          const tag = element.tagName.toLowerCase();
          const id = element.id ? `#${element.id}` : "";
          const className =
            typeof element.className === "string" && element.className.trim()
              ? `.${element.className.trim().split(/\s+/).slice(0, 2).join(".")}`
              : "";
          return `${tag}${id}${className}`;
        };

        const allIds = Array.from(
          document.querySelectorAll("[id]"),
          (element) => element.id,
        ).filter(Boolean);
        const idCounts = new Map();
        for (const id of allIds) idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
        const duplicateIds = Array.from(idCounts.entries())
          .filter(([, count]) => count > 1)
          .map(([id, count]) => `${id} (${count})`);

        const interactive = Array.from(
          document.querySelectorAll(
            'a[href], button, input:not([type="hidden"]), select, textarea, [role="button"], [role="link"]',
          ),
        ).filter((element) => visible(element) && !element.matches(":disabled"));
        const unnamedInteractive = interactive
          .filter((element) => !accessibleName(element))
          .map(describe);

        const fields = Array.from(
          document.querySelectorAll(
            'input:not([type="hidden"]):not([type="button"]):not([type="submit"]), select, textarea',
          ),
        ).filter(visible);
        const unlabelledFields = fields
          .filter((element) => {
            return !(
              associatedLabelText(element) ||
              normalizedText(element.getAttribute("aria-label")) ||
              labelledByText(element)
            );
          })
          .map(describe);

        const imagesWithoutAlt = Array.from(document.images)
          .filter((image) => !image.hasAttribute("alt"))
          .map(describe);

        const headings = Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"))
          .filter(visible)
          .map((heading) => ({
            level: Number(heading.tagName.slice(1)),
            text: normalizedText(heading.textContent),
          }));
        const headingJumps = [];
        for (let index = 1; index < headings.length; index += 1) {
          const previous = headings[index - 1];
          const current = headings[index];
          if (current.level - previous.level > 1) {
            headingJumps.push(
              `H${previous.level} para H${current.level}: ${current.text || "sem texto"}`,
            );
          }
        }

        const skipLink = document.querySelector('.skip-link[href="#conteudo-principal"]');
        const active = document.activeElement;
        const activeRect = active instanceof HTMLElement ? active.getBoundingClientRect() : null;
        const skipLinkVisible = Boolean(
          active === skipLink &&
          activeRect &&
          activeRect.width > 0 &&
          activeRect.height > 0 &&
          activeRect.top >= 0 &&
          activeRect.left >= 0,
        );

        const root = document.documentElement;
        const h1Elements = Array.from(document.querySelectorAll("h1")).filter(visible);
        const main = document.querySelector("main#conteudo-principal");

        return {
          language: root.lang,
          title: document.title,
          h1Count: h1Elements.length,
          h1Text: normalizedText(h1Elements[0]?.textContent),
          mainCount: document.querySelectorAll("main").length,
          hasLandmarks: Boolean(
            document.querySelector("header") && main && document.querySelector("footer"),
          ),
          skipLinkVisible,
          duplicateIds,
          unnamedInteractive,
          unlabelledFields,
          imagesWithoutAlt,
          headingJumps,
          horizontalOverflow: Math.max(0, root.scrollWidth - root.clientWidth),
        };
      });

      const failures = [];
      const warnings = [];
      if (!audit.language.toLowerCase().startsWith("pt"))
        failures.push("idioma do documento não é português");
      if (!audit.title) failures.push("documento sem título");
      if (audit.mainCount !== 1) failures.push(`quantidade de landmarks main: ${audit.mainCount}`);
      if (!audit.hasLandmarks) failures.push("header, main ou footer editorial ausente");
      if (audit.h1Count !== 1) failures.push(`quantidade de títulos H1: ${audit.h1Count}`);
      if (!audit.h1Text) failures.push("título H1 sem texto compreensível");
      if (!audit.skipLinkVisible) failures.push("skip link não recebeu foco visível");
      if (audit.duplicateIds.length > 0) {
        failures.push(`IDs duplicados: ${audit.duplicateIds.join(", ")}`);
      }
      if (audit.unnamedInteractive.length > 0) {
        failures.push(`controles sem nome acessível: ${audit.unnamedInteractive.join(", ")}`);
      }
      if (audit.unlabelledFields.length > 0) {
        failures.push(`campos sem rótulo: ${audit.unlabelledFields.join(", ")}`);
      }
      if (audit.imagesWithoutAlt.length > 0) {
        failures.push(`imagens sem atributo alt: ${audit.imagesWithoutAlt.join(", ")}`);
      }
      if (audit.horizontalOverflow > 2) {
        failures.push(`overflow horizontal de ${audit.horizontalOverflow}px`);
      }
      if (audit.headingJumps.length > 0) {
        warnings.push(`saltos na hierarquia de títulos: ${audit.headingJumps.join("; ")}`);
      }

      results.push({
        route: route.name,
        path: route.path,
        viewport: viewport.name,
        audit,
        failures,
        warnings,
      });
    }

    await context.close();
  }
} finally {
  await browser.close();
}

await writeFile(
  path.join(outputDirectory, "report.json"),
  `${JSON.stringify({ baseUrl, generatedAt: new Date().toISOString(), results }, null, 2)}\n`,
  "utf8",
);
await writeFile(path.join(outputDirectory, "README.md"), markdownReport(results), "utf8");

const failures = results.flatMap((result) =>
  result.failures.map((failure) => `${result.route} ${result.viewport}: ${failure}`),
);

for (const result of results) {
  console.log(
    `${result.route} ${result.viewport}: h1=${result.audit.h1Count} landmarks=${result.audit.hasLandmarks} unnamed=${result.audit.unnamedInteractive.length} labels=${result.audit.unlabelledFields.length} duplicateIds=${result.audit.duplicateIds.length} overflow=${result.audit.horizontalOverflow}px`,
  );
}

if (failures.length > 0) {
  throw new Error(`Falhas no smoke de acessibilidade editorial:\n- ${failures.join("\n- ")}`);
}

console.log(`Smoke de acessibilidade editorial concluído: ${results.length} verificações.`);
