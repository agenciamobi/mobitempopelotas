# Migração — Tempo Pelotas

## Contexto

Este repositório contém a nova versão do portal Tempo Pelotas, migrada do projeto original em Next.js para a base TanStack Start criada pelo Lovable.

- Repositório de origem: `agenciamobi/tempopelotas`
- Repositório oficial: `agenciamobi/mobitempopelotas`
- Branch principal: `main`
- Código legado de consulta: `_legacy/`
- Backend oficial: Supabase externo

## Stack oficial

- TanStack Start
- TanStack Router
- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- TanStack Query
- Nitro
- Supabase externo

A arquitetura nativa do novo projeto deve ser preservada. Arquivos de configuração, dependências ou convenções do Next.js não devem substituir as configurações do TanStack Start.

## Regras da migração

1. Nunca importar arquivos diretamente de `_legacy/`.
2. Copiar somente a implementação necessária e adaptá-la para `src/`.
3. Migrar em fatias pequenas, compiláveis e revisáveis.
4. Executar `npm run build`, `npm run typecheck` e `npm run lint` antes de integrar cada etapa. O build deve ocorrer primeiro para gerar a árvore de rotas do TanStack Router.
5. Manter dados meteorológicos normalizados e desacoplados dos componentes visuais.
6. Manter segredos exclusivamente no servidor.
7. Não expor `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, segredos de cron ou chaves privadas no bundle do navegador.
8. Preservar SEO, acessibilidade, semântica HTML, PWA e desempenho durante a migração.
9. Não criar um segundo banco no Lovable Cloud.
10. Aplicar migrations somente no Supabase externo oficial após revisão e conferência do histórico existente.
11. Textos públicos devem ser compreensíveis para visitantes leigos e distinguir previsão, observação, tendência e alerta oficial.

## Estrutura pretendida

```text
src/
  components/
    layout/
    migration/
    weather/
    ui/
  lib/
    weather/
    supabase/
  routes/
  styles.css
public/
supabase/
  functions/
  migrations/
_legacy/
```

## Etapas

### 1. Fundação e configuração

- [x] Importar o projeto antigo para `_legacy/`
- [x] Excluir `_legacy/` do TypeScript, Prettier, ESLint e detecção do Tailwind
- [x] Bloquear imports diretos do legado
- [x] Adicionar script de typecheck
- [x] Configurar idioma e metadados padrão do shell raiz
- [x] Registrar o plano de migração

### 2. Supabase externo

- [x] Definir variáveis públicas e modo controlado em `.env.example`
- [x] Criar configuração e adaptador mock sem acesso de rede
- [x] Instalar `@supabase/supabase-js` e `@supabase/ssr` com versões fixadas
- [x] Criar clientes reais separados para navegador, servidor público e operações administrativas server-only
- [x] Versionar migrations de perfis, preferências, consentimentos, snapshots e Web Push com RLS
- [x] Adicionar contratos estáticos para impedir regressões de RLS, cascatas e privilégios nas migrations versionadas
- [ ] Conferir o histórico de migrations do projeto Supabase oficial antes de aplicar qualquer SQL
- [ ] Validar policies RLS com usuário anônimo e pelo menos duas contas autenticadas distintas
- [ ] Gerar novamente `database.types.ts` a partir do projeto oficial após a aplicação das migrations
- [ ] Definir e validar o runtime definitivo para cron, snapshots e Web Push

### 3. Layout e identidade

- [x] Migrar tokens visuais essenciais do projeto original
- [x] Implementar container responsivo
- [x] Migrar header desktop e mobile
- [x] Migrar footer
- [x] Implementar navegação acessível
- [x] Integrar o layout global ao `__root.tsx`
- [x] Integrar estados de erro e página 404 ao layout
- [x] Consolidar tema editorial moderno e navegação orientada ao visitante leigo

### 4. Camada meteorológica

- [x] Mapear e portar a fonte de previsão Open-Meteo usada pela Home
- [x] Criar contratos TypeScript normalizados
- [x] Separar contratos compartilhados, helper server-only e server function
- [x] Implementar timeout, cache, validação e fallback explícito
- [x] Impedir que dados demonstrativos sejam identificados como observações reais
- [x] Portar observação local da Embrapa com validação de atualidade
- [x] Portar alertas oficiais do INMET
- [x] Portar CPPMet/UFPel e resumo meteorológico com fallback determinístico
- [x] Portar fontes hidrológicas prioritárias, regras semânticas e estados de atraso

### 5. Home

- [x] Migrar a rota inicial
- [x] Exibir condições atuais de previsão
- [x] Exibir previsão horária
- [x] Exibir previsão para sete dias
- [x] Exibir chuva e vento
- [x] Integrar alertas, banners preventivos e destaques locais
- [x] Integrar atalhos para histórico, mapas, câmeras e níveis das águas
- [x] Manter navegação útil durante indisponibilidade completa das fontes
- [x] Integrar dados estruturados e metadados editoriais

### 6. Páginas internas e SEO

- [x] Criar rotas públicas para tempo, clima, águas, mapas, câmeras e transparência
- [x] Adicionar metadados próprios por rota
- [x] Persistir histórico meteorológico real no Supabase externo
- [x] Integrar radar, satélite, trovoadas e mapa regional com contingência explícita
- [x] Integrar avisos meteorológicos funcionais
- [x] Integrar câmeras ao vivo e contingências do YouTube
- [x] Integrar nível da Lagoa dos Patos e situação hidrológica regional
- [x] Publicar conteúdo institucional, política de privacidade e metodologia
- [x] Publicar sitemap, robots, canonicals e Open Graph
- [x] Publicar Schema.org global, feed JSON e endpoint público de dados

### 7. Autenticação, PWA, cron e notificações

- [x] Implementar login Google com PKCE, cookies SSR e retorno interno validado
- [x] Implementar área de conta, preferências e logout
- [x] Implementar consentimentos versionados, exportação e exclusão de dados
- [x] Manifesto instalável com atalhos editoriais
- [x] Service worker com fallback offline seguro
- [x] Estratégia controlada de atualização e cache de ativos
- [x] Captura diária idempotente de snapshots
- [x] Rotas de cron autenticadas e idempotentes
- [x] Inscrições Web Push opcionais por aparelho e por tópico
- [x] Envio Web Push/VAPID em runtime Node, com paginação, leases e limpeza de endpoints expirados
- [ ] Aplicar e validar as migrations no Supabase oficial
- [ ] Configurar Google OAuth e redirects de preview e produção
- [ ] Configurar VAPID definitivo, `CRON_SECRET`, `PUSH_ADMIN_SECRET` e schedulers no ambiente definitivo
- [ ] Testar notificações reais em Chrome/Android e Safari/iOS instalado

### 8. Qualidade e deploy

- [x] Typecheck sem erros no CI
- [x] Lint sem erros no CI
- [x] Build de produção sem erros no CI
- [x] Contratos automatizados para níveis, HTTP/push, rotas públicas e segurança das migrations
- [x] Auditoria visual automatizada em desktop e mobile
- [x] Smoke automatizado de acessibilidade nas 11 rotas públicas críticas, em desktop e mobile estreito
- [ ] Auditoria completa de acessibilidade WCAG 2.2 AA, incluindo revisão manual
- [ ] Testes reais de RLS, OAuth, exportação, exclusão, cron e Web Push no Supabase oficial
- [ ] Auditoria de Core Web Vitals em produção
- [ ] Configuração integral das variáveis no ambiente definitivo
- [ ] Validação do deploy, domínio, redirects, sitemap e rollback
- [ ] Remoção do `_legacy/` somente após a conferência final de paridade e o corte estável

## Snapshot atual do legado

- Repositório origem: `agenciamobi/tempopelotas` @ `main`
- Commit sincronizado no diretório `_legacy/`: `05cd2d268ad25c070718ecc170bd30e8ad181341`
- Data UTC do snapshot: `2026-07-22T00:11:00Z`
- Método: `git clone --depth 1` + `rsync` sanitizado
- Arquivos em `_legacy/`: `249`
- Detalhes e exclusões: ver `_legacy/SOURCE_SNAPSHOT.md`

O repositório de origem continua no mesmo commit do snapshot. Entregas futuras devem ser comparadas novamente antes de cada lote. A presença de um arquivo em `_legacy/` nunca deve ser considerada implementação concluída.

## Matriz de migração

O inventário completo — status por domínio, origem → destino, dependências, incompatibilidades Next → TanStack, risco, critério de aceite e lote recomendado — vive em [`MIGRATION_MATRIX.md`](./MIGRATION_MATRIX.md).

## Próxima fatia

O próximo bloco é o **Lote 10 — operacionalização, auditoria e corte**:

1. conferir e aplicar as migrations no Supabase oficial, regenerar tipos e validar RLS com isolamento entre contas;
2. validar Google OAuth, cookies SSR, exportação e exclusão em preview e produção;
3. configurar VAPID e schedulers definitivos, com logs, alertas e testes reais de navegador;
4. executar auditoria manual WCAG 2.2 AA, Core Web Vitals, segurança, SEO de corte, domínio e plano de rollback;
5. remover o legado somente após evidência de paridade funcional e estabilidade em produção.
