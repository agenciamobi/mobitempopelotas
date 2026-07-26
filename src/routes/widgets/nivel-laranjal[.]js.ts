import { createFileRoute } from "@tanstack/react-router";

const SCRIPT = String.raw`(function () {
  "use strict";
  var selector = "[data-tempo-pelotas-nivel-laranjal]";
  var embedUrl = "https://tempopelotas.com.br/embed/nivel-laranjal";
  var globalKey = "TempoPelotasNivelLaranjal";

  function mount(container) {
    if (!container || container.dataset.tempoPelotasMounted === "true") return;
    container.dataset.tempoPelotasMounted = "true";

    var iframe = document.createElement("iframe");
    iframe.src = embedUrl;
    iframe.title = "Nível da Lagoa dos Patos no Laranjal";
    iframe.loading = "lazy";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.setAttribute("scrolling", "no");
    iframe.setAttribute("allowtransparency", "true");
    iframe.setAttribute("sandbox", "allow-scripts allow-same-origin allow-popups");
    iframe.style.display = "block";
    iframe.style.width = "100%";
    iframe.style.height = container.dataset.height || "470px";
    iframe.style.minHeight = "360px";
    iframe.style.border = "0";
    iframe.style.borderRadius = "28px";
    iframe.style.background = "transparent";

    container.style.width = "100%";
    container.style.maxWidth = container.dataset.maxWidth || "680px";
    container.style.marginInline = container.dataset.align === "left" ? "0" : "auto";
    container.appendChild(iframe);
  }

  function mountAll(root) {
    var scope = root && root.querySelectorAll ? root : document;
    if (scope.matches && scope.matches(selector)) mount(scope);
    scope.querySelectorAll(selector).forEach(mount);
  }

  if (window[globalKey] && typeof window[globalKey].mountAll === "function") {
    window[globalKey].mountAll(document);
    return;
  }

  window[globalKey] = { mountAll: mountAll };

  window.addEventListener("message", function (event) {
    if (event.origin !== "https://tempopelotas.com.br") return;
    var data = event.data || {};
    if (data.type !== "tempo-pelotas:widget-resize" || data.widget !== "nivel-laranjal") return;
    document.querySelectorAll(selector + " iframe").forEach(function (iframe) {
      if (iframe.contentWindow === event.source && Number.isFinite(data.height)) {
        iframe.style.height = Math.max(340, Math.min(760, Math.ceil(data.height))) + "px";
      }
    });
  });

  function initialize() {
    mountAll(document);
    if (!("MutationObserver" in window) || !document.documentElement) return;

    var observer = new MutationObserver(function (records) {
      records.forEach(function (record) {
        record.addedNodes.forEach(function (node) {
          if (node && node.nodeType === 1) mountAll(node);
        });
      });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window[globalKey].observer = observer;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();`;

export const Route = createFileRoute("/widgets/nivel-laranjal.js")({
  server: {
    handlers: {
      GET: () =>
        new Response(SCRIPT, {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
            "CDN-Cache-Control": "max-age=3600, stale-while-revalidate=86400",
            "Content-Type": "application/javascript; charset=utf-8",
            "X-Content-Type-Options": "nosniff",
          },
        }),
    },
  },
});
