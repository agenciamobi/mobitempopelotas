# Windy Stations no TEMPO Pelotas

## Estado atual

A integração está preparada somente para diagnóstico local. Nenhum dado da Windy Stations é exibido publicamente e a chave não é enviada ao navegador.

A API v2 utiliza o host `https://stations.windy.com/` e aceita a API key pelo header `windy-api-key`. Os endpoints usados no diagnóstico são:

- `GET /api/v2/opendata/station`
- `GET /api/v2/opendata/station/{id}/observation`

## Papel das fontes

A hierarquia de fontes do portal permanece:

1. **Embrapa Clima Temperado** — fonte canônica das condições observadas em Pelotas.
2. **Windy Stations Open Data** — observações complementares, comparação espacial e identificação de microclimas.
3. **Open-Meteo** — previsão horária, diária e cobertura regional.
4. **LabHidroSens / UFPel** — nível observado da Lagoa dos Patos na Estação Laranjal.

Uma estação pessoal da Windy não deve substituir automaticamente a Embrapa. Instalação, altura, calibração, manutenção e disponibilidade podem variar entre operadores.

## Executar o diagnóstico

1. Copie as variáveis da `.env.example` para `.env.local`.
2. Preencha somente localmente:

```env
WINDY_STATIONS_API_KEY=
WINDY_STATIONS_DIAGNOSTIC_RADIUS_KM=150
WINDY_STATIONS_DIAGNOSTIC_OBSERVATION_LIMIT=20
```

3. Execute:

```bash
npm run windy:diagnose
```

O script:

- consulta o catálogo de estações abertas;
- normaliza identificador e coordenadas;
- calcula a distância em relação a Pelotas;
- filtra as estações pelo raio configurado;
- consulta observações das estações mais próximas;
- lista os campos numéricos realmente retornados pela API;
- grava um relatório local em `.diagnostics/`.

A pasta `.diagnostics/` é ignorada pelo Git. A API key não é incluída no relatório.

## Critérios antes de publicar

Antes de criar um componente público, validar:

- quantidade real de estações em Pelotas e na Zona Sul;
- frequência e atraso das leituras;
- campos disponíveis por estação;
- consistência das unidades;
- estabilidade dos identificadores;
- atribuição exigida pela Windy e pelo operador;
- autorização para uso público no portal;
- regras para classificar uma estação como atualizada, atrasada ou indisponível.

## Arquitetura futura

Quando o uso público estiver autorizado e os dados estiverem validados, a integração deve entrar como uma camada complementar:

```text
Embrapa
└── condição observada principal de Pelotas

Windy Stations
├── estações próximas
├── comparação entre localidades
├── validação regional de vento, chuva e temperatura
└── detecção de divergências observacionais

Open-Meteo
└── previsão e cobertura regional
```

A interface deve sempre informar nome da estação, distância, operador, horário da leitura, estado de atualização e fonte. Alertas oficiais continuam pertencendo à Defesa Civil e ao INMET.
