# Acervo local do hero

A Home do Tempo Pelotas usa fotografias locais de Pelotas como fonte visual primária do hero estático.

## Categorias

- chuva/trovoadas: Praia do Laranjal com chuva;
- nevoeiro/neblina: Pelotas sob nevoeiro;
- céu limpo/sol: Pelotas em condição aberta;
- nublado/parcialmente nublado: vista urbana de Pelotas com céu variável.

O resolvedor fica em `src/production/lib/hero-photo-presentation.ts` e cruza a condição observada/narrativa oficial com o ícone meteorológico já resolvido.

Os ativos otimizados ficam em `public/weather/hero/`. A fotografia de parcialmente nublado usa AVIF para preservar a leitura da paisagem com baixo peso. Quando a câmera ao vivo da Praia do Laranjal está online, ela mantém prioridade sobre a fotografia estática.

Não usar Wikimedia ou bancos genéricos como fonte principal do hero. Novas imagens devem ser locais, categorizadas no resolvedor e manter crédito verdadeiro.
