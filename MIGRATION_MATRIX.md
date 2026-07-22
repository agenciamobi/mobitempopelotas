# Matriz completa de migração — Tempo Pelotas

Inventário comparativo entre:

- **Origem:** `_legacy/`, snapshot de `agenciamobi/tempopelotas@main`, commit `05cd2d268ad25c070718ecc170bd30e8ad181341`;
- **Destino:** implementação nativa em `src/`, com TanStack Start, TanStack Router, React 19, Vite, Nitro e Supabase externo.

## Legenda

- **Migrado:** existe implementação nativa funcional no destino.
- **Parcial:** existe base funcional, mas sem paridade com a origem.
- **Não migrado:** existe somente no snapshot legado.
- **Revisar:** deve ser reavaliado antes de portar ou manter.
- **Descartar:** configuração específica do Next.js/Vercel que não deve ser portada.

## Resumo executivo

| Domínio | Estimativa atual | Situação |
| --- | ---: | --- |
| Fundação, rotas e layout básico | 55% | Estrutura TanStack pronta; identidade e navegação ainda sem paridade |
| Previsão meteorológica | 35% | Open-Meteo funcional; faltam fontes locais, alertas e sínteses |
| Home editorial | 15% | Home mínima funcional; hero e blocos avançados não migrados |
| Hidrologia | 0% | Todo o domínio ainda está no legado |
| Radar, satélite, trovoadas e mapas | 0% | REDEMET e MapLibre ainda não migrados |
| Câmeras | 0% | YouTube e contingências ainda não migrados |
| Supabase, histórico e autenticação | 5% | Somente adaptador mock e configuração pública |
| PWA, push e cron | 0% | Requer adaptação de runtime |
| SEO técnico | 15% | Metadados básicos presentes; endpoints e dados estruturados ausentes |
| Qualidade, observabilidade e LGPD | 5% | Build e typecheck funcionam; testes e governança pendentes |

**Percentual global aproximado de paridade funcional: 10% a 15%.**

## Bloqueadores principais

1. Separar rigorosamente código browser, código server-only e tarefas incompatíveis com o runtime Nitro adotado pelo Lovable.
2. Instalar e configurar o SDK do Supabase externo com clientes distintos para navegador e servidor, sem criar banco paralelo no Lovable Cloud.
3. Revisar migrations e RLS antes de ativar autenticação, histórico, snapshots ou push.
4. Portar MapLibre apenas no cliente, com carregamento dinâmico e proteção contra SSR.
5. Definir execução de cron e envio web-push em runtime compatível, provavelmente usando Supabase Edge Functions ou serviço externo.
6. Manter todas as secrets exclusivamente em server functions ou runtime de backend.

## Matriz operacional

| ID | Recurso | Status | Origem no snapshot | Destino atual ou planejado | Dependências / variáveis | Adaptação Next.js → TanStack Start/Nitro | Risco | Critério de aceite | Lote |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | ---: |
| 01 | Layout global e identidade | Parcial | `_legacy/app/layout.tsx`, `_legacy/app/globals.css`, CSS de tema | `src/routes/__root.tsx`, `src/components/layout/SiteLayout.tsx`, `src/styles.css` | Nenhuma | Converter metadata/viewport e consolidar CSS global em tokens/componentes | Médio | Identidade visual, container, tipografia, foco e estados globais equivalentes | 3 |
| 02 | Header desktop/mobile | Parcial | `_legacy/components/site-header.tsx` | `src/components/layout/Header.tsx` | Estado de alertas; futuramente sessão Supabase | Substituir `next/link`, adaptar navegação e estados ativos ao TanStack Router | Alto | Navegação funcional, acessível e responsiva, sem regressão de rotas | 3 |
| 03 | Megamenu novo | Não migrado | `_legacy/components/site-header.tsx`, `_legacy/app/header-megamenu-v25.css` | `src/components/layout/Header.tsx` ou componente `MegaMenu.tsx` | Alertas e autenticação opcionais | Reimplementar interação, foco, `Escape`, clique externo e painel flutuante sem CSS legado cumulativo | Alto | Um painel por vez, teclado completo, desktop estável e mobile separado | 3 |
| 04 | Footer editorial | Parcial | `_legacy/components/site-footer.tsx`, `_legacy/app/footer-*.css` | `src/components/layout/Footer.tsx` | Rotas existentes | Migrar grupos e links, removendo redundâncias do legado | Baixo | Todos os destinos válidos, fontes e créditos corretos, mobile consistente | 3 |
| 05 | Home base | Parcial | `_legacy/app/page.tsx` | `src/routes/index.tsx`, `src/components/weather/WeatherHome.tsx` | Contratos meteorológicos | Loader SSR já existe; falta composição editorial completa | Alto | Home usa somente dados reais e possui todos os blocos prioritários | 3 |
| 06 | Hero meteorológico dinâmico | Não migrado | `_legacy/components/weather-hero.tsx`, CSS do hero | `src/components/weather/WeatherHero.tsx` | Open-Meteo, CPPMet, INMET, Gemini opcional | Adaptar agregação server-side e remover dependências de componentes Next | Alto | Título dinâmico coerente, descrição CPPMet, métricas previstas e fallback seguro | 3 |
| 07 | Previsão atual Open-Meteo | Migrado | `_legacy/lib/weather-service.ts`, `_legacy/lib/weather-data.ts` | `src/lib/weather/open-meteo.server.ts`, `weather.functions.ts`, `types.ts` | API pública Open-Meteo | Já adaptada para server function, timeout, cache e Zod | Baixo | Resposta validada, cache, timeout e indisponibilidade explícita | 2 |
| 08 | Página “Hoje” | Parcial | `_legacy/app/tempo-hoje-pelotas/page.tsx` | `src/routes/tempo-hoje-pelotas.tsx` | Contrato unificado de previsão | Substituir placeholder por loader e componentes nativos | Médio | Hora a hora, chuva, vento e métricas do dia usando contrato compartilhado | 3 |
| 09 | Página “Amanhã” | Não migrado | `_legacy/app/tempo-amanha-pelotas/page.tsx` | `src/routes/tempo-amanha-pelotas.tsx` | Open-Meteo, síntese determinística/Gemini | Criar rota TanStack e preservar destaque visual sem CSS frágil | Médio | Página indexável com previsão, destaque e fallback sem “síntese indisponível” | 3 |
| 10 | Tendência e destaque de amanhã na Home | Não migrado | CSS `home-tomorrow-focus-v25.css`, componentes editoriais | `WeatherHome.tsx` ou `ForecastTrend.tsx` | Dados diários | Identificar amanhã por dados, não por data fixa ou seletor frágil | Médio | Primeiro dia destacado automaticamente e resumo abaixo responsivo | 3 |
| 11 | Página “7 dias” | Parcial | `_legacy/app/previsao-7-dias-pelotas/page.tsx` | `src/routes/previsao-7-dias-pelotas.tsx` | Open-Meteo | Rota existe como placeholder; reutilizar contratos SSR | Baixo | Sete dias completos, sem duplicação de copy, links e metadados próprios | 3 |
| 12 | Chuva e vento | Parcial | páginas e componentes do legado | `src/routes/chuva-em-pelotas.tsx`, `vento-em-pelotas.tsx` | Open-Meteo | Substituir placeholders por visões temáticas | Médio | Probabilidade, volume, períodos críticos, direção e rajadas coerentes | 3 |
| 13 | Observação Embrapa | Não migrado | `_legacy/lib/embrapa-observation.ts`, API e página Embrapa | `src/lib/weather/embrapa.server.ts`, server function e rota | Fonte pública Embrapa | Portar parser, timeout e validação de atualidade; sem números fictícios | Alto | Medição local rotulada, timestamp original e descarte de dado atrasado conforme regra definida | 2 |
| 14 | Alertas INMET | Não migrado | `_legacy/lib/inmet-alerts.ts`, API, painel e `/alertas` | `src/lib/weather/inmet.server.ts`, server function, componentes e rota | Fonte oficial INMET | Portar parser e filtro geográfico; cache controlado | Alto | Apenas alertas aplicáveis a Pelotas, severidade, vigência e fonte explícitas | 2 |
| 15 | CPPMet/UFPel | Não migrado | `_legacy/lib/cppmet-forecast.ts`, `/api/weather/cppmet` | `src/lib/weather/cppmet.server.ts` | Site público CPPMet/UFPel | Substituir route handler Next por server function, sanitizar HTML e manter fingerprint | Alto | Texto do meteorologista no hero, atribuição e falha silenciosa segura | 2 |
| 16 | Defesa Civil — banners preventivos | Não migrado | `_legacy/lib/safety-banners.ts`, `safety-alerts.tsx`, CSS | `src/lib/safety-banners.ts`, componente Home e seção `/alertas` | Links oficiais, SMS 40199, WhatsApp | Conteúdo editorial local; não transformar artigo em alerta ativo | Médio | Canais oficiais, dismiss por sessão, prioridade abaixo de alerta vigente | 3 |
| 17 | Gemini — resumo meteorológico | Não migrado | `_legacy/lib/weather-ai-summary.ts`, componente e CSS | `src/lib/weather/gemini-summary.server.ts` | `GEMINI_API_KEY`, `GEMINI_MODEL` | Chamada somente no servidor; resposta estruturada, timeout e parser tolerante | Alto | JSON válido, cache, fallback determinístico e nenhuma chave no cliente | 2 |
| 18 | Insights e regras editoriais | Não migrado | `_legacy/lib/weather-insights.ts` | `src/lib/weather/insights.ts` | Contratos normalizados | Portar funções puras, sem acoplamento visual | Médio | Chips, títulos e prioridades reproduzíveis por testes unitários | 2 |
| 19 | REDEMET — cliente server-side | Não migrado | `_legacy/lib/redemet.ts`, `redemet-types.ts`, `redemet-last-good.ts` | `src/lib/redemet/*.server.ts` | `REDEMET_API_KEY`, base URL, área `cn`, produto `maxcappi` | Trocar API routes Next por server functions/rotas Nitro; validar streaming e cache | Alto | Chave privada, schemas válidos, timeout, último quadro e logs sanitizados | 5 |
| 20 | REDEMET — radar de Canguçu | Não migrado | rotas `/api/redemet/radar` e `/image` | server route + componente de mapa | REDEMET | Proxy com allowlist, limite de tamanho e bounds geográficos | Alto | MaxCAPPI animado, horário, opacidade, legenda e fallback | 5 |
| 21 | REDEMET — satélite | Não migrado | `/api/redemet/satellite` | server function + mapa | REDEMET | Normalizar URLs relativas e tipos de produto | Médio | Realçado, infravermelho e visível com timeline e atribuição | 5 |
| 22 | REDEMET — trovoadas STSC | Não migrado | `/api/redemet/storms` | server function + camada MapLibre | REDEMET | Validar coordenadas, deduplicar e filtrar raio regional | Alto | Pontos regionais com recência, sem converter monitoramento em alerta oficial | 5 |
| 23 | MapLibre e mapa regional | Não migrado | `_legacy/components/weather-map.tsx`, CSS/module | `src/components/maps/RegionalWeatherMap.tsx` | `maplibre-gl` | Importação client-only, `ClientOnly`/lazy e nenhuma execução no SSR | Alto | Sem erro de hidratação, responsivo, teclado e tela cheia | 5 |
| 24 | Google Maps | Revisar | Somente variáveis e referências no legado | Nenhum consumo atual | chaves Maps públicas/servidor | Não portar enquanto não houver caso de uso aprovado | Baixo | Chaves restritas ou removidas; integração somente se necessária | 9 |
| 25 | Câmera do Laranjal / YouTube | Não migrado | `weather-cameras.ts`, `youtube-latest-stream.ts`, APIs e página | `src/lib/cameras/*.server.ts`, rota e componente | `YOUTUBE_API_KEY`, handle e ID manual opcional | API como primária; descoberta pública e ID manual como contingência | Alto | Live reconhecida, replay separado, embed nocookie e diagnóstico sem secrets | 5 |
| 26 | Hidrologia — Laranjal | Não migrado | `laranjal-level.ts`, API, página e cards | `src/lib/hydrology/laranjal.server.ts`, rota e componentes | telemetria UFPel/ThingsBoard | Portar fetch server-side, cache e série; não definir cota própria | Alto | Nível, timestamp, tendência recente e fonte; indisponibilidade explícita | 4 |
| 27 | Regras semânticas de níveis | Não migrado | `_legacy/lib/water-level-state.ts`, CSS de cores | `src/lib/hydrology/water-level-state.ts` | Cota opcional por estação | Função pura central: vermelho na cota, laranja subindo, ciano baixando, neutro demais | Médio | Mesma regra em números, tags, bordas e gráficos, sem depender apenas da cor | 4 |
| 28 | Rede CCMAR/FURG/Portos RS | Não migrado | `lagoon-monitoring-network.ts`, componentes e API | `src/lib/hydrology/lagoon-network.server.ts` | fontes FURG/Portos RS | Portar cálculo com janelas temporais tolerantes e controle de atraso | Alto | Estado atualizado/atrasado, cotas da fonte, variações confiáveis e sem faixa própria de atenção | 4 |
| 29 | Guaíba e cidades regionais | Não migrado | `guaiba-monitor.ts`, `nivel-guaiba-*.ts`, APIs e card | `src/lib/hydrology/guaiba*.server.ts` | fontes públicas regionais | Portar normalização e cotas específicas; separar referências entre cidades | Alto | Porto Alegre e cidades com timestamps, tendências e referências corretas | 4 |
| 30 | Página de situação hidrológica | Não migrado | `_legacy/app/situacao-hidrologica-pelotas/page.tsx` | `src/routes/situacao-hidrologica-pelotas.tsx` | Todos os serviços hidrológicos | Substituir placeholder e compor múltiplas fontes sem bloquear a página | Alto | Laranjal, rede da Lagoa e Guaíba com metodologias e fontes claras | 4 |
| 31 | Histórico climático | Não migrado | `weather-history*.ts`, API, gráficos e página | `src/lib/weather/history.server.ts`, rota e charts | Supabase externo | Portar consultas e gráficos; definir retenção e agregação | Alto | Séries reais, timezone consistente, estados vazios e fonte documentada | 6 |
| 32 | Snapshots meteorológicos | Não migrado | `weather-snapshot-store.ts`, cron e migration | server function/Edge Function + Supabase | `CRON_SECRET`, service role | Garantir idempotência, chave única e execução compatível | Alto | Snapshot periódico sem duplicação, logs e recuperação de falhas | 6 |
| 33 | Supabase — cliente browser/server | Parcial | libs Supabase do legado | `src/lib/supabase/*` atualmente mock | URL, publishable key, service role server-only | Instalar SDK e separar clientes; nunca expor service role | Alto | Sessão browser funcional, operações server seguras e modo mock removível | 6 |
| 34 | Banco, migrations e RLS | Não migrado | `_legacy/supabase/migrations/*` | Supabase externo oficial | acesso ao projeto Supabase | Revisar SQL antes de aplicar; não usar banco paralelo | Crítico | Migrations versionadas, RLS habilitada, policies testadas e rollback documentado | 6 |
| 35 | Login Google e conta | Não migrado | `/auth/*`, `/entrar`, `/minha-conta`, componentes de auth | rotas TanStack e componentes nativos | Supabase Auth com provider Google | Adaptar callback, cookies/sessão SSR e redirects | Alto | Login, logout, callback, conta e proteção de dados funcionando | 7 |
| 36 | APIs internas e diagnóstico | Não migrado | `_legacy/app/api/**`, `/api/integrations/status` | `createServerFn` e `src/routes/api/public/*` | variáveis de cada integração | Classificar RPC interno versus endpoint público; padronizar respostas | Alto | Status distingue configurado/operacional sem vazar secrets | 2–8 |
| 37 | Cron | Não migrado | `/api/cron/push-daily`, `/api/cron/weather-snapshot` | rotas públicas assinadas ou Edge Functions | `CRON_SECRET`, `PUSH_ADMIN_SECRET` | Substituir Vercel Cron por scheduler compatível | Alto | Assinatura, idempotência, logs e execução observável | 8 |
| 38 | Web push | Não migrado | `web-push-service.ts`, subscription store, APIs | Supabase Edge Function ou runtime Node compatível | VAPID public/private, subject | `web-push` pode ser incompatível com runtime; evitar service role no navegador | Crítico | Subscribe/unsubscribe, envio real, expiração e limpeza de inscrições | 8 |
| 39 | PWA e offline | Não migrado | `manifest.ts`, `public/sw.js`, `pwa-manager.tsx`, `/offline` | manifest estático/dinâmico, SW Vite e rota | VAPID opcional | Reescrever integração Next; definir atualização segura do SW | Alto | Instalável, offline controlado, atualização sem cache quebrado | 8 |
| 40 | Sitemap | Não migrado | `_legacy/app/sitemap.ts` | `src/routes/sitemap[.]xml.ts` ou server route equivalente | lista canônica de rotas | Gerar XML com headers e datas confiáveis | Médio | Todas as URLs públicas canônicas, sem rotas privadas ou duplicadas | 9 |
| 41 | Robots | Não migrado | `_legacy/app/robots.ts` | `src/routes/robots[.]txt.ts` | URL de produção | Gerar texto no runtime ou arquivo público | Baixo | Sitemap referenciado e regras corretas por ambiente | 9 |
| 42 | Canonicals | Parcial | metadata das páginas Next | `head()` das rotas TanStack | `SITE_URL` | Centralizar URL absoluta e evitar canonicals de preview | Médio | Toda rota indexável possui canonical único de produção | 9 |
| 43 | Open Graph e Twitter Cards | Parcial | metadata e assets do legado | `head()` + assets em `public/` | URL pública e imagem social | Adaptar metadata por rota | Médio | Título, descrição, imagem, dimensões e URL corretos | 9 |
| 44 | Schema.org | Não migrado | JSON-LD espalhado no legado | helpers e scripts por rota | dados meteorológicos e organização | Validar tipos WebSite, Organization, BreadcrumbList e Dataset/Weather quando aplicável | Médio | JSON-LD válido sem alegações indevidas ou dados inventados | 9 |
| 45 | `pelotas.json`, feed e transparência | Não migrado | `/pelotas.json`, `/feed`, metodologia | rotas públicas Nitro | contratos agregados | Definir cache, content-type e versão do schema | Médio | JSON estável, feed válido e documentação das fontes | 9 |
| 46 | PageSpeed API | Revisar | variável disponível, sem consumo funcional | Ferramenta administrativa futura | `GOOGLE_PAGESPEED_API_KEY` | Não incluir na experiência pública sem caso de uso | Baixo | Remover chave desnecessária ou criar diagnóstico restrito | 10 |
| 47 | Acessibilidade | Revisar | skip link, ARIA e semântica em componentes legados | todos os componentes migrados | Nenhuma | Preservar foco, teclado, contraste e informação além da cor | Alto | WCAG 2.2 AA nos fluxos principais e testes de teclado | Contínuo |
| 48 | Responsividade | Revisar | dezenas de CSS `mobile-*` e refinamentos | Tailwind e CSS por componente | Nenhuma | Não copiar cascata cumulativa; reconstruir mobile-first | Alto | 320 px a desktop sem overflow, cortes ou colunas comprimidas | Contínuo |
| 49 | Observabilidade | Não migrado | logs pontuais no legado | logger server-side e endpoint de saúde | provedores futuros | Sanitizar erros e correlation IDs; nunca registrar secrets | Médio | Falhas de fontes rastreáveis, métricas básicas e logs úteis | 10 |
| 50 | Segurança e LGPD | Revisar | práticas parciais no legado | políticas, consentimento e controles no novo app | Supabase/Auth/push | Revisar coleta, retenção, cookies, conta e exclusão de dados | Crítico | Avisos claros, mínimo de dados, direitos do titular e secrets protegidas | 7–10 |
| 51 | Testes | Não migrado | diagnóstico Windy e validações manuais | Vitest, testes de contratos e smoke tests | ferramentas de teste | Testar funções puras e parsers sem depender sempre de APIs externas | Alto | Cobertura de normalização, estados de erro e rotas críticas | 10 |
| 52 | Build, lint e typecheck | Parcial | workflows do legado | `.github/workflows/quality.yml` do novo projeto | Node/Bun conforme lockfile | Padronizar ordem build → typecheck → lint | Médio | Três comandos passam em ambiente limpo e CI fornece logs | 10 |
| 53 | Deploy e domínio | Parcial | Vercel/Next (`vercel.json`, `next.config.ts`) | Lovable hosting/TanStack Start | secrets e domínio | Descartar config Vercel; validar runtime, headers, cache e redirects | Crítico | Preview validado, paridade funcional, DNS com rollback e zero perda SEO | 10 |

## Recursos desenvolvidos após o snapshot anterior e confirmados no novo `_legacy/`

- REDEMET: radar de Canguçu, satélite, trovoadas, proxy de imagens e último quadro válido;
- CPPMet/UFPel integrado ao hero;
- banners educativos da Defesa Civil;
- fallback da câmera do Laranjal via página pública e ID manual;
- regra semântica centralizada para cores dos níveis;
- auditoria da rede CCMAR/FURG/Portos RS;
- diagnóstico sanitizado das integrações;
- novo header com megamenu;
- página, resumo e destaque visual de amanhã;
- autenticação Google via Supabase e área “Minha conta”;
- sínteses meteorológicas com Gemini e fallback determinístico.

## Sequência de execução recomendada

1. **Lote 2 — Fontes meteorológicas:** Embrapa, INMET, CPPMet, insights e Gemini, com contratos e testes.
2. **Lote 3 — Home e páginas de previsão:** hero, alertas, Defesa Civil, Hoje, Amanhã, 7 dias, chuva e vento.
3. **Lote 4 — Hidrologia:** Laranjal, regra semântica, CCMAR/FURG/Portos RS, Guaíba e situação hidrológica.
4. **Lote 5 — REDEMET, mapas e câmeras:** cliente server-side, radar, satélite, STSC, MapLibre e YouTube.
5. **Lote 6 — Supabase e histórico:** clientes reais, migrations/RLS, snapshots e histórico climático.
6. **Lote 7 — Autenticação e LGPD:** Google, conta, sessão SSR, privacidade e direitos do usuário.
7. **Lote 8 — PWA, push e cron:** manifest, service worker, inscrições, envio e scheduler.
8. **Lote 9 — SEO e transparência:** sitemap, robots, canonicals, OG, Schema, JSON, feed e metodologia.
9. **Lote 10 — Qualidade e corte:** testes, acessibilidade, performance, observabilidade, segurança, deploy, DNS e rollback.

## Regra de atualização

Ao concluir cada lote, atualizar o status e o critério de aceite desta matriz com evidência nos arquivos de `src/`. A presença de um arquivo em `_legacy/` nunca deve ser considerada implementação concluída.
