# Camada meteorológica

A primeira integração ativa da nova aplicação usa o Open-Meteo exclusivamente no servidor.

## Organização

- `types.ts`: contratos serializáveis compartilhados pela rota e pelos componentes.
- `open-meteo.server.ts`: consulta, validação Zod e normalização server-only.
- `weather.functions.ts`: server function consumida pelos loaders do TanStack Router.

## Regras

- A interface nunca deve apresentar valores demonstrativos como dados reais.
- Respostas inválidas, timeout ou indisponibilidade do provedor retornam estado `unavailable`.
- O cache público atual é de cinco minutos.
- A previsão do Open-Meteo não deve ser descrita como observação oficial de estação local.
- A observação da Embrapa e os alertas do INMET serão integrados em etapas separadas.
