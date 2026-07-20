# TEMPO Pelotas

Portal meteorológico local para Pelotas e a Zona Sul do Rio Grande do Sul.

## Stack

- Next.js 16 com App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Open-Meteo como fonte meteorológica inicial
- OpenWeather para radar global de precipitação
- Supabase opcional para arquivo histórico próprio
- MapLibre GL JS para visualização geográfica
- OpenFreeMap como camada cartográfica
- Esri World Imagery como camada de satélite
- Vercel para validação de produção e captura diária

## Desenvolvimento local

```bash
npm install
npm run dev
```

A aplicação inicia em `http://localhost:5175`.

Para definir a URL pública localmente, copie `.env.example` para `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:5175
```

## Validação

```bash
npm run typecheck
npm run build
```

O GitHub Actions e a Vercel validam as atualizações enviadas para a `main`.

## Dados meteorológicos

A integração atual está centralizada em `lib/weather-service.ts` e normaliza os dados antes de entregá-los aos componentes.

Informações disponíveis:

- temperatura e sensação térmica;
- umidade, pressão e visibilidade;
- velocidade, direção e rajadas de vento;
- previsão horária;
- previsão para sete dias;
- probabilidade e acumulado estimado de chuva;
- nascer e pôr do sol;
- condições regionais de Pelotas, Rio Grande, Canguçu e São Lourenço do Sul.

Os dados de previsão são revalidados a cada 10 minutos. Em caso de indisponibilidade da fonte externa, o sistema utiliza uma estrutura de contingência sem interromper a página.

## Histórico meteorológico

O serviço `lib/weather-history-service.ts` consulta os últimos 30 dias completos na API Historical Forecast do Open-Meteo e entrega uma série diária normalizada.

A página de histórico oferece:

- médias das temperaturas máximas e mínimas;
- chuva acumulada no período;
- maior rajada registrada pelo modelo;
- identificação do dia mais quente, mais frio e mais chuvoso;
- gráfico interativo para 7, 14 ou 30 dias;
- alternância entre temperatura, chuva e rajadas;
- Schema.org do tipo `Dataset`;
- endpoint interno `/api/weather/history`.

O histórico é revalidado a cada seis horas. Quando o armazenamento próprio está configurado, os snapshots persistidos têm prioridade sobre o dado externo correspondente. Durante a formação do arquivo, o sistema combina os dias próprios com a série do Open-Meteo, sem deixar lacunas no painel.

## Arquivo meteorológico próprio

A persistência é opcional e utiliza a API REST do Supabase apenas no servidor, sem enviar a chave administrativa ao navegador.

1. Aplique a migration:

```text
supabase/migrations/20260718233000_create_weather_daily_snapshots.sql
```

2. Configure no ambiente local e na Vercel:

```env
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=CHAVE_APENAS_DO_SERVIDOR
CRON_SECRET=SEGREDO_ALEATORIO_COM_PELO_MENOS_16_CARACTERES
```

3. A chamada `GET /api/cron/weather-snapshot` busca o dia completo anterior e realiza `upsert` pela combinação `location_slug + observed_date`.

4. A chamada protegida `POST /api/cron/weather-snapshot` preenche imediatamente os últimos 30 dias disponíveis. Em desenvolvimento local com PowerShell:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:5175/api/cron/weather-snapshot" `
  -Headers @{ Authorization = "Bearer $env:CRON_SECRET" }
```

5. O `vercel.json` agenda a execução diária às `06:15 UTC`, equivalente a `03:15` no horário de Pelotas. Em contas Hobby, a execução pode ocorrer em qualquer momento dentro dessa hora.

O backfill é interrompido quando a fonte externa está em contingência, evitando gravar a amostra demonstrativa como histórico real. Enquanto as variáveis não estiverem configuradas, a captura retorna como ignorada e o portal continua funcionando exclusivamente com o histórico externo e o fallback já existente.

## Câmeras meteorológicas

A página `app/cameras-ao-vivo-pelotas/page.tsx` está preparada para pontos de observação no Laranjal, Centro e Canal São Gonçalo.

Características:

- fontes configuradas exclusivamente por variáveis de ambiente;
- URLs validadas e limitadas a HTTPS, com HTTP permitido apenas em ambiente local;
- transmissão externa carregada somente após ação do usuário;
- seletor de pontos com estados disponível e em preparação;
- link opcional para a fonte original;
- atribuição do provedor por câmera;
- layout desktop e mobile com linguagem de aplicativo;
- ItemList em Schema.org;
- indexação, sitemap e atalho PWA condicionados à existência de uma transmissão ativa.

Exemplo de configuração:

```env
CAMERA_LARANJAL_EMBED_URL=https://URL-DE-INCORPORACAO
CAMERA_LARANJAL_PUBLIC_URL=https://PAGINA-ORIGINAL
CAMERA_LARANJAL_PROVIDER=Nome do provedor

CAMERA_CENTRO_EMBED_URL=
CAMERA_CENTRO_PUBLIC_URL=
CAMERA_CENTRO_PROVIDER=

CAMERA_SAO_GONCALO_EMBED_URL=
CAMERA_SAO_GONCALO_PUBLIC_URL=
CAMERA_SAO_GONCALO_PROVIDER=
```

Sem uma URL de incorporação válida, o ponto permanece identificado como `Em preparação`. O portal não exibe transmissões fictícias nem tenta acessar RTSP diretamente no navegador.

## Nível da Lagoa dos Patos

A página `app/nivel-da-lagoa-dos-patos-laranjal/page.tsx` organiza o acesso ao painel público da Estação Laranjal, fornecido pelo LabHidroSens / UFPel.

Recursos:

- painel externo carregado somente depois da ação do usuário;
- link permanente para abrir o dashboard original;
- contexto com vento atual, rajadas e chuva prevista;
- destaque na página inicial e na página de alertas;
- metadados, canonical, Schema.org `WebPage` e entrada no sitemap;
- atalho próprio no manifesto PWA;
- aviso explícito de que o portal não define cotas de inundação nem converte a leitura em alerta oficial;
- fallback para acesso direto caso o provedor bloqueie a incorporação em `iframe`.

A referência do dashboard fica centralizada em `lib/lagoon-level.ts`.

## Experiência mobile

A interface para celulares segue uma linguagem próxima de aplicativo nativo:

- cabeçalho fixo com suporte à área segura de aparelhos com notch;
- barra inferior com cinco abas, ícones e indicação da rota ativa;
- navegação preparada para instalação como PWA;
- cartões compactos com hierarquia adaptada para toque;
- carrosséis horizontais com scroll snap para previsão horária, histórico, câmeras e conteúdos relacionados;
- painel da lagoa responsivo e carregado sob demanda;
- controles de mapa, satélite e radar adaptados para toque;
- suporte a `viewport-fit=cover` e `safe-area-inset`;
- manifesto com atalhos para tempo atual, previsão semanal, chuva, lagoa, câmeras, histórico e alertas;
- estilos específicos para execução em modo `standalone`.

Os principais ajustes estão em `app/mobile-app.css`, `app/cameras.css`, `app/lagoon-level.css`, `app/radar-map.css` e `components/site-header.tsx`.

## Gráficos meteorológicos

O componente `components/weather-trend-chart.tsx` apresenta a evolução horária sem adicionar bibliotecas externas de gráficos.

Recursos:

- alternância entre temperatura, probabilidade de chuva e rajadas;
- gráfico SVG responsivo com área, linha, grade e ponto selecionado;
- seleção de horário por botões acessíveis;
- resumo numérico atualizado em tempo real;
- carrossel com scroll snap no celular;
- tema inicial contextual nas páginas de chuva e vento;
- uso na página inicial e nas páginas específicas de previsão.

O componente `components/weather-history-chart.tsx` aplica a mesma arquitetura ao histórico diário e permite alternar o período exibido.

## Satélite e radar de precipitação

O mapa regional possui um seletor com três modos:

- `Mapa` — cartografia vetorial do OpenFreeMap;
- `Satélite` — Esri World Imagery com atribuição dos provedores;
- `Radar` — precipitação observada e prevista pelo OpenWeather Global Precipitation Map Forecast.

O radar oferece:

- histórico da última hora em intervalos de 10 minutos;
- previsão de até duas horas para Pelotas e a Zona Sul;
- reprodução e pausa da animação;
- seleção manual do horário;
- identificação de quadro observado ou previsto;
- controle de transparência;
- legenda de intensidade;
- cidades e temperaturas mantidas acima da camada meteorológica.

A chave do OpenWeather nunca é enviada ao navegador. O componente consulta `/api/weather/radar/status` e os tiles passam pelo proxy restrito `/api/weather/radar/tiles/[timestamp]/[z]/[x]/[y]`, que valida horário, zoom e coordenadas antes de acessar o provedor.

Configuração necessária:

```env
OPENWEATHER_API_KEY=CHAVE_COM_ACESSO_AO_GLOBAL_PRECIPITATION_MAP_FORECAST
```

Sem a chave ou sem acesso ao produto contratado, o botão `Radar` permanece desativado e o mapa convencional e a camada de satélite continuam disponíveis.

## Mapa regional

O mapa da página inicial utiliza coordenadas geográficas reais e apresenta marcadores meteorológicos para as cidades monitoradas.

Características:

- carregamento progressivo somente quando o mapa se aproxima da área visível;
- navegação, zoom e centralização em Pelotas;
- marcadores acessíveis com temperatura e condição atual;
- popup com detalhes por cidade;
- gestos cooperativos para não bloquear a rolagem da página;
- alternância entre mapa, imagem de satélite e radar;
- atribuição cartográfica automática de OpenFreeMap, Esri e OpenWeather;
- fallback visual quando uma camada externa não puder ser carregada.

## Páginas

- `/` — painel meteorológico principal;
- `/tempo-hoje-pelotas` — condição atual e previsão horária;
- `/previsao-7-dias-pelotas` — tendência semanal completa;
- `/chuva-em-pelotas` — probabilidade e acumulado de chuva;
- `/vento-em-pelotas` — vento médio e rajadas;
- `/nivel-da-lagoa-dos-patos-laranjal` — medidor da Estação Laranjal;
- `/historico-climatico-pelotas` — comparação dos últimos 30 dias;
- `/cameras-ao-vivo-pelotas` — pontos de observação visual da cidade;
- `/alertas` — leitura automática de condições de atenção;
- `/api/weather` — endpoint interno com dados normalizados;
- `/api/weather/history` — endpoint interno do histórico recente;
- `/api/weather/radar/status` — disponibilidade e linha do tempo do radar;
- `/api/weather/radar/tiles/[timestamp]/[z]/[x]/[y]` — proxy protegido dos tiles meteorológicos;
- `/api/cron/weather-snapshot` — captura e backfill protegidos do arquivo diário.

## SEO e distribuição

- metadados por página;
- URLs canônicas;
- Schema.org, FAQPage, Dataset, ItemList e WebPage;
- sitemap dinâmico;
- robots.txt;
- navegação interna entre previsões;
- manifesto instalável e ícone do aplicativo;
- conteúdo renderizado no servidor.

## Alertas

A página de alertas utiliza critérios internos para destacar chuva, rajadas e indicação de temporal. Essa leitura não representa um alerta oficial e não substitui a Defesa Civil, o INMET ou as autoridades locais. O medidor da lagoa e o radar são apresentados como informações complementares.

## Próximas etapas

- configurar um projeto Supabase exclusivo e iniciar o arquivo diário próprio;
- configurar uma chave OpenWeather com acesso ao radar de precipitação;
- integrar avisos oficiais do INMET e referências da Defesa Civil;
- ativar as primeiras fontes públicas e estáveis de câmera;
- avaliar integração estruturada do nível da lagoa quando houver API pública documentada;
- ampliar a cobertura para mais cidades da Zona Sul;
- revisar identidade visual e conteúdo com base no uso real.
