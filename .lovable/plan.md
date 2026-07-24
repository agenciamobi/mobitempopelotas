## Auditoria pública somente-leitura — tempopelotas.com.br

Objetivo: coletar evidências objetivas do domínio oficial após o último deploy, sem editar código, publicar ou expor segredos.

### Escopo
Testar via `curl` (HTTP/headers/JSON) e Playwright headless (renderização + labels de fonte) as rotas:

- Páginas: `/`, `/metodologia`, `/radar-e-satelite-pelotas`, `/situacao-hidrologica-pelotas`, `/entrar`
- Recursos: `/robots.txt`, `/sitemap.xml`, `/pelotas.json`, `/feed`
- APIs: `/api/redemet/radar?frames=2`, `/api/redemet/satellite?type=realcada&frames=2`, `/api/redemet/storms?frames=2`, `/api/push/config`

### Procedimento
1. `curl -sS -o body -D headers` em cada rota → registrar status HTTP, `content-type`, `cache-control`.
2. Para respostas JSON (`/pelotas.json`, `/feed`, `/api/redemet/*`, `/api/push/config`): extrair `provider`, `configured`, `available`, `schema_version` quando presentes.
3. Varrer todos os corpos por marcadores sensíveis (`REDEMET_API_KEY`, `GEMINI_API_KEY`, `GOOGLE_OAUTH_CLIENT_SECRET`, `LOVABLE_API_KEY`, `SUPABASE_SECRET`, `process.env.`, stack traces) — reportar apenas presença/ausência.
4. Playwright em `/` e `/metodologia` (1440x900):
   - Confirmar que "condições atuais" trazem rótulo Embrapa.
   - Confirmar que previsão horária/diária traz rótulo Open-Meteo ou MET Norway.
   - Capturar screenshots em `/tmp/browser/audit/`.
5. Confirmar canonical = `https://tempopelotas.com.br/...` nas páginas HTML.
6. Nenhum POST, nenhum login, nenhuma chamada destrutiva.

### Entregáveis
Uma tabela final com: rota | HTTP | content-type | provider/configured/available (quando JSON) | rótulo de fonte visível (quando página) | vazamento de segredos (sim/não). Screenshots das duas páginas renderizadas. Nenhum arquivo do projeto é alterado.
