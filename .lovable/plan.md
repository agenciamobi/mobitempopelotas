# Diagnóstico — rolagem "só arrastando a barra"

## Resultado da reprodução

Testei o sintoma descrito em **duas superfícies**, com Playwright/Chromium headless, viewport 1280×900, sobre a Home `/`:

1. Preview local (`http://localhost:8080/`, HEAD atual).
2. Domínio publicado (`https://mobitempopelotas.lovable.app/`).

Em ambos, wheel do mouse e teclas de navegação movimentaram o documento normalmente:

| Ação | Preview `scrollY` | Público `scrollY` |
|---|---|---|
| inicial | 0 | 0 |
| `mouse.wheel(0, 600)` | 600 | 600 |
| `PageDown` | 1387 | 1387 |
| `End` | 7933 | 8067 |

Nenhum listener `wheel`/`keydown`/`touchmove` marcou `defaultPrevented=true`. Nenhum overlay `fixed`/`sticky` cobrindo ≥90% do viewport com `pointer-events` ativo. `document.scrollingElement === <html>`, `document.activeElement === <body>`, sem iframe fullscreen sobre o conteúdo.

Estado computado relevante (público):

```text
html  overflow-y:auto  overflow-x:hidden  position:static  height:9507.78px
body  overflow-y:auto  overflow-x:hidden  position:static  height:9507.78px
scrollingElement = HTML   scrollHeight = 9508   clientHeight = 900
```

Isso é consistente com um documento normalmente rolável — não há trava global de wheel/teclado no código atual (o teste `tests/document-scroll.test.ts` já veda `wheel`/`stopImmediatePropagation`/`DocumentScrollGuard` em `__root.tsx`, e o guard antigo foi removido).

## Por que não vou nomear uma causa agora

A instrução explícita foi "não proponha hipóteses sem reproduzir". Não reproduzi o sintoma nas condições testadas, então qualquer culpado que eu apontasse (ex.: `PwaManager` bloqueando scroll do body quando o diálogo abre, foco preso num `contenteditable`, `overflow: hidden` aplicado ao `<html>` por um estado transiente, extensão do navegador, camada MapLibre capturando wheel) seria especulação.

## O que preciso de você para fechar o diagnóstico

Uma destas informações, na ordem de utilidade:

1. **URL exata e rota** onde o travamento aparece (Home, `/radar-e-satelite-pelotas`, `/situacao-hidrologica-pelotas`, embed, etc.) e se é preview (`id-preview--…lovable.app`) ou domínio público.
2. **Reprodutibilidade**: acontece sempre, ou só depois de alguma ação (abrir menu, clicar em card de radar, PWA instalado, abrir/fechar diálogo, foco num input)?
3. **Ambiente**: navegador + versão, desktop/mobile, se está com o app instalado como PWA (modo standalone), extensões ativas.
4. **Snapshot no momento do travamento** — cole no console e me mande o retorno:

```js
(() => {
  const de = document.documentElement, b = document.body, se = document.scrollingElement;
  const cs = getComputedStyle(de), bs = getComputedStyle(b);
  return {
    scrollingElement: se && se.tagName,
    html: { overflowY: cs.overflowY, overflowX: cs.overflowX, position: cs.position, height: cs.height },
    body: { overflowY: bs.overflowY, overflowX: bs.overflowX, position: bs.position, height: bs.height },
    activeElement: document.activeElement && (document.activeElement.tagName + '#' + document.activeElement.id + '.' + document.activeElement.className),
    pwaDataset: document.documentElement.dataset,
    fixedOverlays: Array.from(document.querySelectorAll('*')).filter(e => {
      const s = getComputedStyle(e); if (!['fixed','sticky'].includes(s.position)) return false;
      const r = e.getBoundingClientRect();
      return r.width >= innerWidth*0.9 && r.height >= innerHeight*0.9 && s.pointerEvents !== 'none';
    }).map(e => e.tagName + '#' + e.id + '.' + (e.className||'').toString().slice(0,120)),
    scrollY: scrollY, docHeight: de.scrollHeight
  };
})()
```

5. Opcional: no DevTools → Elements → Event Listeners no `document`, `window`, `html` e `body`, um print da lista dos listeners `wheel`, `keydown`, `touchmove`, `scroll` (com "Ancestors" desmarcado).

Com esses dados eu volto direto ao arquivo/listener culpado — sem chutar entre `PwaManager`, `SiteLayout`, `PwaAppExperience`, MapLibre ou o CSS `document-scroll.css`.

## Próximo passo

Aguardo os dados acima. Não mexo em nenhum arquivo até a causa estar reproduzida.
