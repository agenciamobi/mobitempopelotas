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
5. corrigir em branch isolada e exigir todos os workflows verdes antes de uma nova publicação.

O rollback deve alterar a infraestrutura, não a identidade pública do portal.
