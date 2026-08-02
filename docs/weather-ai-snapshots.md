# Snapshots meteorológicos com IA

## Objetivo

O Gemini não participa mais do carregamento das páginas públicas. A IA é executada por uma rotina central, o resultado é persistido no Supabase e todas as páginas, feeds e notificações reutilizam o último snapshot válido.

## Janelas diárias

O sistema define quatro períodos no fuso `America/Sao_Paulo`:

| Período | Horário agendado |
| --- | --- |
| Madrugada | 00:15 |
| Manhã | 06:15 |
| Tarde | 12:15 |
| Noite | 18:15 |

O workflow `.github/workflows/weather-ai-snapshots.yml` executa o endpoint protegido nesses quatro horários.

## Limite rígido

Cada período recebe uma chave única no formato:

```text
AAAA-MM-DD-overnight
AAAA-MM-DD-morning
AAAA-MM-DD-afternoon
AAAA-MM-DD-evening
```

A coluna `slot_key` é a chave primária de `weather_ai_snapshots`. Antes de consultar o Gemini, a rotina tenta inserir a reserva do período com `resolution=ignore-duplicates`.

Consequências:

- chamadas concorrentes não duplicam o uso da IA;
- reexecuções do GitHub Actions não duplicam o uso;
- acionamentos manuais no mesmo período não duplicam o uso;
- uma falha não é repetida automaticamente dentro da mesma janela;
- o teto operacional é de quatro tentativas de Gemini por dia.

## Fluxo de geração

1. O GitHub Actions chama `POST /api/cron/weather-ai`.
2. A rota valida `Authorization: Bearer $CRON_SECRET`.
3. A rotina reserva a chave do período no Supabase.
4. As fontes meteorológicas são agregadas e reconciliadas.
5. O Gemini gera um único `WeatherBrief`.
6. O resultado é salvo em `weather_ai_snapshots`.
7. As páginas passam a reutilizar o snapshot salvo.

## Fluxo público

`fetchWeatherIntelligence()` executa em paralelo:

- agregação dos dados meteorológicos atuais;
- leitura do último snapshot gerado no Supabase.

O snapshot é usado enquanto tiver até oito horas. Se estiver ausente, antigo ou indisponível, o portal gera localmente o resumo determinístico, sem chamar IA.

## Segurança

A tabela possui RLS habilitada e não concede acesso a `anon` ou `authenticated`. Somente `service_role` pode ler e gravar os snapshots. A chave administrativa permanece no runtime do servidor.

## Configuração

No ambiente do portal:

```env
CRON_SECRET=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_WEATHER_ENABLED=true
MOBI_SUPABASE_SECRET_KEY=
```

Nos secrets do repositório GitHub:

```text
TEMPO_PELOTAS_CRON_SECRET
```

O valor deve ser idêntico ao `CRON_SECRET` configurado no ambiente publicado.

## Implantação

1. Aplicar a migration `20260802170000_create_weather_ai_snapshots.sql` no Supabase oficial.
2. Confirmar `MOBI_SUPABASE_SECRET_KEY` no runtime do servidor.
3. Confirmar as variáveis do Gemini.
4. Criar o secret `TEMPO_PELOTAS_CRON_SECRET` no GitHub.
5. Publicar a aplicação.
6. Executar manualmente o workflow uma vez e conferir a linha criada em `weather_ai_snapshots`.
7. Confirmar que uma segunda execução na mesma janela retorna `slot-already-claimed` sem chamar o Gemini.

## Comportamento em falhas

- Supabase ou Gemini não configurado: endpoint retorna `503` e nenhuma chamada é feita.
- Gemini falha após a reserva: o período fica como `failed` e não é repetido automaticamente.
- Snapshot com mais de oito horas: páginas usam o resumo determinístico.
- Banco temporariamente indisponível: páginas continuam funcionando com resumo determinístico.
