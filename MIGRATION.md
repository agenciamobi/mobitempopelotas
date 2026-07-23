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
- [x] Versionar migrations de perfis e preferências com RLS
- [ ] Conferir o histórico de migrations do projeto Supabase oficial antes de aplicar qualquer SQL
- [ ] Validar policies RLS com usuários autenticados e anônimos
- [ ] Gerar novamente `database.types.ts` a partir do projeto oficial após a aplicação das migrations
- [ ] Definir Edge Functions para cron, snapshots e web push

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
- [ ] Persistir histórico meteorológico real no Supabase externo
- [x] Integrar radar, satélite, trovoadas e mapa regional com contingência explícita
- [x] Integrar avisos meteorológicos funcionais
- [x] Integrar câmeras ao vivo e contingências do YouTube
- [x] Integrar nível da Lagoa dos Patos e situação hidrológica regional
- [x] Publicar conteúdo institucional e metodologia
- [x] Publicar sitemap, robots, canonicals e Open Graph
- [x] Publicar Schema.org global, feed JSON e endpoint público de dados

### 7. PWA, cron e notificações

- [x] Manifesto instalável com atalhos editoriais
- [x] Service worker com fallback offline seguro
- [x] Estratégia controlada de atualização e cache de ativos
- [ ] Captura diária de snapshots
- [ ] Autenticação e idempotência dos crons
- [ ] Inscrições push
- [ ] Envio push em runtime compatível

### 8. Qualidade e deploy

- [x] Typecheck sem erros no CI
- [x] Lint sem erros no CI
- [x] Build de produção sem erros no CI
- [x] Auditoria visual automatizada em desktop e mobile
- [ ] Testes unitários dos parsers, normalizadores, RLS e rotas críticas
- [ ] Auditoria completa de acessibilidade WCAG 2.2 AA
- [ ] Auditoria de Core Web Vitals em produção
- [ ] Configuração das variáveis no ambiente definitivo
- [ ] Validação do Supabase externo em produção
- [ ] Remoção do `_legacy/` após conclusão e conferência final

## Snapshot atual do legado

- Repositório origem: `agenciamobi/tempopelotas` @ `main`
- Commit sincronizado no diretório `_legacy/`: `05cd2d268ad25c070718ecc170bd30e8ad181341`
- Data UTC do snapshot: `2026-07-22T00:11:00Z`
- Método: `git clone --depth 1` + `rsync` sanitizado
- Arquivos em `_legacy/`: `249`
- Detalhes e exclusões: ver `_legacy/SOURCE_SNAPSHOT.md`

As entregas posteriores ao snapshot são comparadas diretamente com o repositório de origem antes de cada lote. A presença de um arquivo em `_legacy/` nunca deve ser considerada implementação concluída.

## Matriz de migração

O inventário completo (status por domínio, origem → destino, dependências, incompatibilidades Next → TanStack, risco, critério de aceite e lote recomendado) vive em [`MIGRATION_MATRIX.md`](./MIGRATION_MATRIX.md).

## Próxima fatia

O próximo bloco é o **Lote 6 — histórico climático e snapshots**:

1. revisar e versionar as tabelas de snapshots meteorológicos do projeto de origem;
2. validar retenção, timezone `America/Sao_Paulo`, índices e acesso exclusivamente server-side para escrita;
3. substituir o estado vazio de `/historico-climatico-pelotas` por séries reais, períodos compreensíveis e explicações editoriais para o visitante;
4. somente depois ativar autenticação Google, área de conta e preferências pessoais sobre a base SSR já preparada.
