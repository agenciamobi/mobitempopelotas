# Runbook do domínio de produção

O domínio oficial do Tempo Pelotas é `https://tempopelotas.com.br`. Este documento orienta validação, manutenção e rollback sem alterar a identidade pública do portal.

## Arquitetura pública

- Host canônico: `tempopelotas.com.br`.
- Protocolo obrigatório: HTTPS.
- Variante `www`: redirecionamento permanente para o domínio raiz.
- Endereços técnicos de hospedagem: nunca devem ser publicados em metadados, sitemap, robots, feeds ou materiais institucionais.
- Toda troca futura de infraestrutura deve preservar o domínio oficial e as URLs existentes.

## Verificações de código

Antes de integrar uma alteração de domínio ou SEO:

```powershell
npm ci
npm run test:contracts
npm run build
npm run test:routes
npm run typecheck
npm run lint
```

Os contratos devem confirmar:

- domínio canônico fixo em `src/lib/site-config.ts`;
- redirecionamento de hosts alternativos em `src/lib/canonical-host.ts`;
- geração do sitemap a partir de `src/lib/public-routes.ts`;
- ausência de domínios obsoletos em arquivos rastreados;
- consistência do `VITE_SITE_URL` no preflight de runtime.

## Smoke test do domínio

```powershell
$env:BASE_URL = "https://tempopelotas.com.br"
npm run cutover:smoke
```

O smoke test deve validar:

- Home e rotas públicas principais;
- `robots.txt`;
- `sitemap.xml`;
- canonical e metadados sociais;
- endpoints públicos necessários;
- ausência de erros HTTP inesperados.

O workflow `Smoke test de cutover` também executa `scripts/seo-production-smoke.mjs`. Esse segundo estágio diferencia falha de aplicação de comportamento da infraestrutura externa:

- `PASS`: contrato de produção confirmado;
- `WARN externo`: o destino canônico está correto, mas a camada de hospedagem ainda responde com redirect temporário (`302` ou `307`);
- `FAIL`: status inesperado, redirect ausente, destino incorreto, loop, metadado incorreto ou asset ausente.

Um `WARN externo` não torna o workflow vermelho porque não pode ser corrigido pelo código da aplicação, mas continua registrado no relatório como pendência operacional.

### Estado observado do `www` em 17/08/2026

A aplicação possui contrato explícito em `src/lib/canonical-host.ts` para responder `308` ao host `www`, preservando caminho e query string. Esse redirect é aplicado em `src/server.ts` antes da renderização.

No domínio público, entretanto, a camada externa de hospedagem respondeu `302` para `www` antes de a requisição chegar à aplicação. O destino permaneceu o host canônico. Enquanto esse comportamento existir, o smoke SEO deve registrar `WARN externo`, não `FAIL`.

Para eliminar o aviso e cumprir integralmente o contrato permanente, ajustar a configuração de domínio na camada de hosting. No Lovable, domínios conectados podem ter um domínio primário; domínios secundários são redirecionados pela própria plataforma. Uma opção operacional é remover o redirecionamento de domínio primário para que `www` também alcance a aplicação e seja tratado pelo `308` já implementado, ou configurar uma camada externa que emita `301/308` preservando caminho e parâmetros. Confirmar o resultado pelo smoke antes de considerar o P0 encerrado.

## Verificação manual

```powershell
Resolve-DnsName tempopelotas.com.br -Type A -ErrorAction SilentlyContinue
Resolve-DnsName tempopelotas.com.br -Type AAAA -ErrorAction SilentlyContinue
curl.exe -I https://tempopelotas.com.br/
curl.exe -I https://tempopelotas.com.br/robots.txt
curl.exe -I https://tempopelotas.com.br/sitemap.xml
```

Checklist:

- [ ] certificado TLS válido;
- [ ] Home responde HTTP 200;
- [ ] variante `www` responde 301 ou 308 para o domínio raiz;
- [ ] caminhos e parâmetros são preservados nos redirecionamentos;
- [ ] canonical da Home aponta para o domínio oficial;
- [ ] `robots.txt` referencia o sitemap oficial;
- [ ] sitemap contém somente URLs do domínio oficial;
- [ ] Search Console consegue ler o sitemap;
- [ ] páginas de clima, águas, alertas e câmeras respondem normalmente;
- [ ] não há falhas de hidratação, console ou overflow horizontal.

## Search Console

Após uma publicação relevante:

1. manter somente a propriedade oficial como referência operacional;
2. enviar `https://tempopelotas.com.br/sitemap.xml`;
3. inspecionar a Home e as páginas prioritárias;
4. solicitar indexação somente quando canonical e resposta HTTP estiverem corretos;
5. acompanhar páginas duplicadas, host alternativo e canonical escolhido pelo Google.

## Rollback

Se houver falha crítica:

1. restaurar a origem de infraestrutura ou os registros DNS anteriores;
2. manter `tempopelotas.com.br` como domínio público e canônico;
3. não publicar host de preview como alternativa;
4. preservar caminhos, redirects e metadados;
5. corrigir diretamente na `main` em mudança pequena e exigir `Qualidade` e smoke sem falhas de aplicação antes da próxima publicação.

O rollback deve alterar a infraestrutura, não a identidade pública do portal.
