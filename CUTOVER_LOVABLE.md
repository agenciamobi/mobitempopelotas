# Plano de corte para produção — Lovable

Este documento controla a substituição do ambiente de produção atual pelo projeto TanStack Start publicado no Lovable.

## Condições obrigatórias antes do DNS

- [ ] A branch `main` está sincronizada com o projeto Lovable.
- [ ] O workflow `Qualidade` passou com build, TypeScript e ESLint.
- [ ] O preview publicado foi testado em desktop e celular.
- [ ] `VITE_SITE_URL` está configurada com a origem definitiva do portal, sem barra final.
- [ ] As variáveis já utilizadas em produção foram conferidas no Lovable, sem copiar segredos para variáveis `VITE_*`.
- [ ] A página `/tempo-amanha-pelotas` responde com dados reais ou estado de indisponibilidade explícito.
- [ ] `/clima-em-pelotas` responde com redirecionamento permanente para `/historico-climatico-pelotas`.
- [ ] A câmera do Laranjal diferencia transmissão ao vivo de replay.
- [ ] A Estação Laranjal diferencia leitura atual de última leitura conhecida.

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

- [ ] Canonical de cada rota aponta para o domínio definitivo.
- [ ] `og:url` e imagens sociais usam URLs absolutas válidas.
- [ ] O sitemap lista as 13 páginas públicas indexáveis.
- [ ] O robots referencia o sitemap no domínio definitivo.
- [ ] `/clima-em-pelotas` não permanece no sitemap e redireciona com HTTP 301.
- [ ] Search Console recebe o sitemap definitivo após o corte.
- [ ] Analytics e pixels existentes foram testados, quando aplicáveis.

## Procedimento de DNS

1. Reduzir o TTL do registro atual antes da janela de corte, quando o provedor permitir.
2. Adicionar o domínio personalizado no Lovable e copiar exatamente os registros solicitados pela plataforma.
3. Não remover o ambiente anterior antes da validação completa do domínio novo.
4. Alterar os registros DNS na janela escolhida.
5. Confirmar emissão e validade do certificado HTTPS.
6. Validar `www` e domínio raiz conforme a estratégia adotada, mantendo apenas uma origem canônica.
7. Repetir os testes de rotas, APIs públicas, câmera e telemetria no domínio definitivo.

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

1. restaurar os registros DNS anteriores;
2. manter o Lovable publicado para diagnóstico sem apontar o domínio principal;
3. registrar a rota, fonte ou integração que falhou;
4. corrigir em branch isolada e exigir workflow verde;
5. repetir o corte somente após o preview reproduzir o cenário de produção.

O ambiente anterior deve permanecer disponível por pelo menos 48 horas após a troca, sem receber novas alterações, para permitir rollback rápido.
