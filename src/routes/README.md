# Routes

TanStack Start uses **file-based routing**. Every `.tsx` file in this directory
defines a route. Do **not** create `src/pages/`, `src/routes/_app/index.tsx`, or
`app/layout.tsx` — those are Next.js / Remix conventions. The only root layout
is `src/routes/__root.tsx`.

## Conventions

| File                     | URL                                                     |
| ------------------------ | ------------------------------------------------------- |
| `index.tsx`              | `/`                                                     |
| `about.tsx`              | `/about`                                                |
| `users/index.tsx`        | `/users`                                                |
| `users/$id.tsx`          | `/users/:id` (dynamic — bare `$`, no curly braces)      |
| `posts/{-$category}.tsx` | `/posts/:category?` (optional segment)                  |
| `files/$.tsx`            | `/files/*` (splat — read via `_splat` param, never `*`) |
| `_layout.tsx`            | layout route (renders children via `<Outlet />`)        |
| `__root.tsx`             | app shell — wraps every page; preserve `<Outlet />`     |

## Declaração obrigatória

A chamada `createFileRoute()` deve sempre receber um caminho literal que corresponda ao
nome e à posição do arquivo:

```ts
export const Route = createFileRoute("/tempo-em/$citySlug")({
  // ...
});
```

Não use constantes, template strings interpoladas ou funções dentro de
`createFileRoute()`. O crawler do TanStack e o gerador preventivo executado antes de
`dev`, `build`, `test` e `typecheck` precisam ler esse valor estaticamente.

Arquivos que representam extensões públicas usam `[.]`, por exemplo:

- `sitemap[.]xml.ts` → `/sitemap.xml`
- `widgets/nivel-laranjal[.]js.ts` → `/widgets/nivel-laranjal.js`
- `brand/tempo-pelotas-icon[.]png.ts` → `/brand/tempo-pelotas-icon.png`

`routeTree.gen.ts` é gerado automaticamente. Não o edite manualmente. Use:

```bash
npm run routes:generate
npm run routes:check
```
