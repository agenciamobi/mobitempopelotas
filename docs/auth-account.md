# Autenticação, conta, preferências e direitos LGPD

## Princípio editorial

A conta do Tempo Pelotas é opcional. Nenhuma página pública de previsão, chuva, vento, radar, satélite, câmeras, alertas ou situação das águas exige autenticação.

O login existe somente para:

- identificação básica do visitante;
- preferências opcionais de alertas meteorológicos e hidrológicos;
- resumo diário opcional;
- novidades do portal, quando autorizadas;
- exercício dos direitos de acesso, correção, revogação e exclusão.

## Arquitetura

O fluxo usa Supabase Auth com Google, PKCE e cookies SSR:

1. `/entrar` inicia `signInWithOAuth` no navegador;
2. o Google retorna ao Supabase Auth;
3. o Supabase redireciona para `/auth/callback` com um código temporário;
4. a rota server-side troca o código pela sessão;
5. a sessão é persistida em cookies pelo `@supabase/ssr`;
6. `/minha-conta` valida o usuário no servidor antes de consultar dados privados;
7. perfil e preferências são lidos e gravados sob RLS;
8. alterações das quatro preferências geram eventos de consentimento somente quando o estado muda.

O parâmetro `next` aceita somente caminhos internos normalizados. URLs externas, caminhos iniciados por `//` e variações com barra invertida são recusados.

## Variáveis

```env
SUPABASE_MODE=external
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

VITE_SUPABASE_MODE=external
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

As variáveis `VITE_*` contêm somente URL e chave publicável. A chave administrativa permanece exclusivamente no servidor e é usada para operações que exigem remoção da identidade, exportação consolidada e armazenamento web push.

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

As tabelas `profiles`, `user_preferences` e `account_consent_events` têm RLS habilitada. Usuários autenticados consultam somente os próprios registros.

A interface não recebe:

- access token;
- refresh token;
- chave administrativa;
- ID interno do usuário;
- dados de outras contas;
- chaves criptográficas da inscrição web push.

## Histórico de consentimentos

A migration `20260723133000_add_account_lgpd_rights.sql` cria `account_consent_events` e atualiza `update_account_preferences`.

O histórico registra:

- canal alterado;
- estado autorizado ou revogado;
- origem da alteração;
- versão da política;
- data e hora.

Um evento é gravado apenas quando o novo estado difere do último registro daquele canal. A tabela é apagada em cascata quando a identidade é excluída.

## Exportação dos dados

```http
GET /api/account/export
```

A rota exige sessão autenticada e entrega um arquivo JSON contendo:

- dados básicos da conta;
- perfil e preferências;
- histórico de consentimentos;
- inscrições de notificação vinculadas à conta.

Tokens, chaves criptográficas e credenciais administrativas são omitidos por segurança. A resposta usa `Content-Disposition: attachment` e não pode ser armazenada em cache compartilhado.

## Exclusão da conta

```http
POST /api/account/delete
Content-Type: application/json

{
  "confirmation": "EXCLUIR MINHA CONTA"
}
```

A rota:

- exige mesma origem;
- limita o corpo JSON;
- valida a sessão diretamente no Supabase;
- exige a frase de confirmação exata;
- remove a identidade pelo cliente administrativo;
- encerra a sessão local;
- depende de `ON DELETE CASCADE` para remover perfil, preferências, consentimentos e inscrições push vinculadas.

Inscrições push anônimas não possuem `user_id` e não são removidas pela exclusão da conta. Elas continuam controladas pelo próprio aparelho e são eliminadas quando o visitante desativa o recurso ou o provedor responde com expiração.

## Logout

`POST /auth/signout`:

- aceita somente solicitação da mesma origem;
- encerra a sessão local do dispositivo atual;
- remove os cookies retornados pelo Supabase;
- redireciona com status `303` para a página inicial.

## Política pública

A rota `/privacidade-e-dados` explica em linguagem direta:

- quais dados são usados;
- quais páginas continuam públicas;
- eventos que determinam a retenção;
- itens omitidos da exportação por segurança;
- como baixar, corrigir, revogar ou excluir dados.

## Checklist de validação

Antes de habilitar em produção:

1. aplicar todas as migrations no Supabase oficial;
2. regenerar `database.types.ts` a partir do schema aplicado;
3. testar leitura anônima negada em perfis, preferências e consentimentos;
4. testar login Google em preview e produção;
5. confirmar criação automática de perfil e preferências no primeiro acesso;
6. confirmar que um usuário não consegue consultar ou alterar outro usuário;
7. testar retorno seguro para `/minha-conta` após o login;
8. testar rejeição de `next=https://exemplo.com` e `next=//exemplo.com`;
9. testar exportação e conferir ausência de tokens e chaves;
10. testar registro de consentimento somente após mudança real;
11. testar vínculo e desvinculação de inscrições push autenticadas e anônimas;
12. testar exclusão e confirmar cascata nas quatro tabelas relacionadas;
13. testar logout e invalidação da sessão local;
14. confirmar que `/entrar` e `/minha-conta` permanecem `noindex`;
15. validar `/privacidade-e-dados` no sitemap e no rodapé.
