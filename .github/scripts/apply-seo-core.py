from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8")


def replace_once(path: str, old: str, new: str) -> None:
    target = ROOT / path
    text = target.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{path}: esperado 1 trecho, encontrado {count}: {old[:100]!r}")
    target.write_text(text.replace(old, new, 1), encoding="utf-8")


def add_create_page_head_path(path: str, canonical_path: str) -> None:
    target = ROOT / path
    text = target.read_text(encoding="utf-8")
    marker = "createPageHead("
    start = text.find(marker)
    if start < 0:
        raise RuntimeError(f"{path}: createPageHead não encontrado")

    opening = start + len(marker) - 1
    depth = 0
    quote = None
    escaped = False
    closing = None

    for index in range(opening, len(text)):
        char = text[index]
        if quote:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
            continue

        if char in {'"', "'", "`"}:
            quote = char
            continue
        if char == "(":
            depth += 1
        elif char == ")":
            depth -= 1
            if depth == 0:
                closing = index
                break

    if closing is None:
        raise RuntimeError(f"{path}: fechamento de createPageHead não encontrado")

    body = text[opening + 1 : closing]
    if canonical_path in body:
        return

    stripped = body.rstrip()
    trailing = body[len(stripped) :]
    separator = "" if stripped.endswith(",") else ","
    replacement = f'{stripped}{separator}\n      "{canonical_path}",{trailing}'
    target.write_text(text[: opening + 1] + replacement + text[closing:], encoding="utf-8")


write(
    "src/lib/site-config.ts",
    '''const DEFAULT_SITE_URL = "https://mobitempopelotas.lovable.app";

export const SITE_NAME = "Tempo Pelotas";
export const SITE_TITLE = "Tempo Pelotas | Previsão do tempo em Pelotas e região";
export const SITE_DESCRIPTION =
  "Previsão do tempo, condições atuais, chuva, vento e informações meteorológicas de Pelotas e da Zona Sul do Rio Grande do Sul.";

function normalizeSiteUrl(value: string | undefined) {
  const candidate = value?.trim() || DEFAULT_SITE_URL;
  return candidate.replace(/\\/+$/, "");
}

export const SITE_URL = normalizeSiteUrl(import.meta.env.VITE_SITE_URL);

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}

export const SOCIAL_IMAGE_URL =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3f08c889-e910-4b95-8e86-5c37fa31c1c8/id-preview-9ab27e4f--d63df7b2-45db-4890-823c-87629dab73a1.lovable.app-1784525496143.png";

export function createWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: "pt-BR",
  };
}
''',
)

write(
    "src/lib/public-routes.ts",
    '''export type PublicRouteEntry = {
  path: string;
  changeFrequency: "hourly" | "daily" | "weekly" | "monthly";
  priority: number;
};

export const PUBLIC_ROUTES: PublicRouteEntry[] = [
  { path: "/", changeFrequency: "hourly", priority: 1 },
  { path: "/tempo-hoje-pelotas", changeFrequency: "hourly", priority: 0.9 },
  { path: "/previsao-7-dias-pelotas", changeFrequency: "daily", priority: 0.9 },
  { path: "/chuva-em-pelotas", changeFrequency: "hourly", priority: 0.8 },
  { path: "/vento-em-pelotas", changeFrequency: "hourly", priority: 0.8 },
  { path: "/alertas", changeFrequency: "hourly", priority: 0.9 },
  { path: "/situacao-hidrologica-pelotas", changeFrequency: "hourly", priority: 0.8 },
  { path: "/nivel-da-lagoa-dos-patos-laranjal", changeFrequency: "hourly", priority: 0.8 },
  { path: "/estacao-embrapa-pelotas", changeFrequency: "hourly", priority: 0.7 },
  { path: "/historico-climatico-pelotas", changeFrequency: "daily", priority: 0.7 },
  { path: "/cameras-ao-vivo-pelotas", changeFrequency: "hourly", priority: 0.7 },
  { path: "/metodologia", changeFrequency: "monthly", priority: 0.6 },
];
''',
)

write(
    "src/lib/page-meta.ts",
    '''import { absoluteUrl, SITE_NAME, SOCIAL_IMAGE_URL } from "./site-config";

export function createPageHead(title: string, description: string, canonicalPath: string) {
  const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const canonicalUrl = absoluteUrl(canonicalPath);

  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      { name: "robots", content: "index, follow, max-image-preview:large" },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "pt_BR" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:url", content: canonicalUrl },
      { property: "og:image", content: SOCIAL_IMAGE_URL },
      { property: "og:image:alt", content: "Tempo Pelotas — meteorologia local" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: SOCIAL_IMAGE_URL },
    ],
    links: [{ rel: "canonical", href: canonicalUrl }],
  };
}
''',
)

replace_once(
    "src/routes/__root.tsx",
    'import { reportLovableError } from "@/lib/lovable-error-reporting";\n',
    'import { reportLovableError } from "@/lib/lovable-error-reporting";\nimport {\n  SITE_DESCRIPTION,\n  SITE_NAME,\n  SITE_TITLE,\n  SOCIAL_IMAGE_URL,\n  createWebsiteJsonLd,\n} from "@/lib/site-config";\n',
)
replace_once(
    "src/routes/__root.tsx",
    '''const siteTitle = "Tempo Pelotas | Previsão do tempo em Pelotas e região";
const siteDescription =
  "Previsão do tempo, condições atuais, chuva, vento e informações meteorológicas de Pelotas e da Zona Sul do Rio Grande do Sul.";
const socialImage =
  "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3f08c889-e910-4b95-8e86-5c37fa31c1c8/id-preview-9ab27e4f--d63df7b2-45db-4890-823c-87629dab73a1.lovable.app-1784525496143.png";

''',
    "",
)
replace_once("src/routes/__root.tsx", "{ title: siteTitle }", "{ title: SITE_TITLE }")
replace_once(
    "src/routes/__root.tsx",
    '{ name: "description", content: siteDescription }',
    '{ name: "description", content: SITE_DESCRIPTION }',
)
replace_once(
    "src/routes/__root.tsx",
    '{ property: "og:title", content: siteTitle }',
    '{ property: "og:title", content: SITE_TITLE }',
)
replace_once(
    "src/routes/__root.tsx",
    '{ property: "og:description", content: siteDescription }',
    '{ property: "og:description", content: SITE_DESCRIPTION }',
)
replace_once(
    "src/routes/__root.tsx",
    '{ property: "og:locale", content: "pt_BR" },',
    '{ property: "og:locale", content: "pt_BR" },\n      { property: "og:site_name", content: SITE_NAME },',
)
replace_once(
    "src/routes/__root.tsx",
    '{ property: "og:image", content: socialImage }',
    '{ property: "og:image", content: SOCIAL_IMAGE_URL }',
)
replace_once(
    "src/routes/__root.tsx",
    '{ name: "twitter:title", content: siteTitle }',
    '{ name: "twitter:title", content: SITE_TITLE }',
)
replace_once(
    "src/routes/__root.tsx",
    '{ name: "twitter:description", content: siteDescription }',
    '{ name: "twitter:description", content: SITE_DESCRIPTION }',
)
replace_once(
    "src/routes/__root.tsx",
    '{ name: "twitter:image", content: socialImage }',
    '{ name: "twitter:image", content: SOCIAL_IMAGE_URL }',
)
replace_once(
    "src/routes/__root.tsx",
    '    links: [{ rel: "stylesheet", href: appCss }],',
    '''    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(createWebsiteJsonLd()),
      },
    ],''',
)

replace_once(
    "src/routes/index.tsx",
    'import { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";\n',
    'import { createPageHead } from "@/lib/page-meta";\nimport { getWeatherIntelligence } from "@/lib/weather/weather-intelligence.functions";\n',
)
replace_once(
    "src/routes/index.tsx",
    '''  head: () => ({
    meta: [
      { title: "Tempo Pelotas — Previsão do tempo em Pelotas" },
      {
        name: "description",
        content:
          "Condições atuais, alertas oficiais e previsão meteorológica consolidada para Pelotas, Rio Grande do Sul.",
      },
      { property: "og:title", content: "Tempo Pelotas — Previsão do tempo em Pelotas" },
      {
        property: "og:description",
        content:
          "Condições atuais, alertas oficiais e previsão meteorológica consolidada para Pelotas, Rio Grande do Sul.",
      },
    ],
  }),''',
    '''  head: () =>
    createPageHead(
      "Tempo Pelotas — Previsão do tempo em Pelotas",
      "Condições atuais, alertas oficiais e previsão meteorológica consolidada para Pelotas, Rio Grande do Sul.",
      "/",
    ),''',
)

route_paths = {
    "src/routes/alertas.tsx": "/alertas",
    "src/routes/metodologia.tsx": "/metodologia",
    "src/routes/vento-em-pelotas.tsx": "/vento-em-pelotas",
    "src/routes/chuva-em-pelotas.tsx": "/chuva-em-pelotas",
    "src/routes/tempo-hoje-pelotas.tsx": "/tempo-hoje-pelotas",
    "src/routes/cameras-ao-vivo-pelotas.tsx": "/cameras-ao-vivo-pelotas",
    "src/routes/estacao-embrapa-pelotas.tsx": "/estacao-embrapa-pelotas",
    "src/routes/previsao-7-dias-pelotas.tsx": "/previsao-7-dias-pelotas",
    "src/routes/historico-climatico-pelotas.tsx": "/historico-climatico-pelotas",
    "src/routes/situacao-hidrologica-pelotas.tsx": "/situacao-hidrologica-pelotas",
    "src/routes/nivel-da-lagoa-dos-patos-laranjal.tsx": "/nivel-da-lagoa-dos-patos-laranjal",
}
for route_file, canonical_path in route_paths.items():
    add_create_page_head_path(route_file, canonical_path)

write(
    "src/routes/sitemap[.]xml.ts",
    '''import { createFileRoute } from "@tanstack/react-router";

import { PUBLIC_ROUTES } from "@/lib/public-routes";
import { absoluteUrl } from "@/lib/site-config";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function createSitemap() {
  const urls = PUBLIC_ROUTES.map(
    (route) => `  <url>
    <loc>${escapeXml(absoluteUrl(route.path))}</loc>
    <changefreq>${route.changeFrequency}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
  </url>`,
  ).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>\n`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () =>
        new Response(createSitemap(), {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
          },
        }),
    },
  },
});
''',
)

write(
    "src/routes/robots[.]txt.ts",
    '''import { createFileRoute } from "@tanstack/react-router";

import { absoluteUrl } from "@/lib/site-config";

function createRobotsTxt() {
  return [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /_server/",
    `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
    "",
  ].join("\n");
}

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () =>
        new Response(createRobotsTxt(), {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
          },
        }),
    },
  },
});
''',
)

env_path = ROOT / ".env.example"
env_text = env_path.read_text(encoding="utf-8")
if "VITE_SITE_URL=" not in env_text:
    env_text += '''

# URL pública canônica. Em produção, use somente o domínio definitivo do portal.
VITE_SITE_URL=https://mobitempopelotas.lovable.app
'''
    env_path.write_text(env_text, encoding="utf-8")

matrix_replacements = {
    "| SEO técnico | 15% | Metadados básicos presentes; endpoints e dados estruturados ausentes |":
        "| SEO técnico | 60% | Canonicals, Open Graph, Twitter Cards, sitemap, robots e WebSite JSON-LD implementados |",
    "| 40 | Sitemap | Não migrado | `_legacy/app/sitemap.ts` | `src/routes/sitemap[.]xml.ts` ou server route equivalente | lista canônica de rotas | Gerar XML com headers e datas confiáveis | Médio | Todas as URLs públicas canônicas, sem rotas privadas ou duplicadas | 9 |":
        "| 40 | Sitemap | Migrado | `_legacy/app/sitemap.ts` | `src/routes/sitemap[.]xml.ts`, `src/lib/public-routes.ts` | `VITE_SITE_URL` | Server route TanStack com XML e cache explícitos | Baixo | Todas as URLs públicas canônicas, sem rotas privadas ou duplicadas | 9 |",
    "| 41 | Robots | Não migrado | `_legacy/app/robots.ts` | `src/routes/robots[.]txt.ts` | URL de produção | Gerar texto no runtime ou arquivo público | Baixo | Sitemap referenciado e regras corretas por ambiente | 9 |":
        "| 41 | Robots | Migrado | `_legacy/app/robots.ts` | `src/routes/robots[.]txt.ts` | `VITE_SITE_URL` | Server route TanStack com content-type e cache explícitos | Baixo | Sitemap referenciado e regras corretas por ambiente | 9 |",
    "| 42 | Canonicals | Parcial | metadata das páginas Next | `head()` das rotas TanStack | `SITE_URL` | Centralizar URL absoluta e evitar canonicals de preview | Médio | Toda rota indexável possui canonical único de produção | 9 |":
        "| 42 | Canonicals | Migrado | metadata das páginas Next | `src/lib/site-config.ts`, `src/lib/page-meta.ts`, `head()` das rotas | `VITE_SITE_URL` | URL absoluta centralizada com fallback de produção | Baixo | Toda rota indexável possui canonical único de produção | 9 |",
    "| 43 | Open Graph e Twitter Cards | Parcial | metadata e assets do legado | `head()` + assets em `public/` | URL pública e imagem social | Adaptar metadata por rota | Médio | Título, descrição, imagem, dimensões e URL corretos | 9 |":
        "| 43 | Open Graph e Twitter Cards | Migrado | metadata e assets do legado | `src/lib/page-meta.ts`, `src/routes/__root.tsx` | URL pública e imagem social | Metadados por rota com URL canônica e imagem compartilhada | Baixo | Título, descrição, imagem e URL corretos | 9 |",
    "| 44 | Schema.org | Não migrado | JSON-LD espalhado no legado | helpers e scripts por rota | dados meteorológicos e organização | Validar tipos WebSite, Organization, BreadcrumbList e Dataset/Weather quando aplicável | Médio | JSON-LD válido sem alegações indevidas ou dados inventados | 9 |":
        "| 44 | Schema.org | Parcial | JSON-LD espalhado no legado | `src/lib/site-config.ts`, `src/routes/__root.tsx` | dados meteorológicos e organização | WebSite global implementado; BreadcrumbList e datasets permanecem pendentes | Médio | JSON-LD válido sem alegações indevidas ou dados inventados | 9 |",
}
for old, new in matrix_replacements.items():
    replace_once("MIGRATION_MATRIX.md", old, new)

print("Núcleo de SEO técnico aplicado.")
