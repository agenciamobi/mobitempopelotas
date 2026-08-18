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
