# _legacy/ — Código-fonte de referência (Next.js)

Snapshot do repositório [`agenciamobi/tempopelotas`](https://github.com/agenciamobi/tempopelotas) importado em 20/07/2026 para servir como **referência de leitura** durante a migração para TanStack Start.

## Regras

- **NÃO é compilado**: `tsconfig.json` só inclui os arquivos da aplicação, e o Vite só faz bundle do que é importado a partir de `src/`. Nada aqui deve rodar em produção.
- **NÃO importar nada de `_legacy/`** a partir de `src/`. Ao migrar um arquivo, copie o conteúdo para o local correto em `src/` e adapte à stack nova.
- **NÃO editar implementações do projeto aqui**. Ajustes devem ser realizados apenas na versão migrada em `src/`, `public/` ou `supabase/`.
- O diretório pode ser removido depois que a migração for concluída e validada.

## Stack original

- Next.js 16 (App Router) + React 19
- Tailwind CSS 4
- MapLibre GL
- web-push (VAPID)
- Supabase externo

## Mapa de migração

| Origem (Next.js)                    | Destino (TanStack Start)                         |
| ----------------------------------- | ------------------------------------------------ |
| `app/layout.tsx`                    | `src/routes/__root.tsx` + `SiteLayout`           |
| `app/page.tsx`                      | `src/routes/index.tsx`                           |
| `app/<slug>/page.tsx`               | `src/routes/<slug>.tsx`                          |
| `app/api/<x>/route.ts`              | rota de servidor equivalente em `src/routes/api` |
| `app/api/cron/*`                    | rota protegida ou Supabase Edge Function         |
| `app/sitemap.ts` / `robots.ts`      | rotas públicas para sitemap e robots             |
| `app/manifest.ts` + `public/sw.js`  | `public/manifest.webmanifest` + `public/sw.js`   |
| `components/*`                      | `src/components/*`                               |
| `lib/*`                             | `src/lib/*`, usando `*.server.ts` quando necessário |
| `supabase/migrations/*`             | `supabase/migrations/*` vinculadas ao Supabase externo |

## Supabase

O Supabase externo permanece como backend oficial do Tempo Pelotas. Ele será responsável por banco de dados, migrations, Edge Functions, Storage, autenticação e políticas RLS quando utilizadas.

Não deve ser criado um segundo banco no Lovable Cloud. As migrations existentes devem ser copiadas para `supabase/migrations/` no novo repositório, revisadas e aplicadas ao projeto Supabase externo já definido para o portal.

A `SUPABASE_SERVICE_ROLE_KEY` nunca pode ser exposta em variáveis públicas, componentes React ou bundles do navegador.

## Pontos de atenção

- **`web-push`** usa APIs de servidor. Primeiro deve ser validado o runtime final do deploy. Caso não exista compatibilidade adequada, o envio será migrado para uma Supabase Edge Function ou outro runtime de servidor compatível.
- **MapLibre** é browser-only e deve ser carregado de forma segura no cliente, evitando acesso a `window` durante SSR.
- **Cron routes** externas devem possuir autenticação por segredo, idempotência e logs mínimos de execução.
- Os estilos globais do projeto antigo devem ser consolidados gradualmente em `src/styles.css` ou em módulos dos componentes migrados.
- Nenhuma dependência, configuração ou arquivo gerado do Next.js deve substituir a estrutura nativa do TanStack Start.
