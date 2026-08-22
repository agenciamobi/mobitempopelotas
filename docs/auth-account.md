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

O login Google para Web passa a usar **Google Identity Services diretamente no Tempo Pelotas + Supabase `signInWithIdToken()`**.

Objetivo: manter o Supabase como provedor de sessão e identidade sem expor o domínio técnico `<project-ref>.supabase.co` na etapa em que o usuário escolhe a conta Google e sem depender do add-on pago de Custom Domain.

Fluxo principal:

1. `/conta` apresenta o botão oficial do Google quando não existe sessão;
2. `GoogleLoginCard` carrega `https://accounts.google.com/gsi/client` no navegador;
3. o Google Identity Services é inicializado com o **Web Client ID público** em `VITE_GOOGLE_CLIENT_ID`;
4. a aplicação gera nonce aleatório com Web Crypto, envia ao Google a versão SHA-256 e mantém o nonce bruto apenas em memória para validação;
5. o Google abre o seletor/fluxo diretamente a partir do Tempo Pelotas e devolve um ID Token para o callback JavaScript;
6. o browser chama `supabase.auth.signInWithIdToken({ provider: "google", token, nonce })`;
7. o Supabase valida a identidade Google e cria/abre a sessão normal do Supabase Auth;
8. após sucesso, a aplicação navega diretamente para o `next` interno normalizado, como `/painel`;
9. `/conta` e `/painel` revalidam o usuário no servidor e seguem usando as mesmas tabelas, RLS, preferências e entitlements;
10. se uma sessão válida existir mas alguma linha estrutural estiver ausente, a aplicação pode reparar apenas a própria fundação da conta, sempre recriando `account_access` como Free.

O fluxo antigo PKCE via `signInWithOAuth()` não é mais a entrada principal do Google. A rota `/auth/callback` permanece temporariamente como compatibilidade segura durante a transição, mas o novo botão Google não navega para `*.supabase.co/auth/v1/callback`.

As rotas legadas `/entrar` e `/minha-conta` permanecem apenas como redirecionamentos de compatibilidade para `/conta`.

O parâmetro `next` aceita somente caminhos internos normalizados. Isso permite que `/painel` envie o visitante para `/conta?next=/painel` e que, após a autenticação, o usuário retorne ao painel sem aceitar redirects externos.

## Configuração Google Web

O frontend precisa somente do **Web Client ID público** do Google:

```env
VITE_GOOGLE_CLIENT_ID=000000000000-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
```

Esse Client ID é público por natureza e pode ser incorporado ao bundle. O **Google Client Secret não pode ser colocado em `VITE_*`, no frontend ou versionado no GitHub**; ele continua restrito à configuração do provider no Supabase quando necessário.

No Google Auth Platform, as origens JavaScript autorizadas devem incluir os hosts reais do portal que executarão o Google Identity Services, por exemplo:

- `https://tempopelotas.com.br`;
- `https://www.tempopelotas.com.br`;
- ambientes adicionais somente quando realmente usados para teste.

O novo fluxo por ID Token não depende de cadastrar `https://tempopelotas.com.br/auth/v1/callback` como callback do Google. Esse caminho não hospeda o serviço Auth do Supabase.

Branding do Google deve usar nome, domínio, logotipo, política de privacidade e demais informações oficiais do Tempo Pelotas. Isso é independente da autenticação Supabase e melhora a identificação do aplicativo pelo usuário.

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
VITE_GOOGLE_CLIENT_ID=
```

As variáveis `VITE_*` contêm somente valores públicos. A chave administrativa e qualquer Client Secret permanecem exclusivamente fora do bundle do navegador.

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
- Google Client Secret;
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
- exportação LGPD inclui a camada de acesso e continua omitindo secrets;
- código do login foi migrado de `signInWithOAuth()` para Google Identity Services + `signInWithIdToken()`;
- nonce do Google é gerado com Web Crypto e validado pelo Supabase;
- o botão principal não referencia `/auth/v1/callback` do Supabase.

Ainda pendente e obrigatório antes de iniciar favoritos/históricos Free:

- configurar `VITE_GOOGLE_CLIENT_ID` no build de produção;
- E2E real do Google Identity Services em navegador;
- primeiro login criando `profiles`, `user_preferences` e `account_access`;
- confirmação visual/funcional de que o primeiro usuário recebe Free;
- retorno `/conta?next=/painel` → Google → ID Token → Supabase → `/painel`;
- atualização de preferências/consentimentos com sessão real;
- exportação, logout e exclusão com conta real de teste;
- isolamento cruzado com duas contas descartáveis;
- validação em mobile/navegador real.

No momento da última inspeção técnica, `auth.users` ainda estava vazio. Portanto nenhum teste real do novo login Google foi declarado como concluído.

## Checklist de validação final

1. [x] confirmar a migration `account_access` no Supabase externo;
2. [x] confirmar RLS e ausência de escrita autenticada direta em `account_access`;
3. [x] aplicar e validar a reparação segura da fundação da conta;
4. [x] remover `signInWithOAuth()` da entrada principal do Google;
5. [x] implementar Google Identity Services + `signInWithIdToken()` com nonce;
6. [ ] configurar `VITE_GOOGLE_CLIENT_ID` em produção;
7. [ ] testar login Google em produção;
8. [ ] confirmar criação automática/reparação de `profiles`, `user_preferences` e `account_access` no primeiro login;
9. [ ] confirmar que o primeiro login recebe `Free`;
10. [ ] validar retorno `/conta?next=/painel` → Google → ID Token → Supabase → `/painel`;
11. [x] proteger por contrato `next=https://exemplo.com` e `next=//exemplo.com`;
12. [ ] confirmar em E2E que uma conta não consulta dados privados de outra;
13. [x] manter `/conta` e `/painel` como `noindex` por contrato;
14. [ ] testar atualização de preferências e consentimentos em navegador real;
15. [x] incluir camada de acesso na exportação e manter secrets fora do payload por contrato;
16. [ ] testar exportação em navegador real;
17. [ ] testar exclusão e cascata, incluindo `account_access`;
18. [ ] testar logout;
19. [ ] repetir o E2E com duas contas descartáveis em navegador real;
20. [ ] validar mobile;
21. [ ] somente depois avançar para favoritos, históricos Free e billing PRO.
