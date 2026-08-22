# Tempo Pelotas — Plano de aplicação Público, Free e PRO

Data da decisão: 22/08/2026  
Estado: **arquitetura aprovada / implementação ainda não iniciada**

## 1. Objetivo

Este documento define como o Tempo Pelotas deve distribuir dados, ferramentas e funcionalidades entre três camadas de produto:

- portal **Público**;
- usuário **Free autenticado**;
- usuário **PRO**.

A intenção é criar valor comercial sem transformar dados oficiais públicos em paywall, reduzir exposição jurídica desnecessária e fazer com que o PRO seja sustentado principalmente pelo patrimônio de dados, processamento, organização, análises e ferramentas desenvolvidas pelo próprio Tempo Pelotas.

Este plano deve ser lido em conjunto com:

- `PROJECT_CURRENT_STATE.md` — fonte mestre do estado atual do projeto;
- `docs/ACCOUNT_AND_PRO_ARCHITECTURE.md` — arquitetura de conta, autenticação e entitlement;
- `docs/HISTORICAL_DATA_INVENTORY.md` — inventário de fontes, variáveis e oportunidades de histórico/backfill;
- `docs/OFFICIAL_DATA_SOURCE_POLICY.md` — comunicação e atribuição de fontes oficiais;
- `docs/ANA_RHN_INTEGRATION.md`;
- `docs/DEFESA_CIVIL_RS_HYDROMET_PLAN.md`;
- `docs/REDEMET_OPERATIONS.md`.

## 2. Regra central de produto

> **Dado oficial que seja adequado à disseminação pública permanece público. A conta Free agrega personalização e conveniência. O PRO vende profundidade, histórico próprio, processamento, comparação, análise e ferramentas criadas pelo Tempo Pelotas.**

Nenhum recurso já aberto hoje deve ser fechado atrás de login apenas para criar escassez artificial.

Da mesma forma, integrar uma fonte governamental ao Tempo Pelotas não transforma automaticamente essa fonte em conteúdo PRO.

## 3. Regra de segurança jurídica

A classificação institucional da fonte não substitui a revisão do modo de uso.

"Fonte governamental" ou "fonte oficial" **não significa automaticamente** que qualquer conteúdo possa ser armazenado, redistribuído, exportado ou explorado comercialmente sem condições.

Portanto:

- dados oficiais destinados à disseminação pública podem compor o portal público, com atribuição e sem alterar sua semântica;
- nenhuma fonte oficial deve ser transformada em diferencial pago apenas por estar integrada ao Tempo Pelotas;
- histórico, exportação, cópia permanente, redistribuição em massa ou uso comercial devem respeitar a política aplicável ao produto/dataset específico;
- quando houver dúvida relevante, o recurso não entra no PRO até revisão;
- dúvida sobre uma fonte não deve ser resolvida criando um paywall Free ou PRO;
- quando retenção ou redistribuição não estiverem suficientemente claras, o dataset fica em estado `REVIEW`/interno até decisão documentada.

A estratégia comercial deve evitar depender juridicamente de um dataset externo específico.

## 4. Camada Público

O visitante sem conta continua recebendo **tudo que já está aberto no site atualmente**.

Também devem permanecer no Público, quando a própria fonte/produto admitir disseminação pública e a integração estiver tecnicamente validada:

- avisos oficiais;
- dados meteorológicos oficiais;
- dados hidrológicos oficiais;
- níveis, vazões e chuvas de redes públicas;
- produtos públicos de radar/satélite;
- informações de Defesa Civil;
- dados de ANA/SNIRH/RHN;
- INMET;
- REDEMET/DECEA;
- outras fontes públicas equivalentes.

Regras:

- preservar instituição de origem;
- preservar horário, estação, parâmetro, unidade e referência quando aplicável;
- não atribuir ao órgão cálculo ou análise produzida pelo Tempo Pelotas;
- não esconder depois um dado oficial que já foi consolidado como público apenas para aumentar conversão do PRO;
- dados públicos continuam indexáveis somente quando a página fizer sentido editorial/SEO; APIs e ferramentas não precisam ser indexadas.

O portal público continua priorizando leitura simples, contexto local e serviço de utilidade pública.

## 5. Camada Free autenticado

O cadastro gratuito não existe para bloquear informação governamental. Ele existe para criar **uma experiência pessoal**.

O usuário Free recebe tudo do Público, mais recursos selecionados, como:

- perfil;
- favoritos;
- preferências;
- locais e estações acompanhadas;
- organização de atalhos;
- painel pessoal integrado ao front-end;
- histórico de até **60 dias** para datasets/recursos definidos como Free;
- comparações básicas quando fizer sentido;
- personalizações de interface;
- recursos gratuitos adicionais desenvolvidos ao longo do produto;
- futuros alertas personalizados básicos, quando o canal estiver validado.

### 5.1. Limite de 60 dias

O limite de 60 dias **não se aplica automaticamente a dados oficiais que já sejam públicos**.

Ele é uma regra de entitlement para séries e ferramentas que o Tempo Pelotas decidir disponibilizar ao usuário Free.

Exemplos:

- uma página pública da ANA pode continuar mostrando uma série pública maior se isso fizer parte do serviço aberto;
- um gráfico personalizado dentro do painel Free pode limitar a experiência a 60 dias;
- o banco pode armazenar anos de dados independentemente do limite visual do Free.

### 5.2. Painel Free

O usuário autenticado deve ter um pequeno dashboard conectado visualmente ao site, não um produto separado sem relação com o front público.

Direção de navegação:

- `/conta` — identidade, privacidade, consentimentos, assinatura e sessão;
- `/painel` — dashboard autenticado comum a Free e PRO;
- módulos do painel aparecem conforme entitlements;
- Free vê os módulos gratuitos;
- PRO vê os mesmos módulos enriquecidos e os módulos exclusivos.

O shell do painel deve nascer extensível para novos menus sem acoplamento rígido ao plano atual.

## 6. Camada PRO

O PRO deve concentrar principalmente valor criado ou controlado pelo Tempo Pelotas.

Prioridades de produto:

- Historical Data Layer próprio;
- séries acumuladas pelo Tempo Pelotas ao longo do tempo;
- históricos longos de datasets com uso comercial claramente permitido;
- 90 dias, 12 meses, 24 meses e períodos maiores;
- comparação entre períodos;
- comparação entre estações;
- comparação entre variáveis;
- comparação entre previsões e observado;
- acurácia de modelos;
- extremos;
- tendências;
- agregações próprias;
- indicadores derivados;
- gráficos avançados;
- filtros avançados;
- relatórios;
- exportações quando os datasets envolvidos permitirem;
- análises automáticas;
- IA aplicada a dados estruturados;
- alertas avançados;
- dashboards configuráveis;
- correlações meteorológicas/hidrológicas tecnicamente defensáveis;
- mapas e ferramentas avançadas;
- radar/satélite avançados somente quando a política do produto permitir;
- futuros módulos criados pelo Tempo Pelotas.

O PRO não deve depender de esconder um dado público. O assinante paga pelas ferramentas e pelo conhecimento produzido sobre os dados.

## 7. Camada interna / REVIEW

Além de Público, Free e PRO existe uma classificação operacional que não aparece como plano comercial: `REVIEW`.

Usar para:

- fonte com termos ainda não revisados;
- retenção histórica duvidosa;
- redistribuição não confirmada;
- exportação não confirmada;
- uso comercial não confirmado;
- endpoint descoberto tecnicamente mas ainda não aprovado para consumo contínuo;
- dataset cuja semântica/unidade/referência ainda não foi validada.

Enquanto estiver em `REVIEW`:

- não é diferencial PRO;
- não é exportável;
- não é automaticamente disponibilizado no Free;
- não deve ser promovido publicamente como integração concluída;
- pode ser usado somente no limite tecnicamente e institucionalmente seguro já documentado.

## 8. Matriz de decisão por recurso

Cada nova série/ferramenta deverá responder, antes de entrar em produção:

| Pergunta | Resultado esperado |
| --- | --- |
| É dado oficial destinado à disseminação pública? | preferir Público |
| Já está público no Tempo Pelotas? | não fechar atrás de login sem revisão explícita |
| É personalização/favorito/painel do usuário? | Free ou PRO conforme profundidade |
| É histórico próprio acumulado pelo Tempo Pelotas? | candidato forte a PRO, mantendo transparência da origem |
| É indicador/derivado criado pelo Tempo Pelotas? | candidato forte a PRO |
| Uso comercial está claro? | pode compor PRO conforme produto |
| Uso comercial está incerto? | não usar como diferencial PRO |
| Retenção/redistribuição está incerta? | `REVIEW` até validação |
| Exportação é permitida? | só então habilitar download/CSV/API correspondente |

## 9. Modelo futuro de governança por fonte

Sem implementar nesta etapa, o schema deverá evoluir para representar explicitamente políticas como:

```text
retention_allowed
public_display_allowed
free_authenticated_allowed
pro_allowed
commercial_use_allowed
export_allowed
attribution_required
review_status
terms_checked_at
```

O campo atual `paid_access_allowed` continua útil durante a transição, mas não é suficiente para representar todos os cenários.

### 9.1. Princípio de menor risco

Na ausência de certeza:

- não ativar em PRO;
- não habilitar exportação;
- preservar apenas o que já tenha base técnica/institucional para retenção;
- registrar pendência;
- procurar alternativa própria, oficial claramente pública ou licenciada.

## 10. Relação com o Historical Data Layer

O Historical Data Layer não pertence ao usuário e não é duplicado por plano.

Fluxo:

```text
Fontes externas
    ↓
Coletores + normalização + proveniência
    ↓
Historical Data Layer
    ↓
Política de acesso por dataset/recurso
    ├── Público
    ├── Free autenticado
    ├── PRO
    └── REVIEW / interno
```

A classificação de acesso não altera a classe científica do dado.

Continuam separados:

- `observation`;
- `forecast`;
- `reanalysis`;
- `derived`.

## 11. Arquitetura do painel autenticado

A área autenticada deve ser uma continuação natural do Tempo Pelotas.

Estrutura alvo:

```text
/conta
├── Perfil
├── Privacidade e dados
├── Preferências da conta
└── Plano / assinatura

/painel
├── Início
├── Favoritos
├── Histórico
├── Águas
├── Tempo
├── Mapas
├── Alertas
├── Comparações
├── Exportações
└── Análises
```

Os itens reais do menu serão liberados progressivamente.

Não criar uma rota diferente para cada plano. O mesmo módulo pode oferecer diferentes capacidades conforme entitlement.

Exemplo:

```text
/painel/historico
Free -> até 60 dias nos datasets Free
PRO  -> período completo autorizado + comparações + exportações permitidas
```

## 12. Entitlements recomendados

A autorização continua baseada em capacidades, e não em condicionais espalhadas como `plan === "pro"`.

Exemplos:

```text
account_dashboard
favorites
saved_locations
history_access_days
history_full
history_compare
station_compare
variable_compare
data_export
advanced_charts
advanced_maps
forecast_accuracy
pro_ai_analysis
custom_alerts
```

Dados públicos não precisam de entitlement para serem exibidos no portal aberto.

## 13. Plano de aplicação

### Fase 0 — documentação e congelamento de regra

Estado: **concluído por esta decisão documental**.

Entregas:

- fixar Público / Free / PRO / REVIEW;
- declarar que dados oficiais adequados à disseminação pública não serão transformados em paywall;
- definir que Free agrega personalização e conveniência;
- definir que PRO prioriza valor próprio/derivado;
- vincular esta decisão ao documento mestre do projeto.

Nenhuma migration, rota ou UI nova deve ser criada nesta fase.

### Fase 1 — finalizar arquitetura inicial da conta

Antes de desenvolver o novo painel:

- validar E2E real de autenticação;
- validar duas contas e isolamento RLS;
- corrigir qualquer falha de callback/sessão/logout;
- validar exportação e exclusão LGPD;
- consolidar `/conta` como área de identidade/privacidade/plano;
- definir contrato de entitlement server-side;
- preparar o shell autenticado `/painel` sem billing obrigatório.

Critério de saída: conta confiável e segura antes de receber novos módulos.

### Fase 2 — matriz de fontes e políticas de acesso

Usar `docs/HISTORICAL_DATA_INVENTORY.md` como base e classificar cada dataset/recurso.

Entregas:

- origem;
- instituição;
- classe do dado;
- retenção;
- exibição pública;
- Free;
- PRO;
- exportação;
- atribuição;
- estado de revisão.

Critério de saída: nenhum módulo novo depende de uma decisão jurídica implícita.

### Fase 3 — continuar coleta histórica em paralelo

A coleta não deve esperar a definição comercial.

Prioridades:

- não perder variáveis já capturadas;
- preservar observações com timestamp e proveniência;
- ampliar histórico hidrológico;
- ampliar arquivo de previsões;
- buscar backfill onde permitido;
- criar monitoramento de gaps;
- continuar separando observação, previsão, reanálise e derivados.

Esta fase pode ocorrer paralelamente às fases de conta e UX.

### Fase 4 — painel Free inicial

Primeiro painel autenticado deve funcionar sem cobrança.

MVP Free sugerido:

- resumo pessoal;
- favoritos;
- estações/localizações acompanhadas;
- histórico Free de até 60 dias nos datasets escolhidos;
- atalhos para recursos públicos;
- preferências;
- CTA discreto para PRO, sem bloquear informação governamental pública.

Critério de saída: criar conta já traz utilidade real mesmo sem assinatura.

### Fase 5 — APIs históricas e autorização

Criar contratos server-side para séries e ferramentas.

Exemplos conceituais:

- `getHistoricalSeries()`;
- `getHistoricalSummary()`;
- `getStationComparison()`;
- `getForecastAccuracy()`.

Cada contrato deve:

- verificar autenticação quando necessário;
- resolver entitlement;
- aplicar limites temporais;
- aplicar política do dataset;
- impedir exportação quando não permitida;
- preservar fonte e qualidade;
- responder com cache compatível com o tipo de acesso.

### Fase 6 — PRO baseado em patrimônio próprio

Somente depois do Free e das APIs estarem sólidos.

Primeiros diferenciais recomendados:

- histórico longo;
- comparação temporal;
- comparação de estações;
- extremos;
- tendências;
- acumulados e rollups;
- acurácia de previsão;
- indicadores derivados;
- gráficos avançados;
- ferramentas de análise;
- exportação apenas de datasets autorizados.

O PRO deve funcionar sem IA antes da fase seguinte.

### Fase 7 — billing

Cobrança entra depois de o produto autenticado já demonstrar valor.

Entregas:

- provedor definido;
- produto e preço;
- checkout server-side;
- webhook assinado/idempotente;
- subscription normalizada;
- entitlement PRO;
- cancelamento/portal;
- testes sandbox e produção controlada.

### Fase 8 — IA e ferramentas avançadas

Depois da base determinística:

- resumo inteligente;
- `O que mudou`;
- interpretação de séries;
- comparação assistida;
- perguntas sobre o acervo;
- correlações e detecção de padrões com validação;
- relatórios automatizados.

IA não substitui dado oficial, medição nem alerta oficial.

### Fase 9 — expansão contínua

O modelo deve aceitar novos recursos sem redesenhar os planos a cada descoberta.

Novos módulos podem nascer como:

- Público;
- Free;
- PRO;
- experimental/REVIEW.

A decisão deve ser feita por valor, origem, segurança e direito de uso — não apenas pela possibilidade técnica de esconder uma tela.

## 14. Testes obrigatórios da política de acesso

Quando a implementação começar, criar contratos que garantam:

- conteúdo público atual não exige login;
- dataset marcado `PUBLIC` não passa a exigir PRO por engano;
- Free autenticado acessa somente recursos Free e públicos;
- PRO acessa recursos PRO autorizados;
- `REVIEW` não aparece em produto comercial;
- exportação respeita política do dataset;
- acesso premium é validado no servidor;
- esconder botão no React não é autorização;
- páginas autenticadas são `noindex` quando apropriado;
- cache não vaza resposta personalizada entre usuários;
- fonte/atribuição acompanham a série onde necessário.

## 15. Decisões que não devem ser revertidas sem revisão explícita

- tudo que já está aberto no portal permanece aberto, salvo motivo técnico, institucional ou jurídico documentado;
- dado oficial adequado à disseminação pública não vira diferencial exclusivo PRO;
- cadastro Free deve ter utilidade própria;
- o painel autenticado é compartilhado por Free e PRO, com módulos/recursos por entitlement;
- histórico de 60 dias é um limite de recurso Free, não uma regra global para dados públicos;
- PRO prioriza histórico próprio, dados licenciados/permitidos, derivados, análises e ferramentas do Tempo Pelotas;
- fonte incerta não entra no PRO;
- exportação exige regra específica;
- o Historical Data Layer continua coletando independentemente do lançamento comercial;
- nenhuma implementação desta arquitetura deve começar antes de a documentação mestre apontar para este plano.
