# Autenticação, conta e preferências

## Princípio editorial

A conta do Tempo Pelotas é opcional. Nenhuma página pública de previsão, chuva, vento, radar, satélite, câmeras, alertas ou situação das águas exige autenticação.

O login existe somente para:

- identificação básica do visitante;
- preferências opcionais de alertas meteorológicos e hidrológicos;
- resumo diário opcional;
- novidades do portal, quando autorizadas.

## Arquitetura

O fluxo usa Supabase Auth com Google, PKCE e cookies SSR:

1. `/entrar` inicia `signInWithOAuth` no navegador;
2. o Google retorna ao Supabase Auth;
3. o Supabase redireciona para `/auth/callback` com um código temporário;
4. a rota server-side troca o código pela sessão;
5. a sessão é persistida em cookies pelo `@supabase/ssr`;
6. `/minha-conta` valida o usuário no servidor antes de consultar dados privados;
7. perfil e preferências são lidos e gravados com o cliente autenticado, sob RLS.

O parâmetro `next` aceita somente caminhos internos normalizados. URLs externas, caminhos iniciados por `//` e variações com barra invertida são recusados.

## Variáveis

```env
SUPABASE_MODE=external
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=

VITE_SUPABASE_MODE=external
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

As variáveis `VITE_*` contêm somente URL e chave publicável. A chave administrativa não participa do login, da leitura do perfil nem da atualização de preferências.

## Configuração do Google e Supabase

No projeto Supabase oficial:

1. habilitar o provedor Google;
2. cadastrar Client ID e Client Secret no painel do Supabase;
3. configurar a URL pública do portal em **Site URL**;
4. adicionar à allowlist de redirects:
   - `https://DOMINIO-OFICIAL/auth/callback`;
   - a URL equivalente do ambiente de preview;
   - `http://localhost:PORTA/auth/callback` somente para desenvolvimento;
5. remover URLs temporárias quando não forem mais usadas.

No Google Auth Platform, o callback autorizado do cliente OAuth é o callback fornecido pelo próprio projeto Supabase (`/auth/v1/callback`).

## Cookies e cache

`src/lib/supabase/request-client.server.ts` adapta os cookies do `@supabase/ssr` ao formato universal Request/Response do TanStack Start.

Respostas que dependem de sessão usam:

- `Cache-Control: private, no-store`;
- `Pragma: no-cache`;
- `Vary: Cookie, Authorization`.

Isso impede que uma resposta contendo dados de uma conta seja reutilizada por cache compartilhado.

## Proteção dos dados

As tabelas `profiles` e `user_preferences` têm RLS habilitada. As policies permitem que usuários autenticados consultem e alterem somente o próprio registro, comparando `auth.uid()` com `id` ou `user_id`.

A interface não recebe:

- access token;
- refresh token;
- chave administrativa;
- ID interno do usuário;
- dados de outras contas.

## Logout

`POST /auth/signout`:

- aceita somente solicitação da mesma origem;
- encerra a sessão local do dispositivo atual;
- remove os cookies retornados pelo Supabase;
- redireciona com status `303` para a página inicial.

## Checklist de validação

Antes de habilitar em produção:

1. aplicar e conferir as migrations de `profiles` e `user_preferences` no Supabase oficial;
2. regenerar `database.types.ts` após aplicar o schema;
3. testar leitura anônima negada nas duas tabelas;
4. testar login Google em preview e produção;
5. confirmar criação automática de perfil e preferências no primeiro acesso;
6. confirmar que um usuário não consegue consultar ou alterar outro usuário;
7. testar retorno para `/minha-conta` após o login;
8. testar rejeição de `next=https://exemplo.com` e `next=//exemplo.com`;
9. testar logout e invalidação da sessão local;
10. confirmar que `/entrar` e `/minha-conta` permanecem `noindex`.

## Próximas obrigações LGPD

A próxima fatia deve implementar:

- exportação dos dados da própria conta;
- exclusão da conta com confirmação explícita e revalidação de sessão;
- política pública de retenção;
- registro auditável de consentimento para cada canal de comunicação;
- limpeza das inscrições push vinculadas à conta excluída.
