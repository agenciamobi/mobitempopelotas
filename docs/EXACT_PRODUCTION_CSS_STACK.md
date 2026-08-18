# Pilha CSS literal da produção

A homepage em `src/production` utiliza a pilha CSS carregada por `src/production/production-styles.css`, preservando a ordem necessária para compatibilidade com páginas internas e componentes históricos.

## Regra de compatibilidade

O runtime TanStack carrega Tailwind por `src/styles.css`; a pilha editorial permanece concentrada em `src/production/production-styles.css`.

A partir da consolidação de agosto de 2026, novas alterações da Home não devem voltar ao padrão de arquivos incrementais `v72`, `v73`, `v74` etc. O estado visual vigente da Home deve ser mantido em uma única fonte de verdade:

- `src/production/styles/home-editorial-current.css`.

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

## Ordem final da Home

No fim da pilha editorial, a ordem válida é:

1. `src/production/styles/home-first-fold-magazine-v69.css`;
2. `src/production/styles/home-first-fold-editorial-v70.css`;
3. `src/production/styles/home-first-fold-editorial-v71.css`;
4. `src/production/styles/home-editorial-current.css`.

`home-editorial-current.css` é a camada atual de manutenção da homepage. Alterações futuras devem preferir editar e simplificar esse arquivo em vez de adicionar uma nova versão numerada.

## Objetivo

Manter a homepage Lovable alinhada ao código ativo com uma linguagem editorial meteorológica clara, responsiva e orientada à informação principal, reduzindo a dívida técnica de cascatas sobrepostas.

## Sincronização

Alterações nessa pilha devem ser validadas por `Qualidade` e pela auditoria visual após a atualização da `main`, preservando o fluxo de sincronização com Lovable. Em mudanças estruturais, validar desktop e mobile antes de remover compatibilidades anteriores a `v71`.
