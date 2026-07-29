# Validação de autenticação e direitos da conta — produção

Data da validação: **29 de julho de 2026**  
Portal: `https://tempopelotas.com.br`  
Projeto Supabase: `tempopelotas` (`ovcpgjyomwjteapbvfwk`)

## Escopo validado automaticamente

### Projeto e provedor OAuth

- projeto Supabase em estado `ACTIVE_HEALTHY`;
- provedor Google habilitado;
- autenticação anônima desabilitada;
- endpoint `/auth/v1/authorize` aceitou o retorno de produção;
- o Supabase gerou o fluxo do Google com:
  - callback OAuth do projeto Supabase em `/auth/v1/callback`;
  - retorno final para `https://tempopelotas.com.br/auth/callback`;
  - destino interno `/conta` preservado no parâmetro de retorno.

Nenhum Client Secret, token de sessão ou chave administrativa foi incluído nesta evidência.

### Rotas sem sessão

| Verificação | Resultado esperado | Resultado observado |
| --- | --- | --- |
| `/conta` | página de login opcional e `noindex` | disponível |
| `/entrar` | redirecionar para `/conta` | confirmado |
| `/minha-conta` | redirecionar para `/conta` | confirmado |
| `/auth/callback` sem código | retornar à conta com erro controlado | confirmado |
| `/api/account/export` sem sessão | HTTP 401 | confirmado |
| exportação sem sessão | `private, no-store`, `Vary: Cookie, Authorization`, `noindex` | confirmado |

### Exclusão e logout

| Verificação | Resultado observado |
| --- | --- |
| exclusão com origem externa | HTTP 403 |
| exclusão com frase incorreta | HTTP 400 |
| exclusão com frase correta, mas sem sessão | HTTP 401 |
| logout com origem externa | HTTP 403 |
| logout da mesma origem | retorno à home com cache privado e `no-store` |

### Banco, RLS e privilégios

A migration `20260729065000_harden_account_permissions.sql` foi aplicada ao projeto oficial.

Estado efetivo conferido:

- `public.update_account_preferences` usa `SECURITY INVOKER`;
- a RPC pública exige sessão por `auth.uid()`;
- e-mail e avatar são priorizados a partir dos claims autenticados;
- o papel `authenticated` pode somente `SELECT`, `INSERT` e `UPDATE` em `profiles` e `user_preferences`;
- `TRUNCATE`, `DELETE`, `REFERENCES` e `TRIGGER` foram removidos do papel autenticado;
- `account_consent_events` permite somente leitura do próprio histórico ao cliente;
- alterações de preferências geram consentimentos por trigger privado;
- `private.record_account_consent_changes` é `SECURITY DEFINER`, mas não é executável por `authenticated`;
- o advisor de segurança deixou de apontar função `SECURITY DEFINER` pública executável por usuários autenticados.

Os avisos restantes do advisor são informativos para tabelas deliberadamente server-only com RLS sem policy de cliente.

## Proteções automatizadas adicionadas

- `tests/database-security.test.ts`:
  - RPC pública como invoker;
  - trigger privado de consentimento;
  - ausência de privilégios destrutivos para `authenticated`;
  - tabelas meteorológicas operacionais classificadas como server-only.
- `tests/auth-account-security.test.ts`:
  - normalização de `next`;
  - contrato do login Google e callback PKCE;
  - `noindex` da conta;
  - exportação sem tokens ou chaves criptográficas;
  - mesma origem, confirmação e sessão na exclusão;
  - logout somente por POST da mesma origem.

## Validações que ainda exigem interação humana

Estas etapas não devem ser simuladas com credenciais do usuário:

1. concluir o login real no Google em uma janela de navegador;
2. confirmar criação de perfil e preferências no primeiro acesso;
3. alterar uma preferência e conferir que somente uma mudança real gera evento;
4. baixar a exportação autenticada e revisar o arquivo entregue;
5. testar isolamento entre duas contas distintas;
6. excluir uma conta descartável e confirmar a cascata em perfil, preferências, consentimentos e push vinculado;
7. confirmar remoção dos cookies após logout em navegador real.

Até essas etapas interativas serem concluídas, o lote de conta deve ser classificado como **operacional com validação interativa pendente**, e não como encerrado integralmente.
