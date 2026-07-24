# Plano de corte para produção — Lovable

Este documento controla a substituição do ambiente de produção atual pelo projeto TanStack Start publicado no Lovable.

## Origens envolvidas

- Domínio canônico definitivo: `https://tempopelotas.com.br`.
- Alias a preservar ou redirecionar: `https://tempopelotas.com.br`.
- Produção atual para rollback: projeto `tempopelotas` na Vercel.
- Nova hospedagem validada: `https://tempopelotas.com.br`.

## Condições obrigatórias antes do DNS

- [x] A branch `main` está sincronizada com o projeto Lovable.
- [x] O workflow `Qualidade` passou com build, TypeScript e ESLint.
- [ ] O preview publicado foi testado em desktop e celular após a configuração do domínio canônico.
- [x] O fallback de `VITE_SITE_URL` no código usa `https://tempopelotas.com.br`, sem barra final.
- [ ] As variáveis já utilizadas em produção foram conferidas no Lovable, sem copiar segredos para variáveis `VITE_*`.
- [x] A página `/tempo-amanha-pelotas` responde com dados reais ou estado de indisponibilidade explícito.
- [x] `/clima-em-pelotas` responde com redirecionamento permanente para `/historico-climatico-pelotas`.
- [x] A câmera do Laranjal diferencia transmissão ao vivo de replay.
- [x] A Estação Laranjal diferencia leitura atual de última leitura conhecida.

## Rotas que devem responder antes do corte

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

## SEO e continuidade de URLs

- [ ] Canonical de cada rota aponta para `https://tempopelotas.com.br` na versão publicada.
- [ ] `og:url` usa o domínio definitivo e as imagens sociais possuem URL absoluta válida.
- [x] O sitemap lista as 13 páginas públicas indexáveis.
- [ ] O robots referencia `https://tempopelotas.com.br/sitemap.xml` na versão publicada.
- [x] `/clima-em-pelotas` não permanece no sitemap e redireciona com HTTP 301.
- [ ] Search Console recebe o sitemap definitivo após o corte.
- [ ] Analytics e pixels existentes foram testados, quando aplicáveis.

## Procedimento de DNS

1. Adicionar `tempopelotas.com.br` e `tempopelotas.com.br` como domínios personalizados no projeto `mobitempopelotas` do Lovable.
2. Copiar exatamente os registros DNS solicitados pelo Lovable antes de remover qualquer associação da Vercel.
3. Reduzir o TTL dos registros atuais, quando o provedor permitir.
4. Manter o projeto Vercel e seus deployments disponíveis durante a janela de rollback.
5. Alterar primeiro os registros solicitados pelo Lovable e aguardar a validação do domínio.
6. Confirmar emissão e validade do certificado HTTPS.
7. Definir `tempopelotas.com.br` como origem canônica; `www` deve redirecionar para o domínio raiz.
8. Repetir os testes de rotas, APIs públicas, câmera e telemetria no domínio definitivo.
9. Remover os domínios personalizados da Vercel somente após a nova origem estar validada e estável.

## Validação após o corte

- [ ] Home responde HTTP 200 e renderiza pelo servidor.
- [ ] Não há erros de hidratação ou exceções no console.
- [ ] Fontes meteorológicas entram em contingência sem derrubar as páginas.
- [ ] Não há respostas 404 para URLs indexadas anteriormente.
- [ ] Sitemap, robots, JSON Feed e `pelotas.json` usam o domínio definitivo.
- [ ] Navegação por teclado, foco e skip link permanecem funcionais.
- [ ] Layout não apresenta overflow em 320 px, tablet e desktop.
- [ ] Logs e métricas do primeiro dia foram revisados.

## Rollback

Caso exista bloqueador real após o corte:

1. restaurar os registros DNS anteriores da Vercel;
2. manter o Lovable publicado para diagnóstico sem apontar o domínio principal;
3. registrar a rota, fonte ou integração que falhou;
4. corrigir em branch isolada e exigir workflow verde;
5. repetir o corte somente após o preview reproduzir o cenário de produção.

O ambiente anterior deve permanecer disponível por pelo menos 48 horas após a troca, sem receber novas alterações, para permitir rollback rápido.
