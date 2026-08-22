# Autenticação, conta, painel, preferências e direitos LGPD

Última atualização: 22/08/2026.

## Princípio de produto

A conta do Tempo Pelotas é opcional para o consumo do portal aberto. Nenhuma página pública de previsão, chuva, vento, radar, satélite, câmeras, alertas, dados oficiais ou situação das águas deve exigir autenticação apenas para criar escassez comercial.

A autenticação acrescenta uma camada pessoal ao portal:

- identificação básica;
- preferências opcionais;
- painel autenticado;
- favoritos e locais acompanhados, quando implementados;
- históricos e ferramentas definidos para a camada Free;
- futuros recursos PRO por entitlement;
- exercício de direitos LGPD.

A política de separação Público / Free / PRO está em `docs/DATA_ACCESS_PUBLIC_FREE_PRO_PLAN.md`.

## Arquitetura atual

O fluxo usa Supabase Auth com Google, PKCE e cookies SSR:

1. `/conta` apresenta o login Google quando não existe sessão;
2. `GoogleLoginCard` inicia `signInWithOAuth` no navegador;
3. o Google retorna ao Supabase Auth;
4. o Supabase redireciona para `/auth/callback` com código temporário;
5. a rota server-side troca o código pela sessão;
6. a sessão é persistida em cookies pelo `@supabase/ssr`;
7. `/conta` valida o usuário no servidor e gerencia identidade, preferências, privacidade e sessão;
8. `/painel` valida o usuário no servidor e funciona como shell autenticado comum a Free e PRO;
9. perfil, preferências e camada de acesso são consultados sob RLS;
10. alterações de preferências usam RPC server-side e geram eventos de consentimento quando o estado muda;
11. se uma sessão válida existir mas alguma linha estrutural estiver ausente, a aplicação pode reparar apenas a própria fundação da conta, sempre recriando `account_access` como Free.

As rotas legadas `/entrar` e `/minha-conta` permanecem apenas como redirecionamentos de compatibilidade para `/conta`.

O parâmetro `next` aceita somente caminhos internos normalizados. Isso permite que `/painel` envie o visitante para `/conta?next=/painel` e que, após o OAuth, o usuário retorne ao painel sem aceitar redirects externos.

## Camada de acesso

A migration `20260822043000_create_account_access.sql` cria `public.account_access`.

Cada identidade autenticada recebe uma linha própria com:

- `user_id`;
- `tier` — `free` ou `pro`;
- `status` — `active`, `suspended` ou `expired`;
- `source` — origem da concessão, inicialmente `system`;
- `valid_until` opcional;
- timestamps de criação/atualização.

Regras:

- novos usuários nascem `free` e `active` automaticamente;
- usuários existentes são preenchidos como Free pela migration;
- o usuário autenticado pode somente **ler a própria linha**;
- não existe escrita direta de `account_access` pelo browser autenticado;
- escrita administrativa fica reservada a `service_role` e, futuramente, ao fluxo server-side de billing/administração;
- ausência, expiração ou estado inválido nunca concede PRO por fallback.

`src/lib/auth/account-access.ts` centraliza os entitlements. Componentes não devem espalhar verificações como `plan === "pro"`.

A camada Free começa preparada para:

- acesso ao painel;
- preferências;
- favoritos;
- histórico de até 60 dias nos recursos definidos como Free.

A camada PRO pode liberar, quando implementado e permitido pelas fontes:

- histórico completo;
- comparações entre períodos, estações e variáveis;
- exportações;
- radar/satélite avançados;
- métricas de acurácia;
- gráficos e análises avançadas.

Esses entitlements não alteram a regra de que dados oficiais adequados à disseminação pública continuam públicos.

## Reparação segura da fundação da conta

A migration `20260822045500_repair_authenticated_account_foundation.sql` cria a RPC `ensure_current_user_account_foundation()`.

Finalidade: impedir que uma falha eventual de trigger deixe uma sessão Google válida com conta parcialmente criada.

A função:

- exige `auth.uid()` válido;
- lê somente a identidade autenticada correspondente em `auth.users`;
- recria/atualiza o próprio `profiles`;
- cria `user_preferences` ausente;
- cria `account_access` ausente estritamente como `free`, `active`, `system`;
- usa `ON CONFLICT ... DO NOTHING` em `account_access`, portanto não altera uma concessão existente;
- nunca concede ou restaura PRO;
- é `SECURITY DEFINER` com `search_path` vazio;
- não pode ser executada por `anon`;
- pode ser chamada por `authenticated` somente para a própria identidade obtida por `auth.uid()`.

`getAccountSnapshot()` consulta perfil, preferências e acesso. Se não houver erro de leitura, mas alguma dessas três linhas estiver ausente, chama a reparação uma vez e recarrega a fundação. `storageReady` somente fica verdadeiro quando as três estruturas existem e foram lidas sem erro.

A migration foi aplicada ao Supabase externo em 22/08/2026 e validada com `SECURITY DEFINER`, `search_path` vazio, execução negada a `anon` e liberada a `authenticated`.

## `/conta` e `/painel`

### `/conta`

Responsabilidades:

- login quando não autenticado;
- identidade;
- nome de exibição;
- preferências e consentimentos;
- indicação da camada Free/PRO;
- acesso ao painel;
- exportação LGPD;
- exclusão de conta;
- logout.

### `/painel`

Responsabilidades:

- exigir autenticação server-side;
- permanecer `noindex, nofollow`;
- apresentar a camada efetiva da conta;
- funcionar como shell comum a Free e PRO;
- receber progressivamente módulos pessoais e premium;
- nunca ser usado para esconder conteúdo governamental que já pertence ao portal público.

No primeiro estágio, o painel é intencionalmente um shell: ele identifica a conta e mostra a estrutura dos módulos sem fingir que favoritos, históricos avançados, comparações ou exportações já estão concluídos.

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

As variáveis `VITE_*` contêm somente URL e chave publicável. A chave administrativa permanece exclusivamente no servidor.

## Cookies e cache

Respostas dependentes de sessão usam:

- `Cache-Control: private, no-store, max-age=0`;
- `Pragma: no-cache`;
- `Vary: Cookie, Authorization`.

Isso evita reutilização de respostas privadas por cache compartilhado.

## RLS e proteção

As tabelas `profiles`, `user_preferences`, `account_consent_events` e `account_access` possuem RLS.

O browser autenticado não recebe:

- access token como dado de aplicação;
- refresh token como dado de aplicação;
- chave administrativa;
- dados de outras contas;
- chaves criptográficas web push;
- mecanismo de escrita direta para promover a própria conta a PRO.

## Preferências e consentimentos

`update_account_preferences` é a RPC controlada para atualizar perfil e preferências. O histórico de consentimentos preserva:

- canal;
- estado autorizado/revogado;
- origem;
- versão da política;
- data/hora.

## Exportação dos dados

```http
GET /api/account/export
```

A rota exige sessão e entrega JSON com os dados pessoais previstos pelo contrato atual. Tokens, chaves criptográficas e credenciais administrativas são omitidos.

A exportação versão `1.1` inclui também a camada de acesso (`tier`, `status`, `source`, `valid_until` e timestamps), sem confundir entitlement com histórico financeiro/fiscal. Quando billing existir, dados financeiros sujeitos a retenção legal deverão ter política própria.

## Exclusão da conta

```http
POST /api/account/delete
Content-Type: application/json

{
  "confirmation": "EXCLUIR MINHA CONTA"
}
```

A rota exige mesma origem, limita o corpo, valida sessão, exige frase exata, remove a identidade pelo cliente administrativo e encerra a sessão local. `account_access` usa `ON DELETE CASCADE` e acompanha a exclusão da identidade.

## Logout

`POST /auth/signout` encerra somente a sessão local do dispositivo atual e redireciona para a Home.

## Estado de validação em 22/08/2026

Confirmado tecnicamente:

- migration `account_access` aplicada no Supabase externo;
- RLS de `account_access` permite apenas leitura da própria linha ao autenticado;
- escrita administrativa de `account_access` não está disponível ao browser autenticado;
- triggers de criação de perfil, preferências e acesso existem em `auth.users`;
- reparação segura da fundação foi aplicada e validada no banco;
- `/conta` e `/painel` estão preparados como rotas privadas/noindex;
- `next` rejeita redirects externos por contrato;
- exportação LGPD inclui a camada de acesso e continua omitindo secrets.

Ainda pendente e obrigatório antes de iniciar favoritos/históricos Free:

- E2E real do Google OAuth em navegador;
- primeiro login criando `profiles`, `user_preferences` e `account_access`;
- confirmação visual/funcional de que o primeiro usuário recebe Free;
- retorno `/conta?next=/painel` → Google → callback → `/painel`;
- atualização de preferências/consentimentos com sessão real;
- exportação, logout e exclusão com conta real de teste;
- isolamento cruzado com duas contas descartáveis;
- validação em mobile/navegador real.

No momento da última inspeção técnica, `auth.users` ainda estava vazio. Portanto nenhum teste real de Google OAuth foi declarado como concluído.

## Checklist de validação final

1. [x] confirmar a migration `account_access` no Supabase externo;
2. [x] confirmar RLS e ausência de escrita autenticada direta em `account_access`;
3. [x] aplicar e validar a reparação segura da fundação da conta;
4. [ ] testar login Google em preview e produção;
5. [ ] confirmar criação automática/reparação de `profiles`, `user_preferences` e `account_access` no primeiro login;
6. [ ] confirmar que o primeiro login recebe `Free`;
7. [ ] validar retorno `/conta?next=/painel` → Google → callback → `/painel`;
8. [x] proteger por contrato `next=https://exemplo.com` e `next=//exemplo.com`;
9. [ ] confirmar em E2E que uma conta não consulta dados privados de outra;
10. [x] manter `/conta` e `/painel` como `noindex` por contrato;
11. [ ] testar atualização de preferências e consentimentos em navegador real;
12. [x] incluir camada de acesso na exportação e manter secrets fora do payload por contrato;
13. [ ] testar exportação em navegador real;
14. [ ] testar exclusão e cascata, incluindo `account_access`;
15. [ ] testar logout;
16. [ ] repetir o E2E com duas contas descartáveis em navegador real;
17. [ ] validar mobile;
18. [ ] somente depois avançar para favoritos, históricos Free e billing PRO.
