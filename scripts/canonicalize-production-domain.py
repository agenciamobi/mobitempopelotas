from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CANONICAL_HOST = "tempopelotas.com.br"
CANONICAL_URL = f"https://{CANONICAL_HOST}"
LEGACY_PROJECT_HOST = ".".join(("mobitempopelotas", "lovable", "app"))
PLATFORM_DOMAIN = ".".join(("lovable", "app"))
WWW_HOST = f"www.{CANONICAL_HOST}"


def tracked_files() -> list[Path]:
    result = subprocess.run(
        ["git", "ls-files", "-z"],
        cwd=ROOT,
        check=True,
        capture_output=True,
    )
    return [ROOT / item.decode() for item in result.stdout.split(b"\0") if item]


def replace_domain_references() -> None:
    replacements = (
        (LEGACY_PROJECT_HOST, CANONICAL_HOST),
        (PLATFORM_DOMAIN, CANONICAL_HOST),
        (WWW_HOST, CANONICAL_HOST),
    )

    for path in tracked_files():
        if not path.is_file():
            continue
        try:
            content = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue

        updated = content
        for old, new in replacements:
            updated = updated.replace(old, new)

        if updated != content:
            path.write_text(updated, encoding="utf-8")


def write_site_config() -> None:
    (ROOT / "src/lib/site-config.ts").write_text(
        '''export const CANONICAL_SITE_URL = "https://tempopelotas.com.br";
export const SITE_URL = CANONICAL_SITE_URL;

export const SITE_NAME = "Tempo Pelotas";
export const SITE_TITLE = "Tempo Pelotas | Previsão do tempo em Pelotas e região";
export const SITE_DESCRIPTION =
  "Previsão do tempo, condições atuais, chuva, vento e informações meteorológicas de Pelotas e da Zona Sul do Rio Grande do Sul.";

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}

export const WEBSITE_JSON_LD_ID = absoluteUrl("/#website");
export const SOCIAL_IMAGE_URL = absoluteUrl("/brand/tempo-pelotas-primary.svg");

export function createWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_JSON_LD_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "pt-BR",
  };
}
''',
        encoding="utf-8",
    )


def write_canonical_host() -> None:
    (ROOT / "src/lib/canonical-host.ts").write_text(
        '''import { CANONICAL_SITE_URL } from "./site-config";

const CANONICAL_HOSTNAME = new URL(CANONICAL_SITE_URL).hostname;
const LEGACY_HOSTNAME = ["mobitempopelotas", "lovable", "app"].join(".");

export function getCanonicalRedirectUrl(requestUrl: string) {
  const url = new URL(requestUrl);
  const hostname = url.hostname.toLowerCase();
  const isCanonicalHost = hostname === CANONICAL_HOSTNAME;
  const shouldRedirect =
    hostname === LEGACY_HOSTNAME ||
    hostname === `www.${CANONICAL_HOSTNAME}` ||
    (isCanonicalHost && url.protocol !== "https:");

  if (!shouldRedirect) return null;

  url.protocol = "https:";
  url.hostname = CANONICAL_HOSTNAME;
  url.port = "";
  return url.toString();
}

export function createCanonicalRedirectResponse(request: Request) {
  const location = getCanonicalRedirectUrl(request.url);
  if (!location) return null;

  return new Response(null, {
    status: 308,
    headers: {
      Location: location,
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
''',
        encoding="utf-8",
    )


def update_server() -> None:
    path = ROOT / "src/server.ts"
    content = path.read_text(encoding="utf-8")

    import_line = 'import { createCanonicalRedirectResponse } from "./lib/canonical-host";\n'
    anchor = 'import { consumeLastCapturedError } from "./lib/error-capture";\n'
    if import_line not in content:
        content = content.replace(anchor, import_line + anchor, 1)

    fetch_anchor = "  async fetch(request: Request, env: unknown, ctx: unknown) {\n    try {\n"
    replacement = (
        "  async fetch(request: Request, env: unknown, ctx: unknown) {\n"
        "    const canonicalRedirect = createCanonicalRedirectResponse(request);\n"
        "    if (canonicalRedirect) return canonicalRedirect;\n\n"
        "    try {\n"
    )
    if "const canonicalRedirect = createCanonicalRedirectResponse(request);" not in content:
        if fetch_anchor not in content:
            raise SystemExit("Ponto de inserção do redirect não encontrado em src/server.ts")
        content = content.replace(fetch_anchor, replacement, 1)

    path.write_text(content, encoding="utf-8")


def update_camera_schema() -> None:
    path = ROOT / "src/components/cameras/CameraPage.tsx"
    content = path.read_text(encoding="utf-8")
    import_line = 'import { absoluteUrl } from "@/lib/site-config";\n'
    anchor = 'import type { WeatherCameraData } from "@/lib/cameras/cameras.types";\n'
    if import_line not in content:
        content = content.replace(anchor, import_line + anchor, 1)

    hardcoded = f"      url: `{CANONICAL_URL}/cameras-ao-vivo-pelotas#${{camera.id}}`,"
    dynamic = '      url: absoluteUrl(`/cameras-ao-vivo-pelotas#${camera.id}`),'
    if hardcoded in content:
        content = content.replace(hardcoded, dynamic, 1)
    elif dynamic not in content:
        raise SystemExit("URL estruturada da página de câmeras não encontrada")

    path.write_text(content, encoding="utf-8")


def write_sitemap_module() -> None:
    (ROOT / "src/lib/sitemap.ts").write_text(
        '''import { PUBLIC_ROUTES } from "./public-routes";
import { absoluteUrl } from "./site-config";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function createSitemapXml() {
  const urls = PUBLIC_ROUTES.map(
    (route) => `  <url>
    <loc>${escapeXml(absoluteUrl(route.path))}</loc>
    <changefreq>${route.changeFrequency}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
  </url>`,
  ).join("\\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>\\n`;
}
''',
        encoding="utf-8",
    )

    (ROOT / "src/routes/sitemap[.]xml.ts").write_text(
        '''import { createFileRoute } from "@tanstack/react-router";

import { createSitemapXml } from "@/lib/sitemap";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () =>
        new Response(createSitemapXml(), {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
            "X-Robots-Tag": "index, follow",
          },
        }),
    },
  },
});
''',
        encoding="utf-8",
    )


def write_tests() -> None:
    (ROOT / "tests/seo-domain.test.ts").write_text(
        '''import assert from "node:assert/strict";
import test from "node:test";

import { getCanonicalRedirectUrl } from "../src/lib/canonical-host";
import { PUBLIC_ROUTES } from "../src/lib/public-routes";
import { CANONICAL_SITE_URL, SITE_URL, absoluteUrl } from "../src/lib/site-config";
import { createSitemapXml } from "../src/lib/sitemap";

const legacyHost = ["mobitempopelotas", "lovable", "app"].join(".");
const wwwHost = ["www", "tempopelotas", "com", "br"].join(".");
const wwwHost = ["www", "tempopelotas", "com", "br"].join(".");
const wwwHost = ["www", "tempopelotas", "com", "br"].join(".");

test("o domínio canônico é único e não depende de ambiente", () => {
  assert.equal(CANONICAL_SITE_URL, "https://tempopelotas.com.br");
  assert.equal(SITE_URL, CANONICAL_SITE_URL);
  assert.equal(absoluteUrl("/alertas"), "https://tempopelotas.com.br/alertas");
});

test("o endereço anterior redireciona permanentemente preservando caminho e consulta", () => {
  assert.equal(
    getCanonicalRedirectUrl(`https://${legacyHost}/chuva-em-pelotas?origem=busca`),
    "https://tempopelotas.com.br/chuva-em-pelotas?origem=busca",
  );
});

test("www e http convergem para o domínio oficial em HTTPS", () => {
  assert.equal(
    getCanonicalRedirectUrl(`https://${wwwHost}/alertas`),
    "https://tempopelotas.com.br/alertas",
  );
  assert.equal(
    getCanonicalRedirectUrl("http://tempopelotas.com.br/"),
    "https://tempopelotas.com.br/",
  );
});

test("o domínio oficial e hosts locais não sofrem redirecionamento", () => {
  assert.equal(getCanonicalRedirectUrl("https://tempopelotas.com.br/vento-em-pelotas"), null);
  assert.equal(getCanonicalRedirectUrl("http://localhost:5173/"), null);
});

test("o sitemap contém somente URLs canônicas e todas as rotas públicas", () => {
  const sitemap = createSitemapXml();

  assert.match(sitemap, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.equal((sitemap.match(/<url>/g) ?? []).length, PUBLIC_ROUTES.length);
  assert.equal(sitemap.includes(legacyHost), false);
  assert.equal(sitemap.includes(wwwHost), false);

  for (const route of PUBLIC_ROUTES) {
    assert.match(sitemap, new RegExp(`<loc>${absoluteUrl(route.path).replace(/[.*+?^${}()|[\\]\\\\]/g, "\\\\$&")}</loc>`));
  }
});
''',
        encoding="utf-8",
    )


def update_package_scripts() -> None:
    path = ROOT / "package.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    contracts = data["scripts"]["test:contracts"]
    test_file = "tests/seo-domain.test.ts"
    if test_file not in contracts:
        data["scripts"]["test:contracts"] = f"{contracts} {test_file}"
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def assert_no_obsolete_domains() -> None:
    offenders: list[str] = []
    for path in tracked_files():
        if not path.is_file() or path == Path(__file__).resolve():
            continue
        try:
            content = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        if PLATFORM_DOMAIN in content or WWW_HOST in content:
            offenders.append(str(path.relative_to(ROOT)))

    if offenders:
        raise SystemExit(f"Referências de domínio obsoletas: {', '.join(offenders)}")


replace_domain_references()
write_site_config()
write_canonical_host()
update_server()
update_camera_schema()
write_sitemap_module()
write_tests()
update_package_scripts()
assert_no_obsolete_domains()
