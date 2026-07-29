# Plano — diagnóstico do bloqueio de rolagem

O travamento não reproduziu em Chromium headless em nenhuma das três URLs (apex, www, lovable.app). As três servem o mesmo bundle `index-CHv0PIEg.js`, sem `preventDefault`, sem overlay fixed, sem overflow restritivo. O único componente com estado persistente entre sessões é o **Service Worker ativo** (escopo `https://tempopelotas.com.br/`).

Sem uma reprodução real, qualquer edição seria especulativa. Antes de tocar em código, coletar dados do ambiente do usuário.

## Passo 1 — Reprodução no navegador real (usuário executa)

Com a página travada, abrir DevTools > Console e colar:

```js
(() => {
  const se = document.scrollingElement;
  const hs = getComputedStyle(document.documentElement);
  const bs = getComputedStyle(document.body);
  const active = document.activeElement;
  const overlays = [...document.querySelectorAll('*')].filter(e=>{
    const s=getComputedStyle(e); if(!['fixed','sticky'].includes(s.position)) return false;
    const r=e.getBoundingClientRect();
    return r.width>=innerWidth*0.8 && r.height>=innerHeight*0.6 && s.pointerEvents!=='none';
  }).map(e=>({tag:e.tagName,cls:e.className,z:getComputedStyle(e).zIndex,pe:getComputedStyle(e).pointerEvents}));
  const prevented = [];
  ['wheel','keydown','touchmove'].forEach(t=>addEventListener(t,e=>{if(e.defaultPrevented)prevented.push(t)},{capture:true,passive:true}));
  return {
    ua: navigator.userAgent,
    standalone: matchMedia('(display-mode: standalone)').matches,
    url: location.href,
    scrollingEl: se?.tagName, scrollY: scrollY, scrollH: se?.scrollHeight, clientH: se?.clientHeight,
    htmlOverflow:[hs.overflow,hs.overflowY,hs.position,hs.height,hs.overscrollBehavior],
    bodyOverflow:[bs.overflow,bs.overflowY,bs.position,bs.height,bs.touchAction,bs.overscrollBehavior],
    activeElement: active && {tag:active.tagName, cls:active.className, tabindex:active.tabIndex},
    overlays,
    swRegs: await navigator.serviceWorker.getRegistrations().then(rs=>rs.map(r=>r.scope)),
  };
})()
```

E, após tentar rolar por 2 segundos, colar `prevented` (variável global acima) para saber se algum handler está engolindo o evento.

## Passo 2 — Teste de isolamento do Service Worker

Ainda no console da página travada:

```js
navigator.serviceWorker.getRegistrations().then(rs=>Promise.all(rs.map(r=>r.unregister()))).then(()=>location.reload())
```

Se após unregister + reload o scroll voltar, o SW (ou algo que ele injeta/cacheia) é a causa. Se continuar travado, é código de aplicação.

## Passo 3 — Diagnóstico dirigido pelos dados coletados

Com o retorno do passo 1 e o resultado do passo 2, cruzar com:
- `src/routes/__root.tsx` e overlays globais (modals, sheets, toasts, dialogs de menu mobile).
- Registros de SW em `public/` e qualquer hook de instalação de PWA.
- Handlers globais de wheel/keydown em componentes de mapa (MapLibre) que podem ter capturado o documento indevidamente após unmount.
- `activeElement` reportado — se for iframe do YouTube ou canvas do mapa, isso explica setas/PageDown sem efeito no documento; wheel também não subiria se ponteiro estivesse dentro do iframe.

## Passo 4 — Correção

Somente após o passo 3 identificar o responsável, propor edição mínima e localizada. Não editar antes.

## Restrições

- Nenhuma edição de código ou publicação até o passo 3 concluir.
- Nenhum comando com efeito colateral no repositório.
- Domínio público de referência apenas `https://tempopelotas.com.br`.
