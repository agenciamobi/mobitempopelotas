# Redes sociais — índice operacional

Este diretório concentra as regras de criação de artes e o planejamento editorial do Tempo Pelotas.

O objetivo é manter o `AGENTS.md` como índice curto e evitar misturar regras gerais do repositório com detalhes de social media.

## Ordem de leitura para uma IA/agente

Quando a tarefa envolver **criação de arte para redes sociais**, ler nesta ordem:

1. `ART_GUIDE.md` — fonte de verdade visual e técnica específica do Tempo Pelotas;
2. `ART_SYSTEM_TEMPLATE.md` — estrutura reutilizável para implantar o mesmo sistema em outros projetos da MOBI;
3. `EDITORIAL_GUIDE.md` — escolha de pautas, validação factual e mix editorial;
4. `tempo-pelotas-ideias-posts.csv` — backlog de ideias de posts.

Quando a tarefa for apenas escolher pauta, calendário ou assunto, `EDITORIAL_GUIDE.md` e o CSV são suficientes, mas qualquer arte gerada depois deve respeitar `ART_GUIDE.md`.

## Fontes de verdade

- Estado atual do produto: `../../PROJECT_CURRENT_STATE.md`.
- Regras gerais para agentes: `../../AGENTS.md`.
- Identidade e composição de artes: `ART_GUIDE.md`.
- Banco editorial: `tempo-pelotas-ideias-posts.csv`.

Se houver divergência entre uma pauta antiga do CSV e o produto atual, prevalecem o código ativo e `PROJECT_CURRENT_STATE.md`. O CSV deve ser reconciliado depois.

## Separação de responsabilidades

### `AGENTS.md`

Deve conter apenas a instrução de entrada e os links para este diretório. Não duplicar nele o manual completo de criação de artes.

### `ART_GUIDE.md`

Contém apenas regras de criação visual do Tempo Pelotas: logotipo, cores, formatos, composição, fotografia, tipografia, CTA, prompts-base, variações por tema e checklist final.

### `ART_SYSTEM_TEMPLATE.md`

É o modelo reutilizável. Não é a identidade do Tempo Pelotas. Foi criado para ser copiado e preenchido em outros repositórios da MOBI, separando claramente o que é regra universal de produção do que é configuração de cada marca.

### `EDITORIAL_GUIDE.md`

Contém regras de pauta: como escolher assunto, como validar informações atuais, como usar o CSV e como equilibrar os pilares editoriais.

### `tempo-pelotas-ideias-posts.csv`

É backlog, não fonte factual. Um item do CSV nunca autoriza publicar número, alerta, previsão ou condição atual sem nova consulta às fontes do produto.

## Regra para novos projetos MOBI

Ao implantar este sistema em outro projeto, não copiar cegamente as cores, logotipo, CTA, fotografias ou linguagem do Tempo Pelotas. Copiar primeiro `ART_SYSTEM_TEMPLATE.md`, preencher a configuração da nova marca e só então criar um `ART_GUIDE.md` específico daquele projeto.
