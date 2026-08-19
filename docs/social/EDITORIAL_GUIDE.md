# Tempo Pelotas — guia editorial para redes sociais

Este arquivo define como escolher pautas, validar informações e transformar o banco editorial em publicações.

Ele não substitui o guia visual. Para criar uma arte, ler também `ART_GUIDE.md`.

## 1. Banco editorial

Fonte de referência:

`tempo-pelotas-ideias-posts.csv`

O arquivo reúne **350 ideias de posts** numeradas de `TP-001` a `TP-350`.

Os IDs são estáveis. Ao ampliar o banco:

- adicionar novos IDs sequenciais;
- não renumerar IDs existentes;
- não reutilizar IDs removidos/descontinuados.

O CSV é **backlog editorial**, não fonte de verdade factual.

## 2. Colunas canônicas

- `id` — identificador estável da pauta;
- `pilar` — macrotema;
- `serie` — série recorrente;
- `titulo_post` — proposta-base de assunto;
- `pagina_destino` — rota preferencial para CTA, quando ainda válida;
- `prioridade` — orientação editorial inicial;
- `frequencia_sugerida` — cadência possível;
- `sazonalidade` — estação, contexto ou condição em que a pauta tende a funcionar melhor.

## 3. Pilares atuais

O banco cobre, entre outros:

- institucional;
- rotina editorial;
- previsão;
- chuva;
- vento;
- radar e satélite;
- alertas oficiais;
- observação local/Embrapa;
- meteograma;
- histórico e clima;
- hidrologia;
- geadas;
- câmeras;
- transparência e tecnologia;
- cotidiano/sazonal;
- cidades e panorama regional;
- educação meteorológica.

## 4. Como escolher a pauta

Antes de criar uma publicação:

1. verificar o que é relevante **agora** para Pelotas e região;
2. considerar condição meteorológica, sazonalidade, alertas oficiais, situação hidrológica e interesse local;
3. procurar no CSV pautas coerentes com esse contexto;
4. preferir prioridade `Alta` quando houver aderência real ao momento;
5. evitar repetir a mesma série em sequência se houver outra pauta igualmente útil;
6. alternar utilidade imediata, educação, cobertura regional, hidrologia e institucional;
7. validar se `pagina_destino` ainda existe em `PUBLIC_ROUTES`/código/`PROJECT_CURRENT_STATE.md`;
8. tratar `titulo_post` como ponto de partida, não como texto imutável.

A utilidade pública do momento tem prioridade sobre uma cadência fixa.

Exemplo: durante chuva relevante, vento forte, alerta oficial ou mudança hidrológica, conteúdo de serviço deve prevalecer sobre uma pauta institucional prevista para aquele dia.

## 5. Verificação factual obrigatória

Para qualquer publicação com dados atuais, consultar as fontes vigentes do produto antes de escrever texto ou montar arte.

### Previsão

- usar a previsão atual para o mesmo horizonte temporal citado;
- não apresentar previsão como observação;
- não transformar tendência em certeza.

### Observação / Embrapa

- usar medição válida;
- incluir timestamp quando relevante;
- respeitar estados de leitura atualizada, atrasada ou indisponível;
- nunca apresentar dado atrasado como atual.

### Radar e satélite

- usar quadro real válido;
- manter timestamp;
- preservar atribuição;
- nunca gerar radar/satélite fictício por IA.

### Trovoadas / STSC

- tratar como monitoramento de atividade elétrica;
- não apresentar como alerta oficial.

### Alertas

- publicar como alerta apenas quando houver aviso oficial válido;
- preservar órgão emissor, área, período e severidade;
- não inventar nível de risco ou interpretação adicional.

### Hidrologia

- informar nível, tendência e horário somente quando houver leitura válida;
- nível/tendência não equivalem a previsão de cheia;
- não criar faixas de risco sem critério oficial/documentado.

### Câmeras

- confirmar `live`, `replay` ou indisponibilidade;
- nunca apresentar replay como transmissão ao vivo.

### Comparações entre cidades

- usar o mesmo horizonte temporal;
- comparar variáveis equivalentes;
- evitar misturar horários de referência diferentes.

### Histórico e recordes

- não usar `recorde` com base apenas em janela de 30 dias ou série insuficiente;
- informar período e fonte usados na comparação.

## 6. Quatro categorias que não podem ser misturadas

Manter sempre separadas:

1. **previsão** — cenário futuro estimado;
2. **observação** — dado efetivamente medido;
3. **monitoramento** — radar, satélite, trovoadas, câmeras e outros sinais de acompanhamento;
4. **alerta oficial** — aviso emitido por órgão competente.

Essa separação deve aparecer tanto na linguagem quanto na arte.

## 7. Da pauta à publicação

1. selecionar pauta no CSV;
2. validar a relevância atual;
3. consultar dados/fontes necessários;
4. confirmar rota de destino;
5. definir headline e apoio;
6. criar arte conforme `ART_GUIDE.md`;
7. preparar legenda com contexto e CTA;
8. revisar fatos, unidades, horários, ortografia e link.

## 8. Mix editorial recomendado

Referência flexível:

- **40–50%** utilidade e atualidade: tempo do dia, previsão, chuva, vento, alertas, radar e Lagoa;
- **20–25%** educação meteorológica, clima, metodologia e transparência;
- **15–20%** cobertura de cidades e panoramas da Zona Sul;
- **10–15%** institucional, funcionalidades, bastidores técnicos e divulgação do portal.

Durante eventos meteorológicos/hidrológicos relevantes, aumentar temporariamente a proporção de conteúdo de serviço.

## 9. Reuso de pautas

Não apagar uma ideia porque já foi publicada.

Muitas pautas são recorrentes e podem ser usadas novamente com:

- outro contexto meteorológico;
- outra fotografia;
- outra cidade;
- outro recorte de horário;
- outro formato;
- nova leitura de dados.

O controle de posts efetivamente publicados deve existir separadamente do banco de ideias.

## 10. Manutenção do banco

Atualizar o CSV quando:

- surgir nova página ou funcionalidade;
- uma rota pública for renomeada/removida;
- uma pauta se tornar tecnicamente incorreta;
- uma nova cidade/região passar a ser atendida;
- uma série editorial nova for aprovada;
- um novo recurso real do produto abrir oportunidades editoriais.

Se o produto mudar, o código ativo e `PROJECT_CURRENT_STATE.md` prevalecem sobre o CSV.
