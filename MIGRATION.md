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
7. Não expor `SUPABASE_SERVICE_ROLE_KEY`, segredos de cron ou chaves privadas no bundle do navegador.
8. Preservar SEO, acessibilidade, semântica HTML, PWA e desempenho durante a migração.
9. Não criar um segundo banco no Lovable Cloud.
10. Aplicar migrations somente no Supabase externo oficial após revisão.

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
- [ ] Instalar o SDK e criar clientes reais separados para browser e servidor
- [ ] Copiar e revisar migrations existentes
- [ ] Validar RLS e permissões
- [ ] Definir estratégia de Edge Functions para tarefas incompatíveis com o runtime do deploy

### 3. Layout e identidade

- [x] Migrar tokens visuais essenciais do projeto original
- [x] Implementar container responsivo
- [x] Migrar header desktop e mobile
- [x] Migrar footer
- [x] Implementar navegação acessível
- [x] Integrar o layout global ao `__root.tsx`
- [x] Integrar estados de erro e página 404 ao layout

### 4. Camada meteorológica

- [x] Mapear e portar a fonte de previsão Open-Meteo usada pela Home
- [x] Criar contratos TypeScript normalizados
- [x] Separar contratos compartilhados, helper server-only e server function
- [x] Implementar timeout, cache, validação e fallback explícito
- [x] Impedir que dados demonstrativos sejam identificados como observações reais
- [ ] Portar observação local da Embrapa com validação de atualidade
- [ ] Portar alertas oficiais do INMET
- [ ] Mapear e revisar as fontes hidrológicas

### 5. Home

- [x] Migrar a rota inicial
- [x] Exibir condições atuais de previsão
- [x] Exibir previsão horária
- [x] Exibir previsão para sete dias
- [x] Exibir chuva e vento
- [ ] Alertas e destaques locais
- [ ] Links para histórico, mapa, câmeras e nível da Lagoa
- [ ] Dados estruturados e metadados específicos

### 6. Páginas internas e SEO

- [x] Criar rotas estáticas para os destinos atuais do Header e Footer
- [x] Adicionar metadados básicos por rota
- [ ] Histórico meteorológico funcional
- [ ] Radar e mapas
- [ ] Alertas funcionais
- [ ] Câmeras ao vivo
- [ ] Nível da Lagoa dos Patos
- [ ] Conteúdo institucional e metodologia
- [ ] Sitemap
- [ ] Robots
- [ ] Canonicals
- [ ] Open Graph completo
- [ ] Schema.org

### 7. PWA, cron e notificações

- [ ] Manifest
- [ ] Service worker
- [ ] Estratégia de atualização e cache
- [ ] Captura diária de snapshots
- [ ] Autenticação e idempotência dos crons
- [ ] Inscrições push
- [ ] Envio push em runtime compatível

### 8. Qualidade e deploy

- [ ] Typecheck sem erros
- [ ] Lint sem erros
- [ ] Build de produção sem erros
- [ ] Testes das principais rotas
- [ ] Verificação mobile-first
- [ ] Auditoria de acessibilidade
- [ ] Auditoria de Core Web Vitals
- [ ] Configuração das variáveis no ambiente de deploy
- [ ] Validação do Supabase externo em produção
- [ ] Remoção do `_legacy/` após conclusão e conferência final

## Próxima fatia

A próxima implementação deve combinar a previsão do Open-Meteo com uma observação local validada da Embrapa, portar os alertas oficiais do INMET e substituir os placeholders das páginas Hoje e 7 dias por visões completas dos mesmos contratos normalizados.
