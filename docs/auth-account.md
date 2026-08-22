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
10. alterações de preferências usam RPC server-side e geram eventos de consentimento quando o estado muda.

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
- escrita fica reservada a `service_role` e, futuramente, ao fluxo server-side de billing/administração;
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

A camada de acesso deve ser incluída na revisão da exportação antes do lançamento comercial do PRO, sem confundir entitlement com histórico financeiro/fiscal.

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

## Checklist de validação

Antes de considerar a fundação da conta concluída:

1. confirmar a migration `account_access` no Supabase externo;
2. confirmar RLS e ausência de escrita autenticada direta em `account_access`;
3. testar login Google em preview e produção;
4. confirmar criação automática de `profiles`, `user_preferences` e `account_access` no primeiro login;
5. confirmar que o primeiro login recebe `Free`;
6. validar retorno `/conta?next=/painel` → Google → callback → `/painel`;
7. testar rejeição de `next=https://exemplo.com` e `next=//exemplo.com`;
8. confirmar que uma conta não consulta dados privados de outra;
9. validar `/conta` e `/painel` como `noindex`;
10. testar atualização de preferências e consentimentos;
11. testar exportação e ausência de secrets;
12. testar exclusão e cascata, incluindo `account_access`;
13. testar logout;
14. repetir o E2E com duas contas descartáveis em navegador real;
15. só depois avançar para favoritos, históricos Free e billing PRO.
