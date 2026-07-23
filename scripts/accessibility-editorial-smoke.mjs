/* global process, document, window, HTMLElement, HTMLImageElement */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "playwright";

const baseUrl = process.env.CANDIDATE_URL ?? "http://127.0.0.1:4173";
const outputDirectory = path.resolve("artifacts/visual-parity/accessibility");
const routes = [
  { name: "inicio", path: "/" },
  { name: "tempo-hoje", path: "/tempo-hoje-pelotas" },
  { name: "tempo-amanha", path: "/tempo-amanha-pelotas" },
  { name: "previsao-sete-dias", path: "/previsao-7-dias-pelotas" },
  { name: "alertas", path: "/alertas" },
  { name: "radar-satelite", path: "/radar-e-satelite-pelotas" },
  { name: "situacao-hidrologica", path: "/situacao-hidrologica-pelotas" },
  {
    name: "nivel-lagoa-laranjal",
    path: "/nivel-da-lagoa-dos-patos-laranjal",
  },
  { name: "cameras", path: "/cameras-ao-vivo-pelotas" },
  { name: "metodologia", path: "/metodologia" },
  { name: "privacidade", path: "/privacidade-e-dados" },
];
const viewports = [
  { name: "desktop-1280", width: 1280, height: 900 },
  { name: "mobile-320", width: 320, height: 720 },
];

function emptyAudit() {
  return {
    language: "",
    title: "",
    h1Count: 0,
    h1Text: "",
    mainCount: 0,
    hasLandmarks: false,
    skipLinkVisible: false,
    duplicateIds: [],
    unnamedInteractive: [],
    unlabelledFields: [],
    imagesWithoutAlt: [],
    headingJumps: [],
    horizontalOverflow: 0,
  };
}

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
    result.warnings.map(
      (warning) => `- ${result.route} ${result.viewport}: ${warning}`,
    ),
  );
  if (warnings.length > 0) {
    lines.push("", "## Avisos não bloqueantes", "", ...warnings);
  }

  const failures = results.flatMap((result) =>
    result.failures.map(
      (failure) => `- ${result.route} ${result.viewport}: ${failure}`,
    ),
  );
  if (failures.length > 0) {
    lines.push("", "## Falhas bloqueantes", "", ...failures);
  }

  return `${lines.join("\n")}\n`;
}

function collectBackendNodeIds(node, backendByMarker) {
  const attributes = node.attributes ?? [];
  for (let index = 0; index < attributes.length; index += 2) {
    if (attributes[index] === "data-a11y-smoke-id") {
      backendByMarker.set(attributes[index + 1], node.backendNodeId);
      break;
    }
  }

  for (const child of node.children ?? []) {
    collectBackendNodeIds(child, backendByMarker);
  }
  for (const shadowRoot of node.shadowRoots ?? []) {
    collectBackendNodeIds(shadowRoot, backendByMarker);
  }
  if (node.contentDocument) {
    collectBackendNodeIds(node.contentDocument, backendByMarker);
  }
}

async function computedAccessibleNames(session) {
  const [{ root }, { nodes }] = await Promise.all([
    session.send("DOM.getDocument", { depth: -1, pierce: true }),
    session.send("Accessibility.getFullAXTree"),
  ]);
  const backendByMarker = new Map();
  collectBackendNodeIds(root, backendByMarker);

  const accessibleNameByBackend = new Map();
  for (const node of nodes) {
    if (!node.backendDOMNodeId || node.ignored) continue;
    const name = String(node.name?.value ?? "").replace(/\s+/g, " ").trim();
    const existing = accessibleNameByBackend.get(node.backendDOMNodeId) ?? "";
    if (!existing || name) {
      accessibleNameByBackend.set(node.backendDOMNodeId, name);
    }
  }

  const names = new Map();
  for (const [marker, backendNodeId] of backendByMarker) {
    names.set(marker, accessibleNameByBackend.get(backendNodeId) ?? "");
  }
  return names;
}

function buildFailures(audit) {
  const failures = [];
  const warnings = [];

  if (!audit.language.toLowerCase().startsWith("pt")) {
    failures.push("idioma do documento não é português");
  }
  if (!audit.title) failures.push("documento sem título");
  if (audit.mainCount !== 1) {
    failures.push(`quantidade de landmarks main: ${audit.mainCount}`);
  }
  if (!audit.hasLandmarks) {
    failures.push("header, main ou footer editorial ausente");
  }
  if (audit.h1Count !== 1) {
    failures.push(`quantidade de títulos H1: ${audit.h1Count}`);
  }
  if (!audit.h1Text) failures.push("título H1 sem texto compreensível");
  if (!audit.skipLinkVisible) {
    failures.push("skip link não recebeu foco visualmente exposto");
  }
  if (audit.duplicateIds.length > 0) {
    failures.push(`IDs duplicados: ${audit.duplicateIds.join(", ")}`);
  }
  if (audit.unnamedInteractive.length > 0) {
    failures.push(
      `controles sem nome acessível: ${audit.unnamedInteractive.join(", ")}`,
    );
  }
  if (audit.unlabelledFields.length > 0) {
    failures.push(`campos sem rótulo: ${audit.unlabelledFields.join(", ")}`);
  }
  if (audit.imagesWithoutAlt.length > 0) {
    failures.push(
      `imagens sem atributo alt: ${audit.imagesWithoutAlt.join(", ")}`,
    );
  }
  if (audit.horizontalOverflow > 2) {
    failures.push(`overflow horizontal de ${audit.horizontalOverflow}px`);
  }
  if (audit.headingJumps.length > 0) {
    warnings.push(
      `saltos na hierarquia de títulos: ${audit.headingJumps.join("; ")}`,
    );
  }

  return { failures, warnings };
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
    const session = await context.newCDPSession(page);

    try {
      for (const route of routes) {
        try {
          const response = await page.goto(
            new URL(route.path, baseUrl).toString(),
            {
              waitUntil: "domcontentloaded",
              timeout: 60_000,
            },
          );

          if (!response?.ok()) {
            throw new Error(
              `${route.name} respondeu HTTP ${response?.status() ?? "desconhecido"}.`,
            );
          }

          await page
            .waitForLoadState("networkidle", { timeout: 15_000 })
            .catch(() => undefined);
          await page.waitForTimeout(500);

          await page.evaluate(() => window.scrollTo(0, 0));
          await page.keyboard.press("Tab");
          await page.waitForTimeout(100);

          const domAudit = await page.evaluate(() => {
            const normalizedText = (value) =>
              value?.replace(/\s+/g, " ").trim() ?? "";
            const visible = (element) => {
              if (!(element instanceof HTMLElement)) return false;
              if (element.getAttribute("aria-hidden") === "true") return false;
              if (
                typeof element.checkVisibility === "function" &&
                !element.checkVisibility({
                  checkOpacity: true,
                  checkVisibilityCSS: true,
                })
              ) {
                return false;
              }

              const rect = element.getBoundingClientRect();
              return rect.width > 0 && rect.height > 0;
            };
            const visuallyExposed = (element) => {
              if (!visible(element)) return false;

              for (
                let current = element;
                current instanceof HTMLElement;
                current = current.parentElement
              ) {
                const style = window.getComputedStyle(current);
                const opacity = Number.parseFloat(style.opacity);
                if (
                  style.display === "none" ||
                  style.visibility === "hidden" ||
                  style.visibility === "collapse" ||
                  style.contentVisibility === "hidden" ||
                  (Number.isFinite(opacity) && opacity <= 0.01)
                ) {
                  return false;
                }

                const normalizedClip = style.clip.replace(/\s+/g, "").toLowerCase();
                const normalizedClipPath = style.clipPath
                  .replace(/\s+/g, "")
                  .toLowerCase();
                if (
                  normalizedClip === "rect(0px,0px,0px,0px)" ||
                  normalizedClip === "rect(0,0,0,0)" ||
                  normalizedClipPath.includes("inset(50%") ||
                  normalizedClipPath.includes("circle(0")
                ) {
                  return false;
                }
              }

              const rect = element.getBoundingClientRect();
              if (
                rect.right <= 0 ||
                rect.bottom <= 0 ||
                rect.left >= window.innerWidth ||
                rect.top >= window.innerHeight
              ) {
                return false;
              }

              const x = Math.min(
                window.innerWidth - 1,
                Math.max(0, rect.left + rect.width / 2),
              );
              const y = Math.min(
                window.innerHeight - 1,
                Math.max(0, rect.top + rect.height / 2),
              );
              const hit = document.elementFromPoint(x, y);
              return Boolean(hit && (hit === element || element.contains(hit)));
            };
            const describe = (element) => {
              const tag = element.tagName.toLowerCase();
              const id = element.id ? `#${element.id}` : "";
              const className =
                typeof element.className === "string" &&
                element.className.trim()
                  ? `.${element.className
                      .trim()
                      .split(/\s+/)
                      .slice(0, 2)
                      .join(".")}`
                  : "";
              return `${tag}${id}${className}`;
            };
            const markerByElement = new Map();
            let markerSequence = 0;
            const mark = (element) => {
              const existing = markerByElement.get(element);
              if (existing) return existing;
              markerSequence += 1;
              const marker = String(markerSequence);
              markerByElement.set(element, marker);
              element.setAttribute("data-a11y-smoke-id", marker);
              return marker;
            };

            const allIds = Array.from(
              document.querySelectorAll("[id]"),
              (element) => element.id,
            ).filter(Boolean);
            const idCounts = new Map();
            for (const id of allIds) {
              idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
            }
            const duplicateIds = Array.from(idCounts.entries())
              .filter(([, count]) => count > 1)
              .map(([id, count]) => `${id} (${count})`);

            const interactiveCandidates = Array.from(
              document.querySelectorAll(
                'a[href], button, input:not([type="hidden"]), select, textarea, [role="button"], [role="link"]',
              ),
            )
              .filter(
                (element) => visible(element) && !element.matches(":disabled"),
              )
              .map((element) => ({
                marker: mark(element),
                description: describe(element),
              }));

            const fieldCandidates = Array.from(
              document.querySelectorAll(
                'input:not([type="hidden"]):not([type="button"]):not([type="submit"]):not([type="reset"]), select, textarea',
              ),
            )
              .filter(visible)
              .map((element) => ({
                marker: mark(element),
                description: describe(element),
              }));

            const imagesWithoutAlt = Array.from(document.images)
              .filter((image) => !image.hasAttribute("alt"))
              .map(describe);

            const headings = Array.from(
              document.querySelectorAll("h1, h2, h3, h4, h5, h6"),
            )
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

            const skipLink = document.querySelector(
              '.skip-link[href="#conteudo-principal"]',
            );
            const skipLinkVisible = Boolean(
              skipLink &&
                document.activeElement === skipLink &&
                visuallyExposed(skipLink),
            );

            const root = document.documentElement;
            const h1Elements = Array.from(
              document.querySelectorAll("h1"),
            ).filter(visible);
            const main = document.querySelector("main#conteudo-principal");

            return {
              language: root.lang,
              title: document.title,
              h1Count: h1Elements.length,
              h1Text: normalizedText(h1Elements[0]?.textContent),
              mainCount: document.querySelectorAll("main").length,
              hasLandmarks: Boolean(
                document.querySelector("header") &&
                  main &&
                  document.querySelector("footer"),
              ),
              skipLinkVisible,
              duplicateIds,
              interactiveCandidates,
              fieldCandidates,
              imagesWithoutAlt,
              headingJumps,
              horizontalOverflow: Math.max(
                0,
                root.scrollWidth - root.clientWidth,
              ),
            };
          });

          const names = await computedAccessibleNames(session);
          const audit = {
            ...domAudit,
            unnamedInteractive: domAudit.interactiveCandidates
              .filter((candidate) => !names.get(candidate.marker))
              .map((candidate) => candidate.description),
            unlabelledFields: domAudit.fieldCandidates
              .filter((candidate) => !names.get(candidate.marker))
              .map((candidate) => candidate.description),
          };
          delete audit.interactiveCandidates;
          delete audit.fieldCandidates;

          const { failures, warnings } = buildFailures(audit);
          results.push({
            route: route.name,
            path: route.path,
            viewport: viewport.name,
            audit,
            failures,
            warnings,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          const screenshot = path.join(
            outputDirectory,
            `${route.name}-${viewport.name}-erro.png`,
          );
          await page
            .screenshot({ path: screenshot, fullPage: true })
            .catch(() => undefined);

          results.push({
            route: route.name,
            path: route.path,
            viewport: viewport.name,
            audit: emptyAudit(),
            failures: [`auditoria interrompida nesta rota: ${message}`],
            warnings: [],
          });
        }
      }
    } finally {
      await session.detach().catch(() => undefined);
      await context.close();
    }
  }
} finally {
  await browser.close();
}

await writeFile(
  path.join(outputDirectory, "report.json"),
  `${JSON.stringify(
    { baseUrl, generatedAt: new Date().toISOString(), results },
    null,
    2,
  )}\n`,
  "utf8",
);
await writeFile(
  path.join(outputDirectory, "README.md"),
  markdownReport(results),
  "utf8",
);

const failures = results.flatMap((result) =>
  result.failures.map(
    (failure) => `${result.route} ${result.viewport}: ${failure}`,
  ),
);

for (const result of results) {
  console.log(
    `${result.route} ${result.viewport}: h1=${result.audit.h1Count} landmarks=${result.audit.hasLandmarks} unnamed=${result.audit.unnamedInteractive.length} labels=${result.audit.unlabelledFields.length} duplicateIds=${result.audit.duplicateIds.length} overflow=${result.audit.horizontalOverflow}px failures=${result.failures.length}`,
  );
}

if (failures.length > 0) {
  throw new Error(
    `Falhas no smoke de acessibilidade editorial:\n- ${failures.join("\n- ")}`,
  );
}

console.log(
  `Smoke de acessibilidade editorial concluído: ${results.length} verificações.`,
);
