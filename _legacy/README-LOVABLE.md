# _legacy/ — Snapshot de referência

Este diretório contém um **snapshot congelado, somente leitura** do repositório
`agenciamobi/tempopelotas` (Next.js 16). É usado apenas como referência durante
a migração para a stack TanStack Start deste projeto.

## Regras

- **Não importar nada de `_legacy/` no código de `src/`.** Nem por alias
  (`@/...`), nem por caminho relativo. A regra é copiar o trecho necessário
  para `src/` e adaptá-lo.
- **Não editar arquivos aqui.** Se for preciso corrigir algo, corrija na
  cópia adaptada dentro de `src/`.
- Arquivos aqui **não são compilados, type-checked, lintados nem formatados**
  (o `tsconfig.json` restringe a `src/**` e o `.prettierignore` cobre
  `_legacy/`).
- Nada em `_legacy/` entra no bundle de produção.
- Segredos, chaves privadas e valores de ambiente **nunca** devem existir
  aqui. O snapshot foi curado para excluir `.env`, `.env.local` e
  `.env.*.local`.

## Como este diretório é atualizado

`_legacy/` é substituído integralmente a cada novo snapshot fornecido pelo
mantenedor. Para os detalhes do snapshot corrente (origem, branch, commit,
data UTC, checksum, exclusões) veja `_legacy/SOURCE_SNAPSHOT.md`.

O plano de migração e o mapeamento origem → destino vivem em `MIGRATION.md`
e `MIGRATION_MATRIX.md` na raiz do projeto.
