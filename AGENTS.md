<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Fonte de verdade do projeto

Antes de alterações amplas, leia `PROJECT_CURRENT_STATE.md`. Ele é o inventário mestre do estado atual do Tempo Pelotas.

`MIGRATION_MATRIX.md` continua sendo a matriz histórica de migração/paridade; não deve ser usado isoladamente para responder o que existe hoje no produto.

Atualize `PROJECT_CURRENT_STATE.md` no mesmo conjunto de mudanças sempre que houver alteração estrutural em páginas públicas, cidades atendidas, funcionalidades ativas/suspensas, fontes de dados, integrações, APIs, crons/workflows, banco/auth, SEO/indexação, variáveis de ambiente estruturais, deploy/runtime ou pendências relevantes.

Documentos especializados em `docs/` continuam sendo a fonte detalhada de cada subsistema. Quando houver divergência entre documentação e código ativo, reconcilie a documentação na mesma mudança.

Nunca versione HARs brutos, cookies, tokens, chaves, secrets, headers autenticados ou URLs contendo credenciais. Use apenas conclusões técnicas sanitizadas em documentos do repositório.

## Padrão oficial de artes para redes sociais

Este bloco é instrução de marca para qualquer IA, agente, designer ou automação que crie artes do Tempo Pelotas. O padrão abaixo foi aprovado em 19/08/2026 e deve ser tratado como referência visual principal para novas peças, adaptando o conteúdo ao assunto sem descaracterizar a identidade.

### Logotipo: fonte de verdade

Para artes de redes sociais, a fonte de verdade do logotipo roxo é:

`https://tempopelotas.com.br/brand/tempo-pelotas-purple.svg`

Regras obrigatórias:

- usar o SVG oficial sempre que a ferramenta suportar vetor;
- nunca redesenhar, reinterpretar, reescrever ou recriar o logotipo por prompt;
- nunca substituir a tipografia interna do logotipo por fontes aproximadas;
- nunca alterar proporções, espaçamento, desenho, contornos ou relação entre `TEMPO` e `Pelotas`;
- não aplicar outra cor ao logotipo salvo quando existir uma variante oficial específica para isso;
- se uma ferramenta generativa não aceitar SVG, converter temporariamente o SVG para PNG de alta resolução com fundo transparente apenas como referência de entrada; o SVG continua sendo a fonte de verdade;
- sempre que possível, gerar foto/fundo e composição sem o logo e aplicar o SVG oficial como camada final determinística. Isso evita deformações típicas de modelos generativos.

O uso deste SVG em artes sociais não altera outras referências técnicas de logo já usadas pelo site, SEO ou dados estruturados.

### Formato oficial do feed

- proporção: `4:5`;
- tamanho final preferencial: `1080 × 1350 px`;
- composição mobile-first, pensada para leitura rápida no feed;
- manter área segura de aproximadamente 70–90 px nas laterais, topo e base;
- evitar texto importante encostado nas bordas;
- exportar com nitidez suficiente para que textos, ícones e logotipo permaneçam legíveis em telas pequenas.

### Linguagem visual aprovada

A arte deve parecer uma peça oficial do Tempo Pelotas, não um template genérico de meteorologia.

Direção visual:

- fotografia real de Pelotas, Laranjal, Lagoa dos Patos ou região como plano de fundo sempre que houver imagem pertinente ao tema;
- enquadramento fotográfico com forte identidade local;
- overlay escuro em azul-marinho/roxo profundo, preservando detalhes da foto e criando contraste;
- roxo da marca como principal cor de destaque. O SVG oficial utiliza o roxo `#5F2DED` como referência dominante;
- branco para títulos, textos e ícones principais;
- tons de roxo podem variar em transparência, degradês discretos e superfícies, desde que mantenham coerência com o logotipo;
- evitar amarelo/dourado como cor estrutural da identidade;
- evitar azul-claro genérico de aplicativo de previsão, excesso de glassmorphism, brilhos aleatórios, cards demais ou aparência de template de IA;
- acabamento editorial, tecnológico, local, confiável e limpo.

### Estrutura visual padrão

A composição aprovada deve seguir esta hierarquia como ponto de partida:

1. **Topo / marca** — logotipo oficial com boa área de respiro. Logo abaixo, quando fizer sentido, usar um selo compacto como `PELOTAS E REGIÃO`.
2. **Headline principal** — título grande, direto e legível em 2 a 4 linhas. Predominantemente branco.
3. **Linha de ênfase** — destacar a informação principal com uma faixa, pincelada, bloco ou superfície roxa. Ex.: `em Pelotas`, `chuva forte`, `vento intenso`, `nível da Lagoa`.
4. **Texto de apoio** — no máximo 2 ou 3 linhas, explicando o benefício ou contexto local. Evitar parágrafos longos.
5. **Faixa de indicadores** — painel horizontal com 3 ou 4 ícones/indicadores relacionados ao tema. Ex.: temperatura, chuva, vento, nebulosidade. Os itens devem mudar conforme o assunto.
6. **CTA principal** — bloco roxo de alta visibilidade próximo à base com `ACESSE` e `tempopelotas.com.br`.
7. **Microprovas opcionais** — uma linha final curta com até 3 atributos reais, por exemplo `DADOS CONFIÁVEIS`, `ATUALIZAÇÃO CONSTANTE`, `INFORMAÇÃO LOCAL`, desde que sejam adequados à peça.

A arte não precisa repetir mecanicamente todos os elementos. O que deve permanecer é a linguagem visual, hierarquia, identidade e CTA. Em peças de alerta ou informação urgente, simplifique a composição para priorizar a mensagem.

### Como adaptar o padrão para assuntos diferentes

Mantenha a estrutura e troque fotografia, headline, destaque, texto de apoio e indicadores conforme o tema.

Exemplos de adaptação:

- **Nevoeiro:** foto real de Pelotas com baixa visibilidade; headline sobre nevoeiro/visibilidade; indicadores como visibilidade, umidade, temperatura e vento, somente quando houver dados disponíveis.
- **Chuva:** foto local de chuva/nuvens ou radar quando permitido; headline sobre chuva em Pelotas; indicadores como chuva, radar, vento e alertas.
- **Frio/geada:** foto local de frio/geada; destaque de temperatura ou risco de geada; indicadores disponíveis de temperatura, vento, umidade e condição prevista.
- **Calor:** foto local de sol/calor; destaque de temperatura; usar somente métricas realmente existentes na fonte de dados do produto.
- **Vento:** foto local compatível; destaque para vento/rajadas; indicadores de velocidade, rajada, direção e alertas quando suportados.
- **Alertas:** reduzir elementos decorativos; o tipo de alerta e a área afetada devem dominar a peça. Nunca inventar nível, período, órgão emissor ou severidade.
- **Lagoa dos Patos / situação hidrológica:** usar foto da Lagoa, Laranjal ou estação relevante; headline sobre nível/tendência; indicadores como nível, tendência, horário da leitura e contexto regional, apenas com dados reais disponíveis.
- **Divulgação institucional:** usar a composição aprovada com headline como `Sua previsão do tempo em Pelotas`, apoio sobre temperatura/chuva/vento/condições em tempo real e CTA para o domínio.

### Regra editorial e factual

Artes meteorológicas e hidrológicas não podem inventar valores, horários, tendências, avisos, probabilidades ou fontes.

Antes de inserir números ou afirmações factuais:

- consultar a fonte atual usada pelo produto ou os dados fornecidos explicitamente para a peça;
- manter unidades e horários claros;
- diferenciar medição observada, previsão e alerta oficial;
- não transformar uma condição prevista em fato observado;
- não transformar tendência em certeza;
- não criar selo de `alerta`, `risco`, `perigo` ou equivalente sem base real.

Quando a peça for apenas institucional, prefira benefícios permanentes e evite números meteorológicos específicos.

### Uso de fotografias

Priorizar imagens reais de Pelotas e região fornecidas pelo projeto ou pelo usuário. Não substituir uma foto local disponível por uma cidade genérica criada por IA.

A foto pode receber crop, ajuste de contraste, tratamento de cor, desfoque localizado e overlay roxo/escuro. Evitar alterar arquitetura, ruas, monumentos ou elementos reconhecíveis a ponto de a imagem deixar de representar o local real.

### Tipografia e legibilidade

- usar sans-serif moderna, robusta e de alta legibilidade para headline e textos auxiliares;
- a escrita cursiva/expressiva da marca deve permanecer restrita ao próprio logotipo oficial;
- headline com peso alto e contraste forte;
- corpo com tamanho suficiente para leitura em celular;
- não ultrapassar aproximadamente 25–30% da peça com texto corrido;
- priorizar uma única mensagem central por arte.

### CTA oficial

O domínio principal deve aparecer exatamente como:

`tempopelotas.com.br`

Preferência visual aprovada:

- superfície roxa arredondada;
- pequeno rótulo `ACESSE`;
- domínio em destaque grande, branco e legível;
- ícone de globo pode ser usado, desde que simples e coerente com o restante da peça.

### Prompt-base para recriação por IA generativa

Ao usar uma IA de imagem, partir desta estrutura e substituir apenas os campos entre colchetes:

> Crie uma arte vertical 4:5 para Instagram do Tempo Pelotas. Use uma fotografia real de Pelotas ou região relacionada a [ASSUNTO] como plano de fundo. Preserve a identidade local e aplique overlay escuro/roxo profundo. Use como fonte de verdade o logotipo oficial `https://tempopelotas.com.br/brand/tempo-pelotas-purple.svg`, sem redesenhar ou reinterpretar o logo. Identidade visual baseada em roxo `#5F2DED`, branco e tons escuros. Estilo editorial, tecnológico, premium, limpo e confiável. No topo, inserir o logotipo oficial e, quando adequado, selo `PELOTAS E REGIÃO`. Headline grande: `[TÍTULO]`. Destacar `[TRECHO PRINCIPAL]` sobre faixa/pincelada roxa. Texto de apoio curto: `[APOIO]`. Criar uma faixa com até quatro indicadores coerentes com o assunto: `[INDICADORES]`. Na base, CTA roxo com `ACESSE tempopelotas.com.br`. Evitar amarelo/dourado, aparência genérica de app meteorológico, excesso de elementos e qualquer dado não fornecido. Formato final 1080 × 1350 px.

Depois da geração, revisar manualmente texto, ortografia, logotipo, números e domínio. Se o modelo deformar o logotipo ou qualquer texto crítico, substituir esses elementos em pós-produção em vez de aceitar a versão gerada.

### Checklist antes de aprovar uma arte

- formato 4:5 e resolução adequada;
- logo oficial correto e sem deformação;
- identidade predominantemente roxa/branca/escura;
- fotografia reconhecivelmente local quando aplicável;
- headline legível em celular;
- uma mensagem principal clara;
- indicadores coerentes com o assunto;
- nenhum dado inventado;
- domínio escrito exatamente `tempopelotas.com.br`;
- CTA visível;
- ortografia revisada;
- sem marcas d'água, logos de terceiros ou elementos visuais que confundam a autoria.
