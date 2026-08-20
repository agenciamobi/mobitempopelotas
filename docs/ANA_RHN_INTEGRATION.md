# ANA / SNIRH / RHN — integração hidrometeorológica do Tempo Pelotas

Última consolidação: 19/08/2026.

Este documento registra o estado técnico e editorial da integração do Tempo Pelotas com a plataforma integrada da Agência Nacional de Águas e Saneamento Básico (ANA), o Sistema Nacional de Informações sobre Recursos Hídricos (SNIRH) e a Rede Hidrometeorológica Nacional (RHN).

## Estado atual

- O responsável pelo Tempo Pelotas recebeu acesso autorizado à plataforma integrada da ANA.
- O acesso autenticado ao Sistema HIDRO / Hidrotelemetria foi validado em 19/08/2026.
- A integração automática desses dados ao runtime público do Tempo Pelotas está **em implantação e validação**.
- Nenhuma credencial, cookie, senha, sessão ou HAR autenticado deve ser versionado.
- A existência de acesso autorizado não deve ser descrita como certificação, homologação ou endosso editorial da ANA ao Tempo Pelotas.

## Contexto institucional

Segundo a apresentação institucional do Portal HidroWeb fornecida durante o levantamento, o HidroWeb integra o SNIRH e dá acesso às informações reunidas pela Rede Hidrometeorológica Nacional. A rede agrega observações hidrológicas e hidrometeorológicas, incluindo níveis, vazões e chuvas, além de outras variáveis mantidas por diferentes estações e instituições operadoras.

O material institucional também distingue dois contextos importantes:

- **HidroWeb**: concentra o acervo hidrometeorológico e séries resultantes de coletas e medições da rede;
- **Hidrotelemetria**: disponibiliza informações telemétricas e dados mais recentes das estações que transmitem em tempo próximo do real.

Para o Tempo Pelotas, o foco inicial é o monitoramento de níveis, vazões e chuva de estações relevantes para a Lagoa dos Patos, Guaíba e bacias que influenciam a Zona Sul do Rio Grande do Sul.

## Rede Hidrometeorológica Nacional

A ANA coordena as atividades da Rede Hidrometeorológica Nacional em articulação com órgãos e entidades que a integram ou utilizam seus dados. As estações cadastradas no banco Hidro possuem identificação própria e podem ser operadas por diferentes instituições públicas ou privadas.

Consequências para o portal:

- “dado da RHN” não significa necessariamente “estação operada diretamente pela ANA”;
- a entidade operadora/responsável precisa ser preservada quando informada pela fonte;
- o código oficial da estação deve ser armazenado junto com a leitura;
- referências de nível de estações distintas não podem ser somadas, subtraídas ou convertidas automaticamente sem metadados que sustentem essa transformação;
- estado de transmissão e atraso da leitura precisam ser mostrados separadamente do valor observado.

## Evidência técnica sanitizada de 19/08/2026

Durante a navegação autenticada no Sistema HIDRO / Hidrotelemetria foi identificada a estação:

- nome: **LARANJAL**;
- código da estação no sistema: **87955001**;
- município: **Pelotas / RS**;
- entidade associada observada: **UFPel**;
- sub-bacia: **Lagoa dos Patos**;
- situação observada no sistema: **Ativo**.

O mapa da ANA/SNIRH utiliza serviços ArcGIS REST para parte da consulta cartográfica e do último dado. Foi observado, entre outros, o serviço sanitizado:

`/server/rest/services/SGH/CotasReferencia2/MapServer/2/query`

Campos observados nesse contrato incluem identificação da estação, município, bacia/sub-bacia, parâmetro, último dado, horário do último dado e estado da informação.

### Regra de publicação

Uma leitura vista no ambiente autenticado não deve ser promovida automaticamente a dado público do Tempo Pelotas.

Antes de publicar qualquer valor da ANA/RHN, validar no mínimo:

1. código e identidade da estação;
2. parâmetro observado;
3. unidade oficial;
4. referência/cota usada pela estação quando aplicável;
5. timestamp da observação;
6. timezone;
7. estado da estação e do dado;
8. atraso entre observação e coleta pelo portal;
9. entidade operadora/responsável;
10. permissões e contrato técnico aplicáveis ao endpoint usado.

Em especial, não inferir uma classificação de “normal”, “atenção”, “alerta” ou “inundação” quando a fonte não entregar uma referência oficial aplicável àquela estação.

## Arquitetura pretendida

A integração deve ser server-side e desacoplada da interface do SNIRH.

Fluxo recomendado:

`ANA / SNIRH / RHN → coletor server-side → normalização → cache/persistência → API sanitizada Tempo Pelotas → páginas públicas`

Estrutura mínima de uma observação normalizada:

```ts
type HydrometricObservation = {
  stationCode: string;
  stationName: string;
  operator: string | null;
  parameter: "level" | "flow" | "rain" | string;
  value: number;
  unit: string;
  reference: string | null;
  observedAt: string;
  fetchedAt: string;
  status: "live" | "stale" | "unavailable";
  source: "ANA_RHN";
};
```

Credenciais e cookies permanecem somente no servidor. A API pública do Tempo Pelotas deve retornar apenas dados sanitizados necessários à exibição.

## Cache, persistência e rastreabilidade

Quando o contrato de coleta for fechado:

- usar cache curto para último dado;
- persistir observações com `observedAt` e `fetchedAt` separados;
- deduplicar por estação + parâmetro + timestamp;
- registrar somente logs sanitizados;
- manter último valor conhecido apenas com indicação explícita de atraso;
- nunca transformar indisponibilidade em valor zero;
- preservar o identificador oficial da estação para auditoria e conciliação.

## Situação da Estação Laranjal

A página pública `/nivel-da-lagoa-dos-patos-laranjal` já possui uma fonte operacional própria e não deve mudar silenciosamente de referência.

A estação LARANJAL identificada na RHN pode futuramente:

- servir como fonte adicional;
- servir como validação cruzada;
- substituir uma fonte apenas depois de validação formal da unidade e referência;
- alimentar a página regional de situação das águas sem alterar a semântica histórica do nível local.

Até essa validação terminar, a comunicação pública deve dizer que o acesso ANA/RHN está autorizado e que a integração está em implantação, sem afirmar que a leitura atual do Laranjal já vem da ANA.

## Comunicação institucional pública

Formulação recomendada:

> O Tempo Pelotas possui acesso autorizado à plataforma integrada da Agência Nacional de Águas e Saneamento Básico para coleta e exibição de informações hidrometeorológicas da Rede Hidrometeorológica Nacional. A integração é realizada gradualmente, preservando a estação de origem, unidade, referência e horário de cada observação antes de sua publicação.

Complemento editorial possível:

> A Rede Hidrometeorológica Nacional integra o Sistema Nacional de Informações sobre Recursos Hídricos e reúne observações essenciais para acompanhar níveis, vazões e chuvas em diferentes bacias do país. No Tempo Pelotas, esses dados são usados como contexto regional e nunca substituem automaticamente a referência de uma estação local.

Evitar:

- “site oficial da ANA”;
- “homologado pela ANA”;
- “certificado pela ANA”;
- “parceiro oficial da ANA”, salvo se houver instrumento específico que sustente essa relação;
- afirmar que toda estação da RHN é operada diretamente pela ANA.

## Pendências técnicas

Antes de ativar a ingestão contínua em produção:

- identificar o contrato estável para último dado e, se autorizado, série temporal;
- confirmar unidades por parâmetro;
- confirmar timezone e formato de datas;
- documentar limites de requisição e política de uso;
- definir conjunto inicial de estações relevantes para Pelotas;
- validar histórico/exportação quando o perfil permitir;
- implementar testes de contrato com fixtures sanitizadas;
- documentar fallback e janela de atraso por tipo de estação;
- atualizar `PROJECT_CURRENT_STATE.md` quando a fonte passar de “integração em implantação” para “runtime ativo”.

## Segurança

- nunca versionar e-mail com senha, screenshot de credencial ou senha recebida;
- nunca versionar HAR bruto autenticado;
- nunca copiar `ASP.NET_SessionId`, cookies de segurança ou tokens para código/documentação;
- não usar automação que dependa de sessão de navegador quando existir contrato oficial mais estável;
- rotacionar/reautenticar a sessão se um artefato autenticado tiver sido exposto fora do ambiente privado de diagnóstico.

## Referências internas

- `PROJECT_CURRENT_STATE.md`;
- `docs/REDEMET_OPERATIONS.md`;
- `src/routes/metodologia.tsx`;
- `src/routes/situacao-hidrologica-pelotas.tsx`;
- `src/routes/nivel-da-lagoa-dos-patos-laranjal.tsx`;
- `src/components/content/OfficialDataAccessNotice.tsx`.
