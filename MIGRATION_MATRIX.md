# Matriz completa de migração — Tempo Pelotas

Inventário comparativo entre:

- **Origem:** `_legacy/`, snapshot de `agenciamobi/tempopelotas@main`, commit `05cd2d268ad25c070718ecc170bd30e8ad181341`;
- **Destino:** implementação nativa em `src/`, com TanStack Start, TanStack Router, React 19, Vite, Nitro e Supabase externo.

Entregas posteriores ao snapshot são conferidas diretamente no repositório de origem antes de cada lote.

## Legenda

- **Migrado:** existe implementação nativa funcional no destino.
- **Parcial:** existe base funcional, mas falta configuração externa, persistência ou validação final.
- **Não migrado:** existe somente no snapshot legado ou ainda não possui implementação funcional.
- **Revisar:** deve ser reavaliado antes de portar ou manter.
- **Descartar:** configuração específica do Next.js/Vercel que não deve ser portada.

## Resumo executivo

| Domínio | Estimativa atual | Situação |
| --- | ---: | --- |
| Fundação, rotas e layout | 95% | Arquitetura TanStack, identidade, header, megamenu, footer, acessibilidade básica e estados globais implementados |
| Previsão meteorológica | 95% | Open-Meteo, Embrapa, INMET, CPPMet, insights e síntese Gemini com fallback determinístico integrados |
| Home editorial | 95% | Hero, alertas, blocos editoriais, contingência e navegação orientada ao visitante implementados |
| Hidrologia | 90% | Laranjal, Lagoa dos Patos, rede regional, Guaíba, tendências e metodologia integrados; validação contínua das fontes permanece necessária |
| Radar, satélite, trovoadas e mapas | 90% | REDEMET e MapLibre implementados com configuração server-side e estados explícitos de indisponibilidade |
| Câmeras | 90% | YouTube, descoberta de live, replay, ID manual e contingências implementados |
| Supabase, histórico e autenticação | 30% | SDK, clientes separados e migrations iniciais versionados; histórico persistido, aplicação de RLS e autenticação ainda pendentes |
| PWA, push e cron | 45% | PWA e offline concluídos; snapshots agendados, web push e scheduler ainda pendentes |
| SEO técnico e transparência | 95% | Canonicals, Open Graph, Twitter Cards, sitemap, robots, Schema global, feed e endpoint público implementados |
| Qualidade, observabilidade e LGPD | 70% | CI, auditoria visual e tratamento de erros ativos; faltam testes unitários, auditorias finais e fluxos LGPD autenticados |

**Percentual global aproximado de paridade funcional: 80% a 85%.**

## Bloqueadores principais

1. Confirmar o projeto Supabase externo oficial, histórico de migrations e variáveis de ambiente antes de habilitar o modo externo.
2. Aplicar e testar RLS para perfis, preferências, snapshots e inscrições push com usuários anônimos e autenticados.
3. Implementar snapshots meteorológicos idempotentes e histórico climático real, sem recorrer a dados demonstrativos.
4. Adaptar autenticação Google, callback PKCE e sessão SSR ao TanStack Start/Nitro.
5. Definir runtime compatível para cron e envio web push, preferencialmente Supabase Edge Functions ou serviço externo controlado.
6. Concluir testes automatizados, WCAG 2.2 AA, Core Web Vitals, configuração de produção e plano de rollback.
7. Manter todas as secrets exclusivamente em módulos `*.server.ts`, server functions, rotas de servidor ou Edge Functions.

## Matriz operacional

| ID | Recurso | Status | Origem no snapshot | Destino atual ou planejado | Dependências / variáveis | Adaptação Next.js → TanStack Start/Nitro | Risco | Critério de aceite | Lote |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | ---: |
| 01 | Layout global e identidade | Migrado | `_legacy/app/layout.tsx`, `_legacy/app/globals.css`, CSS de tema | `src/routes/__root.tsx`, `src/components/layout/`, `src/production/`, `src/styles.css` | Nenhuma | Metadata e shell convertidos; CSS consolidado no tema editorial | Baixo | Identidade, container, tipografia, foco e estados globais consistentes | 3 |
| 02 | Header desktop/mobile | Migrado | `_legacy/components/site-header.tsx` | componentes de header em `src/components/` e `src/production/` | Estado de alertas; sessão futura | Navegação adaptada ao TanStack Router | Baixo | Navegação funcional, acessível e responsiva | 3 |
| 03 | Megamenu | Migrado | `_legacy/components/site-header.tsx`, CSS do megamenu | componentes nativos de navegação | Alertas e autenticação opcionais | Interação reconstruída sem cascata legada | Médio | Teclado, Escape, clique externo, desktop e mobile estáveis | 3 |
| 04 | Footer editorial | Migrado | `_legacy/components/site-footer.tsx`, CSS do footer | componentes de footer em `src/components/` e `src/production/` | Rotas existentes | Grupos e créditos reorganizados | Baixo | Links válidos, fontes corretas e mobile consistente | 3 |
| 05 | Home base | Migrado | `_legacy/app/page.tsx` | `src/routes/index.tsx`, `src/production/ProductionHome.tsx` | Contratos meteorológicos e hidrológicos | Loader SSR e composição editorial nativa | Médio | Home usa dados reais e mantém estado útil em contingência | 3 |
| 06 | Hero meteorológico dinâmico | Migrado | `_legacy/components/weather-hero.tsx` | `src/production/components/weather-hero.tsx` | Open-Meteo, CPPMet, INMET, Gemini opcional | Agregação server-side e fallback determinístico | Médio | Título coerente, texto local, métricas e fontes explícitas | 3 |
| 07 | Previsão atual Open-Meteo | Migrado | `_legacy/lib/weather-service.ts`, `_legacy/lib/weather-data.ts` | `src/lib/weather/open-meteo.server.ts`, server functions e tipos | API pública Open-Meteo | Timeout, cache e validação Zod | Baixo | Resposta validada e indisponibilidade explícita | 2 |
| 08 | Página “Hoje” | Migrado | `_legacy/app/tempo-hoje-pelotas/page.tsx` | `src/routes/tempo-hoje-pelotas.tsx` | Contrato unificado de previsão | Componentes e loader nativos | Baixo | Hora a hora, chuva, vento e métricas compreensíveis | 3 |
| 09 | Página “Amanhã” | Migrado | `_legacy/app/tempo-amanha-pelotas/page.tsx` | `src/routes/tempo-amanha-pelotas.tsx` | Open-Meteo, síntese determinística/Gemini | Página e destaque adaptados ao tema editorial | Baixo | Previsão indexável com fallback seguro | 3 |
| 10 | Tendência e destaque de amanhã | Migrado | CSS e componentes editoriais do legado | componentes da Home e páginas de previsão | Dados diários | Seleção por dados, sem data fixa | Baixo | Amanhã identificado automaticamente e resumo responsivo | 3 |
| 11 | Página “7 dias” | Migrado | `_legacy/app/previsao-7-dias-pelotas/page.tsx` | `src/routes/previsao-7-dias-pelotas.tsx` | Open-Meteo | Contratos SSR compartilhados | Baixo | Sete dias completos, metadados e links próprios | 3 |
| 12 | Chuva e vento | Migrado | páginas e componentes do legado | `src/routes/chuva-em-pelotas.tsx`, `src/routes/vento-em-pelotas.tsx` | Open-Meteo | Visões temáticas nativas | Baixo | Probabilidade, volume, direção e rajadas coerentes | 3 |
| 13 | Observação Embrapa | Migrado | `_legacy/lib/embrapa-observation.ts` | `src/lib/weather/embrapa.server.ts` e componentes | Fonte pública Embrapa | Parser, timeout e validação de atualidade | Médio | Medição local rotulada, timestamp original e dado atrasado sinalizado | 2 |
| 14 | Alertas INMET | Migrado | `_legacy/lib/inmet-alerts.ts`, painel e `/alertas` | `src/lib/weather/inmet.server.ts`, rota e componentes | Fonte oficial INMET | Filtro geográfico e cache controlado | Médio | Apenas avisos aplicáveis, severidade, vigência e fonte explícitas | 2 |
| 15 | CPPMet/UFPel | Migrado | `_legacy/lib/cppmet-forecast.ts` | `src/lib/weather/cppmet.server.ts` | Site público CPPMet/UFPel | HTML sanitizado e fingerprint | Médio | Texto do meteorologista, atribuição e falha segura | 2 |
| 16 | Defesa Civil — banners preventivos | Migrado | `_legacy/lib/safety-banners.ts`, componentes e CSS | componentes preventivos e `/alertas` | Links oficiais | Conteúdo educativo separado de alertas vigentes | Baixo | Canais oficiais e prioridade editorial correta | 3 |
| 17 | Gemini — resumo meteorológico | Migrado | `_legacy/lib/weather-ai-summary.ts` | `src/lib/weather/gemini-summary.server.ts` | `GEMINI_API_KEY`, `GEMINI_MODEL` | Chamada somente no servidor e fallback determinístico | Médio | JSON válido, cache, timeout e nenhuma chave no cliente | 2 |
| 18 | Insights e regras editoriais | Migrado | `_legacy/lib/weather-insights.ts` | módulos puros em `src/lib/weather/` e `src/production/lib/` | Contratos normalizados | Funções desacopladas do visual | Baixo | Títulos, chips e prioridades reproduzíveis | 2 |
| 19 | REDEMET — cliente server-side | Migrado | `_legacy/lib/redemet.ts`, tipos e último quadro | `src/lib/redemet/*.server.ts` | `REDEMET_API_KEY`, base URL, área e produto | Server functions, validação e cache | Alto | Chave privada, schemas válidos e logs sanitizados | 5 |
| 20 | REDEMET — radar de Canguçu | Migrado | rotas de radar e proxy de imagem | rotas de servidor e componentes de mapa | REDEMET | Proxy com allowlist e limites | Alto | MaxCAPPI, horário, opacidade, legenda e fallback | 5 |
| 21 | REDEMET — satélite | Migrado | rota de satélite | server function e mapa | REDEMET | URLs e produtos normalizados | Médio | Realçado, infravermelho e visível com timeline e atribuição | 5 |
| 22 | REDEMET — trovoadas STSC | Migrado | rota de trovoadas | server function e camada MapLibre | REDEMET | Coordenadas validadas e filtro regional | Alto | Pontos recentes sem transformar monitoramento em alerta oficial | 5 |
| 23 | MapLibre e mapa regional | Migrado | `_legacy/components/weather-map.tsx` | componentes de mapas em `src/components/` e `src/production/` | `maplibre-gl` | Carregamento client-only e proteção SSR | Médio | Sem erro de hidratação, responsivo, teclado e tela cheia | 5 |
| 24 | Google Maps | Revisar | Variáveis e referências sem uso funcional | Nenhum consumo aprovado | Chaves Maps | Não portar sem caso de uso | Baixo | Chaves removidas ou restritas; integração apenas se necessária | 9 |
| 25 | Câmera do Laranjal / YouTube | Migrado | serviços, APIs e página do legado | `src/lib/cameras/*.server.ts`, rota e componentes | `YOUTUBE_API_KEY`, handle e ID manual | API primária e contingências adaptadas | Médio | Live reconhecida, replay separado, embed nocookie e diagnóstico seguro | 5 |
| 26 | Hidrologia — Laranjal | Migrado | `laranjal-level.ts`, API, página e cards | `src/lib/hydrology/laranjal-level.server.ts`, rota e componentes | Telemetria UFPel/ThingsBoard | Fetch server-side, cache e série | Alto | Nível, timestamp, tendência e fonte; indisponibilidade explícita | 4 |
| 27 | Regras semânticas de níveis | Migrado | `_legacy/lib/water-level-state.ts` | `src/lib/hydrology/water-level-state.ts` | Cotas por estação quando oficiais | Função pura centralizada | Médio | Estado expresso por texto, ícone e cor consistente | 4 |
| 28 | Rede CCMAR/FURG/Portos RS | Migrado | serviços e componentes regionais | `src/lib/hydrology/lagoon-network.server.ts` | Fontes FURG/Portos RS | Janelas tolerantes e controle de atraso | Alto | Atualizado/atrasado, referências e variações confiáveis | 4 |
| 29 | Guaíba e cidades regionais | Migrado | monitores e APIs regionais | `src/lib/hydrology/guaiba.server.ts` e módulos relacionados | Fontes públicas regionais | Normalização e referências específicas | Alto | Cidades e estações com timestamps e tendências corretas | 4 |
| 30 | Página de situação hidrológica | Migrado | `_legacy/app/situacao-hidrologica-pelotas/page.tsx` | `src/routes/situacao-hidrologica-pelotas.tsx` | Serviços hidrológicos | Composição tolerante a falhas parciais | Médio | Laranjal, Lagoa e Guaíba com metodologia e fontes claras | 4 |
| 31 | Histórico climático | Parcial | `weather-history*.ts`, API, gráficos e página | `src/lib/weather/history.server.ts`, rota e gráficos | Open-Meteo histórico e Supabase externo | Consulta externa funciona; persistência própria ainda pendente | Alto | Séries reais, timezone consistente, estados vazios e fonte documentada | 6 |
| 32 | Snapshots meteorológicos | Não migrado | `weather-snapshot-store.ts`, cron e migration | server function/Edge Function + Supabase | Secret administrativa e scheduler | Idempotência, chave única e runtime compatível | Alto | Snapshot periódico sem duplicação, logs e recuperação de falhas | 6 |
| 33 | Supabase — clientes browser/server | Parcial | libs Supabase do legado | `src/lib/supabase/client.ts`, `src/lib/supabase/server-client.server.ts` | URL, publishable key e secret server-only | SDK instalado, clientes separados e modo mock preservado | Alto | Configuração real validada em preview e sessão SSR testada | 6 |
| 34 | Banco, migrations e RLS | Parcial | `_legacy/supabase/migrations/*` | `supabase/migrations/` e projeto externo oficial | Acesso ao projeto Supabase | Perfis e preferências versionados; aplicação e testes pendentes | Crítico | Histórico conferido, RLS testada e rollback documentado | 6 |
| 35 | Login Google e conta | Não migrado | `/auth/*`, `/entrar`, `/minha-conta`, componentes | rotas TanStack e componentes nativos | Supabase Auth Google | Callback PKCE, cookies e redirects SSR | Alto | Login, logout, callback, conta e proteção de dados funcionando | 7 |
| 36 | APIs internas e diagnóstico | Parcial | `_legacy/app/api/**`, diagnóstico de integrações | server functions e rotas públicas em `src/routes/` | Variáveis de cada integração | Endpoints públicos e RPCs parcialmente classificados | Médio | Status distingue configurado/operacional sem vazar secrets | 2–8 |
| 37 | Cron | Não migrado | rotas Vercel Cron | Edge Functions ou rotas assinadas | `CRON_SECRET`, `PUSH_ADMIN_SECRET` | Scheduler compatível e assinatura | Alto | Idempotência, logs e execução observável | 8 |
| 38 | Web push | Não migrado | serviço, store e APIs do legado | Supabase Edge Function ou runtime Node | VAPID public/private e subject | Evitar secret ou service role no navegador | Crítico | Subscribe, unsubscribe, envio, expiração e limpeza | 8 |
| 39 | PWA e offline | Migrado | manifesto, service worker, manager e offline | `public/manifest.webmanifest`, `public/sw.js`, `public/offline.html`, `src/components/pwa/` | Nenhuma; VAPID apenas para push futuro | Integração Vite/TanStack reescrita | Médio | Instalável, offline seguro, atualização controlada e cache resiliente | 8 |
| 40 | Sitemap | Migrado | `_legacy/app/sitemap.ts` | `src/routes/sitemap[.]xml.ts`, `src/lib/public-routes.ts` | `VITE_SITE_URL` | Server route com XML e cache | Baixo | URLs canônicas sem rotas privadas ou duplicadas | 9 |
| 41 | Robots | Migrado | `_legacy/app/robots.ts` | `src/routes/robots[.]txt.ts` | `VITE_SITE_URL` | Server route com content-type correto | Baixo | Sitemap referenciado e regras por ambiente | 9 |
| 42 | Canonicals | Migrado | metadata das páginas Next | `src/lib/site-config.ts`, `src/lib/page-meta.ts`, heads das rotas | `VITE_SITE_URL` | URL absoluta centralizada | Baixo | Canonical único em cada rota indexável | 9 |
| 43 | Open Graph e Twitter Cards | Migrado | metadata e assets do legado | `src/lib/page-meta.ts`, `src/routes/__root.tsx` | URL pública e imagem social | Metadados por rota | Baixo | Título, descrição, imagem e URL corretos | 9 |
| 44 | Schema.org | Parcial | JSON-LD espalhado no legado | `src/lib/site-config.ts`, heads e componentes | Dados editoriais e meteorológicos | WebSite global implementado; schemas específicos continuam evoluindo | Médio | JSON-LD válido sem alegações indevidas | 9 |
| 45 | `pelotas.json`, feed e transparência | Migrado | endpoints e metodologia | `src/routes/pelotas[.]json.ts`, `src/routes/feed.ts`, portal público | Contratos atuais | Schema, JSON Feed, CORS e cache explícitos | Baixo | JSON estável, feed válido e fontes documentadas | 9 |
| 46 | PageSpeed API | Revisar | Variável sem consumo funcional | Ferramenta administrativa futura | `GOOGLE_PAGESPEED_API_KEY` | Não incluir sem caso de uso | Baixo | Chave removida ou diagnóstico restrito | 10 |
| 47 | Acessibilidade | Parcial | Semântica e CSS legados | layout, headers, PWA, componentes e CSS de acessibilidade | Nenhuma | Foco, skip link, teclado, ARIA e movimento reduzido implementados parcialmente | Médio | WCAG 2.2 AA nos fluxos principais | Contínuo |
| 48 | Responsividade | Parcial | CSS mobile cumulativo | CSS/componentes reconstruídos mobile-first | Nenhuma | Sem copiar cascata legada | Médio | 320 px a desktop sem overflow ou cortes | Contínuo |
| 49 | Observabilidade | Parcial | Logs pontuais | tratamento de erro, logs sanitizados e auditorias | Provedor futuro | Erros externos diferenciados e secrets omitidas | Médio | Correlation IDs, saúde e métricas básicas | 10 |
| 50 | Segurança e LGPD | Parcial | Práticas parciais do legado | policies, configuração server-only e conteúdo de privacidade | Supabase/Auth/push | Minimização e separação de secrets iniciadas | Crítico | Direitos do titular, retenção, exclusão e consentimento testados | 7–10 |
| 51 | Testes | Parcial | Validações manuais | CI, smoke tests e auditoria visual | Vitest/Playwright | Cobertura visual existe; unitários e contratos pendentes | Alto | Parsers, normalizadores, RLS e rotas críticas cobertos | 10 |
| 52 | Build, lint e typecheck | Migrado | Workflows do legado | `.github/workflows/quality.yml` | Node 24 e lockfile | Ordem build → typecheck → lint padronizada | Baixo | Três comandos verdes em ambiente limpo | 10 |
| 53 | Deploy e domínio | Parcial | Vercel/Next | Hosting TanStack/Lovable | Secrets e domínio | Configuração Vercel descartada; preview e auditoria ativos | Crítico | Produção validada, DNS com rollback e zero perda SEO | 10 |

## Recursos desenvolvidos após o snapshot e confirmados no destino

- REDEMET: radar de Canguçu, satélite, trovoadas, proxy seguro e último quadro válido;
- CPPMet/UFPel integrado ao hero;
- banners educativos da Defesa Civil;
- câmera do Laranjal com YouTube, página pública e ID manual;
- regra semântica centralizada para níveis;
- rede CCMAR/FURG/Portos RS, Guaíba e situação hidrológica;
- diagnóstico sanitizado das integrações;
- header com megamenu e navegação editorial;
- página, resumo e destaque visual de amanhã;
- sínteses meteorológicas com Gemini e fallback determinístico;
- mapa regional MapLibre e páginas temáticas;
- PWA instalável, offline seguro e atualização controlada;
- SDK Supabase, clientes separados e migrations iniciais versionadas.

## Sequência de execução atualizada

1. **Concluir Lote 6 — histórico e snapshots:** schema, RLS, persistência, retenção e página histórica real.
2. **Executar Lote 7 — autenticação e LGPD:** Google, callback PKCE, conta, preferências, sessão SSR e direitos do usuário.
3. **Concluir Lote 8 — push e cron:** inscrições, envio, scheduler, idempotência e observabilidade.
4. **Fechar Lote 9 — Schema específico:** BreadcrumbList, Dataset/WeatherObservations quando factualmente aplicáveis.
5. **Executar Lote 10 — corte:** testes, acessibilidade, performance, segurança, deploy, DNS e rollback.

## Regra de atualização

Ao concluir cada lote, atualizar o status e o critério de aceite desta matriz com evidência nos arquivos de `src/`. A presença de um arquivo em `_legacy/` nunca deve ser considerada implementação concluída.
