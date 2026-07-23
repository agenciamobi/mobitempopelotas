# Notificações web push

## Princípio editorial

As notificações do Tempo Pelotas são opcionais e vinculadas ao aparelho e ao navegador usados pelo visitante.

O portal diferencia explicitamente:

- **previsão meteorológica:** estimativa de condições futuras;
- **observação:** medição realizada por uma estação ou fonte identificada;
- **aviso oficial:** comunicação emitida por órgão competente, como o INMET;
- **orientação preventiva:** conteúdo educativo que não representa alerta vigente.

Uma notificação nunca deve transformar uma previsão, tendência ou regra interna do portal em alerta oficial.

## Recursos implementados

- inscrição e remoção pelo navegador;
- seleção entre tempo, águas e novidades do portal;
- armazenamento server-only no Supabase;
- leitura paginada de todas as inscrições do tópico, sem limite global silencioso;
- limpeza automática de endpoints expirados após respostas 404 ou 410;
- disparo administrativo protegido por segredo próprio;
- resumo diário protegido por `CRON_SECRET`;
- reserva atômica e lease renovada entre lotes para impedir duplicidade concorrente;
- abertura somente de caminhos internos do portal;
- limite real de 16 KiB durante a leitura dos corpos JSON, inclusive em transferência chunked;
- service worker com recebimento e clique em notificação;
- mensagens públicas em linguagem compreensível para visitantes leigos.

## Variáveis de ambiente

```env
SUPABASE_MODE=external
SUPABASE_URL=
SUPABASE_SECRET_KEY=

VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:contato@agenciamobi.com.br

CRON_SECRET=
PUSH_ADMIN_SECRET=
```

A chave VAPID pública é entregue ao navegador pelo endpoint `/api/push/config`. A chave privada, o segredo administrativo e a chave administrativa do Supabase permanecem exclusivamente no servidor.

## Banco de dados

A migration `20260723113000_create_web_push_subscriptions.sql` cria:

- `web_push_subscriptions`: endpoint, chaves públicas da inscrição, assuntos escolhidos e timestamps;
- `web_push_dispatches`: impressão digital, estado, token e vigência operacional da lease, conclusão e contadores de entrega;
- `claim_web_push_dispatch`: reserva atômica que permite recuperar somente leases interrompidas e vencidas.

As duas tabelas têm RLS habilitada. `anon` e `authenticated` não recebem privilégios diretos. A leitura e a gravação ocorrem somente pelo cliente administrativo server-side.

## Endpoints

### Configuração pública

```http
GET /api/push/config
```

Retorna apenas se o recurso está operacional e a chave VAPID pública.

### Inscrição por aparelho

```http
POST /api/push/subscription
Content-Type: application/json
```

O corpo contém a inscrição gerada pelo `PushManager` e os assuntos escolhidos. A rota exige mesma origem, aceita somente endpoints HTTPS autorizados e interrompe a leitura quando o corpo real ultrapassa 16 KiB.

### Remoção por aparelho

```http
DELETE /api/push/subscription
Content-Type: application/json
```

Remove o endpoint do banco. O navegador também cancela localmente a inscrição.

### Disparo administrativo

```http
POST /api/push/broadcast
Authorization: Bearer $PUSH_ADMIN_SECRET
Content-Type: application/json
```

Exemplo:

```json
{
  "title": "INMET: aviso oficial para Pelotas",
  "body": "Há um aviso oficial ativo. Consulte vigência, área e orientações no portal.",
  "url": "/alertas",
  "tag": "inmet-pelotas",
  "urgency": "high",
  "topic": "weather"
}
```

Título e mensagem são limitados. A URL deve ser um caminho interno. O broadcast percorre as inscrições por páginas estáveis ordenadas pelo endpoint e entrega em lotes menores, evitando excluir assinantes antigos quando o volume ultrapassar 10 mil registros.

### Resumo diário

```http
GET /api/cron/push-daily
Authorization: Bearer $CRON_SECRET
```

A rotina consulta a previsão agregada e os avisos oficiais do INMET aplicáveis especificamente a Pelotas.

- quando existe aviso local ativo, o payload usa somente evento, severidade, vigência e orientação do próprio INMET, priorizando o aviso de maior gravidade e levando o visitante para `/alertas`;
- sem aviso local, a mensagem é identificada como previsão meteorológica e não mistura observações hidrológicas ou conteúdo preventivo sob a identidade de um alerta oficial.

O resumo comum usa o fingerprint `resumo-diario-AAAA-MM-DD`. Avisos locais usam um fingerprint próprio com a data e os IDs oficiais aplicáveis. Antes de cada lote de entrega, o servidor renova e verifica a lease; se outra execução assumir uma reserva vencida, a execução anterior interrompe os próximos lotes.

## Scheduler recomendado

Executar diariamente após as principais atualizações matinais das fontes, por exemplo entre **06:10 e 06:30 no horário de Brasília**.

O scheduler deve:

1. usar HTTPS;
2. enviar `Authorization: Bearer $CRON_SECRET`;
3. registrar status HTTP, duração e corpo sanitizado;
4. alertar após falhas consecutivas;
5. não repetir automaticamente em frequência agressiva.

## Privacidade e LGPD

- o navegador solicita permissão somente após ação do visitante;
- a escolha fica armazenada localmente para edição da interface;
- o banco recebe apenas os dados técnicos necessários para entrega;
- não há acesso público às inscrições;
- o visitante pode desativar os avisos no portal ou nas configurações do navegador;
- endpoints inválidos são removidos automaticamente apenas quando a exclusão no banco é confirmada;
- os avisos não dependem de login.

Antes da produção, documentar retenção e executar limpeza periódica de inscrições sem atividade por período definido pela política do portal.

## Validação do lote

O lote deve permanecer aberto até que dependências, build, TypeScript, ESLint, auditoria visual e revisão automatizada estejam verdes no mesmo head.

## Checklist de produção

1. aplicar a migration no projeto Supabase oficial;
2. regenerar `database.types.ts` a partir do schema aplicado;
3. gerar um par VAPID definitivo e armazená-lo no ambiente de produção;
4. configurar `CRON_SECRET` e `PUSH_ADMIN_SECRET` distintos;
5. testar ativação, alteração de assuntos e remoção em Chrome/Android;
6. testar o fluxo instalado no Safari/iOS compatível;
7. testar respostas 404/410 e confirmar que falha de limpeza não incrementa `removed`;
8. validar que URLs externas são recusadas;
9. validar que previsão, observação e aviso oficial permanecem editorialmente separados;
10. simular mais de 10 mil inscrições e confirmar paginação completa;
11. simular uma execução longa e confirmar renovação e perda segura da lease;
12. configurar scheduler, logs e plano de rollback.
