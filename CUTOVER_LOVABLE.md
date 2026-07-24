# Política do domínio de produção

Este documento registra a configuração oficial do portal Tempo Pelotas após a ativação do domínio público.

## Domínio oficial

- Origem pública e canônica: `https://tempopelotas.com.br`.
- A variante `www` não é canônica e deve redirecionar permanentemente para o domínio raiz, preservando caminho e parâmetros.
- O endereço técnico anterior não deve aparecer em canonical, Open Graph, JSON-LD, sitemap, robots, feeds, documentação pública ou materiais de divulgação.
- Quando acessado diretamente, o endereço técnico anterior deve responder com redirecionamento permanente para o domínio oficial e cabeçalho `X-Robots-Tag: noindex, nofollow`.

## Contrato de SEO

- Todas as páginas indexáveis usam URLs absolutas iniciadas por `https://tempopelotas.com.br`.
- `robots.txt` referencia `https://tempopelotas.com.br/sitemap.xml`.
- `sitemap.xml` contém apenas as rotas públicas definidas em `src/lib/public-routes.ts`.
- Canonical, `og:url`, JSON-LD, feed e `pelotas.json` derivam de `src/lib/site-config.ts`.
- O domínio canônico é fixo no código e não pode ser substituído por preview ou variável de ambiente incorreta.

## Rotas operacionais obrigatórias

1. `/`
2. `/tempo-hoje-pelotas`
3. `/tempo-amanha-pelotas`
4. `/previsao-7-dias-pelotas`
5. `/chuva-em-pelotas`
6. `/vento-em-pelotas`
7. `/alertas`
8. `/situacao-hidrologica-pelotas`
9. `/nivel-da-lagoa-dos-patos-laranjal`
10. `/estacao-embrapa-pelotas`
11. `/historico-climatico-pelotas`
12. `/cameras-ao-vivo-pelotas`
13. `/metodologia`
14. `/sitemap.xml`
15. `/robots.txt`
16. `/pelotas.json`
17. `/feed`

## Validação após publicação

- [ ] Home responde HTTP 200 no domínio oficial.
- [ ] A variante `www` responde 301 ou 308 para o domínio raiz.
- [ ] O endereço técnico anterior responde 308 para o domínio oficial.
- [ ] O HTML da Home contém canonical no domínio oficial.
- [ ] `robots.txt` anuncia o sitemap oficial.
- [ ] `sitemap.xml` não contém host alternativo.
- [ ] Search Console aceita o sitemap.
- [ ] Não há erros de hidratação, overflow ou falhas de navegação.
- [ ] Integrações meteorológicas mantêm estados de contingência explícitos.

## Rollback

Em caso de falha crítica, preservar o domínio oficial como referência pública. O rollback deve trocar apenas a origem de infraestrutura ou o apontamento DNS; canonical, sitemap e URLs públicas não devem voltar para hosts de preview.
