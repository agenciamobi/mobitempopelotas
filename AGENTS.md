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

## Redes sociais

As regras de social media ficam separadas da documentação geral do agente.

Quando a tarefa envolver **criação de arte para redes sociais**, leia obrigatoriamente:

1. `docs/social/README.md` — índice e ordem de leitura;
2. `docs/social/ART_GUIDE.md` — fonte de verdade visual específica do Tempo Pelotas;
3. `docs/social/EDITORIAL_GUIDE.md` — seleção de pauta e validação factual, quando houver conteúdo atual;
4. `docs/social/tempo-pelotas-ideias-posts.csv` — banco editorial de 350 ideias, quando a tarefa envolver escolha de assunto.

`docs/social/ART_SYSTEM_TEMPLATE.md` é o **modelo reutilizável para implantação desse sistema em outros projetos da MOBI**. Ele não substitui `ART_GUIDE.md` e não deve ser tratado como identidade visual do Tempo Pelotas.

### Regras rápidas que nunca podem ser ignoradas

- logotipo oficial de artes: `https://tempopelotas.com.br/brand/tempo-pelotas-purple.svg`;
- não redesenhar ou deformar o logotipo por IA;
- feed principal: `4:5`, preferencialmente `1080 × 1350 px`;
- domínio/CTA institucional: `tempopelotas.com.br`;
- não inventar previsão, medição, alerta, nível, radar, timestamp ou qualquer dado factual;
- radar, satélite, mapas, gráficos, hidrologia e câmeras devem usar material real quando representarem dados do produto;
- separar sempre previsão, observação, monitoramento e alerta oficial;
- antes de publicar informação atual, validar as fontes vigentes do produto.

O `AGENTS.md` deve permanecer como índice operacional. Não duplicar aqui o manual completo de identidade, composição visual ou planejamento editorial; atualizar os arquivos de `docs/social/` correspondentes.
