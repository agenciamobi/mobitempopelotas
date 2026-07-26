import { createFileRoute } from "@tanstack/react-router";

const SCRIPT = String.raw`(function () {
  "use strict";
  var selector = "[data-tempo-pelotas-nivel-laranjal]";
  var embedUrl = "https://tempopelotas.com.br/embed/nivel-laranjal";

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

  function mountAll() {
    document.querySelectorAll(selector).forEach(mount);
  }

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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mountAll, { once: true });
  } else {
    mountAll();
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
            "CDN-Cache-Control": "max-age=86400, stale-while-revalidate=604800",
            "Content-Type": "application/javascript; charset=utf-8",
            "X-Content-Type-Options": "nosniff",
          },
        }),
    },
  },
});
