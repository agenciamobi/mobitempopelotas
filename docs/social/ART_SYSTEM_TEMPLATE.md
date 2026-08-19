# MOBI — template reutilizável para sistema de artes de redes sociais

Este arquivo é um **modelo de implantação**. Ele não define a identidade do Tempo Pelotas e não deve ser usado diretamente para criar uma peça final sem antes preencher a configuração da marca.

A finalidade é replicar o mesmo nível de organização em outros projetos da MOBI.

## 1. Arquitetura recomendada no repositório

Criar:

```text
AGENTS.md
docs/social/README.md
docs/social/ART_GUIDE.md
docs/social/EDITORIAL_GUIDE.md
docs/social/ideias-posts.csv
```

Opcionalmente:

```text
docs/social/assets/
docs/social/references/
docs/social/PUBLISHED_LOG.csv
```

Responsabilidades:

- `AGENTS.md`: apenas aponta para as fontes de verdade de social media;
- `ART_GUIDE.md`: regras visuais específicas da marca;
- `EDITORIAL_GUIDE.md`: regras de pauta, validação factual e mix editorial;
- `ideias-posts.csv`: backlog de assuntos;
- `PUBLISHED_LOG.csv`: controle separado de publicações, quando necessário.

## 2. Configuração mínima da marca

Preencher antes de gerar qualquer arte:

```yaml
brand_name: "[NOME DA MARCA]"
brand_short_name: "[NOME CURTO]"
primary_domain: "[DOMINIO]"
primary_cta: "[CTA PADRÃO]"
logo_source_of_truth: "[URL OU PATH DO SVG OFICIAL]"
logo_variant_feed: "[URL/PATH SE HOUVER]"
logo_variant_story: "[URL/PATH SE HOUVER]"
primary_color: "#[HEX]"
secondary_colors:
  - "#[HEX]"
  - "#[HEX]"
background_colors:
  - "#[HEX]"
tone: "[EX.: premium, técnico, humano, editorial]"
primary_audience: "[PUBLICO]"
main_region: "[REGIAO SE HOUVER]"
feed_format: "1080x1350"
story_format: "1080x1920"
```

Nenhuma IA deve inferir logo, telefone, domínio, cores ou rodapé quando esses dados puderem ser definidos como fonte de verdade.

## 3. Ativos oficiais

Definir explicitamente:

### Logotipo

- caminho/URL oficial;
- variantes permitidas;
- área de proteção;
- tamanho mínimo;
- quando usar horizontal/vertical;
- fundos permitidos;
- proibições.

Regras recomendadas para todas as marcas:

- preferir SVG oficial;
- não redesenhar logo por IA;
- não trocar tipografia interna;
- não alterar proporção;
- não alterar cor sem variante aprovada;
- quando a IA deformar o logo, aplicar o ativo original em pós-produção.

### Rodapé ou assinatura

Se a marca usa rodapé fixo, registrar como fonte de verdade:

- SVG/PNG/path oficial;
- telefone;
- WhatsApp;
- domínio;
- endereço;
- registro profissional, quando aplicável;
- regras de espaçamento.

Quando existir um rodapé oficial em SVG, preferir aplicar o arquivo pronto em vez de remontar ícones/textos por IA.

## 4. Formatos e áreas seguras

Definir por projeto:

### Feed

- proporção;
- resolução final;
- margem segura;
- limite de texto;
- posição preferencial do logo/rodapé.

### Stories/Reels

- proporção;
- resolução;
- área segura para interface do Instagram;
- reposicionamento da headline e CTA.

Regra geral: adaptar a composição por formato. Não esticar nem apenas recortar a arte do feed.

## 5. Sistema visual

Documentar de forma objetiva:

### Cores

- primária;
- secundárias;
- neutras;
- cores de fundo;
- cores proibidas ou restritas.

### Atmosfera

Exemplos:

- editorial;
- minimalista;
- institucional;
- tecnológico;
- premium;
- acolhedor;
- jurídico;
- clínico;
- industrial;
- local/regional.

### Elementos visuais

Definir quais são permitidos:

- fotografia real;
- ilustração;
- ícones;
- gradientes;
- grids;
- linhas;
- molduras;
- glassmorphism;
- texturas;
- sombras;
- mapas/gráficos;
- selos.

E quais devem ser evitados.

## 6. Fotografia e geração de imagem

Separar três categorias:

### Foto real obrigatória

Usar quando autenticidade do local, pessoa, produto, equipe, imóvel, equipamento ou contexto for importante.

### Imagem gerativa permitida

Usar como apoio visual quando não houver risco de representar um dado/fato real de forma enganosa.

### Imagem gerativa proibida

Não gerar artificialmente como se fossem reais:

- documentos;
- dados;
- gráficos factuais;
- mapas de monitoramento;
- screenshots de sistema;
- certificados;
- resultados clínicos;
- alertas oficiais;
- produtos/obras/projetos específicos inexistentes;
- pessoas reais sem referência adequada;
- qualquer evidência que possa ser confundida com registro factual.

## 7. Hierarquia visual padrão

Definir uma composição-base da marca. Exemplo reutilizável:

1. marca/logo;
2. selo ou categoria opcional;
3. headline principal;
4. trecho de ênfase;
5. texto de apoio curto;
6. imagem/foto principal;
7. dados/benefícios/indicadores opcionais;
8. CTA;
9. assinatura/rodapé.

A regra deve descrever **hierarquia**, não obrigar todos os componentes em toda arte.

## 8. Tipografia

Registrar:

- família principal, se houver;
- família secundária;
- pesos;
- uso de caixa alta/baixa;
- estilo da headline;
- tamanho mínimo de corpo;
- regras de alinhamento;
- restrições.

Se a fonte da marca não estiver disponível para a IA, usar uma alternativa de alta compatibilidade apenas para textos externos ao logotipo. Nunca recriar o lettering do logo.

## 9. Conteúdo na arte

Definir:

- quantidade máxima de texto;
- tamanho aproximado da headline;
- quantidade de linhas;
- presença ou ausência de descrição;
- CTA padrão;
- informações obrigatórias;
- informações proibidas.

Boa regra geral:

- uma mensagem principal por peça;
- headline curta;
- apoio em 1–3 linhas;
- evitar transformar a arte em panfleto textual.

## 10. Variações por assunto

Criar uma seção por categoria recorrente do projeto.

Modelo:

```md
### [ASSUNTO]

- imagem/fotografia preferida: [...]
- headline típica: [...]
- destaque visual: [...]
- informações permitidas: [...]
- CTA: [...]
- cuidados factuais: [...]
```

Exemplos de categorias em outros projetos:

- serviço;
- produto;
- institucional;
- prova social;
- educativo;
- FAQ;
- alerta/comunicado;
- bastidor;
- promoção;
- evento;
- legislação;
- datas sazonais;
- conteúdo local;
- case/resultados.

## 11. Regras factuais por domínio

Cada projeto deve registrar riscos próprios.

### Jurídico

- não prometer resultado;
- não apresentar orientação individual como universal;
- revisar regras da OAB aplicáveis;
- não inventar número de processo, decisão ou jurisprudência.

### Saúde

- não prometer cura/resultado;
- não inventar diagnóstico, exame ou estatística;
- separar informação educativa de orientação clínica individual;
- respeitar regras profissionais aplicáveis.

### Engenharia/SST

- não inventar norma, laudo, certificação ou requisito;
- citar número de NR/NBR apenas quando validado;
- não apresentar imagem gerativa como obra executada.

### Imobiliário

- não inventar imóvel, metragem, preço ou disponibilidade;
- usar fotos reais do imóvel quando a publicação se referir a uma unidade específica.

### Meteorologia/hidrologia

- não inventar previsão, medição, alerta, radar, nível ou timestamp;
- separar previsão, observação, monitoramento e alerta oficial.

### SaaS/tecnologia

- não anunciar funcionalidade inexistente;
- não usar screenshot fictício como se fosse produção;
- não prometer integração ou automação ainda não implementada.

Adicionar outras regras conforme o segmento.

## 12. CTA e dados de contato

Registrar como fonte de verdade:

```yaml
website: "[DOMINIO]"
whatsapp: "[NUMERO]"
phone: "[NUMERO]"
email: "[EMAIL]"
instagram: "[@PERFIL]"
cta_primary: "[EX.: Fale conosco]"
cta_secondary: "[EX.: Saiba mais]"
```

Se os dados mudarem, atualizar primeiro a fonte de verdade e depois gerar novas peças.

## 13. Prompt-base genérico

```text
Crie uma arte [FORMATO] para [MARCA] sobre [ASSUNTO].

Use como fonte de verdade o logotipo oficial [LOGO]. Não redesenhe nem altere o logotipo.

Identidade visual: [CORES], [ATMOSFERA], [TIPOGRAFIA/ESTILO].

Imagem principal: [TIPO DE FOTO/ILUSTRAÇÃO].

Headline: [TÍTULO].
Trecho de ênfase: [DESTAQUE].
Texto de apoio: [APOIO].
CTA: [CTA].
Rodapé/assinatura: [REGRAS].

Respeite [REGRAS FACTUAIS DO SEGMENTO]. Não invente dados, resultados, números, certificações, alertas ou informações não fornecidas.

Entrega final em [RESOLUÇÃO].
```

## 14. Fluxo de produção recomendado

1. ler `AGENTS.md`;
2. ler `docs/social/ART_GUIDE.md`;
3. identificar pauta/objetivo;
4. consultar `EDITORIAL_GUIDE.md` quando necessário;
5. validar dados factuais;
6. buscar/selecionar ativos oficiais;
7. gerar fundo/foto/elementos quando apropriado;
8. aplicar logo e elementos determinísticos;
9. revisar;
10. exportar.

## 15. Checklist universal

- [ ] formato correto;
- [ ] resolução correta;
- [ ] logo oficial correto;
- [ ] cores coerentes;
- [ ] hierarquia visual preservada;
- [ ] texto legível em celular;
- [ ] uma mensagem principal;
- [ ] CTA correto;
- [ ] telefone/domínio/e-mail revisados;
- [ ] nenhum dado inventado;
- [ ] nenhuma imagem fictícia apresentada como evidência real;
- [ ] ortografia revisada;
- [ ] regras do segmento respeitadas;
- [ ] sem marcas d'água indevidas;
- [ ] arquivo final pronto para publicação.

## 16. Implantação em um novo repositório

Passo mínimo:

1. copiar este template;
2. preencher configuração e ativos da nova marca;
3. criar `ART_GUIDE.md` específico;
4. registrar no `AGENTS.md` que esse guia é a fonte de verdade para artes;
5. criar `EDITORIAL_GUIDE.md` se houver estratégia de conteúdo recorrente;
6. criar CSV de pautas quando houver volume suficiente;
7. gerar 1–3 peças piloto;
8. aprovar visualmente;
9. registrar no `ART_GUIDE.md` os refinamentos aprendidos com as peças aprovadas.

O objetivo é fazer o repositório carregar a memória visual da marca, reduzindo dependência de contexto de conversa e garantindo que IAs diferentes produzam peças consistentes.
