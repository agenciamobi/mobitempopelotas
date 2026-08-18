# Tempo Pelotas — estado atual do projeto

Última atualização: 18/08/2026  
Branch operacional: `main`  
Domínio canônico: `https://tempopelotas.com.br`

## 1. Propósito deste documento

Este arquivo é a fonte de verdade de alto nível para responder **o que existe hoje no Tempo Pelotas, o que está ativo, o que está parcial/suspenso e onde cada domínio técnico é mantido**.

Ele não substitui a documentação especializada. Em vez disso, funciona como índice operacional do projeto e aponta para os documentos detalhados.

Regras:

- `PROJECT_CURRENT_STATE.md` descreve o estado atual do produto.
- `MIGRATION_MATRIX.md` registra a migração, paridade e pendências herdadas do legado.
- `docs/*.md` detalha integrações, operação, segurança, SEO, runtime e subsistemas específicos.
- `_legacy/` é referência histórica e **não** define o estado atual.
- Código ativo em `src/`, workflows e migrations prevalecem sobre documentos antigos; divergências devem ser corrigidas no mesmo conjunto de mudanças.
- Nunca versionar HARs brutos, cookies, tokens, chaves, secrets ou URLs autenticadas obtidas em diagnóstico.

## 2. Visão executiva

O Tempo Pelotas é um portal meteorológico regional focado em Pelotas e Zona Sul do Rio Grande do Sul. O produto combina previsão, observação local, radar/satélite, alertas oficiais, hidrologia, histórico, câmeras e páginas regionais, com forte camada editorial, SEO técnico, APIs server-side e monitoramento operacional.

### Estado por domínio

| Domínio | Estado atual | Observação |
| --- | --- | --- |
| Portal público | Ativo | Produção em `tempopelotas.com.br` |
| Home meteorológica | Ativo | Header editorial compacto, hero unificado com temperatura dominante, próximas horas, alertas oficiais e blocos locais |
| Previsão hoje/amanhã/7 dias | Ativo | Páginas dedicadas e conteúdo indexável |
| Chuva, vento e meteograma | Ativo | Visões temáticas e hora a hora |
| Alertas oficiais | Ativo | INMET e conteúdo preventivo claramente separado |
| Estação Embrapa | Ativo | Observação local, timestamp e estado de atualidade |
| Radar REDEMET | Ativo com dependência externa | Santiago (`sg`) é a estação operacional preferencial; Canguçu (`cn`) é fallback quando voltar a fornecer imagem |
| Satélite REDEMET | Ativo | Realçada, infravermelho e visível |
| Trovoadas STSC | Ativo | Contrato atual da API REDEMET e filtro regional |
| Mapa regional MapLibre | Ativo | Camadas de radar, satélite e trovoadas |
| Hidrologia | Ativo | Laranjal, Lagoa dos Patos, Guaíba e rede regional |
| Histórico climático | Ativo | Janela de 30 dias com fonte/fallback documentados |
| Câmeras | Ativo com dependência externa | YouTube, live/replay e contingências |
| Páginas regionais | Ativo | 23 cidades além de Pelotas |
| Blog | Ativo | Rota pública e indexável |
| SEO técnico | Ativo | Canonical, sitemap, robots, OG/Twitter, Schema.org e imagem social raster |
| Supabase externo | Ativo/parcial | Banco e RLS implantados; ciclo autenticado completo com duas contas ainda precisa de validação real |
| Login Google / conta | Parcial | Base funcional, exportação e exclusão implementadas; E2E real ainda pendente |
| Weather AI | Ativo controlado | Snapshot persistido, orçamento mensal e fallback determinístico |
| PWA / Web Push | Suspenso para ativação pública | Código preservado; reativação depende de validação real de navegador e rolagem |
| CPTEC/SIGMA | Pesquisa futura | Não integrar ao runtime público antes da revisão institucional planejada para novembro/dezembro de 2026 |

## 3. Stack atual

Aplicação principal:

- React 19;
- TypeScript 5.8;
- TanStack Start e TanStack Router;
- Vite 8;
- Nitro;
- Tailwind CSS 4;
- Supabase JS/SSR;
- MapLibre GL para mapas;
- Recharts para gráficos;
- Radix UI e componentes próprios;
- Node.js 24 nos workflows de CI;
- Lovable como ambiente conectado de publicação/sincronização.

Scripts principais em `package.json`:

- `npm run dev`;
- `npm run build`;
- `npm test`;
- `npm run test:contracts`;
- `npm run test:routes`;
- `npm run typecheck`;
- `npm run lint`;
- `npm run runtime:check`;
- `npm run runtime:check:example`;
- `npm run cutover:smoke`.

## 4. Rotas públicas indexáveis

`src/lib/public-routes.ts` é a fonte programática das URLs destinadas a sitemap/indexação.

O inventário atual possui **43 rotas públicas indexáveis**: 20 rotas fixas, contando Home e institucionais, mais 23 páginas regionais de cidades.

### Pelotas e conteúdo principal

- `/`
- `/tempo-hoje-pelotas`
- `/tempo-amanha-pelotas`
- `/previsao-7-dias-pelotas`
- `/chuva-em-pelotas`
- `/vento-em-pelotas`
- `/meteograma-pelotas`
- `/alertas`
- `/radar-e-satelite-pelotas`
- `/mapa-de-geadas-rio-grande-do-sul`
- `/situacao-hidrologica-pelotas`
- `/nivel-da-lagoa-dos-patos-laranjal`
- `/estacao-embrapa-pelotas`
- `/clima-em-pelotas`
- `/historico-climatico-pelotas`
- `/cameras-ao-vivo-pelotas`
- `/tempo-na-regiao-sul-rs`
- `/blog`
- `/metodologia`
- `/privacidade-e-dados`

### Páginas regionais

Pelotas usa a Home como página principal regional. As demais cidades usam `/tempo-em/{slug}`:

**Pelotas e entorno**

- Capão do Leão;
- Canguçu;
- Morro Redondo;
- Turuçu;
- Arroio do Padre;
- Pedro Osório;
- Cerrito;
- Piratini.

**Costa Doce**

- Rio Grande;
- São José do Norte;
- São Lourenço do Sul;
- Cristal.

**Fronteira Sul**

- Jaguarão;
- Arroio Grande;
- Herval;
- Santa Vitória do Palmar;
- Chuí.

**Campanha**

- Pinheiro Machado;
- Pedras Altas;
- Bagé;
- Candiota;
- Aceguá;
- Dom Pedrito.

Cada cidade possui slug, coordenadas, código IBGE, agrupamento regional e descriptor editorial em `src/lib/regional-cities.ts`.

## 5. Rotas operacionais e não indexáveis

Além das páginas de conteúdo, existem rotas funcionais que não pertencem ao sitemap editorial:

- `/entrar`;
- `/conta`;
- `/auth/callback`;
- `/auth/signout`;
- `/embed/nivel-laranjal`;
- `/embed/status-tempo-agora`.

Também existem endpoints/máquinas públicas como `robots.txt`, `sitemap.xml`, feed JSON e `pelotas.json`, protegidos por contratos próprios de conteúdo, cache e indexação.

## 6. Previsão meteorológica e inteligência de dados

O núcleo meteorológico combina múltiplas fontes e regras de reconciliação, evitando tratar uma única fonte externa como verdade absoluta em todos os contextos.

### Previsão

- Open-Meteo: previsão principal/fallback em vários fluxos e páginas;
- MET Norway: fonte complementar no domínio de previsão;
- lógica centralizada para condição atual, hora a hora e dias seguintes;
- páginas dedicadas para hoje, amanhã, sete dias, chuva, vento e meteograma;
- normalização de timezone para `America/Sao_Paulo` quando aplicável;
- contratos para integridade de temperatura, precipitação, vento, rastreabilidade e disponibilidade.

### Observação local

Embrapa é a principal referência de observação meteorológica local do portal quando disponível.

O projeto possui:

- parser server-side;
- endpoint meteorológico próprio;
- rota pública da estação;
- histórico/snapshots;
- estado explícito de leitura atualizada, atrasada ou indisponível;
- coleta centralizada por cron;
- comparação da previsão com observação real para arquivo de precisão.

### CPPMet / UFPel

O texto meteorológico do CPPMet/UFPel é integrado como contexto editorial/local, com atribuição e fallback seguro.

### INMET

O projeto usa INMET para:

- alertas oficiais aplicáveis a Pelotas;
- produtos/fontes meteorológicas oficiais complementares;
- mapa/registros de geadas;
- satélite oficial complementar onde o fluxo específico utiliza essa fonte.

Avisos oficiais são mantidos semanticamente separados de previsão e monitoramento informal.

## 7. REDEMET / DECEA

Documentação de referência: `docs/REDEMET_OPERATIONS.md`.

A integração é server-side e usa `REDEMET_API_KEY` exclusivamente no runtime do servidor.

### Radar

Estado operacional consolidado em 18/08/2026:

- estação preferencial: Santiago (`sg`);
- estação alternativa: Canguçu (`cn`) quando voltar a fornecer imagem válida;
- produto prioritário: `maxcappi`;
- produtos alternativos podem ser consultados quando necessário;
- a chamada de produto recebe múltiplas estações e a seleção é feita depois da resposta;
- um quadro só é aceito para o portal se os bounds cobrem Pelotas;
- Canguçu com `path: null` não pode ser confundido com uma imagem válida de outra estação;
- respostas indisponíveis usam cache curto para nova tentativa rápida;
- último quadro válido pode ser usado por janela controlada para oscilações temporárias.

HARs da REDEMET e evidência independente do SIGMA mostraram Canguçu sem imagem recente enquanto Santiago estava operacional no período analisado.

### Satélite

Produtos suportados:

- realçada;
- infravermelho;
- visível.

A camada mantém timeline, timestamp, bounds e atribuição de origem.

### STSC / trovoadas

O contrato atual usa o endpoint `produtos/stsc/0` observado no portal oficial, interpretando `data[]` com timestamps e `pontos` de latitude/longitude.

O Tempo Pelotas filtra ocorrências em uma área regional de até 450 km de Pelotas. STSC é apresentado como monitoramento de atividade elétrica, nunca como alerta meteorológico oficial.

### Proxy e segurança

- hosts da API são allowlisted;
- hosts de imagens são allowlisted;
- somente HTTPS é aceito;
- a chave nunca é retornada ao navegador;
- imagens externas passam por proxy controlado;
- logs e erros não devem imprimir URL autenticada, header ou secret.

## 8. Hidrologia

O domínio hidrológico é um dos subsistemas centrais do portal.

### Laranjal / Lagoa dos Patos

O projeto mantém:

- medição do nível no Laranjal;
- timestamp da leitura;
- tendência recente;
- semântica centralizada de estados de nível;
- página dedicada;
- widget público;
- embed reutilizável;
- estados de disponibilidade/atraso.

### Rede regional

A situação hidrológica também agrega estações e referências da Lagoa dos Patos e região, incluindo conteúdo para:

- FURG/CCMAR;
- São Lourenço do Sul;
- Arambaré;
- São José do Norte;
- Itapuã;
- Guaíba em Porto Alegre;
- demais fontes regionais normalizadas pelos módulos de hidrologia.

A página `/situacao-hidrologica-pelotas` deve funcionar mesmo quando uma ou mais fontes externas estiverem indisponíveis.

## 9. Radar, satélite, trovoadas e MapLibre

`src/production/components/weather-map.tsx` e componentes relacionados implementam o mapa regional.

Características atuais:

- MapLibre carregado client-side;
- marcador de Pelotas;
- marcador da estação operacional de radar;
- camada raster de radar;
- camada raster de satélite;
- pontos de trovoada;
- timeline/reprodução de quadros;
- opacidade e legenda;
- comparação contextual com previsão por hora;
- proteção contra SSR/hidratação;
- layout responsivo e controles de mapa.

## 10. Câmeras

A rota `/cameras-ao-vivo-pelotas` possui integração de vídeo com YouTube e regras para distinguir live, replay e contingência.

O código ativo de câmera está em `src/lib/cameras/*.server.ts` e componentes associados.

A disponibilidade de uma transmissão é externa ao portal; a interface deve sinalizar claramente quando uma live não está disponível em vez de apresentar vídeo gravado como transmissão atual.

## 11. Histórico, snapshots e precisão

O projeto mantém três conceitos separados:

### Histórico climático

- página pública de 30 dias;
- séries de temperatura máxima/mínima, chuva e vento/rajadas;
- combinação de fonte histórica externa com arquivo próprio quando aplicável;
- estados vazios e fallback editorial;
- metadados de período e origem.

### Snapshots meteorológicos

- captura periódica de estado meteorológico;
- persistência no Supabase;
- upsert/idempotência;
- rota protegida de cron;
- uso futuro como arquivo próprio de observações/previsões.

### Precisão de previsão

- armazenamento/arquivo de previsões;
- comparação posterior com observação Embrapa;
- contratos automatizados para evitar degradação silenciosa;
- painel/uso editorial de métricas conforme implementado no produto.

## 12. Weather AI / Gemini

Documentação: `docs/weather-ai-snapshots.md`.

A IA meteorológica não é chamada a cada acesso de usuário. O modelo atual utiliza geração persistida e controlada.

Características:

- `GEMINI_API_KEY` somente server-side;
- modelo configurável por `GEMINI_MODEL`;
- flag `GEMINI_WEATHER_ENABLED`;
- teto mensal de chamadas reais;
- fingerprint material antes de chamar IA;
- reaproveitamento de texto compatível quando possível;
- fallback determinístico quando IA, banco ou configuração não estiverem disponíveis;
- snapshot persistido;
- execução via workflow GitHub Actions com OIDC.

Agenda atual do workflow `Weather AI snapshots`:

- 23:00;
- 05:00;
- 11:00;
- 17:00.

Horários em `America/Sao_Paulo` conforme comentário operacional do workflow.

## 13. Supabase, banco e persistência

O projeto utiliza Supabase externo, separado entre uso público/browser e uso administrativo server-side.

Princípios:

- clientes browser e server separados;
- chave administrativa nunca enviada ao cliente;
- RLS como camada de isolamento;
- migrations versionadas em `supabase/migrations/`;
- schema/objetos privados quando necessário;
- snapshots e dados operacionais persistidos no servidor;
- privilégios mínimos para fluxos públicos;
- validação de advisors e políticas conforme documentação de segurança.

Estado atual: banco, migrations e endurecimento de RLS estão implantados, mas o ciclo completo com **duas contas descartáveis** ainda deve ser validado em navegador real para confirmar isolamento, consentimento, exportação e exclusão ponta a ponta.

## 14. Autenticação, conta e LGPD

O fluxo usa Supabase Auth com Google OAuth.

Rotas principais:

- `/entrar`;
- `/conta`;
- `/auth/callback`;
- `/auth/signout`.

APIs de direitos do titular:

- `/api/account/export`;
- `/api/account/delete`.

Recursos existentes:

- PKCE/callback server-side;
- sessão por cookies SSR;
- logout;
- conta autenticada;
- consentimentos versionados;
- exportação dos dados;
- exclusão de conta/dados com fluxo protegido;
- página `/privacidade-e-dados`.

Pendência principal: validação E2E real com duas contas descartáveis e registro da evidência operacional.

## 15. APIs internas e endpoints funcionais

### Conta

- `/api/account/export`;
- `/api/account/delete`.

### Crons

- `/api/cron/embrapa`;
- `/api/cron/forecast-accuracy`;
- `/api/cron/push-daily`;
- `/api/cron/weather-snapshot`.

### REDEMET

- `/api/redemet/radar`;
- `/api/redemet/satellite`;
- `/api/redemet/storms`;
- `/api/redemet/image`.

### Meteorologia

- `/api/weather/embrapa`;
- `/api/weather/hourly-precipitation`.

### INMET

- `/api/inmet/geadas`.

### Web Push

- `/api/push/config`;
- `/api/push/subscription`;
- `/api/push/broadcast`.

Os endpoints de push existem no código, mas a ativação pública do PWA/Web Push permanece suspensa.

### Widgets

- `/api/widgets/nivel-laranjal`.

### Embeds

- `/embed/nivel-laranjal`;
- `/embed/status-tempo-agora`.

## 16. SEO, GEO e dados estruturados

O portal possui camada técnica de SEO centralizada.

Estado atual:

- host canônico `https://tempopelotas.com.br`;
- canonicals por rota;
- redirecionamento/consolidação de variantes de host;
- sitemap construído a partir de `PUBLIC_ROUTES`;
- `robots.txt`;
- Open Graph;
- Twitter Cards;
- imagem social raster 1200×630;
- Schema.org centralizado;
- `WebSite`, `WebPage`, `BreadcrumbList` e schemas editoriais por página;
- dados estruturados específicos somente onde o conteúdo os sustenta;
- JSON Feed;
- `pelotas.json` como contrato público de dados/transparência;
- páginas regionais com metadados geográficos próprios;
- conteúdo editorial, FAQs e links internos por intenção;
- alias técnicos e feeds fora da indexação quando apropriado.

Baseline de Search Console: `docs/SEO_GSC_BASELINE_2026-08-16.md`.

## 17. PWA e Web Push

Documentação: `docs/web-push.md`.

O código de PWA/Web Push foi desenvolvido e preservado, incluindo:

- service worker;
- manifesto;
- subscription/unsubscribe;
- VAPID;
- envio paginado;
- leases/limpeza de endpoints;
- APIs de configuração e broadcast.

**Estado atual: ativação pública suspensa.**

Motivo operacional: reativação deve ocorrer somente em implantação controlada e teste real em Chrome normal, anônimo, mobile e perfis com extensões, sem regressão de rolagem ou mutações globais de `body`.

## 18. Segurança e secrets

Fonte de configuração: `.env.example`.

Regras permanentes:

- nenhum secret real é versionado;
- arquivos `.env` privados são ignorados pelo Git;
- variáveis server-only não usam prefixo `VITE_`;
- REDEMET, Gemini, Supabase administrativo, cron e VAPID privado ficam somente no servidor;
- `.env.example` contém nomes e defaults seguros, nunca valores de produção;
- logs e relatórios devem ser sanitizados;
- HARs são tratados como confidenciais e não entram no repo;
- proxy de imagem externa usa allowlist e validação;
- endpoints sensíveis validam autenticação/segredo/identidade conforme seu domínio.

Grupos de configuração existentes no template:

- Supabase público e server-side;
- cron;
- VAPID/Web Push;
- Gemini/Weather AI;
- REDEMET;
- URL canônica do site.

## 19. GitHub Actions e observabilidade

Existem cinco workflows ativos em `.github/workflows/`.

### `quality.yml` — Qualidade

Dispara em push na `main`, branches `agent/**`, pull request para `main` e manualmente.

Valida:

- template de ambiente;
- contratos rápidos;
- contrato Weather AI;
- árvore de rotas;
- build de produção;
- rotas públicas;
- TypeScript;
- ESLint incremental.

### `cutover-smoke.yml` — Smoke test de cutover

Valida o domínio público em mudanças relevantes e manualmente.

Executa:

- `scripts/cutover-smoke.mjs`;
- `scripts/seo-production-smoke.mjs`;
- relatório de artefato com retenção de 30 dias.

### `runtime-smoke.yml` — Runtime de produção

Executa às 06:00 e 18:00 em horário de Brasília e também em pushes que alteram REDEMET/hidrologia relevantes.

Valida:

- publicação da página de radar;
- REDEMET configurada;
- radar/satélite/STSC;
- proxy de imagem;
- ausência de marcadores sensíveis;
- home hidrológica;
- página de situação hidrológica;
- Guaíba e estações regionais.

### `visual-parity.yml` — Auditoria visual de paridade

Protege regressões visuais e de acessibilidade em áreas editoriais relevantes, incluindo navegação, footer e comportamento mobile.

### `weather-ai-snapshots.yml` — Weather AI snapshots

Executa quatro vezes ao dia e manualmente, com GitHub OIDC e endpoint protegido de geração persistida.

## 20. Testes e contratos

A suíte de contratos cobre, entre outros domínios:

- níveis de água;
- Web Push;
- segurança de banco;
- conta/autenticação;
- centralização Embrapa;
- precisão de previsão;
- resiliência Open-Meteo;
- runtime/Lovable;
- rolagem/PWA;
- integridade meteorológica;
- fontes INMET;
- reconciliação de temperatura;
- REDEMET e contratos HAR;
- coerência editorial da Home;
- páginas Hoje/Amanhã/7 dias/Chuva/Vento;
- radar/satélite;
- inteligência atmosférica;
- meteograma;
- clima;
- histórico;
- estação Embrapa;
- câmeras;
- geadas;
- hidrologia;
- páginas regionais;
- SEO e acessibilidade;
- integrações Guaíba/SACE;
- bootstrap/árvore de rotas.

A regra atual de lint é incremental para impedir nova dívida sem misturar uma limpeza histórica global com mudanças funcionais.

## 21. Deploy, Lovable e disciplina de Git

O projeto é conectado ao Lovable. Commits enviados à branch conectada sincronizam para o editor.

Regras:

- não reescrever histórico publicado com force-push/rebase destrutivo;
- manter commits pequenos e coerentes;
- preservar a `main` em estado buildável;
- verificar `Qualidade` após mudanças funcionais;
- usar smoke/runtime para validar integrações externas e domínio público;
- evitar alterações automáticas do Lovable fora do escopo; quando ocorrerem, revisar e reverter mudanças colaterais.

Runbooks:

- `CUTOVER_LOVABLE.md`;
- `docs/PRODUCTION_CUTOVER.md`;
- `docs/RUNTIME_READINESS.md`.

## 22. Pesquisa CPTEC / INPE / SIGMA

Documentação: `docs/CPTEC_SIGMA_RESEARCH.md`.

**Não é dependência de produção.**

A pesquisa de agosto de 2026 identificou tecnicamente:

- radar Canguçu CAPPI 3 km, código SIGMA 4962;
- radar Santiago CAPPI 3 km, código 4965;
- PPI de vento Santiago, código 8323;
- GLM, código 2305;
- Hidroestimador, incluindo 6353/6354;
- FORTRACC +30/+60/+90/+120 min, códigos 6891–6894;
- produtos GOES-19;
- WMS/MapServer do SIGMA em EPSG:3857.

Os HARs indicaram Canguçu desatualizado e Santiago operacional no período analisado, corroborando a decisão do radar REDEMET.

A integração pública com CPTEC/SIGMA foi deliberadamente adiada para revisão em novembro/dezembro de 2026. Até lá:

- não consumir os produtos no runtime público;
- não criar dependência de WMS SIGMA;
- não versionar os HARs;
- manter a pesquisa apenas como backlog técnico.

## 23. Documentos especializados

| Documento | Finalidade |
| --- | --- |
| `MIGRATION_MATRIX.md` | Matriz histórica de migração, paridade e critérios de aceite |
| `MIGRATION.md` | Estratégia e histórico da migração |
| `docs/REDEMET_OPERATIONS.md` | Fonte operacional da integração REDEMET |
| `docs/CPTEC_SIGMA_RESEARCH.md` | Pesquisa futura CPTEC/SIGMA, sem integração produtiva |
| `docs/RUNTIME_READINESS.md` | Preflight e requisitos do runtime |
| `docs/PRODUCTION_CUTOVER.md` | Runbook de corte/produção |
| `CUTOVER_LOVABLE.md` | Operação de publicação pelo Lovable |
| `docs/SEO_GSC_BASELINE_2026-08-16.md` | Baseline Search Console e SEO |
| `docs/weather-ai-snapshots.md` | Arquitetura Weather AI persistida |
| `docs/weather-snapshots.md` | Snapshots meteorológicos |
| `docs/web-push.md` | Arquitetura Web Push/PWA |
| `docs/auth-account.md` | Conta, autenticação e direitos do titular |
| `docs/auth-production-validation-2026-07-29.md` | Evidências e validações de auth |
| `docs/open-meteo-production-resilience-2026-07-29.md` | Resiliência Open-Meteo |
| `WEATHER_PAGE_IDENTITY.md` | Identidade e consistência das páginas meteorológicas |
| `docs/EXACT_PRODUCTION_CSS_STACK.md` | Stack CSS de produção |

## 24. Pendências reais atuais

Estas são pendências de produto/operação, não funcionalidades inexistentes disfarçadas de prontas:

1. executar e registrar E2E de autenticação com duas contas descartáveis, incluindo isolamento RLS, consentimentos, exportação, logout e exclusão;
2. reativar PWA/Web Push somente após validação controlada de navegador e rolagem;
3. executar auditoria final WCAG 2.2 AA, Core Web Vitals e responsividade ampla;
4. formalizar rollback de aplicação, banco, DNS e caches;
5. continuar monitorando a disponibilidade das fontes externas, principalmente radar REDEMET e hidrologia regional;
6. retomar avaliação CPTEC/SIGMA em novembro/dezembro de 2026, sem assumir previamente autorização ou integração;
7. manter a limpeza de dívida histórica de lint/formatação separada de mudanças funcionais.

## 25. Regra de manutenção deste arquivo

Atualizar `PROJECT_CURRENT_STATE.md` no mesmo conjunto de mudanças sempre que ocorrer qualquer uma das situações abaixo:

- criação, remoção ou renomeação de página pública;
- nova cidade/região;
- ativação, suspensão ou retirada de funcionalidade;
- nova fonte meteorológica/hidrológica;
- alteração de fonte primária ou fallback;
- nova integração externa;
- mudança de API pública/interna relevante;
- novo cron/workflow;
- mudança de arquitetura de banco/auth;
- alteração importante de SEO/indexação;
- nova variável de ambiente estrutural;
- mudança de estado de PWA/Web Push;
- mudança de estratégia de deploy/runtime;
- conclusão ou criação de uma pendência estrutural importante.

O objetivo é que uma pessoa possa abrir este arquivo meses depois e responder rapidamente: **o que o Tempo Pelotas faz hoje, de onde vêm os dados, como opera e o que ainda não está concluído?**
