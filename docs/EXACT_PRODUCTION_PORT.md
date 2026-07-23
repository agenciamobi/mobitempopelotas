# Transplante literal da produção Vercel

A homepage em `src/production` foi copiada da implementação ativa em `agenciamobi/tempopelotas`, também preservada em `_legacy`.

## Mantido literalmente

- estrutura JSX e hierarquia editorial;
- nomes de classes e folha de estilos da produção;
- header, megamenus e navegação móvel;
- hero meteorológico;
- avisos INMET e orientação preventiva;
- previsão hora a hora e próximos dias;
- radar, satélite e trovoadas com MapLibre;
- observação Embrapa;
- Laranjal, Guaíba e rede da Lagoa dos Patos;
- exploração do portal e footer editorial.

## Adaptações limitadas

- `next/link` e `next/navigation` foram substituídos por compatibilidade com TanStack Router;
- dados atuais do runtime TanStack são convertidos para os contratos esperados pelos componentes da produção;
- indisponibilidade integral ou parcial permanece explícita e não gera valores meteorológicos inventados;
- as rotas server-side, secrets e proxies existentes no Lovable foram preservados.

O domínio e o DNS não fazem parte deste lote.
