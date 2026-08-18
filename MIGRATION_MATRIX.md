# Matriz completa de migração — Tempo Pelotas

Inventário comparativo entre:

- **Origem:** `_legacy/`, snapshot de `agenciamobi/tempopelotas@main`, commit `05cd2d268ad25c070718ecc170bd30e8ad181341`;
- **Destino:** implementação nativa em `src/`, com TanStack Start, TanStack Router, React 19, Vite, Nitro e Supabase externo.

Entregas posteriores ao snapshot são conferidas diretamente no repositório de origem antes de cada lote.

## Legenda

- **Migrado:** existe implementação nativa funcional no destino.
- **Parcial:** existe base funcional e operação real, mas falta uma validação final ou ativação controlada.
- **Não migrado:** existe somente no snapshot legado ou ainda não possui implementação funcional.
- **Revisar:** deve ser reavaliado antes de portar ou manter.
- **Descartar:** configuração específica do Next.js/Vercel que não deve ser portada.

## Resumo executivo

| Domínio | Estimativa atual | Situação |
| --- | ---: | --- |
| Fundação, rotas e layout | 96% | Arquitetura TanStack, identidade, header, megamenu, footer, acessibilidade básica e estados globais implementados |
| Previsão meteorológica | 98% | Open-Meteo, MET Norway, Embrapa, INMET, CPPMet, síntese Gemini e avaliação automática de precisão integrados |
| Home editorial | 96% | Hero, alertas, blocos editoriais, contingência e navegação orientada ao visitante implementados |
| Hidrologia | 92% | Laranjal, Lagoa dos Patos, rede regional, Guaíba, tendências e metodologia integrados; validação contínua das fontes permanece necessária |
| Radar, satélite, trovoadas e mapas | 92% | REDEMET e MapLibre implementados; radar escolhe estação operacional com cobertura real sobre Pelotas (Santiago no estado observado em 18/08/2026), satélite e STSC usam contratos atuais e mantêm estados explícitos de indisponibilidade |
| Câmeras | 92% | YouTube, descoberta de live, replay, ID manual e contingências implementados |
| Supabase, histórico e autenticação | 92% | Projeto oficial ativo, migrations aplicadas, RLS endurecida, Google OAuth habilitado, callback de produção aceito e direitos do titular protegidos; ciclo autenticado com contas descartáveis ainda precisa de validação interativa |
| PWA, push e cron | 78% | Cron meteorológico está ativo; PWA e Web Push permanecem temporariamente desativados até a conclusão da investigação de rolagem e dos testes reais de navegador |
| SEO técnico e transparência | 98% | Canonicals, Open Graph, Twitter Cards, sitemap, robots, Schema editorial, feed e endpoint público implementados |
| Qualidade, observabilidade e LGPD | 92% | Saúde da Embrapa, arquivo de precisão, advisors do banco, exportação, exclusão, consentimentos e contratos de segurança implementados; faltam auditoria WCAG/Core Web Vitals e ciclo autenticado completo |

**Percentual global aproximado de paridade funcional: 93% a 95%.**

## Pendências principais

1. Concluir um ciclo real de login Google com duas contas descartáveis: criação de perfil, isolamento RLS, consentimentos, exportação, logout e exclusão em cascata.
2. Reativar PWA e Web Push somente por implantação controlada, sem bloqueio global de rolagem e com testes em navegador real.
3. Executar a suíte completa em ambiente limpo e concluir WCAG 2.2 AA, Core Web Vitals e auditoria responsiva.
4. Formalizar o plano de rollback de aplicação, banco, domínio e caches antes do encerramento do corte.
5. Manter todas as secrets exclusivamente em módulos `*.server.ts`, server functions, rotas de servidor ou Edge Functions.

## Matriz operacional

| ID | Recurso | Status | Origem no snapshot | Destino atual ou planejado | Dependências / variáveis | Adaptação Next.js → TanStack Start/Nitro | Risco | Critério de aceite | Lote |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | ---: |
| 01 | Layout global e identidade | Migrado | `_legacy/app/layout.tsx`, `_legacy/app/globals.css`, CSS de tema | `src/routes/__root.tsx`, `src/components/layout/`, `src/production/`, `src/styles.css` | Nenhuma | Metadata e shell convertidos; CSS consolidado no tema editorial | Baixo | Identidade, container, tipografia, foco e estados globais consistentes | 3 |
| 02 | Header desktop/mobile | Migrado | `_legacy/components/site-header.tsx` | componentes de header em `src/components/` e `src/production/` | Estado de alertas; sessão opcional | Navegação adaptada ao TanStack Router | Baixo | Navegação funcional, acessível e responsiva | 3 |
| 03 | Megamenu | Migrado | `_legacy/components/site-header.tsx`, CSS do megamenu | componentes nativos de navegação | Alertas e autenticação opcionais | Interação reconstruída sem cascata legada | Médio | Teclado, Escape, clique externo, desktop e mobile estáveis | 3 |
| 04 | Footer editorial | Migrado | `_legacy/components/site-footer.tsx`, CSS do footer | componentes de footer em `src/components/` e `src/production/` | Rotas existentes | Grupos, transparência, conta e privacidade reorganizados | Baixo | Links válidos, fontes corretas e mobile consistente | 3 |
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
| 19 | REDEMET — cliente server-side | Migrado | `_legacy/lib/redemet.ts`, tipos e último quadro | `src/lib/redemet/*.server.ts` | `REDEMET_API_KEY`, base URL, área e produto | Server functions, validação, cache e contratos separados para radar/STSC | Alto | Chave privada, schemas válidos, hosts allowlisted e logs sanitizados | 5 |
| 20 | REDEMET — radar regional para Pelotas | Migrado | rotas de radar e proxy de imagem | `src/lib/redemet/redemet-radar.server.ts`, rota de radar, proxy e componentes de mapa | `REDEMET_API_KEY`, `REDEMET_RADAR_AREA=sg`, produto inicial `maxcappi` | Produto é consultado sem fixar uma estação na URL; `sg`/`cn` são selecionados depois da resposta e cada quadro precisa ter bounds que cubram Pelotas | Alto | Estação real identificada, MAXCAPPI ou fallback recente, horário e bounds válidos; Canguçu sem `path` nunca é confundido com Santiago | 5 |
| 21 | REDEMET — satélite | Migrado | rota de satélite | server function e mapa | REDEMET | URLs e produtos normalizados | Médio | Realçado, infravermelho e visível com timeline e atribuição | 5 |
| 22 | REDEMET — trovoadas STSC | Migrado | rota de trovoadas | `src/lib/redemet/redemet-stsc.server.ts`, server function e camada MapLibre | REDEMET | Contrato `produtos/stsc/0`, quadros em `data[]`, coordenadas validadas e filtro regional de até 450 km | Alto | Pontos recentes, timestamp normalizado e origem explícita, sem transformar monitoramento em alerta oficial | 5 |
| 23 | MapLibre e mapa regional | Migrado | `_legacy/components/weather-map.tsx` | componentes de mapas em `src/components/` e `src/production/` | `maplibre-gl` | Carregamento client-only e proteção SSR | Médio | Sem erro de hidratação, responsivo, teclado e tela cheia | 5 |
| 24 | Google Maps | Revisar | Variáveis e referências sem uso funcional | Nenhum consumo aprovado | Chaves Maps | Não portar sem caso de uso | Baixo | Chaves removidas ou restritas; integração apenas se necessária | 9 |
| 25 | Câmera do Laranjal / YouTube | Migrado | serviços, APIs e página do legado | `src/lib/cameras/*.server.ts`, rota e componentes | `YOUTUBE_API_KEY`, handle e ID manual | API primária e contingências adaptadas | Médio | Live reconhecida, replay separado, embed nocookie e diagnóstico seguro | 5 |
| 26 | Hidrologia — Laranjal | Migrado | `laranjal-level.ts`, API, página e cards | `src/lib/hydrology/laranjal-level.server.ts`, rota e componentes | Telemetria UFPel/ThingsBoard | Fetch server-side, cache e série | Alto | Nível, timestamp, tendência e fonte; indisponibilidade explícita | 4 |
| 27 | Regras semânticas de níveis | Migrado | `_legacy/lib/water-level-state.ts` | `src/lib/hydrology/water-level-state.ts` | Cotas por estação quando oficiais | Função pura centralizada | Médio | Estado expresso por texto, ícone e cor consistente | 4 |
| 28 | Rede CCMAR/FURG/Portos RS | Migrado | serviços e componentes regionais | `src/lib/hydrology/lagoon-network.server.ts` | Fontes FURG/Portos RS | Janelas tolerantes e controle de atraso | Alto | Atualizado/atrasado, referências e variações confiáveis | 4 |
| 29 | Guaíba e cidades regionais | Migrado | monitores e APIs regionais | `src/lib/hydrology/guaiba.server.ts` e módulos relacionados | Fontes públicas regionais | Normalização e referências específicas | Alto | Cidades e estações com timestamps e tendências corretas | 4 |
| 30 | Página de situação hidrológica | Migrado | `_legacy/app/situacao-hidrologica-pelotas/page.tsx` | `src/routes/situacao-hidrologica-pelotas.tsx` | Serviços hidrológicos | Composição tolerante a falhas parciais | Médio | Laranjal, Lagoa e Guaíba com metodologia e fontes claras | 4 |
| 31 | Histórico climático | Migrado | `weather-history*.ts`, API, gráficos e página | `src/lib/weather/history.server.ts`, `src/lib/weather/history-with-snapshots.server.ts`, rota e gráficos | Open-Meteo histórico e Supabase externo | Consulta externa combinada com arquivo próprio; sem dados simulados | Alto | Séries reais, timezone consistente, estados vazios, fallback e fonte documentada | 6 |
| 32 | Snapshots meteorológicos | Migrado | `weather-snapshot-store.ts`, cron e migration | `src/lib/weather/weather-snapshot-store.server.ts`, `src/routes/api/cron/weather-snapshot.ts`, migration Supabase | `CRON_SECRET`, secret administrativa e scheduler | Upsert server-only, chave composta e rota assinada | Alto | Snapshot periódico sem duplicação, resposta sanitizada e recuperação por arquivo próprio | 6 |
| 33 | Supabase — clientes browser/server | Parcial | libs Supabase do legado | `src/lib/supabase/client.ts`, `src/lib/supabase/server-client.server.ts`, `src/lib/supabase/request-client.server.ts` | URL, publishable key e secret server-only | Projeto externo oficial ativo; SDK, cookies SSR e clientes separados validados sem expor a chave administrativa | Alto | Falta somente validar persistência e renovação da sessão em navegador autenticado real | 6–7 |
| 34 | Banco, migrations e RLS | Parcial | `_legacy/supabase/migrations/*` | `supabase/migrations/` e projeto externo oficial | Projeto Supabase `tempopelotas` | Migrations aplicadas; RLS, privilégios mínimos, advisors, trigger privado de consentimento e tabelas server-only auditados | Crítico | Confirmar isolamento com duas contas e registrar rollback do banco | 6–8 |
| 35 | Login Google e conta | Parcial | `/auth/*`, `/entrar`, `/minha-conta`, componentes | `src/routes/auth/`, `src/routes/conta.tsx`, `src/lib/auth/`, rotas de exportação/exclusão | Supabase Auth Google e chaves publicáveis | Google habilitado, callback de produção aceito, PKCE, redirects internos, cache privado, exclusão e logout sem sessão validados | Alto | Concluir login, exportação, consentimentos e exclusão com contas descartáveis | 7 |
| 36 | APIs internas e diagnóstico | Parcial | `_legacy/app/api/**`, diagnóstico de integrações | server functions e rotas públicas em `src/routes/` | Variáveis de cada integração | Endpoints meteorológicos, conta e RPCs classificados; respostas críticas testadas no domínio oficial | Médio | Completar inventário de status e correlation IDs sem vazar secrets | 2–8 |
| 37 | Cron | Parcial | rotas Vercel Cron | rotas em `src/routes/api/cron/` e pg_cron/pg_net no Supabase | `CRON_SECRET`, tokens privados dos coletores | Coleta central da Embrapa e arquivo de precisão ativos e observáveis; rotina de Web Push segue suspensa | Alto | Reativar somente o agendamento de push após testes de navegador | 8 |
| 38 | Web push | Parcial | serviço, store e APIs do legado | `src/lib/push/`, `src/routes/api/push/`, `public/sw.js` e migrations | VAPID public/private, subject, Supabase e secrets | Criptografia nativa, paginação, leases e limpeza de endpoints implementados, porém ativação suspensa | Crítico | Subscribe, unsubscribe, envio, expiração e vínculo validados em navegador sem afetar a rolagem | 8 |
| 39 | PWA e offline | Parcial | manifesto, service worker, manager e offline | arquivos preservados em `public/` e `src/components/pwa/`; montagem removida temporariamente do root | Nenhuma para instalação; VAPID apenas para push | Implementação preservada, mas service worker, manifesto e interface de instalação foram desativados durante o diagnóstico de rolagem | Médio | Reativação isolada, sem mutação global de `body`, com wheel, teclado, touch e atualização controlada testados | 8 |
| 40 | Sitemap | Migrado | `_legacy/app/sitemap.ts` | `src/routes/sitemap[.]xml.ts`, `src/lib/public-routes.ts` | `VITE_SITE_URL` | Server route com XML e cache | Baixo | URLs canônicas sem rotas privadas ou duplicadas | 9 |
| 41 | Robots | Migrado | `_legacy/app/robots.ts` | `src/routes/robots[.]txt.ts` | `VITE_SITE_URL` | Server route com content-type correto | Baixo | Sitemap referenciado e regras por ambiente | 9 |
| 42 | Canonicals | Migrado | metadata das páginas Next | `src/lib/site-config.ts`, `src/lib/page-meta.ts`, heads das rotas | `VITE_SITE_URL` | URL absoluta centralizada | Baixo | Canonical único em cada rota indexável | 9 |
| 43 | Open Graph e Twitter Cards | Migrado | metadata e assets do legado | `src/lib/page-meta.ts`, `src/routes/__root.tsx` | URL pública e imagem social | Metadados por rota | Baixo | Título, descrição, imagem e URL corretos | 9 |
| 44 | Schema.org | Migrado | JSON-LD espalhado no legado | `src/lib/structured-data.ts`, `src/lib/site-config.ts` e heads das rotas | Dados editoriais e meteorológicos | WebSite global por `@id`, WebPage e BreadcrumbList centralizados | Médio | JSON-LD válido, sem entidades duplicadas ou alegações indevidas | 9 |
| 45 | `pelotas.json`, feed e transparência | Migrado | endpoints e metodologia | `src/routes/pelotas[.]json.ts`, `src/routes/feed.ts`, metodologia e privacidade | Contratos atuais | Schema, JSON Feed, CORS, cache e política pública explícitos | Baixo | JSON estável, feed válido e fontes e dados documentados | 9 |
| 46 | PageSpeed API | Revisar | Variável sem consumo funcional | Ferramenta administrativa futura | `GOOGLE_PAGESPEED_API_KEY` | Não incluir sem caso de uso | Baixo | Chave removida ou diagnóstico restrito | 10 |
| 47 | Acessibilidade | Parcial | Semântica e CSS legados | layout, headers, conta e componentes | Nenhuma | Foco, skip link, teclado, ARIA e movimento reduzido implementados parcialmente | Médio | WCAG 2.2 AA nos fluxos principais | Contínuo |
| 48 | Responsividade | Parcial | CSS mobile cumulativo | CSS/componentes reconstruídos mobile-first | Nenhuma | Sem copiar cascata legada | Médio | 320 px a desktop sem overflow, cortes ou bloqueio de rolagem | Contínuo |
| 49 | Observabilidade | Parcial | Logs pontuais | saúde da Embrapa, incidentes automáticos, arquivo de precisão, tratamento de erro e logs sanitizados | Supabase e logs do hosting | Métricas básicas e estados das fontes implementados; correlation IDs globais ainda ausentes | Médio | Rastrear uma requisição entre portal, Edge Function e banco sem expor secrets | 10 |
| 50 | Segurança e LGPD | Parcial | Práticas parciais do legado | RLS, schema privado, `/privacidade-e-dados`, exportação, exclusão e direitos na conta | Supabase/Auth/push | Privilégios destrutivos removidos do cliente, RPC pública como invoker, consentimento por trigger privado e endpoints testados sem sessão | Crítico | Validar duas contas, exportação autenticada, cascata e retenção em ciclo real | 7–10 |
| 51 | Testes | Parcial | Validações manuais | CI, contratos Node, smoke tests e auditoria visual | Node test, TypeScript e navegador | Parsers, normalizadores, banco, autenticação, precisão, rotas e regressões visuais possuem contratos; suíte integral ainda não foi executada após o lote atual | Alto | Build, typecheck, lint e todos os contratos verdes em ambiente limpo | 10 |
| 52 | Build, lint e typecheck | Migrado | Workflows do legado | `.github/workflows/quality.yml` | Node 24 e lockfile | Ordem build → typecheck → lint padronizada | Baixo | Três comandos verdes em ambiente limpo | 10 |
| 53 | Deploy e domínio | Parcial | Vercel/Next | Hosting TanStack/Lovable e domínio oficial | Secrets, DNS e Cloudflare | Produção e domínio oficial operacionais; publicação e rotas críticas verificadas | Crítico | Formalizar rollback de aplicação, banco, DNS e caches com zero perda SEO | 10 |

## Recursos desenvolvidos após o snapshot e confirmados no destino

- REDEMET: radar regional com Santiago operacional e Canguçu como alternativa quando voltar a fornecer imagem válida, satélite, STSC no contrato atual, proxy seguro e último quadro válido;
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
- SDK Supabase, clientes separados, PKCE e cookies SSR;
- centralizador da Embrapa, histórico de 24 horas, saúde operacional e incidentes automáticos;
- histórico climático combinado com arquivo próprio e fallback editorial;
- snapshots meteorológicos idempotentes com rota de captura protegida por segredo;
- arquivo de previsões, verificação contra a Embrapa e painel público de precisão;
- coleta Open-Meteo isolada em Edge Function para contornar limitação de rede do hosting;
- Web Push nativo com VAPID, paginação, leases e avisos oficiais separados da previsão, atualmente suspenso;
- dados estruturados editoriais com WebSite, WebPage e BreadcrumbList conectados por `@id`;
- conta com Google OAuth, privilégios mínimos, consentimentos versionados, exportação, exclusão e política pública de retenção.

A pesquisa CPTEC/SIGMA realizada em agosto de 2026 foi preservada em `docs/CPTEC_SIGMA_RESEARCH.md` apenas como evidência técnica e backlog. Ela não é dependência do runtime e não deve ser integrada ao portal público antes da revisão planejada para novembro/dezembro de 2026. A operação corrente da REDEMET está documentada em `docs/REDEMET_OPERATIONS.md`.

## Sequência de execução atualizada

1. **Encerrar Lote 7 interativo:** executar login Google com duas contas descartáveis, validar isolamento, exportação, consentimentos, logout e exclusão.
2. **Reativar Lote 8 de forma controlada:** PWA e Web Push sem bloqueio global de rolagem, com validação em Chrome normal, anônimo, mobile e perfil com extensões.
3. **Executar Lote 10 — corte:** suíte integral, WCAG 2.2 AA, Core Web Vitals, responsividade, segurança, rollback e encerramento do domínio.

## Regra de atualização

Ao concluir cada lote, atualizar o status e o critério de aceite desta matriz com evidência nos arquivos de `src/` ou em documentos operacionais versionados. A presença de um arquivo em `_legacy/` nunca deve ser considerada implementação concluída.
