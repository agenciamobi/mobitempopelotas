# Tempo Pelotas — estado atual do projeto

Última atualização: 20/08/2026  
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
| Interface pública | Ativo | Home, páginas internas/dedicadas e páginas institucionais compartilham o mesmo header/footer editorial, rail de conteúdo e contrato de superfícies da Home; a rota histórica de 2024 foi corrigida para não duplicar o chrome global |
| Home meteorológica | Ativo | Header e hero editoriais; próximas horas e tendência semanal em capítulos separados; tendência posicionada imediatamente antes da central de radar/satélite; alertas e blocos locais autocontidos |
| Previsão hoje/amanhã/7 dias | Ativo | Páginas dedicadas e conteúdo indexável |
| Chuva, vento e meteograma | Ativo | Visões temáticas e hora a hora |
| Alertas oficiais | Ativo | INMET e conteúdo preventivo claramente separado |
| Estação Embrapa | Ativo | Observação local, timestamp e estado de atualidade |
| Radar REDEMET | Ativo com dependência externa | Santiago (`sg`) é a estação operacional preferencial; Canguçu (`cn`) é fallback quando voltar a fornecer imagem |
| Satélite REDEMET | Ativo | Realçada, infravermelho e visível |
| Trovoadas STSC | Ativo | Contrato atual da API REDEMET e filtro regional |
| Mapa regional MapLibre | Ativo | Camadas de radar, satélite e trovoadas |
| Hidrologia | Ativo | Laranjal, Lagoa dos Patos, Guaíba e rede regional |
| Rede Hidrometeorológica Defesa Civil RS | Pesquisa / inventário | API GraphQL e contratos técnicos identificados; ainda não é fonte ativa do runtime público. Próximo passo é inventariar códigos, bacias e capacidades das estações e revisar condições de uso |
| Histórico climático | Ativo | Janela de 30 dias com fonte/fallback documentados |
| Registro histórico da enchente de 2024 | Ativo | Rota pública `/enchente-2024-pelotas-laranjal` registra a linha do tempo da cheia, a propagação Guaíba → Lagoa dos Patos → Pelotas/Laranjal → estuário e a fase de reconstrução |
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

O inventário atual possui **45 rotas públicas indexáveis**: 22 rotas fixas, contando Home e institucionais/editoriais, mais 23 páginas regionais de cidades.

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
- `/enchente-2024-pelotas-laranjal`
- `/cameras-ao-vivo-pelotas`
- `/tempo-na-regiao-sul-rs`
- `/blog`
- `/status-dos-dados`
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

### Rede Hidrometeorológica da Defesa Civil RS — pesquisa

Documentação de planejamento: `docs/DEFESA_CIVIL_RS_HYDROMET_PLAN.md`.

A API GraphQL e os contratos de consulta/histórico/nowcasting foram identificados tecnicamente, mas a rede **ainda não é consumida pelo runtime público**. O próximo passo é obter o inventário completo de estações `DCRS-xxxxx`, associar código, nome, coordenadas, bacia e capacidades e somente então selecionar os pontos de produção.

A regra de seleção já foi definida:

- para meteorologia, interessa a rede regional ao sul de Porto Alegre e no entorno da Lagoa dos Patos quando houver sensores válidos e leitura recente;
- para hidrologia, entram somente estações ligadas fisicamente ao Guaíba/Lagoa dos Patos, afluentes relevantes da Bacia do Camaquã, sistema Mirim–São Gonçalo, orla da Lagoa e estuário de Rio Grande;
- proximidade geográfica isolada não transforma uma estação em contexto hidrológico;
- as cores dos produtos de chuva da rede não devem ser interpretadas como limiares de alerta.

As condições de uso devem ser revisadas antes da ativação pública/comercial da nova fonte.

### Registro histórico da enchente de 2024

A rota pública e indexável `/enchente-2024-pelotas-laranjal` funciona como registro histórico permanente da enchente de 2024 em Pelotas e no Laranjal. A página é organizada como linha do tempo e adiciona uma segunda camada visual indicando em que trecho do sistema hidrológico estava o problema: Centro/Norte do RS → rios da Bacia do Guaíba → Guaíba → Lagoa dos Patos → Pelotas/Laranjal e Canal São Gonçalo → estuário de Rio Grande → retorno/reconstrução.

Os valores históricos preservam a referência das fontes e réguas utilizadas à época. Valores absolutos de estações diferentes não devem ser comparados diretamente quando datum, referência altimétrica ou método de medição forem distintos.

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

Na Home, o monitoramento é apresentado como uma **central Civic Tech / Scientific autocontida**. A tendência semanal encerra a leitura de previsão imediatamente antes do radar. A central usa barra plana de camadas para Radar, Satélite e Trovoadas, mapa como protagonista, timeline técnica clara separada visualmente da imagem, fonte/estado de disponibilidade visíveis e um guia editorial de interpretação. A rota `/radar-e-satelite-pelotas` continua sendo o aprofundamento público do tema.

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
- coesão visual entre Home e páginas internas/dedicadas;
- páginas Hoje/Amanhã/7 dias/Chuva/Vento;
- radar/satélite;
- inteligência atmosférica;
- meteograma;
- clima;
- histórico;
- registro histórico da enchente de 2024;
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

A interface pública usa a Home como fonte de verdade visual: `HomeEditorialHeader`, footer editorial com faixa de utilidade pública, rail de 1440 px no desktop e superfícies brancas de borda discreta/radius suave são compartilhados pelas páginas públicas, preservando componentes e conteúdo específicos de cada rota.

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
| `docs/DEFESA_CIVIL_RS_HYDROMET_PLAN.md` | Pesquisa e plano de integração meteorológica/hidrológica da Rede da Defesa Civil RS; ainda sem consumo produtivo |
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
7. concluir o inventário de estações da Rede Hidrometeorológica da Defesa Civil RS, revisar condições de uso e validar bacias/unidades antes de qualquer ativação pública;
8. manter a limpeza de dívida histórica de lint/formatação separada de mudanças funcionais.

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

## 26. Direção de produto aprovada — Tempo Pelotas público e Tempo Pelotas PRO

A próxima evolução estrutural do projeto é transformar a área autenticada em um produto pago, mantendo o portal público útil, aberto e editorialmente simples.

A regra central passa a ser:

> **O Tempo Pelotas público informa. O Tempo Pelotas PRO analisa, compara, acompanha e interpreta.**

O PRO não deve cobrar pelo simples acesso a uma imagem de satélite, radar, aviso oficial ou dado que já faz sentido permanecer público. O valor comercial deve vir da profundidade, organização, histórico, cruzamento entre fontes, personalização, alertas avançados, dados derivados e interpretação assistida por IA.

### 26.1. Papel do portal público

O portal público deve responder rapidamente às perguntas mais comuns:

- como está o tempo agora;
- vai chover e em qual janela;
- qual é a previsão resumida para as próximas horas e dias;
- existe alerta oficial;
- como está o nível da Lagoa e a situação das águas;
- onde consultar radar, satélite e câmeras;
- quais são as principais medições locais.

O front público deve continuar funcional sem autenticação, sem assinatura e sem chamada de IA no caminho crítico. A direção visual deve privilegiar informação simples, leitura editorial, identidade local e boa hierarquia, evitando transformar a Home em um dashboard técnico.

### 26.2. Papel do PRO

O PRO será a camada de inteligência meteorológica e hidrológica para usuários que precisam acompanhar Pelotas e a região em maior profundidade.

O produto pago deve concentrar, progressivamente:

- previsão horária expandida;
- comparação entre fontes e modelos;
- séries temporais e históricos ampliados;
- acumulados de chuva;
- evolução de temperatura, pressão, umidade, vento e rajadas;
- comparação entre estações;
- evolução hidrológica regional;
- mais camadas em mapas, radar e satélite quando as fontes e permissões permitirem;
- linhas do tempo e contexto temporal mais detalhado;
- filtros por período e variável;
- favoritos e locais de interesse;
- dashboards configuráveis;
- alertas personalizados;
- exportação de dados e relatórios quando a origem permitir;
- indicadores e dados derivados do próprio Tempo Pelotas;
- análises automáticas com IA;
- comparação interpretativa de cenários;
- resumo do que mudou desde a última atualização;
- consulta orientada aos dados em linguagem natural em etapa posterior.

A primeira versão comercial deve preferir **um único plano PRO**. Não criar múltiplos tiers antes de existir evidência real de uso que justifique segmentação.

## 27. Limite permanente para IA no produto

A IA é uma camada opcional de interpretação e nunca uma dependência para acesso aos dados meteorológicos e hidrológicos.

### 27.1. Front público

Regra permanente:

- não criar novos recursos públicos que chamem IA por acesso de página;
- não expor chave, SDK ou chamada de modelo no navegador;
- preferir regras determinísticas, templates, cálculos, reconciliação de fontes e snapshots persistidos;
- manter fallback determinístico sempre disponível;
- manter alertas oficiais independentes de IA;
- não permitir que IA altere, substitua ou produza um aviso oficial.

A exceção existente é o Weather AI atual, que já opera como snapshot editorial server-side, fora do carregamento da página, com quatro oportunidades diárias, fingerprint, reaproveitamento e teto mensal. Esse mecanismo pode permanecer enquanto for útil, mas não deve servir como justificativa para espalhar IA pelo front público.

### 27.2. PRO

No PRO, IA passa a ser parte legítima da proposta de valor, desde que continue controlada por orçamento e rastreabilidade.

Toda utilidade de IA do PRO deve obrigatoriamente possuir:

- identificador de recurso;
- finalidade clara;
- limite diário próprio;
- eventual limite mensal financeiro;
- modelo configurável;
- cache e TTL;
- fingerprint dos dados utilizados quando aplicável;
- fallback não-IA ou estado explícito de indisponibilidade;
- log de execução;
- custo estimado;
- motivo da execução;
- política de exceção;
- kill switch.

A regra deve ser **limite por utilidade**, e não um único contador genérico para toda a plataforma.

Exemplos de utilidades futuras:

- `pro_weather_summary` — resumo refinado do cenário atual;
- `pro_model_comparison` — comparação entre modelos/fontes;
- `pro_change_detection` — o que mudou desde a análise anterior;
- `pro_risk_interpretation` — interpretação de risco nas próximas horas sem substituir alertas oficiais;
- `pro_hydrology_summary` — síntese da evolução das águas;
- `pro_ask_data` — consulta explícita do assinante aos dados.

Análises compartilhadas devem ser pré-geradas e reutilizadas por todos os assinantes enquanto os dados de origem forem compatíveis. Não gerar a mesma interpretação para cada pageview.

Consultas realmente personalizadas, como `pro_ask_data`, devem consumir cota diária por usuário e existir somente após ação explícita do assinante.

Exceções acima da cota normal só podem ocorrer por regra registrada, por exemplo evento severo, necessidade operacional ou acionamento administrativo. Toda exceção deve ficar auditável.

## 28. Leitura do estado atual para chegada do PRO

A base técnica atual reduz bastante o trabalho necessário para o produto pago, mas ainda não existe uma camada comercial completa.

### 28.1. O que já pode ser reaproveitado

- autenticação Google com Supabase Auth;
- sessão SSR por cookies;
- rota amigável `/conta`;
- RLS e padrões de isolamento já existentes;
- perfil do usuário;
- preferências e consentimentos versionados;
- exportação e exclusão de conta;
- histórico/snapshots meteorológicos;
- observação Embrapa centralizada;
- arquivo de precisão de previsão;
- mapa MapLibre e camadas meteorológicas existentes;
- radar, satélite e STSC;
- hidrologia regional;
- Recharts;
- rotinas server-side e crons;
- Weather AI persistido e seu padrão de orçamento;
- contratos automatizados e workflows de qualidade;
- Lovable para sincronização/publicação do código conectado à `main`.

### 28.2. O que ainda não existe

No estado atual não há evidência no runtime de:

- produto/plano comercial PRO;
- provedor de cobrança definido;
- checkout;
- customer portal de cobrança;
- webhooks de pagamento;
- tabela de assinaturas;
- estado de pagamento normalizado;
- entitlement PRO;
- guard server-side por recurso premium;
- dashboard PRO separado da conta;
- catálogo de features premium;
- limite diário de IA por utilidade e por usuário;
- camada de analytics de conversão/receita;
- política documentada de uso comercial para cada nova fonte que venha a compor o PRO.

O `package.json` atual também não contém SDK específico de cobrança. A escolha do provedor deve ser feita antes da fase de checkout, sem acoplar o modelo de dados central a um fornecedor específico.

## 29. Arquitetura de infraestrutura para o PRO

### 29.1. GitHub

O repositório operacional permanece `agenciamobi/mobitempopelotas`, branch `main`.

A implementação do PRO será feita diretamente na `main`, sem PR, conforme decisão operacional atual. Isso aumenta a importância de:

- commits pequenos;
- feature flags;
- migrations compatíveis com versões anteriores;
- CI antes de ativar recurso;
- não misturar alteração estrutural de banco, cobrança e grande refino visual no mesmo commit;
- nunca depender de force-push para correção.

### 29.2. Lovable

Lovable é o ambiente conectado de deploy, preview e sincronização do projeto.

**Lovable não gerencia o Supabase deste projeto.**

O código pode ser publicado pelo fluxo conectado ao Lovable, mas o banco de dados não deve ser considerado aplicado, migrado ou validado apenas porque uma alteração chegou ao deploy da aplicação.

### 29.3. Supabase

O Tempo Pelotas usa **Supabase externo**.

O repositório mantém as migrations como fonte versionada da evolução do schema, mas aplicar uma migration ao ambiente oficial é uma etapa independente do deploy do Lovable.

Regra para o PRO:

1. criar migration retrocompatível no GitHub;
2. revisar RLS, grants, funções e impactos de LGPD;
3. aplicar no Supabase externo oficial;
4. regenerar tipos quando necessário;
5. validar o schema aplicado;
6. somente depois habilitar no runtime a feature que depende daquela migration.

Enquanto o Supabase externo não estiver acessível por ferramenta nesta sessão de trabalho, alterações de banco podem ser preparadas no repositório, mas **não podem ser declaradas como implantadas ou validadas em produção**.

## 30. Modelo de dados alvo do PRO

Os nomes definitivos podem ser ajustados na implementação, mas o domínio deve separar identidade, cobrança, entitlement, preferências de produto e consumo de IA.

### 30.1. Cobrança e entitlement

Estrutura recomendada:

- `products` — produto lógico, inicialmente `tempo_pelotas_pro`;
- `plans` — preço/ciclo e configuração comercial, inicialmente um plano principal;
- `billing_customers` — vínculo entre usuário e identificador do provedor;
- `subscriptions` — estado normalizado da assinatura;
- `subscription_events` — eventos recebidos do provedor, com idempotência;
- `entitlements` — direitos efetivos concedidos ao usuário.

`subscriptions` não deve ser consultada pelo browser para decidir acesso. O backend resolve entitlement e entrega somente o necessário para a interface.

Estados mínimos a normalizar, independentemente do provedor escolhido:

- `incomplete`;
- `active`;
- `past_due`;
- `canceled`;
- `expired`.

Se existir trial, grace period ou cancelamento ao fim do ciclo, a regra deve ser explícita e testada.

### 30.2. Preferências PRO

Estrutura recomendada:

- `saved_locations` — locais/estações favoritos quando a funcionalidade existir;
- `dashboard_preferences` — organização e filtros do painel;
- `alert_rules` — regras personalizadas de chuva, vento, nível ou outros indicadores;
- `report_preferences` — configuração de relatórios quando implementados.

### 30.3. IA PRO

Estrutura recomendada:

- `ai_feature_policies` — limites, modelo, TTL, flag e política por utilidade;
- `ai_daily_usage` — contador diário por utilidade e escopo;
- `ai_usage_events` — log individual de tentativa/execução;
- `ai_artifacts` — análises persistidas e reutilizáveis;
- `ai_user_queries` — apenas se `Pergunte aos dados` for lançado, com retenção mínima e política própria.

O mecanismo existente de `weather_ai_snapshots`, `weather_ai_monthly_usage` e `weather_ai_calls` deve ser preservado durante a transição. A unificação só deve ocorrer quando o novo gerenciador de orçamento estiver coberto por testes e sem risco de aumentar chamadas públicas.

## 31. Entitlement e segurança de acesso

O PRO precisa ser protegido no servidor. Esconder componente React não é controle de acesso.

A aplicação deve evoluir para helpers server-side equivalentes a:

- `requireAuthenticatedUser()`;
- `getUserSubscription()`;
- `getUserEntitlements()`;
- `requireEntitlement("pro")`;
- `requireFeature("model_comparison")`.

Regras:

- usuário não autenticado não acessa dados privados;
- usuário autenticado sem assinatura ativa pode acessar `/conta`, checkout e páginas públicas, mas não o painel PRO;
- usuário com entitlement ativo acessa os recursos contratados;
- estado do front nunca é fonte de verdade;
- resposta autenticada usa `private, no-store` e `Vary` apropriado;
- nenhuma rota premium deve entrar no sitemap;
- endpoints premium precisam de rate limit quando houver custo ou risco de abuso;
- RLS continua sendo defesa adicional, não substituto do guard da aplicação.

## 32. Cobrança — arquitetura antes de escolher provedor

O provedor de cobrança ainda deve ser definido. O núcleo do produto deve ser provider-agnostic.

Criar uma camada de adaptação com operações conceituais:

- criar checkout;
- consultar customer;
- abrir portal de cobrança;
- validar assinatura do webhook;
- normalizar evento;
- sincronizar assinatura;
- cancelar/agendar cancelamento.

Requisitos obrigatórios:

- webhook com validação criptográfica;
- idempotência por ID de evento;
- processamento seguro contra replay;
- log sanitizado;
- atualização de entitlement somente no servidor;
- reconciliação periódica opcional para detectar divergência entre banco local e provedor;
- nenhum secret de cobrança no cliente.

O fluxo de ativação alvo é:

`checkout confirmado -> webhook válido -> subscription normalizada -> entitlement ativo -> acesso ao /painel`.

Não liberar PRO apenas pelo retorno do navegador após o checkout.

## 33. Arquitetura de rotas recomendada

Separar claramente marketing, conta e produto autenticado.

### Pública e indexável

- `/pro` — apresentação do produto, diferenciais, preço e CTA;

### Autenticada, noindex

- `/conta` — identidade, assinatura, cobrança, privacidade e sessão;
- `/painel` — visão geral do PRO;
- `/painel/tempo` — previsão detalhada e séries;
- `/painel/mapas` — camadas avançadas quando disponíveis;
- `/painel/modelos` — comparação de fontes/modelos;
- `/painel/aguas` — hidrologia detalhada;
- `/painel/historico` — séries e comparação temporal;
- `/painel/analises` — análises automáticas/IA;
- `/painel/alertas` — regras personalizadas quando o canal estiver validado.

Não é obrigatório lançar todas as subrotas na primeira versão. O shell deve permitir crescimento sem transformar `/conta` no dashboard técnico.

## 34. Escopo recomendado para o primeiro PRO em produção

A primeira versão paga deve ser forte o suficiente para justificar assinatura, mas menor que a visão final.

### MVP comercial recomendado

1. dashboard PRO com situação atual refinada;
2. previsão horária mais extensa e filtros;
3. gráficos de temperatura, chuva, vento/rajadas e pressão quando disponíveis;
4. histórico e comparação temporal já sustentados pelo arquivo atual;
5. hidrologia detalhada com evolução e comparação entre pontos disponíveis;
6. mapa com controles e camadas adicionais que tenham uso/licença confirmados;
7. comparação de duas ou mais fontes/modelos onde os dados forem estruturados e confiáveis;
8. bloco `O que mudou`;
9. resumo inteligente PRO compartilhado e persistido;
10. tela de assinatura/estado de pagamento na conta.

### Pode entrar após o primeiro lançamento

- `Pergunte aos dados`;
- relatórios PDF recorrentes;
- exportações amplas;
- alertas push avançados;
- e-mail transacional/alertas por e-mail;
- mais locais favoritos;
- novos níveis de assinatura;
- API comercial para terceiros.

## 35. Diferença de produto entre público e PRO

| Domínio | Público | PRO |
| --- | --- | --- |
| Agora | leitura simples | leitura refinada + séries/contexto |
| Próximas horas | resumo | horizonte maior, filtros e gráficos |
| Próximos dias | tendência simples | comparação, evolução e divergências |
| Radar/satélite | visualização base | mais contexto, camadas/timeline conforme permissões |
| Alertas oficiais | sempre públicos | públicos + contexto e personalização, sem substituir fonte oficial |
| Lagoa/águas | nível e tendência principal | histórico, comparação, filtros e análise |
| Histórico | visão pública limitada | histórico ampliado e comparação |
| Modelos/fontes | fonte editorial consolidada | comparação explícita e divergências |
| IA | somente mecanismo público já existente e controlado | análises refinadas, quotas por utilidade e recursos personalizados |
| Exportação | apenas direitos LGPD da conta | dados/relatórios do produto quando permitido |
| Personalização | preferências básicas | dashboard, favoritos, alertas e configurações avançadas |

## 36. Governança das fontes antes da monetização

O PRO não pode ser construído partindo do pressuposto de que toda informação publicamente acessível pode ser redistribuída comercialmente sem restrição.

Antes de uma fonte ganhar uso novo dentro do produto pago, registrar:

- instituição/fonte;
- produto ou endpoint;
- formato;
- acesso autenticado ou público;
- permissão de uso público;
- permissão de uso comercial;
- regras de redistribuição;
- regras de cache/armazenamento;
- possibilidade de gerar dados derivados;
- atribuição obrigatória;
- limites de uso/rate limit;
- contato ou documento de referência;
- data da última revisão;
- decisão: `PUBLIC`, `PRO_ALLOWED`, `DERIVED_ONLY`, `VIEW_ONLY`, `BLOCKED`, `REVIEW`.

Princípios:

- não cobrar pela simples ocultação de um produto oficial que já é adequado ao portal aberto;
- cobrar pela experiência, processamento, organização, histórico, comparação e interpretação desenvolvidos pelo Tempo Pelotas;
- não extrair números por OCR de imagens para transformá-los em feed operacional sem endpoint estruturado e validação;
- preservar atribuição visível;
- manter CPTEC/SIGMA fora do runtime até a revisão institucional já planejada;
- revisar qualquer nova camada REDEMET, INMET, ANA, SIMAGRO ou outra fonte antes de torná-la diferencial comercial.

## 37. Design e UX do PRO

A área pública e o PRO devem compartilhar identidade, mas não densidade.

### Público

Direção:

- editorial;
- data journalism;
- identidade local;
- informação simples;
- poucas bordas e pouco ruído;
- fotografia regional quando fizer sentido;
- sem aparência de SaaS técnico na Home.

### PRO

Direção:

- weather intelligence platform;
- maior densidade informacional;
- gráficos e comparação;
- controles e filtros claros;
- superfícies modulares;
- navegação persistente do painel;
- estados de atualização/fonte sempre visíveis;
- sem ornamentação que prejudique leitura técnica.

O PRO deve parecer mais poderoso que o front público, não apenas mais cheio.

## 38. Alertas, PWA e notificações no PRO

O código de Web Push existe, mas permanece suspenso para ativação pública enquanto a validação real de navegadores não for concluída.

Para o PRO:

- não usar Web Push como bloqueador do primeiro lançamento pago;
- primeiro validar novamente service worker, inscrição, unsubscribe, permissões e rolagem;
- depois vincular alertas personalizados a `alert_rules`;
- deduplicar eventos;
- aplicar cooldown;
- registrar entrega e falha;
- não transformar interpretação de IA em alerta oficial;
- sempre priorizar dados/avisos oficiais quando o assunto for evento severo.

## 39. LGPD, conta e cobrança no cenário PRO

A chegada da assinatura amplia o escopo dos direitos do titular e da política de privacidade.

Antes de produção:

- exportação da conta deve incluir os novos dados pessoais que façam sentido exportar;
- exclusão deve remover preferências e artefatos pessoais conforme a política definida;
- registros fiscais/financeiros que precisem de retenção legal não devem ser apagados cegamente por cascade;
- a política deve explicar quais dados de cobrança ficam no provedor e quais identificadores ficam no Tempo Pelotas;
- prompts/consultas pessoais à IA devem ter retenção mínima;
- logs de IA não devem registrar secrets nem dados desnecessários;
- regras de alertas/localizações devem ser tratadas como dados pessoais do usuário;
- consentimentos de marketing continuam separados de mensagens transacionais necessárias à assinatura.

## 40. Observabilidade de produto e custo

O PRO precisa nascer mensurável.

Métricas mínimas:

- visita à página `/pro`;
- clique para assinar;
- checkout iniciado;
- checkout concluído;
- assinatura ativa;
- cancelamento;
- falha/past due;
- conversão visitante -> assinatura;
- MRR/receita recorrente conforme o provedor;
- churn;
- assinantes ativos;
- usuários PRO ativos por período;
- uso por módulo;
- custo de IA por utilidade;
- custo de IA por assinante;
- cache hit de análises compartilhadas;
- chamadas evitadas por fingerprint;
- erros por fonte externa;
- tempo de resposta dos módulos PRO;
- falhas de entitlement/webhook.

Não registrar conteúdo pessoal de forma desnecessária apenas para analytics.

## 41. Contratos e testes que devem existir antes do lançamento

Criar cobertura específica do PRO sem depender apenas de teste visual.

Contratos mínimos:

- usuário anônimo não acessa `/painel`;
- usuário autenticado sem entitlement não acessa PRO;
- assinatura ativa concede entitlement;
- assinatura cancelada expira conforme regra comercial;
- webhook duplicado não duplica evento nem entitlement;
- webhook inválido é recusado;
- retorno de checkout sem webhook válido não libera acesso;
- RLS impede leitura de assinatura/preferências de outro usuário;
- rota PRO é `noindex`;
- `/pro` pública permanece indexável;
- quota diária de IA bloqueia chamada excedente;
- exceção de IA exige motivo permitido;
- cache/fingerprint evita nova chamada quando aplicável;
- falha de IA não torna o painel meteorológico indisponível;
- front público continua sem chamada direta de IA;
- nenhum secret de cobrança, Gemini ou Supabase administrativo aparece no bundle cliente;
- exclusão/exportação tratam as novas tabelas de forma coerente;
- build, typecheck, lint incremental e árvore de rotas continuam verdes.

E2E real obrigatório antes do lançamento:

1. conta A sem assinatura;
2. conta B com assinatura ativa;
3. tentativa de isolamento cruzado;
4. checkout sandbox;
5. ativação por webhook;
6. acesso ao painel;
7. cancelamento;
8. expiração/estado final;
9. exportação de dados;
10. exclusão da conta conforme política;
11. login/logout em navegador real;
12. validação mobile.

## 42. Feature flags para implantação segura na `main`

Como o trabalho será feito diretamente na `main`, recursos estruturais devem nascer desativados até o ambiente estar pronto.

Flags recomendadas:

- `PRO_ENABLED`;
- `PRO_BILLING_ENABLED`;
- `PRO_AI_ENABLED`;
- `PRO_ALERTS_ENABLED`;
- `PRO_MODEL_COMPARISON_ENABLED`.

Regras:

- flags estruturais devem ser avaliadas server-side quando protegem acesso/custo;
- não usar flag cliente como segurança;
- página pública `/pro` pode ser publicada antes do checkout, se deixar claro o estado comercial;
- `/painel` não deve ser habilitado em produção antes de schema, entitlement e E2E estarem confirmados.

## 43. Roadmap de implementação até produção

### Fase 0 — decisão e documentação

Estado: **iniciada por esta atualização**.

Entregas:

- consolidar público x PRO;
- congelar regra de IA pública;
- definir escopo inicial do PRO;
- registrar infraestrutura correta: Lovable para deploy, Supabase externo separado;
- manter `PROJECT_CURRENT_STATE.md` como fonte de direção.

Critério de saída: equipe consegue explicar o produto pago sem depender de decisões implícitas.

### Fase 1 — estabilizar a conta existente

Entregas:

- executar E2E com duas contas descartáveis;
- corrigir qualquer falha de RLS, callback, sessão, exportação ou exclusão;
- reconciliar documentação antiga que ainda mencione `/minha-conta` quando o fluxo vigente é `/conta`;
- garantir que a conta atual continue funcional antes de introduzir cobrança.

Critério de saída: autenticação e LGPD validadas ponta a ponta em produção/ambiente equivalente.

### Fase 2 — auditoria das fontes para uso PRO

Entregas:

- criar matriz de uso/licença;
- classificar fontes atuais;
- marcar quais dados podem ser públicos, PRO, derivados, apenas visualização ou dependem de revisão;
- impedir que uma camada incerta entre no MVP pago.

Critério de saída: todos os recursos do MVP PRO têm origem e regra de uso conhecidas.

### Fase 3 — fundação de banco e entitlement

Entregas no repositório:

- migrations de billing/subscription/entitlement;
- RLS e grants;
- tipos;
- helpers server-side;
- testes estáticos/de contrato;
- flags desligadas por padrão.

Checkpoint externo obrigatório:

- aplicar migrations no Supabase externo;
- validar schema real;
- validar duas contas;
- registrar evidência.

Critério de saída: entitlement pode ser calculado com segurança sem qualquer cobrança real ainda.

### Fase 4 — escolher e integrar cobrança

Entregas:

- escolher provedor;
- definir preço e ciclo;
- cadastrar produto/preço no provedor;
- implementar adapter;
- checkout server-side;
- webhook validado e idempotente;
- sincronização de assinatura;
- estado da assinatura em `/conta`;
- customer portal/cancelamento quando suportado;
- sandbox completo.

Critério de saída: pagamento de teste gera entitlement e cancelamento remove/agenda acesso conforme regra.

### Fase 5 — shell do painel PRO sem IA

Entregas:

- `/painel` protegido no servidor;
- navegação do painel;
- visão geral;
- data freshness e fontes visíveis;
- componentes reutilizando dados atuais;
- gráficos determinísticos;
- histórico/hidrologia detalhados;
- skeletons, empty states e erros por fonte;
- mobile e acessibilidade.

Critério de saída: já existe valor real suficiente no PRO mesmo com `PRO_AI_ENABLED=false`.

### Fase 6 — profundidade de dados

Entregas:

- comparação entre fontes/modelos escolhidos;
- séries mais longas quando sustentadas pelo arquivo;
- novos agregados derivados;
- mapa/camadas adicionais aprovadas;
- comparativos hidrológicos;
- favoritos/configurações essenciais.

Critério de saída: o PRO não é apenas uma versão visualmente diferente do portal público.

### Fase 7 — camada de IA PRO

Entregas:

- gateway único de IA server-side;
- políticas por utilidade;
- quotas diárias;
- orçamento mensal;
- artefatos persistidos;
- fingerprint;
- cache compartilhado;
- logs e custo estimado;
- kill switch;
- primeira análise PRO: resumo refinado + `O que mudou`;
- comparação interpretativa somente quando as fontes estruturadas sustentarem o conteúdo.

Critério de saída: IA agrega interpretação sem criar dependência, duplicação de chamadas ou custo imprevisível.

### Fase 8 — hardening comercial e operacional

Entregas:

- termos/privacidade atualizados;
- política de cancelamento/reembolso conforme modelo comercial;
- export/delete revisados;
- rate limits;
- observabilidade de cobrança;
- dashboards de erro/custo;
- backup/rollback de banco documentado;
- smoke de rotas PRO;
- Core Web Vitals e WCAG;
- testes de navegador e mobile;
- revisão de secrets;
- revisão final das fontes usadas no plano pago.

Critério de saída: checklist de produção sem bloqueadores críticos.

### Fase 9 — lançamento controlado

Sequência:

1. publicar código com flags seguras;
2. confirmar migrations do Supabase externo;
3. confirmar cobrança em modo produção;
4. fazer assinatura real controlada;
5. verificar webhook e entitlement;
6. acessar o painel como assinante real;
7. testar cancelamento/portal;
8. ativar `PRO_ENABLED`;
9. ativar `PRO_BILLING_ENABLED`;
10. manter `PRO_AI_ENABLED` inicialmente controlado se necessário;
11. acompanhar erros, custo e conversão nas primeiras horas/dias;
12. ampliar divulgação apenas depois da estabilidade operacional.

## 44. Critérios de GO LIVE do Tempo Pelotas PRO

O PRO só pode ser considerado em produção quando todos os itens críticos abaixo estiverem confirmados:

- autenticação E2E real concluída;
- Supabase externo com migrations aplicadas e RLS validada;
- cobrança de produção configurada;
- webhook assinado e idempotente;
- assinatura ativa gera entitlement sem ação manual;
- usuário sem assinatura não consegue contornar o guard;
- cancelamento funciona conforme regra comercial;
- `/painel` é noindex;
- dados públicos continuam disponíveis sem login;
- portal público funciona com IA desligada;
- PRO funciona meteorologicamente com IA desligada;
- quotas de IA e teto financeiro funcionam;
- nenhuma chamada de IA ocorre por simples pageview público;
- nenhuma fonte usada no MVP pago permanece com autorização de uso indefinida;
- política de privacidade e conta cobrem cobrança e novos dados;
- exportação/exclusão foram revisadas;
- secrets não aparecem no cliente/logs;
- smoke de produção passa;
- CI aplicável está verde;
- responsividade e acessibilidade foram testadas;
- rollback de aplicação e banco está documentado.

## 45. Prioridade imediata a partir desta decisão

A ordem recomendada agora é:

1. não ampliar mais a complexidade da Home pública sem necessidade;
2. concluir refinos editoriais atuais do front simples;
3. validar definitivamente o fluxo `/conta` com duas contas;
4. auditar fontes para uso comercial/derivado;
5. escolher provedor de cobrança e regra de preço;
6. preparar migrations de subscription + entitlement;
7. implementar guards do PRO ainda atrás de flag;
8. construir o primeiro `/painel` sem IA;
9. adicionar profundidade de dados;
10. implementar IA PRO com orçamento por utilidade;
11. executar hardening e lançamento controlado.

Até a Fase 4, nenhuma tela deve sugerir que o PRO está disponível para compra em produção.

A partir da implementação do PRO, este arquivo também deve ser atualizado quando ocorrer:

- mudança de escopo público x PRO;
- criação de plano/preço;
- escolha ou troca de provedor de cobrança;
- mudança de entitlement;
- nova feature premium;
- nova utilidade de IA;
- alteração de quota/custo estrutural;
- nova fonte usada como diferencial comercial;
- mudança de política de cancelamento;
- ativação de uma feature flag estrutural;
- passagem de uma fase do roadmap para concluída.