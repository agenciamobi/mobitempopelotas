# Integração REDEMET / DECEA

A seção de radar e satélite da home utiliza produtos oficiais da API REDEMET exclusivamente por rotas server-side do TEMPO Pelotas.

## Variáveis de ambiente

Obrigatória:

```env
REDEMET_API_KEY=
```

Opcionais, com os valores padrão já adotados pelo código:

```env
REDEMET_API_BASE_URL=https://api-redemet.decea.mil.br/
REDEMET_RADAR_AREA=cn
REDEMET_RADAR_PRODUCT=maxcappi
```

A chave nunca deve usar o prefixo `NEXT_PUBLIC_`.

## Produtos utilizados

- Radar meteorológico de Canguçu: `produtos/radar/maxcappi?area=cn`;
- Satélite: `produtos/satelite/realcada`, `ir` e `vis`;
- Trovoadas: `produtos/stsc`.

## Rotas internas

- `/api/redemet/radar`;
- `/api/redemet/satellite`;
- `/api/redemet/storms`;
- `/api/redemet/image`.

A rota de imagem aceita somente hosts oficiais em allowlist e impede que a aplicação seja usada como proxy aberto.

## Cache

- radar: 3 minutos;
- satélite: 5 minutos;
- trovoadas: 2 minutos;
- imagens: cache CDN de 15 minutos com `stale-while-revalidate`.

## Critérios editoriais

As camadas representam produtos de monitoramento meteorológico. O portal não converte automaticamente ecos ou pontos STSC em alerta oficial. Em situações de risco, o visitante deve consultar INMET, Defesa Civil e autoridades locais.
