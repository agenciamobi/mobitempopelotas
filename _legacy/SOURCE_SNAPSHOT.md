# Snapshot da origem legada

Este diretório é **somente referência**. Nenhum arquivo daqui deve ser importado
pelo código em `src/`. A migração é feita reescrevendo/adaptando cada peça
para a stack TanStack Start deste projeto.

## Origem sincronizada

- Repositório: `agenciamobi/tempopelotas` (GitHub, público na data da sincronização)
- Branch: `main`
- Commit: `05cd2d268ad25c070718ecc170bd30e8ad181341`
- Data UTC do snapshot: `2026-07-22T00:11:00Z`
- Método: `git clone --depth 1` + `rsync` para `_legacy/`

## Exclusões aplicadas

Preservados os caminhos relativos originais, mas excluídos:

- `.git/` (histórico não é necessário aqui)
- `node_modules/`, `dist/`, `build/`, `.next/`, `.turbo/`, `.vercel/`, `coverage/`
- Arquivos de log (`*.log`)
- Arquivos locais com valores de ambiente: `.env`, `.env.local`, `.env.*.local`

Foi mantido `_legacy/.env.example` porque contém somente nomes de variáveis e
placeholders públicos — sem credenciais.

## Regra

`_legacy/` existe apenas para consulta durante a migração. Os arquivos aqui:

- não são compilados (o `tsconfig.json` restringe a `src/**`)
- não são formatados (`.prettierignore`)
- não são type-checked, lintados, nem inseridos no bundle
- não devem ser importados por caminhos como `@/_legacy/...` — a regra é
  copiar e adaptar para `src/`
