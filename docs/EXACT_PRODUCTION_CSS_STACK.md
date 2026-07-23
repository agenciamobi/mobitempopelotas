# Pilha CSS literal da produção

A homepage em `src/production` utiliza os arquivos CSS carregados pelo `app/layout.tsx` do repositório `agenciamobi/tempopelotas`, preservando a mesma ordem de cascata.

## Regra de compatibilidade

O único trecho removido é o `@import "tailwindcss"` de `globals.css`, porque o runtime TanStack já carrega Tailwind por `src/styles.css`. Todos os demais arquivos e seletores são mantidos literalmente.

## Objetivo

Evitar reconstruções ou aproximações visuais e manter a homepage Lovable alinhada à produção Vercel em desktop, tablet e mobile.
