# Pilha CSS literal da produção

A homepage em `src/production` utiliza a pilha CSS carregada por `src/production/production-styles.css`, preservando a ordem de cascata necessária para compatibilidade com o histórico visual do projeto.

## Regra de compatibilidade

O runtime TanStack carrega Tailwind por `src/styles.css`; a pilha editorial permanece concentrada em `src/production/production-styles.css`.

Arquivos de refinamento são adicionados ao final da cascata para evitar reescrita destrutiva de estilos históricos ainda usados por páginas internas.

## Estado atual da primeira dobra

Desde a revisão `v70`, a Home deixa de reutilizar o header editorial completo das páginas internas e passa a usar um header compacto dedicado, seguido por um hero meteorológico unificado.

A camada final responsável por essa direção é:

- `src/production/styles/home-first-fold-editorial-v70.css`.

Ela sobrescreve somente a primeira dobra da Home e mantém as versões anteriores na pilha como compatibilidade para seletores e páginas ainda dependentes delas.

## Objetivo

Manter a homepage Lovable alinhada ao código ativo sem apagar a história da cascata, mas permitindo que a primeira dobra evolua para uma linguagem editorial meteorológica mais clara, responsiva e orientada à informação principal.

## Sincronização

Alterações nessa pilha devem ser validadas por `Qualidade` e pela auditoria visual antes da integração na `main`, preservando o fluxo de sincronização com Lovable.
