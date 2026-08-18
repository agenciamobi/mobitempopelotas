# Pilha CSS literal da produção

A homepage em `src/production` utiliza a pilha CSS carregada por `src/production/production-styles.css`, preservando a ordem necessária para compatibilidade com páginas internas e componentes históricos.

## Regra de compatibilidade

O runtime TanStack carrega Tailwind por `src/styles.css`; a pilha editorial permanece concentrada em `src/production/production-styles.css`.

A partir da consolidação de agosto de 2026, novas alterações da Home não devem voltar ao padrão de arquivos incrementais `v72`, `v73`, `v74` etc.

A composição visual vigente da Home continua centralizada em:

- `src/production/styles/home-editorial-current.css`.

A usabilidade transversal da Home fica em uma segunda camada estável, sem versionamento incremental:

- `src/production/styles/home-editorial-ux.css`.

A separação é intencional: `home-editorial-current.css` define composição, superfícies, hierarquia e layout; `home-editorial-ux.css` trata legibilidade, alvos de toque, estados de foco, responsividade operacional, densidade e escaneabilidade. Nenhuma das duas deve voltar ao padrão de arquivos `v81`, `v82` etc.

## Estado atual da Home editorial

As revisões `v70` e `v71` continuam como base arquitetural da primeira dobra: header compacto dedicado, hero meteorológico unificado, fotografia local, leitura atual e previsão das próximas horas integradas ao mesmo palco.

As revisões experimentais `v72` a `v80` foram usadas para estabilizar:

- primeira dobra e aviso oficial;
- previsão oficial do INMET;
- orientação preventiva e índice da página;
- previsão hora a hora e tendência semanal;
- radar e satélite;
- medição local da Embrapa;
- situação da Lagoa dos Patos e Laranjal;
- diretório do portal;
- metodologia, FAQ e conteúdos relacionados;
- ritmo global e footer.

Essas revisões foram consolidadas em `home-editorial-current.css`. A produção não deve depender novamente da sequência `v72–v80`.

A rodada de UX/UI posterior à consolidação adicionou melhorias transversais sem reestruturar os componentes: tipografia auxiliar mais legível, alvos mínimos de interação, foco visível, navegação interna mais utilizável, melhor equilíbrio entre texto e mapa, maior escaneabilidade em previsão e águas, carrosséis horizontais controlados em telas pequenas e suporte explícito a `prefers-reduced-motion`.

## Ordem final da Home

No fim da pilha editorial, a ordem válida é:

1. `src/production/styles/home-first-fold-magazine-v69.css`;
2. `src/production/styles/home-first-fold-editorial-v70.css`;
3. `src/production/styles/home-first-fold-editorial-v71.css`;
4. `src/production/styles/home-editorial-current.css`;
5. `src/production/styles/home-editorial-ux.css`.

`home-editorial-current.css` é a fonte de verdade da composição visual. `home-editorial-ux.css` é a fonte de verdade das regras transversais de interação e usabilidade. Alterações futuras devem editar uma dessas duas camadas conforme a responsabilidade, em vez de adicionar novas versões numeradas.

## Objetivo

Manter a homepage Lovable alinhada ao código ativo com uma linguagem editorial meteorológica clara, responsiva e orientada à informação principal, reduzindo a dívida técnica de cascatas sobrepostas e priorizando leitura rápida, acessibilidade e uso em dispositivos móveis.

## Sincronização

Alterações nessa pilha devem ser validadas por `Qualidade` e pela auditoria visual após a atualização da `main`, preservando o fluxo de sincronização com Lovable. Em mudanças estruturais, validar desktop e mobile antes de remover compatibilidades anteriores a `v71`.
