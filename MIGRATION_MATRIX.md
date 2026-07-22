# Matriz de Migração — Tempo Pelotas

Inventário comparativo entre a origem em `_legacy/` (Next.js 16, commit
`05cd2d26`, 2026-07-22) e a implementação nativa em `src/` (TanStack Start).

Legenda de status: **Migrado** · **Parcial** · **Não migrado** · **Revisar** · **Descartar**.

## Resumo executivo

| Domínio | Migrado | Parcial | Não migrado |
| --- | --- | --- | --- |
| Layout, header, footer, navegação | ~60% | header sem megamenu novo, sem estados de alerta | — |
| Home (hero + editorial) | ~15% | apenas previsão Open-Meteo | dashboard editorial, hero CPPMet, banners, alertas |
| Camada meteorológica (Open-Meteo) | ~40% | forecast base | Embrapa, INMET, CPPMet, insights, cameras, radar |
| Hidrologia (Laranjal, Guaíba, Lagoon Network) | 0% | — | tudo |
| REDEMET (radar/satélite/trovoadas) | 0% | — | tudo |
| Câmeras / YouTube | 0% | — | tudo |
| Histórico climático + snapshots Supabase | 0% | — | tudo |
| Autenticação Supabase/Google | 0% | — | tudo |
| APIs internas / cron / push / PWA | 0% | — | tudo |
| SEO técnico (sitemap, robots, feed, JSON-LD, OG dinâmico) | ~10% | metas básicas | sitemap, robots, feed, pelotas.json, schema.org |
| Rotas internas (placeholders vs. conteúdo real) | ~5% | 10 rotas placeholder criadas | conteúdo real de todas elas |
| Observabilidade, LGPD, testes, deploy | 0% | — | tudo |

**Percentual global aproximado migrado: ~10%.**

### Novidades da origem em relação ao snapshot anterior deste projeto

Explicitamente presentes em `_legacy/` e ausentes de `src/`:

- **REDEMET/DECEA**: `lib/redemet.ts`, `redemet-last-good.ts`, `redemet-types.ts` e rotas `app/api/redemet/{radar,satellite,storms,image}`.
- **CPPMet/UFPel no hero**: `lib/cppmet-forecast.ts`, `app/api/weather/cppmet` e integração no `weather-hero.tsx`.
- **Banners Defesa Civil / alertas de segurança**: `lib/safety-banners.ts`, `components/safety-alerts.tsx`, CSS dedicados.
- **Fallback de câmera do Laranjal**: `lib/youtube-latest-stream.ts` + rotas `app/api/cameras/*`.
- **Regras semânticas de níveis de água**: `lib/water-level-state.ts`, `home-editorial-dashboard-semantic.tsx`.
- **Auditoria CCMAR/FURG e diagnóstico de integrações**: `app/api/integrations/status`, docs em `_legacy/docs/`.
- **Novo header + megamenu**: `site-header.tsx` reformulado, `header-megamenu-v25.css`, `header-auth-portal.tsx`.
- **Ajustes da rota Amanhã**: `app/tempo-amanha-pelotas/page.tsx`.
- **Login Google e área "Minha conta"**: `app/auth/*`, `app/entrar`, `app/minha-conta`, `components/google-login-card.tsx`, `components/auth-account-action.tsx`.
- **Resumo IA com Gemini**: `lib/weather-ai-summary.ts`, `components/weather-ai-summary.tsx`.

### Bloqueadores e dependências críticas

1. **Runtime Worker**: várias libs em `_legacy/` assumem Node completo (`web-push`, `maplibre-gl` server-side, `fs.watch`, `child_process`). Cada porta precisa validar compatibilidade com Cloudflare Workers (ver `<server-runtime>`).
2. **Supabase externo oficial**: SDK real ainda não instalado; toda a persistência (snapshots, push subscriptions, auth) depende disso.
3. **Segredos**: REDEMET, Gemini, VAPID, YouTube, Supabase service role — armazenados no projeto Lovable, mas devem ser lidos somente em server functions.
4. **PWA**: `next-pwa`/service worker precisa ser reescrito em cima do Vite plugin (`vite-plugin-pwa` ou service worker manual).
5. **Cron**: `app/api/cron/*` do Next → server routes em `src/routes/api/public/*` com verificação de segredo.

### Sequência de lotes recomendada

1. **Lote 2 — Camada meteorológica completa**: portar Embrapa, INMET, CPPMet e insights; consolidar contratos em `src/lib/weather/`.
2. **Lote 3 — Home real**: `home-editorial-dashboard` + `weather-hero` + `safety-alerts` + INMET panel.
3. **Lote 4 — Hidrologia**: Laranjal, Guaíba, rede de monitoramento da Lagoa.
4. **Lote 5 — REDEMET + Câmeras + Mapas** (após avaliar MapLibre no Worker).
5. **Lote 6 — Supabase externo real**: cliente browser/server, migrations, RLS, snapshots e histórico.
6. **Lote 7 — Auth Google + Minha conta**.
7. **Lote 8 — Cron, push, PWA**.
8. **Lote 9 — SEO técnico** (sitemap, robots, feed, pelotas.json, JSON-LD, OG dinâmico) + a11y + performance.
9. **Lote 10 — Observabilidade, testes, deploy** e remoção de `_legacy/`.

---

## Inventário detalhado

Formato de cada linha: **Status | Origem → Destino | Deps/env | Incompat. Next→TanStack | Risco | Aceite | Lote**.

### Layout e identidade
- **Parcial** — `_legacy/app/layout.tsx`, `app/globals.css` e ~60 CSS de tema → `src/routes/__root.tsx`, `src/styles.css`. Deps: nenhum. Incompat: `metadata`/`viewport` do Next não existem (usar `head()` em cada rota). Risco: médio (perda de tokens). Aceite: tokens principais e reset presentes; head raiz com lang/theme-color. Lote: 3.
- **Não migrado** — 60+ arquivos CSS temáticos (`home-editorial-*.css`, `mobile-*.css`, `theme-*.css`, `footer-*.css`, `header-megamenu-v25.css`, `home-cppmet-layout-water-audit.css`, `inmet-alerts.css`). Aceite: consolidar em módulos por componente ou `styles.css`. Lote: 3.

### Header e megamenu
- **Parcial** — `_legacy/components/site-header.tsx` (+ `header-auth-portal.tsx`, `header-megamenu-v25.css`) → `src/components/layout/Header.tsx`. Incompat: menu com dados de sessão (Supabase Auth) e estados de alerta agregando INMET/Defesa Civil. Risco: alto (UX central). Aceite: megamenu com as mesmas categorias, estados de alerta e portal de autenticação. Lote: 3 (visual) + 7 (auth).

### Footer
- **Parcial** — `_legacy/components/site-footer.tsx` + `footer-*.css` → `src/components/layout/Footer.tsx`. Incompat: links dinâmicos por rota. Aceite: mesmas seções e links do original. Lote: 3.

### Home
- **Parcial** — `_legacy/app/page.tsx`, `components/home-editorial-dashboard.tsx`, `home-editorial-dashboard-semantic.tsx`, `weather-hero.tsx`, `home-section-navigation.tsx`, `safety-alerts.tsx`, `inmet-alerts-panel.tsx` → `src/routes/index.tsx`, `src/components/weather/WeatherHome.tsx`. Deps: quase todos os libs meteorológicos e hidrológicos. Aceite: hero + dashboard editorial + banners de segurança + INMET, todos ligados a contratos reais. Lote: 3.

### Previsão do tempo
- **Migrado (base)** — Open-Meteo: `_legacy/lib/weather-service.ts`, `weather-data.ts` → `src/lib/weather/open-meteo.server.ts`, `weather.functions.ts`, `types.ts`. Aceite atual: previsão atual + horária + 7 dias em `WeatherHome`.
- **Não migrado** — Embrapa: `_legacy/lib/embrapa-observation.ts` + `app/api/weather/embrapa` + `estacao-embrapa-pelotas/page.tsx` + `components/embrapa-observation-overview.tsx`. Aceite: observação recente com validação de atualidade (≤ 2h). Lote: 2.
- **Não migrado** — INMET: `_legacy/lib/inmet-alerts.ts`, `app/api/alerts/inmet`, `app/alertas/page.tsx`, `components/inmet-alerts-panel.tsx`. Deps: XML/RSS INMET. Aceite: alertas atuais com filtro Pelotas + severidade. Lote: 2.
- **Não migrado** — CPPMet/UFPel: `_legacy/lib/cppmet-forecast.ts`, `app/api/weather/cppmet`. Aceite: painel CPPMet no hero. Lote: 2.
- **Não migrado** — Insights e AI summary: `_legacy/lib/weather-insights.ts`, `weather-ai-summary.ts`, `components/weather-ai-summary.tsx`. Deps: `GEMINI_API_KEY`. Aceite: resumo do dia com fallback textual. Lote: 2/6.
- **Não migrado (conteúdo)** — Rotas `tempo-hoje-pelotas`, `tempo-amanha-pelotas`, `previsao-7-dias-pelotas`, `chuva-em-pelotas`, `vento-em-pelotas` estão como placeholders. Lote: 3.

### Hidrologia
- **Não migrado** — Laranjal: `_legacy/lib/laranjal-level.ts` + `app/api/hydrology/laranjal` + `nivel-da-lagoa-dos-patos-laranjal/page.tsx` + `components/laranjal-level-card.tsx`. Aceite: nível atual + tendência + alerta operacional. Lote: 4.
- **Não migrado** — Guaíba: `_legacy/lib/guaiba-monitor.ts`, `nivel-guaiba-cities.ts`, `nivel-guaiba-regional.ts`, `app/api/hydrology/guaiba*`, `components/guaiba-level-card.tsx`. Lote: 4.
- **Não migrado** — Rede Lagoa dos Patos (CCMAR/FURG/Portos RS): `_legacy/lib/lagoon-monitoring-network.ts`, `lagoon-level.ts`, `hydrology.ts`, `app/api/hydrology/lagoon-network`, `components/lagoon-*`, `pelotas-hydrology-widget*`. Deps: auditoria CCMAR/FURG. Lote: 4.
- **Não migrado** — `water-level-state.ts` (semântica de níveis) e `situacao-hidrologica-pelotas/page.tsx`. Lote: 4.

### REDEMET / radar / satélite / trovoadas
- **Não migrado** — `_legacy/lib/redemet.ts`, `redemet-last-good.ts`, `redemet-types.ts`, `app/api/redemet/{radar,satellite,storms,image}`, `components/weather-map.tsx`, `weather-radar.ts`. Deps: `REDEMET_API_KEY`. Incompat: proxy de imagens grande; avaliar streaming no Worker. Risco: alto. Lote: 5.

### Câmeras / YouTube
- **Não migrado** — `_legacy/lib/weather-cameras.ts`, `youtube-latest-stream.ts`, `app/api/cameras/*`, `app/cameras-ao-vivo-pelotas/page.tsx`, `components/weather-camera-explorer.tsx`. Deps: `YOUTUBE_API_KEY`. Aceite: exibir live + fallback para gravação. Lote: 5.

### Histórico climático + snapshots Supabase
- **Não migrado** — `_legacy/lib/weather-history*.ts`, `weather-snapshot-store.ts`, `app/api/weather/history`, `app/historico-climatico-pelotas/page.tsx`, `components/weather-history-chart.tsx`, `weather-trend-chart.tsx`. Deps: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Incompat: chamadas fetch diretas ao PostgREST — reusar client server. Lote: 6.

### Mapas
- **Não migrado** — `maplibre-gl` no legado (`weather-map.tsx`). Incompat: import só em client (`<ClientOnly>` + `React.lazy`). Lote: 5.

### Gemini (IA)
- **Não migrado** — `_legacy/lib/weather-ai-summary.ts`. Deps: `GEMINI_API_KEY`. Aceite: chamada server-only com timeout e fallback estático. Lote: 2/6.

### Autenticação Supabase/Google
- **Não migrado** — `_legacy/app/auth/*`, `app/entrar`, `app/minha-conta`, `components/google-login-card.tsx`, `header-auth-portal.tsx`, `auth-account-action.tsx`. Deps: Supabase publishable + Google OAuth. Incompat: callbacks do Next → server routes `src/routes/api/public/auth/*`. Lote: 7.

### Banco / RLS
- **Não migrado** — `_legacy/supabase/migrations/*` (snapshots meteorológicos, subscriptions push). Aceite: revisar e aplicar no Supabase externo oficial (não criar Lovable Cloud). Lote: 6.

### APIs internas
- **Não migrado** — `_legacy/app/api/**` (weather, hydrology, redemet, cameras, alerts, integrations/status, push, cron, pelotas.json, feed). Cada uma vira `createServerFn` (RPC interno) ou rota em `src/routes/api/public/*` (webhooks/cron/feed público). Lote: 2–8 conforme domínio.

### Cron
- **Não migrado** — `_legacy/app/api/cron/{push-daily,weather-snapshot}`. Deps: `PUSH_ADMIN_SECRET` + secret cron. Incompat: sem `vercel.json cron`; usar scheduler externo apontando para `/api/public/...`. Lote: 8.

### Push / PWA
- **Não migrado** — `_legacy/lib/web-push-service.ts`, `push-subscription-store.ts`, `app/api/push/*`, `components/pwa-manager.tsx`, `public/sw.js`, `app/manifest.ts`, `app/offline/page.tsx`. Deps: VAPID keys. Incompat: `web-push` requer Node crypto — verificar suporte no Worker; alternativa: enviar via edge function externa. Lote: 8.

### SEO técnico
- **Parcial** — metas por rota. Faltando:
  - Sitemap (`_legacy/app/sitemap.ts`)
  - Robots (`_legacy/app/robots.ts`)
  - Canonicals dinâmicos
  - Open Graph completo com imagens
  - `application/ld+json` (WebSite, BreadcrumbList, WeatherReport)
  - `_legacy/app/pelotas.json/route.ts` (endpoint de dados agregados)
  - `_legacy/app/feed/route.ts` (RSS/Atom)
  Lote: 9.

### Acessibilidade
- **Revisar** — origem tem `id="conteudo-principal" tabIndex={-1}`, links skip, ARIA em cards. Migrar junto de cada componente. Lote: 3+.

### Responsividade
- **Revisar** — muitos CSS `mobile-*.css`. Consolidar com Tailwind + breakpoints por componente. Lote: 3.

### Observabilidade
- **Não migrado** — nenhum sistema estruturado no legado; oportunidade de introduzir logs padronizados no Worker. Lote: 10.

### Segurança / LGPD
- **Revisar** — legado não tem página de política; auth com Google exige aviso LGPD e consentimento. Lote: 7/10.

### Testes
- **Não migrado** — legado tem apenas `scripts/windy-stations-diagnostic.mjs`. Introduzir Vitest para libs meteorológicas/hidrológicas. Lote: 10.

### Deploy
- **Descartar** — `_legacy/vercel.json`, `next.config.ts`, `proxy.ts`. Substituídos pela configuração Cloudflare/TanStack Start deste projeto. Lote: 10.
