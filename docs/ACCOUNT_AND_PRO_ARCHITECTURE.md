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
- histórico de dados de até **60 dias**;
- recursos gratuitos adicionais que ajudem o usuário a personalizar o acompanhamento do tempo e da Lagoa;
- futuros alertas personalizados básicos, caso sejam reativados e validados.

O limite de 60 dias é uma regra de acesso, não uma regra de retenção. O banco pode possuir anos de dados mesmo quando a conta gratuita enxerga apenas os 60 dias mais recentes.

### 3.3 PRO

O PRO recebe tudo do nível Público e Cadastrado Gratuito, mais acesso ao acervo e às ferramentas avançadas.

Escopo inicial previsto:

- histórico completo disponível no acervo;
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
- exportações;
- radares completos;
- satélites completos;
- séries/animações mais extensas quando a fonte e a licença permitirem;
- arquivo de radar/satélite quando tecnicamente e contratualmente permitido;
- métricas de acurácia da previsão;
- gráficos avançados;
- novos recursos premium desenvolvidos posteriormente.

O benefício comercial deve ser comunicado como **histórico completo + ferramentas avançadas**, e não como se 7/30/60 dias fossem exclusivos, pois o cadastrado gratuito já terá acesso a até 60 dias.

## 4. Entitlements, não condicionais espalhadas por plano

O código não deve depender de dezenas de condicionais como `plan === "pro"` espalhadas pelos componentes.

A autorização deve ser baseada em capacidades/entitlements, por exemplo:

- `history_access_days` — 60 para gratuito; ilimitado para PRO;
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
- a conta recebe permissão de leitura por APIs internas conforme entitlement;
- exportações devem validar entitlement no servidor;
- limites temporais devem ser aplicados server-side;
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
APIs internas com autorização
    ├── Público
    ├── Cadastrado gratuito — até 60 dias
    └── PRO — acervo completo + ferramentas avançadas
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

Porém, coleta e monetização são decisões diferentes.

Para cada fonte devem existir metadados de governança contendo:

- origem e atribuição;
- início de cobertura disponível;
- início da coleta própria pelo Tempo Pelotas;
- política/termos revisados;
- permissão de retenção conhecida;
- permissão de uso comercial conhecida;
- possibilidade de backfill;
- observações de qualidade.

**Enquanto o uso comercial de uma fonte não estiver revisado, o dado pode permanecer no arquivo operacional interno, mas não deve ser liberado automaticamente como conteúdo PRO/exportável.**

Isso permite começar a preservar séries agora sem confundir armazenamento técnico com autorização comercial futura.

## 10. Ordem de implementação

1. preservar e concluir a arquitetura atual de autenticação/conta;
2. implementar plano e entitlements sem billing obrigatório nesta etapa;
3. implementar favoritos e preferências adicionais;
4. concluir E2E real de autenticação e autorização;
5. construir e ampliar o Historical Data Layer em paralelo, iniciando a coleta o quanto antes;
6. criar APIs históricas server-side;
7. aplicar limite de até 60 dias ao cadastrado gratuito;
8. liberar histórico completo e ferramentas avançadas ao PRO;
9. integrar billing quando produto, preço e provedor estiverem definidos.

## 11. Decisões que não devem ser revertidas sem revisão arquitetural

- o portal público atual permanece público;
- cadastrado gratuito recebe histórico de até 60 dias;
- PRO recebe histórico completo disponível no acervo e ferramentas avançadas;
- histórico pertence ao Tempo Pelotas Data Layer, não ao usuário;
- autorização é baseada em entitlements;
- retenção de dados começa antes do lançamento comercial do PRO;
- nenhuma fonte com situação comercial pendente deve ser automaticamente exposta em recurso pago/exportável;
- observação, previsão, reanálise e derivados permanecem semanticamente separados.
