# Snapshot da origem legada

Este diretório é **somente referência**. Nenhum arquivo daqui deve ser
importado pelo código em `src/`. Ver `_legacy/README-LOVABLE.md`.

## Origem sincronizada

- Repositório: `agenciamobi/tempopelotas` (GitHub)
- Branch: `main`
- Commit canônico: `05cd2d268ad25c070718ecc170bd30e8ad181341`
- Data UTC do snapshot: `2026-07-22T00:14:00Z`
- Método: ponte temporária autenticada no GitHub → ZIP curado
- SHA-256 do ZIP: `7714992dd24a2a2b2bdecac800d4640c0465ecd0bdb10ed0ca63c5477c52eac7`
- Entradas de arquivo no ZIP: `244`
- Arquivos em `_legacy/` após extração: `244`

## Exclusões aplicadas pela ponte

Caminhos relativos preservados; excluídos do ZIP:

- `.git/`, `.github/workflows/**`, `.gitignore`
- `node_modules/`, `.next/`, `dist/`, `build/`, `.turbo/`, `.vercel/`, `coverage/`
- Arquivos locais de ambiente com valores: `.env`, `.env.local`, `.env.*.local`
- Também excluído: `.env.example` (para eliminar qualquer risco de vazamento
  incidental; a lista canônica de variáveis vive agora em `MIGRATION_MATRIX.md`)
- Qualquer log ou artefato de build

## Verificação

Antes de substituir o conteúdo antigo, foi conferido:

1. SHA-256 do ZIP baixado bate com o hash divulgado.
2. Estrutura raiz corresponde ao repositório (`app/`, `components/`, `lib/`,
   `supabase/`, `public/`, `scripts/`, `docs/`, `README.md`,
   `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`,
   `proxy.ts`, `vercel.json`, `next-env.d.ts`).
3. Nenhum arquivo `.env*` presente após extração.
