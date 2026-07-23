# Runbook de cutover para o Lovable

Este documento controla a migração de `tempopelotas.com.br` da produção Vercel para a publicação Lovable.

A existência deste runbook **não autoriza a troca de DNS**. O cutover só deve ocorrer em uma janela definida, com um executor responsável, uma segunda pessoa acompanhando a validação e possibilidade imediata de rollback.

## Estado de prontidão

Baseline aprovada em 23/07/2026:

- publicação Lovable: `https://mobitempopelotas.lovable.app`;
- commit funcional publicado: `98d865a90ffb862bdc30a5baea403adc35751689`;
- auditoria visual final: workflow run `29983757973`;
- artefato: `visual-parity-19`;
- viewports: 1440×1200, 320×720, 390×844 e 768×1024;
- zero overflow horizontal;
- build, TypeScript, ESLint, REDEMET e hidrologia aprovados;
- issue de bloqueio: #52, mantido aberto até o término do cutover.

## Princípios obrigatórios

1. Não apagar nem desconectar a produção Vercel durante o cutover.
2. Manter a Vercel disponível por no mínimo 48 horas após a troca.
3. Não alterar registros de e-mail: MX, SPF, DKIM, DMARC e verificações de terceiros.
4. Usar exatamente os registros exibidos pelo painel de domínio personalizado do Lovable. Não presumir IP, CNAME ou destino.
5. Não registrar valores de secrets em issues, commits, logs ou capturas.
6. Não executar mudanças paralelas de layout, APIs ou conteúdo durante a janela de DNS.
7. Interromper a troca quando qualquer pré-requisito estiver incompleto.

## Responsáveis e janela

Preencher antes da execução:

- Executor: `____________________________`
- Acompanhamento: `____________________________`
- Provedor DNS: `____________________________`
- Acesso confirmado ao Vercel: `[ ]`
- Acesso confirmado ao Lovable: `[ ]`
- Início da janela: `____/____/______ ____:____ BRT`
- Limite para decisão de rollback: `____:____ BRT`
- Canal de comunicação durante a operação: `____________________________`

## Fase 1 — Preparação com antecedência

Executar preferencialmente 24 horas antes.

### DNS e rollback

- [ ] Exportar ou capturar todos os registros atuais da zona DNS.
- [ ] Registrar separadamente os valores atuais que apontam para a Vercel.
- [ ] Confirmar que a restauração desses valores pode ser feita sem suporte externo.
- [ ] Reduzir somente o TTL dos registros web que serão alterados para aproximadamente 300 segundos.
- [ ] Não alterar TTL ou conteúdo de MX, SPF, DKIM, DMARC e demais serviços.
- [ ] Guardar a captura da zona em local restrito, fora do repositório público.

### Lovable

- [ ] Adicionar `tempopelotas.com.br` no painel de domínio personalizado do projeto.
- [ ] Definir a estratégia para `www.tempopelotas.com.br`: redirecionar para o domínio principal ou configurar como alias.
- [ ] Copiar do painel Lovable os registros exatos solicitados para validação e tráfego.
- [ ] Confirmar que o domínio aparece como aguardando DNS, sem remover a publicação `lovable.app`.
- [ ] Confirmar que todas as secrets atuais continuam reconhecidas pelo runtime.
- [ ] Definir `VITE_SITE_URL=https://tempopelotas.com.br` no ambiente de produção quando o painel permitir. O código possui o mesmo valor como fallback, mas a variável explícita evita ambiguidade.

### Aplicação e SEO

- [ ] Confirmar que `src/lib/site-config.ts` continua usando `https://tempopelotas.com.br` como URL pública.
- [ ] Confirmar que `/clima-em-pelotas` mantém redirect 301 para `/historico-climatico-pelotas`.
- [ ] Confirmar que `/tempo-amanha-pelotas` responde diretamente, sem redirect.
- [ ] Confirmar que `robots.txt`, `sitemap.xml`, `/feed` e `/pelotas.json` apontam para o domínio público.
- [ ] Registrar a situação atual do Search Console e da ferramenta de analytics utilizada.
- [ ] Não solicitar remoção, mudança de endereço ou desindexação no Search Console.

## Fase 2 — Baseline imediatamente antes da troca

No computador de operação, atualizar o repositório e executar:

```powershell
npm ci
$env:BASE_URL = "https://tempopelotas.com.br"
npm run cutover:smoke
```

Como o domínio ainda estará na Vercel, esta execução registra a baseline anterior ao cutover.

Também confirmar manualmente:

```powershell
Resolve-DnsName tempopelotas.com.br -Type A
Resolve-DnsName www.tempopelotas.com.br -Type CNAME -ErrorAction SilentlyContinue
curl.exe -I https://tempopelotas.com.br/
curl.exe -I https://tempopelotas.com.br/sitemap.xml
```

- [ ] Smoke test anterior aprovado ou falhas conhecidas registradas.
- [ ] Homepage atual abre em janela anônima.
- [ ] Captura do DNS anterior armazenada.
- [ ] Vercel continua saudável.
- [ ] Lovable continua saudável em `mobitempopelotas.lovable.app`.
- [ ] Nenhuma implantação ou alteração de código em andamento.

## Fase 3 — Alteração de DNS

Executar somente dentro da janela definida.

1. Abrir simultaneamente:
   - painel DNS;
   - domínio personalizado no Lovable;
   - projeto Vercel atual;
   - issue #52.
2. Alterar somente os registros web necessários, usando os valores exatos fornecidos pelo Lovable.
3. Preservar todos os registros de e-mail e serviços externos.
4. Salvar a zona.
5. Registrar no issue #52:
   - horário da alteração;
   - registros modificados, sem informações sensíveis;
   - TTL observado;
   - executor.
6. Não remover o domínio do projeto Vercel nesta etapa.

Checklist:

- [ ] Registros web anteriores documentados.
- [ ] Registros Lovable copiados sem edição manual do destino.
- [ ] MX/TXT de e-mail comparados antes e depois, sem alterações.
- [ ] Horário exato da troca registrado.
- [ ] Nenhuma mudança adicional realizada na zona.

## Fase 4 — Propagação e certificado

Durante os primeiros 15 minutos:

```powershell
Resolve-DnsName tempopelotas.com.br
Resolve-DnsName www.tempopelotas.com.br -ErrorAction SilentlyContinue
curl.exe -I https://tempopelotas.com.br/
```

Verificar no Lovable:

- [ ] domínio validado;
- [ ] certificado TLS emitido e ativo;
- [ ] domínio principal definido corretamente;
- [ ] `www` redireciona ou funciona conforme a estratégia definida;
- [ ] URL `lovable.app` continua disponível para diagnóstico.

Não considerar a operação concluída apenas porque o DNS resolveu. O certificado e os testes funcionais precisam estar aprovados.

## Fase 5 — Smoke test pós-cutover

Quando o domínio já responder pelo Lovable:

```powershell
$env:BASE_URL = "https://tempopelotas.com.br"
npm run cutover:smoke
```

O teste cobre:

- 14 rotas públicas e seus canonicals;
- redirect legado `/clima-em-pelotas`;
- `robots.txt` e `sitemap.xml`;
- JSON Feed 1.1 em `/feed`;
- schema 2.0 e CORS de `/pelotas.json`;
- radar, satélite e trovoadas da REDEMET;
- ausência de nomes de secrets e marcadores internos nas respostas.

Checklist manual complementar:

- [ ] Homepage desktop.
- [ ] Homepage mobile em aproximadamente 390 px.
- [ ] Navegação fixa mobile não cobre o rodapé.
- [ ] Rodapé claro e seção de exploração presentes.
- [ ] `/tempo-hoje-pelotas`.
- [ ] `/tempo-amanha-pelotas`.
- [ ] `/alertas`.
- [ ] `/radar-e-satelite-pelotas`.
- [ ] `/situacao-hidrologica-pelotas`.
- [ ] `/nivel-da-lagoa-dos-patos-laranjal`.
- [ ] `/cameras-ao-vivo-pelotas`, sem classificar replay como transmissão ao vivo.
- [ ] Estação Laranjal não apresenta leitura atrasada como atual.
- [ ] `https://tempopelotas.com.br/robots.txt` aponta para o sitemap correto.
- [ ] `https://tempopelotas.com.br/sitemap.xml` contém as rotas públicas.
- [ ] Código-fonte da homepage contém canonical para `https://tempopelotas.com.br/`.
- [ ] Search Console consegue acessar o sitemap.
- [ ] Analytics recebe uma visita de teste, quando aplicável.

## Critérios de rollback imediato

Restaurar a Vercel quando ocorrer qualquer uma destas condições atribuível ao cutover:

- certificado TLS inválido ou não emitido dentro da janela operacional;
- homepage indisponível ou com 5xx por mais de cinco minutos;
- duas ou mais rotas críticas indisponíveis;
- canonicals, robots ou sitemap apontando para host incorreto;
- perda das secrets no runtime Lovable;
- todos os produtos REDEMET indisponíveis por erro de configuração do ambiente;
- quebra estrutural grave em desktop ou mobile;
- alteração acidental de registros de e-mail;
- impossibilidade de concluir a validação antes do limite definido para rollback.

Falha isolada de uma fonte externa, tratada corretamente como `stale`, `partial` ou `unavailable`, não exige rollback por si só.

## Procedimento de rollback

1. Restaurar exatamente os registros web anteriores, salvos na Fase 1.
2. Não alterar MX, SPF, DKIM, DMARC ou outros serviços.
3. Manter o domínio cadastrado no Lovable enquanto a investigação estiver em andamento.
4. Aguardar o TTL e confirmar novamente:

```powershell
Resolve-DnsName tempopelotas.com.br
curl.exe -I https://tempopelotas.com.br/
$env:BASE_URL = "https://tempopelotas.com.br"
npm run cutover:smoke
```

5. Registrar no issue #52:
   - motivo do rollback;
   - horário;
   - sintomas observados;
   - confirmação de retorno à Vercel.
6. Não tentar uma segunda troca na mesma janela sem causa identificada e nova aprovação.

## Monitoramento após a troca

### Primeiros 60 minutos

- [ ] Repetir o smoke test após 15 minutos.
- [ ] Repetir após 60 minutos.
- [ ] Observar 404, 5xx, timeouts e falhas de certificado.
- [ ] Conferir homepage, alertas, radar e hidrologia em rede móvel.
- [ ] Conferir logs do Lovable sem expor conteúdo sensível.

### Primeiras 24 horas

- [ ] Executar o smoke test pelo menos mais duas vezes.
- [ ] Monitorar indexação, sitemap e canonicals.
- [ ] Verificar tráfego, páginas de entrada e eventuais 404.
- [ ] Confirmar que fontes degradadas continuam exibindo estados honestos.
- [ ] Manter Vercel e rollback intactos.

### De 24 a 48 horas

- [ ] Confirmar estabilidade de DNS e TLS.
- [ ] Revisar alertas, câmeras e estação do Laranjal novamente.
- [ ] Confirmar que não houve perda relevante de tráfego ou indexação.
- [ ] Somente após 48 horas, decidir sobre a desativação da implantação antiga.

## Encerramento do issue #52

O bloqueio pode ser encerrado somente quando:

- [ ] domínio principal ativo no Lovable;
- [ ] `www` tratado;
- [ ] certificado válido;
- [ ] smoke test pós-cutover aprovado;
- [ ] auditoria visual e mobile aprovada no domínio final;
- [ ] Search Console e analytics conferidos;
- [ ] 48 horas sem necessidade de rollback;
- [ ] responsável autoriza a retirada da Vercel.
