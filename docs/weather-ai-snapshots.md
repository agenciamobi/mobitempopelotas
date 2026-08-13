# Snapshots meteorológicos editoriais

## Objetivo

O Gemini não participa mais do carregamento das páginas públicas. A IA é apenas uma camada editorial opcional, executada por rotina protegida. Dados meteorológicos, alertas, páginas, feed, JSON público e notificações continuam funcionando sem IA.

O resultado editorial é persistido no Supabase externo. Quando não existe um texto persistido compatível com o estado meteorológico atual, o portal usa imediatamente o resumo determinístico.

## Janelas diárias

O workflow `.github/workflows/weather-ai-snapshots.yml` executa quatro vezes por dia no fuso `America/Sao_Paulo`:

| Ciclo | Horário |
| --- | --- |
| Manhã | 05:00 |
| Meio do dia | 11:00 |
| Fim da tarde | 17:00 |
| Noite | 23:00 |

No GitHub Actions os horários são configurados em UTC como `0 2,8,14,20 * * *`.

## Limite rígido por janela

Cada período recebe uma chave única:

```text
AAAA-MM-DD-overnight
AAAA-MM-DD-morning
AAAA-MM-DD-afternoon
AAAA-MM-DD-evening
```

A coluna `slot_key` é a chave primária de `weather_ai_snapshots`. Antes de qualquer possibilidade de chamada ao Gemini, a rotina reserva a janela com `resolution=ignore-duplicates`.

Isso impede chamadas duplicadas por concorrência, reexecução do workflow ou acionamento manual repetido dentro da mesma janela.

O teto operacional continua sendo quatro oportunidades por dia, mas o número real de chamadas ao Gemini pode ser menor.

## Teto financeiro mensal

Além do limite por janela, existe uma segunda trava independente e atômica no Supabase. O padrão é de **150 tentativas reais de API por mês**, configurável por `GEMINI_WEATHER_MONTHLY_CALL_LIMIT`.

O contador é reservado imediatamente antes de `generateGeminiWeatherBrief()`. Portanto:

- abrir ou atualizar páginas não consome cota;
- feed, JSON e push diário não consomem cota;
- uma janela duplicada não consome cota;
- reutilizar um fingerprint existente não consome cota;
- ausência de dados meteorológicos suficientes não consome cota;
- somente uma tentativa que chegou ao ponto de chamar o Gemini ocupa uma unidade do orçamento.

A função SQL `claim_weather_ai_monthly_call` incrementa `weather_ai_monthly_usage` somente quando `calls < call_limit`, na mesma operação que cria um registro individual em `weather_ai_calls`. Isso evita ultrapassagem do limite mesmo com concorrência.

Cada tentativa autorizada recebe um `call_id`. Depois da resposta do Gemini o registro individual é fechado como `generated` ou `failed`, com modelo e erro quando aplicável. Assim o total mensal pode ser auditado sem depender apenas dos logs do provedor.

A proteção é **fail closed**: se o Supabase não conseguir confirmar o orçamento ou se a migration da trava não estiver aplicada, a rotina não chama o Gemini. O site segue usando o resumo determinístico.

Quando o teto é alcançado, o cron responde com `success: true`, `skipped: true`, `reason: "monthly-ai-budget"` e `aiCalled: false`; portanto a proteção financeira não transforma o portal em indisponível.

## Fingerprint material

Depois de reservar a janela, o sistema agrega e reconcilia as fontes meteorológicas e calcula `source_fingerprint`.

O fingerprint não usa valores crus minuto a minuto. Ele normaliza apenas mudanças relevantes, incluindo:

- temperatura e sensação em faixas;
- condição meteorológica;
- umidade, vento e rajadas em faixas;
- mínima, máxima, chuva e vento dos próximos dias;
- alertas oficiais ativos ou próximos;
- confiança, fontes degradadas e divergências significativas.

Se já existir um snapshot gerado com o mesmo fingerprint, o novo ciclo copia o texto persistido e registra `reused_from_slot`. Nesse caso nenhuma chamada ao Gemini é realizada e o orçamento mensal não é consumido.

## Fluxo de geração

1. O GitHub Actions chama `GET /api/cron/push-daily?task=weather-ai`.
2. A rota valida `Authorization: Bearer $CRON_SECRET`.
3. A rotina reserva `slot_key` no Supabase.
4. As fontes meteorológicas são agregadas e reconciliadas.
5. O sistema calcula o fingerprint material.
6. Se existir texto compatível, ele é reutilizado sem IA e sem consumir orçamento.
7. Se não houver dados suficientes, a janela termina sem consumir orçamento.
8. O sistema tenta reservar uma unidade do teto mensal no Supabase.
9. Se o teto estiver disponível, registra a tentativa em `weather_ai_calls` e só então o Gemini pode gerar um `WeatherBrief`.
10. O resultado da chamada e o snapshot são persistidos.

A rota `/api/cron/push-daily` sem `task=weather-ai` mantém exclusivamente o comportamento de notificações e não chama Gemini.

## Fluxo público

`fetchWeatherIntelligence()` busca os dados meteorológicos e o último snapshot persistido sem gerar IA.

Depois da reconciliação, calcula o fingerprint atual. O texto editorial só é utilizado quando:

- o snapshot possui no máximo oito horas;
- o `source_fingerprint` do snapshot é igual ao fingerprint material atual.

Se qualquer uma dessas condições falhar, o resumo determinístico é usado. Portanto uma mudança meteorológica relevante não fica escondida por um texto antigo.

O `WeatherMinuteRefresh` pode continuar invalidando os dados a cada minuto porque esse caminho não chega mais ao Gemini.

## Alertas oficiais

Alertas do INMET são sempre consumidos diretamente dos dados oficiais. Exibição e push de alertas não dependem de Gemini nem aguardam o próximo ciclo editorial.

## Segurança

As tabelas `weather_ai_snapshots`, `weather_ai_monthly_usage` e `weather_ai_calls` possuem RLS habilitada e não concedem acesso a `anon` ou `authenticated`. Somente `service_role` pode ler ou gravar os dados de controle. A função atômica de reserva mensal também concede execução somente ao `service_role`.

A chave administrativa permanece no runtime do servidor. O diretório `_legacy` não participa do runtime nem dos jobs editoriais.

## Configuração

No ambiente do portal:

```env
CRON_SECRET=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_WEATHER_ENABLED=true
GEMINI_WEATHER_MONTHLY_CALL_LIMIT=150
MOBI_SUPABASE_SECRET_KEY=
```

`GEMINI_WEATHER_MONTHLY_CALL_LIMIT` é opcional. Quando ausente ou inválido, o código usa o limite seguro padrão de 150. Valores aceitos ficam entre 1 e 10000.

Nos secrets do repositório GitHub:

```text
TEMPO_PELOTAS_CRON_SECRET
```

O valor deve ser idêntico ao `CRON_SECRET` do ambiente publicado.

## Implantação

1. Aplicar as migrations do repositório no Supabase externo oficial. A base cria `weather_ai_snapshots` em `20260802170000_create_weather_ai_snapshots.sql`; `20260812201000_add_weather_ai_snapshot_fingerprint.sql` atualiza instalações anteriores; `20260813023000_add_weather_ai_monthly_budget.sql` cria o teto mensal, o log individual e a função atômica.
2. Confirmar `MOBI_SUPABASE_SECRET_KEY` no runtime do servidor.
3. Confirmar `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_WEATHER_ENABLED` e, se desejado, `GEMINI_WEATHER_MONTHLY_CALL_LIMIT`.
4. Criar ou conferir o secret `TEMPO_PELOTAS_CRON_SECRET` no GitHub.
5. Publicar a aplicação.
6. Executar manualmente `Weather AI snapshots` uma vez.
7. Conferir que `weather_ai_monthly_usage.calls` aumentou somente se houve tentativa real de Gemini.
8. Conferir o registro correspondente em `weather_ai_calls`.
9. Reexecutar na mesma janela e confirmar `slot-already-claimed`, sem novo incremento mensal.
10. Em uma janela futura com fingerprint idêntico, confirmar `status: reused` e `aiCalled: false`, novamente sem incremento mensal.

## Comportamento em falhas

- Supabase administrativo ou Gemini não configurado: o job editorial não chama IA; o portal segue determinístico.
- Contador mensal indisponível: chamada ao Gemini bloqueada; o portal segue determinístico.
- Teto mensal atingido: chamada bloqueada com `monthly-ai-budget`; o portal segue determinístico.
- Gemini falha depois que a tentativa foi autorizada: a unidade mensal permanece contabilizada, pois houve tentativa real de API, e o log individual fica como `failed`.
- Snapshot com mais de oito horas: resumo determinístico.
- Fingerprint incompatível: resumo determinístico.
- Banco temporariamente indisponível: resumo determinístico.
- Novo alerta oficial: alerta e push continuam independentes da IA.
