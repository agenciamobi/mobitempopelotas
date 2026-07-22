# Snapshot da origem legada

Este diretório é **somente referência**. Nenhum arquivo daqui deve ser importado
pelo código em `src/`. A migração é feita reescrevendo e adaptando cada peça
para a stack TanStack Start deste projeto.

## Origem sincronizada

- Repositório: `agenciamobi/tempopelotas`
- Branch: `main`
- Commit: `05cd2d268ad25c070718ecc170bd30e8ad181341`
- Data UTC do snapshot: `2026-07-22T00:11:00Z`
- Método: `git clone --depth 1` seguido de `rsync` para `_legacy/`
- Arquivos em `_legacy/`: `249`

## Exclusões aplicadas

Os caminhos relativos versionados foram preservados. Foram excluídos somente:

- `.git/`;
- `node_modules/`, `.next/`, `dist/`, `build/`, `.turbo/`, `.vercel/` e `coverage/`;
- arquivos de log;
- arquivos locais com valores de ambiente: `.env`, `.env.local` e `.env.*.local`.

O arquivo `_legacy/.env.example` foi mantido porque contém apenas nomes de
variáveis, comentários e valores padrão públicos, sem credenciais.

## Regra de uso

- `_legacy/` não é compilado, formatado, lintado ou incluído no bundle;
- nada em `src/` pode importar diretamente arquivos de `_legacy/`;
- cada recurso deve ser copiado e adaptado para a arquitetura TanStack Start;
- o diretório pode ser removido somente após a conclusão e auditoria da migração.
