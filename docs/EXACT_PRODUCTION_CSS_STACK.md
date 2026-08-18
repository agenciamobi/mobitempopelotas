# Pilha CSS literal da produção

A homepage em `src/production` utiliza a pilha CSS carregada por `src/production/production-styles.css`, preservando a ordem de cascata necessária para compatibilidade com o histórico visual do projeto.

## Regra de compatibilidade

O runtime TanStack carrega Tailwind por `src/styles.css`; a pilha editorial permanece concentrada em `src/production/production-styles.css`.

Arquivos de refinamento são adicionados ao final da cascata para evitar reescrita destrutiva de estilos históricos ainda usados por páginas internas.

## Estado atual da Home editorial

Desde a revisão `v70`, a Home deixou de reutilizar o header editorial completo das páginas internas e passou a usar um header compacto dedicado, seguido por um hero meteorológico unificado.

A revisão `v71` removeu a sensação de dashboard da primeira dobra: a previsão das próximas horas passou a integrar o próprio palco do hero, a fotografia recebeu mais presença, os CTAs ficaram menos promocionais e o aviso oficial do INMET assumiu uma composição horizontal editorial.

A revisão `v72` fez o polimento final dessa arquitetura: reduziu a altura do hero no desktop, garantiu o resumo meteorológico sem truncamento, reposicionou a origem da observação como crédito técnico, eliminou a duplicidade visual de ações de alerta, reforçou a legibilidade das métricas e simplificou a faixa do INMET.

A revisão `v73` leva a mesma linguagem para as seções imediatamente abaixo da primeira dobra. A previsão oficial do INMET, a orientação preventiva, a navegação da Home e a primeira seção detalhada de previsão passam a usar superfícies claras, divisores finos, tipografia editorial, menos caixas independentes e a mesma régua de largura do hero.

As camadas finais responsáveis por essa direção são:

- `src/production/styles/home-first-fold-editorial-v70.css`;
- `src/production/styles/home-first-fold-editorial-v71.css`;
- `src/production/styles/home-first-fold-editorial-v72.css`;
- `src/production/styles/home-below-fold-editorial-v73.css`.

A `v73` é carregada por último e sobrescreve somente a continuidade visual da Home abaixo do hero, mantendo as versões anteriores na pilha como compatibilidade para seletores e páginas ainda dependentes delas.

## Objetivo

Manter a homepage Lovable alinhada ao código ativo sem apagar a história da cascata, evoluindo a Home inteira para uma linguagem editorial meteorológica mais clara, responsiva e orientada à informação principal.

## Sincronização

Alterações nessa pilha devem ser validadas por `Qualidade` e pela auditoria visual após a atualização da `main`, preservando o fluxo de sincronização com Lovable.
