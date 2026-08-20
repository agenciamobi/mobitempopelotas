# Monitoramento de fontes, incidentes e disponibilidade

Última atualização: 20/08/2026

## Objetivo

A rota pública `/status-dos-dados` informa o estado atual das principais integrações usadas pelo Tempo Pelotas e mantém histórico operacional próprio.

O monitor não transforma indisponibilidade de uma fonte externa em indisponibilidade de todo o portal. Cada integração é avaliada separadamente e pode assumir um dos estados:

- `operational`: respondeu normalmente;
- `partial`: respondeu com atraso ou perda parcial de informação;
- `maintenance`: manutenção programada pelo Tempo Pelotas;
- `offline`: não respondeu de forma utilizável na verificação;
- `implementation`: acesso/integracão ainda em implantação e fora do cálculo de disponibilidade.

## Coleta automática

O workflow `.github/workflows/data-status-monitor.yml` executa aproximadamente a cada 10 minutos e chama:

`GET https://tempopelotas.com.br/api/cron/data-status`

A chamada usa GitHub Actions OIDC com audiência `tempo-pelotas-data-status`. O endpoint também aceita `CRON_SECRET` quando configurado no runtime, mantendo compatibilidade com as demais rotinas protegidas.

O workflow registra o horário em que o problema foi **detectado pelo monitor**. Esse horário não deve ser apresentado como prova do instante exato em que um provedor externo começou ou terminou uma indisponibilidade.

## Persistência

Migration de referência:

`supabase/migrations/20260820025000_data_source_status_history.sql`

Tabelas:

### `data_source_status_checks`

Amostras periódicas por integração. Guarda estado, provedor, categoria, horário da verificação, horário retornado pela fonte quando disponível e URL pública da origem.

As amostras têm retenção automática de 180 dias. Elas alimentam os cálculos de disponibilidade e permitem futuras visualizações temporais.

### `data_source_incidents`

Mantém incidentes abertos e resolvidos. Um incidente é aberto quando uma integração entra em `partial`, `offline` ou `maintenance` e é resolvido quando volta para `operational` ou deixa de ser runtime ativo (`implementation`).

Enquanto permanece degradado, o mesmo incidente é atualizado em vez de criar uma nova ocorrência a cada coleta. O registro preserva:

- início detectado;
- última confirmação;
- resolução;
- pior estado observado;
- quantidade de verificações afetadas;
- serviço e provedor envolvidos.

### `data_source_maintenance_windows`

Reserva janelas de manutenção programada. Quando uma janela ativa coincide com o identificador de uma integração, o estado exibido e persistido passa a `maintenance` durante o período.

Não existe manutenção fictícia ou automática: uma janela só aparece quando foi cadastrada explicitamente.

## Cálculo de disponibilidade

A função `get_data_source_availability()` calcula disponibilidade usando apenas verificações de runtime:

- `operational` entra como verificação saudável;
- `partial` e `offline` entram como verificações afetadas;
- `maintenance` é excluído do denominador;
- `implementation` é excluído do denominador.

A página mostra resumo das últimas 24 horas e de uma janela de até 7 dias, além da disponibilidade individual por integração quando já existem amostras suficientes.

## Segurança

As três tabelas têm RLS habilitada e não são legíveis por `anon` ou `authenticated`. Leitura, escrita e RPCs operacionais são permitidas somente para `service_role`.

A página pública acessa o histórico exclusivamente pelo servidor do Tempo Pelotas. Credenciais administrativas do Supabase nunca são enviadas ao navegador.

## Integrações monitoradas inicialmente

- Embrapa Clima Temperado — observação local;
- INMET — avisos oficiais;
- CPPMet/UFPel;
- Open-Meteo;
- MET Norway;
- REDEMET/DECEA — radar;
- REDEMET/DECEA — satélite;
- REDEMET/DECEA — STSC;
- INMET — satélite complementar;
- LabHidroSens/UFPel — nível no Laranjal;
- fonte operacional do nível do Guaíba;
- ANA/SNIRH/RHN aparece como `implementation` enquanto a ingestão pública estiver em implantação.

## Evoluções previstas

A base já suporta futuras melhorias sem alterar o significado histórico dos dados:

- gráficos de disponibilidade por dia/semana/mês;
- página dedicada de um incidente;
- anotações editoriais de causa e resolução;
- avisos públicos de manutenção programada;
- métricas de tempo médio de recuperação;
- integração futura com notificações operacionais internas, sem misturar incidentes técnicos com alertas meteorológicos oficiais.
