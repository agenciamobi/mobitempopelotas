# Política de fontes oficiais e disseminação — Tempo Pelotas

Última consolidação: 20/08/2026.

Este documento define como o Tempo Pelotas deve comunicar publicamente integrações com órgãos e redes oficiais. A regra central é separar com clareza **fonte oficial**, **acesso técnico** e **papel do portal**.

## Princípio institucional

O Tempo Pelotas não deve se apresentar como órgão oficial emissor dos dados de REDEMET/DECEA, ANA/SNIRH/RHN ou INMET.

O posicionamento correto é:

> O Tempo Pelotas atua como plataforma local de integração, contextualização e disseminação de informações oficiais, preservando a identificação da instituição de origem, o horário, a abrangência, o estado de disponibilidade e, quando aplicável, a classificação oficial recebida.

Quando houver acesso técnico concedido ou credenciais próprias, isso pode e deve ser informado com precisão, sem transformar esse acesso em alegação de homologação, certificação, parceria formal ou chancela editorial.

## REDEMET / DECEA

Estado atual:

- integração server-side ativa;
- uso de credencial própria `REDEMET_API_KEY`;
- produtos meteorológicos oficiais consultados por API;
- radar, satélite e STSC permanecem identificados como produtos da REDEMET/DECEA.

Formulação pública recomendada:

> O Tempo Pelotas possui credenciais de acesso à API da REDEMET/DECEA para integração automatizada de produtos meteorológicos oficiais. As informações preservam a identificação da REDEMET, do produto e do horário recebido.

Não usar:

- “homologado pela REDEMET”;
- “certificado pela Aeronáutica”;
- “site oficial da REDEMET”;
- “parceiro oficial do DECEA”, salvo existência de instrumento formal específico.

## ANA / SNIRH / RHN

Estado atual:

- acesso concedido à plataforma integrada da ANA;
- acesso autenticado ao Sistema HIDRO / Hidrotelemetria validado;
- ingestão pública contínua ainda em implantação e validação;
- cada estação precisa preservar código, operador, unidade, referência, horário e situação do dado.

Formulação pública recomendada:

> O responsável pelo Tempo Pelotas teve acesso concedido à plataforma integrada da Agência Nacional de Águas e Saneamento Básico para consulta e futura integração de informações hidrometeorológicas da Rede Hidrometeorológica Nacional. A incorporação ao portal é gradual e mantém a identificação da estação e da instituição de origem.

Não usar:

- “site oficial da ANA”;
- “homologado pela ANA”;
- “certificado pela ANA”;
- “parceiro oficial da ANA”, salvo existência de instrumento formal específico;
- afirmar que toda estação da RHN é operada diretamente pela ANA.

## INMET

Os avisos oficiais do INMET podem ser usados como conteúdo de serviço e disseminação, preservando integralmente a identificação do órgão emissor, a severidade, a validade, a abrangência e o link oficial quando disponível.

A integração de avisos deve preservar a classificação cromática informada pelo INMET:

- **Amarelo — Perigo potencial**;
- **Laranja — Perigo**;
- **Vermelho — Grande perigo**.

A cor de um aviso oficial nunca pode ser inferida a partir da previsão, de um advisory produzido pelo Tempo Pelotas ou da condição meteorológica observada. Quando a classificação oficial não puder ser confirmada, o aviso deve permanecer com apresentação neutra até que a severidade seja validada.

O endpoint municipal por geocódigo pode ser usado para identificar diretamente avisos que incluem Pelotas. O RSS oficial `https://apiprevmet3.inmet.gov.br/avisos/rss` e os respectivos documentos CAP podem complementar essa consulta para estabilizar severidade, validade, abrangência e identificação do aviso. Falha no enriquecimento por RSS não autoriza o portal a elevar a classificação do aviso.

Enquanto não houver documento específico de autorização institucional, não usar linguagem que indique homologação, credenciamento ou parceria formal com o INMET.

O plano de Web Push deve seguir a mesma regra: a notificação é **entregue pelo Tempo Pelotas**, mas o aviso permanece **oficial do INMET**.

Exemplo de identificação:

> INMET — aviso meteorológico oficial, disseminado pelo Tempo Pelotas.

## Regra editorial

O portal pode:

- selecionar dados relevantes para Pelotas e região;
- organizar informações de múltiplas fontes;
- explicar contexto local;
- criar sínteses próprias;
- distribuir avisos oficiais por PWA/Web Push quando a integração estiver ativa.

O portal não pode:

- alterar silenciosamente severidade ou classificação oficial;
- atribuir ao órgão uma análise produzida pelo Tempo Pelotas;
- transformar acesso técnico em alegação de aprovação editorial;
- omitir a fonte original em conteúdo oficial redistribuído.

## Fonte oficial x canal de disseminação

A formulação institucional preferencial é:

- **REDEMET / DECEA, ANA / SNIRH / RHN e INMET**: fontes institucionais e oficiais dos respectivos dados e avisos;
- **Tempo Pelotas**: plataforma local de integração, contextualização e disseminação;
- **PWA / Web Push**: canal de entrega proativa aos usuários inscritos.

## Referências internas

- `docs/REDEMET_OPERATIONS.md`;
- `docs/ANA_RHN_INTEGRATION.md`;
- `src/components/content/OfficialDataAccessNotice.tsx`;
- `src/routes/metodologia.tsx`.
