# _legacy/ — Código-fonte de referência (Next.js)

Snapshot do repositório [`agenciamobi/tempopelotas`](https://github.com/agenciamobi/tempopelotas) importado em 20/07/2026 para servir como **referência de leitura** durante a migração para TanStack Start.

## Regras

- **NÃO é compilado**: `tsconfig.json` só inclui `src/**`, e o Vite só faz bundle do que é importado a partir de `src/`. Nada aqui roda em produção.
- **NÃO importar nada de `_legacy/`** a partir de `src/`. Ao migrar um arquivo, **copie** o conteúdo para o local correto em `src/` e adapte à stack nova.
- **NÃO editar** arquivos aqui — se precisar ajustar algo, faça na versão migrada em `src/`.
- Pode ser removido depois que a migração terminar.

## Stack original

- Next.js 16 (App Router) + React 19
- TailwindCSS 4
- MapLibre GL
- web-push (VAPID)
- Supabase (2 migrations em `_legacy/supabase/migrations/`)

## Mapa de migração (para acompanhar)

| Origem (Next)                       | Destino (TanStack Start)                       |
| ----------------------------------- | ---------------------------------------------- |
| `app/layout.tsx`                    | `src/routes/__root.tsx` + `SiteLayout`         |
| `app/page.tsx`                      | `src/routes/index.tsx`                         |
| `app/<slug>/page.tsx`               | `src/routes/<slug>.tsx`                        |
| `app/api/<x>/route.ts`              | `src/routes/api/<x>.ts` (server route)         |
| `app/api/cron/*`                    | `src/routes/api/public/cron.*.ts` + assinatura |
| `app/sitemap.ts` / `robots.ts`      | `src/routes/api/public/sitemap.xml.ts` etc.    |
| `app/manifest.ts` + `public/sw.js`  | `public/manifest.webmanifest` + `public/sw.js` |
| `components/*`                      | `src/components/*`                             |
| `lib/*`                             | `src/lib/*` (ou `*.server.ts` quando node-only) |
| `supabase/migrations/*`             | migrations do Lovable Cloud (quando habilitado) |

## Pontos de atenção

- **`web-push`** (push notifications) usa APIs Node — não roda no runtime Worker da Cloudflare. Vai precisar virar Edge Function do Supabase.
- **MapLibre** é browser-only: importar via `React.lazy` + `<ClientOnly>`.
- **Cron routes** externas devem ficar sob `src/routes/api/public/` com verificação de secret.
- Muitos CSS globais em `app/*.css` — consolidar em `src/styles.css` ou módulos por componente durante a migração.
