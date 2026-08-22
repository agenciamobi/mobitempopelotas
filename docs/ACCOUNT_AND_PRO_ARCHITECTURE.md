# Tempo Pelotas — Arquitetura de Conta e Acesso PRO

Data da decisão: 21/08/2026

## 1. Objetivo

Este documento define a arquitetura funcional da conta do Tempo Pelotas e a separação entre conteúdo público, conta cadastrada gratuita e recursos PRO.

A regra central é permanente: **nenhum conteúdo que já é público no Tempo Pelotas deve ser fechado atrás de login apenas para criar valor artificial para uma assinatura**. Cadastro e PRO acrescentam recursos, histórico e ferramentas; não retiram o que já é aberto.

A conta controla autorização e experiência do usuário. O acervo meteorológico e hidrológico pertence ao **Tempo Pelotas Data Layer**, e não a uma conta individual.

## 2. Estado técnico atual da conta

A base de autenticação já existe e deve ser preservada, não substituída por uma arquitetura paralela.

Hoje o projeto já possui:

- Supabase Auth;
- login e callback de autenticação;
- `profiles` vinculados a `auth.users`;
- `user_preferences`;
- consentimentos auditáveis em `account_consent_events`;
- RLS para isolamento dos dados do usuário;
- exportação e exclusão de conta/LGPD;
- infraestrutura de Web Push preservada, embora a ativação pública permaneça suspensa;
- ciclo E2E real de autenticação ainda pendente de validação final.

Antes da construção das telas PRO, esta arquitetura inicial da conta deve ser concluída com plano, entitlements, favoritos e autorização server-side consistente.

## 3. Camadas de acesso

### 3.1 Público

O visitante não autenticado continua tendo acesso a **tudo o que já está aberto no portal público**.

Isso inclui, entre outros recursos já existentes:

- condições atuais;
- previsão hoje, amanhã e 7 dias;
- chuva;
- vento;
- meteograma;
- alertas;
- hidrologia;
- níveis da Lagoa dos Patos e referências regionais;
- radar e satélite na experiência pública vigente;
- clima e histórico editorial já publicado;
- Embrapa;
- câmeras;
- páginas regionais;
- metodologia, status e demais conteúdos públicos.

Não exigir cadastro para funcionalidades que já são públicas.

### 3.2 Cadastrado gratuito

A conta gratuita recebe tudo do nível Público, mais:

- perfil;
- favoritos;
- preferências;
- personalizações futuras;
- histórico de dados de até **60 dias** para datasets/recursos classificados como Free;
- recursos gratuitos adicionais que ajudem o usuário a personalizar o acompanhamento do tempo e da Lagoa;
- futuros alertas personalizados básicos, caso sejam reativados e validados.

O limite de 60 dias é uma regra de acesso para recursos Free, não uma regra global de retenção nem uma regra para esconder dados oficiais já públicos. O banco pode possuir anos de dados mesmo quando determinado recurso Free enxerga apenas os 60 dias mais recentes.

### 3.3 PRO

O PRO recebe tudo do nível Público e Cadastrado Gratuito, mais acesso ao acervo e às ferramentas avançadas.

Escopo inicial previsto:

- histórico completo disponível no acervo quando o dataset permitir esse uso;
- seletores de 7 dias;
- 30 dias;
- 60 dias;
- 90 dias;
- 12 meses;
- 24 meses;
- períodos maiores futuramente conforme o acervo crescer;
- comparação entre períodos;
- comparação entre estações;
- comparação entre variáveis;
- exportações somente quando permitidas pela origem/dataset;
- radares completos quando a política do produto permitir;
- satélites completos quando a política do produto permitir;
- séries/animações mais extensas quando a fonte e a licença permitirem;
- arquivo de radar/satélite quando tecnicamente e contratualmente permitido;
- métricas de acurácia da previsão;
- gráficos avançados;
- dados derivados e ferramentas próprias do Tempo Pelotas;
- novos recursos premium desenvolvidos posteriormente.

O benefício comercial deve ser comunicado como **histórico próprio/permitido + ferramentas avançadas + análise**, e não como simples cobrança por dados oficiais públicos.

## 4. Entitlements, não condicionais espalhadas por plano

O código não deve depender de dezenas de condicionais como `plan === "pro"` espalhadas pelos componentes.

A autorização deve ser baseada em capacidades/entitlements, por exemplo:

- `history_access_days` — 60 para determinados recursos Free; ilimitado para PRO quando a política do dataset permitir;
- `history_full`;
- `history_compare`;
- `station_compare`;
- `variable_compare`;
- `data_export`;
- `radar_extended`;
- `radar_archive`;
- `satellite_extended`;
- `satellite_archive`;
- `forecast_accuracy`;
- `advanced_charts`.

Isso permite criar no futuro PRO+, Pesquisador, Empresarial, API ou outros pacotes sem reescrever o sistema de autorização.

## 5. Modelo mínimo futuro de assinatura

A implementação de billing não precisa acontecer agora, mas a conta deve nascer preparada para:

- plano atual;
- status da assinatura;
- início e término do período;
- trial futuro, se adotado;
- origem da assinatura/billing provider;
- cancelamento e término de acesso;
- histórico de alterações relevantes;
- entitlements efetivos calculados server-side.

O preço, nome comercial definitivo e provedor de cobrança podem ser decididos posteriormente.

## 6. Segurança e autorização

Regras obrigatórias:

- autenticação é responsabilidade do Supabase Auth;
- autorização para dados pagos deve ocorrer no servidor, nunca apenas escondendo UI no navegador;
- RLS deve continuar protegendo dados pessoais;
- tabelas do acervo meteorológico/hidrológico não pertencem diretamente ao usuário;
- a conta recebe permissão de leitura por APIs internas conforme entitlement e política do dataset;
- exportações devem validar entitlement e permissão do dataset no servidor;
- limites temporais devem ser aplicados server-side quando fizerem parte do recurso;
- dados e recursos públicos continuam acessíveis sem sessão.

## 7. Relação entre conta e Historical Data Layer

O Historical Data Layer é um patrimônio único do Tempo Pelotas.

Fluxo conceitual:

```text
Fontes externas
    ↓
Coletores e normalizadores
    ↓
Tempo Pelotas Historical Data Layer
    ↓
Política do dataset + APIs internas + autorização
    ├── Público
    ├── Cadastrado gratuito
    ├── PRO
    └── REVIEW / interno
```

Não duplicar séries meteorológicas por usuário, plano ou assinatura.

## 8. Regra de proveniência

Toda série histórica deve distinguir, no mínimo:

- `observation` — medição/observação da fonte;
- `forecast` — previsão emitida em determinado momento;
- `reanalysis` — reconstrução/modelagem histórica;
- `derived` — indicador calculado pelo Tempo Pelotas.

O produto nunca deve apresentar reanálise como medição observada nem previsão arquivada como fato ocorrido.

## 9. Governança de fontes e PRO

Começar a coletar cedo é prioritário, porque tempo não capturado não pode ser reconstruído com a mesma fidelidade depois.

Porém, coleta, exibição pública, cadastro gratuito, exportação e monetização são decisões diferentes.

Para cada fonte devem existir metadados de governança contendo:

- origem e atribuição;
- início de cobertura disponível;
- início da coleta própria pelo Tempo Pelotas;
- política/termos revisados;
- permissão de retenção conhecida;
- permissão de exibição pública conhecida;
- permissão de uso comercial conhecida;
- permissão de exportação conhecida;
- possibilidade de backfill;
- observações de qualidade.

**Fonte oficial adequada à disseminação pública deve permanecer no portal público e não deve ser transformada em diferencial exclusivo PRO.**

**Enquanto uso comercial/exportação não estiverem revisados, o dado não deve ser liberado automaticamente como diferencial PRO/exportável.**

## 10. Ordem de implementação

1. preservar e concluir a arquitetura atual de autenticação/conta;
2. implementar entitlements sem billing obrigatório nesta etapa;
3. preparar o shell autenticado `/painel` para Free e PRO;
4. implementar favoritos e preferências adicionais;
5. concluir E2E real de autenticação e autorização;
6. classificar datasets/recursos por Público, Free, PRO ou REVIEW;
7. construir e ampliar o Historical Data Layer em paralelo;
8. criar APIs históricas server-side com política por dataset;
9. implementar primeiro valor real para o Free;
10. implementar ferramentas PRO baseadas em patrimônio próprio/permitido;
11. integrar billing quando produto, preço e provedor estiverem definidos.

## 11. Decisões que não devem ser revertidas sem revisão arquitetural

- o portal público atual permanece público;
- dados oficiais adequados à disseminação pública permanecem públicos;
- cadastrado gratuito recebe personalização e recursos Free reais;
- histórico de até 60 dias é limite de determinados recursos Free, não limite de dados oficiais públicos;
- PRO recebe ferramentas avançadas, histórico próprio/permitido e valor derivado;
- histórico pertence ao Tempo Pelotas Data Layer, não ao usuário;
- autorização é baseada em entitlements;
- retenção de dados começa antes do lançamento comercial do PRO;
- nenhuma fonte com situação comercial pendente deve ser automaticamente exposta como diferencial pago/exportável;
- observação, previsão, reanálise e derivados permanecem semanticamente separados.

## 12. Inventário operacional de históricos

O detalhamento de fontes, variáveis, oportunidades de backfill, lacunas atuais, prioridades e regras de preservação está em:

- `docs/HISTORICAL_DATA_INVENTORY.md`.

Esse inventário é a referência operacional para decidir **o que coletar e preservar**. Este documento de conta continua sendo a referência para decidir **como a identidade e autorização funcionam**.

## 13. Plano de aplicação Público / Free / PRO

A decisão de produto mais recente e específica sobre distribuição de dados e recursos está documentada em:

- `docs/DATA_ACCESS_PUBLIC_FREE_PRO_PLAN.md`.

Esse documento refina esta arquitetura com quatro estados operacionais de acesso: **Público**, **Free autenticado**, **PRO** e **REVIEW/interno**.

Em caso de ambiguidade entre textos anteriores deste documento e o plano de aplicação, prevalece a regra mais recente do plano de acesso: **dado oficial adequado à disseminação pública não deve ser deslocado para Free ou PRO apenas para criar paywall; Free agrega experiência pessoal e PRO agrega patrimônio próprio, profundidade, processamento, análise e ferramentas avançadas.**
