# Pilha CSS literal da produção

A homepage em `src/production` utiliza a pilha CSS carregada por `src/production/production-styles.css`, preservando a ordem de cascata necessária para compatibilidade com o histórico visual do projeto.

## Regra de compatibilidade

O runtime TanStack carrega Tailwind por `src/styles.css`; a pilha editorial permanece concentrada em `src/production/production-styles.css`.

Arquivos de refinamento são adicionados ao final da cascata para evitar reescrita destrutiva de estilos históricos ainda usados por páginas internas.

## Estado atual da primeira dobra

Desde a revisão `v70`, a Home deixou de reutilizar o header editorial completo das páginas internas e passou a usar um header compacto dedicado, seguido por um hero meteorológico unificado.

A revisão `v71` mantém essa arquitetura e remove a última sensação de dashboard da primeira dobra: a previsão das próximas horas passa a integrar o próprio palco do hero, a fotografia recebe mais presença, os CTAs ficam menos promocionais e o aviso oficial do INMET assume uma composição horizontal editorial.

As camadas finais responsáveis por essa direção são:

- `src/production/styles/home-first-fold-editorial-v70.css`;
- `src/production/styles/home-first-fold-editorial-v71.css`.

A `v71` é carregada por último e sobrescreve somente os refinamentos da primeira dobra da Home, mantendo as versões anteriores na pilha como compatibilidade para seletores e páginas ainda dependentes delas.

## Objetivo

Manter a homepage Lovable alinhada ao código ativo sem apagar a história da cascata, mas permitindo que a primeira dobra evolua para uma linguagem editorial meteorológica mais clara, responsiva e orientada à informação principal.

## Sincronização

Alterações nessa pilha devem ser validadas por `Qualidade` e pela auditoria visual após a atualização da `main`, preservando o fluxo de sincronização com Lovable.
