import { Check, Code2, Copy, ExternalLink } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import "./LaranjalEmbedGuide.css";

const EMBED_CODE = `<div data-tempo-pelotas-nivel-laranjal></div>\n<script async src="https://tempopelotas.com.br/widgets/nivel-laranjal.js"></script>`;
const COPY_FEEDBACK_DURATION = 2200;

export function LaranjalEmbedGuide() {
  const [copied, setCopied] = useState(false);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current);
    },
    [],
  );

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(EMBED_CODE);
      setCopied(true);
      if (resetTimerRef.current !== null) window.clearTimeout(resetTimerRef.current);
      resetTimerRef.current = window.setTimeout(() => {
        setCopied(false);
        resetTimerRef.current = null;
      }, COPY_FEEDBACK_DURATION);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="laranjal-embed-guide" aria-labelledby="laranjal-embed-guide-title">
      <div className="laranjal-embed-guide-copy">
        <span className="laranjal-embed-guide-eyebrow">Recurso público</span>
        <h2 id="laranjal-embed-guide-title">Leve o nível do Laranjal para outro site.</h2>
        <p>
          O widget é responsivo, atualiza a leitura automaticamente e mantém a fonte técnica
          identificada. O conteúdo é carregado em um iframe isolado, sem interferir no CSS do portal
          que o incorpora.
        </p>
        <ul>
          <li>Leitura atual, tendência e histórico recente.</li>
          <li>Altura ajustada automaticamente ao conteúdo.</li>
          <li>Uso gratuito com atribuição ao Tempo Pelotas e à UFPel.</li>
        </ul>
        <a href="/api/widgets/nivel-laranjal" target="_blank" rel="noopener noreferrer">
          Consultar API JSON <ExternalLink aria-hidden="true" />
        </a>
      </div>

      <div className="laranjal-embed-guide-code">
        <header>
          <div>
            <Code2 aria-hidden="true" />
            <span>Código de incorporação</span>
          </div>
          <button
            type="button"
            onClick={copyCode}
            aria-label={copied ? "Código de incorporação copiado" : "Copiar código de incorporação"}
          >
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            <span aria-live="polite">{copied ? "Copiado" : "Copiar"}</span>
          </button>
        </header>
        <pre tabIndex={0} aria-label="Código HTML para incorporar o widget">
          <code>{EMBED_CODE}</code>
        </pre>
        <small>
          Para limitar a largura, adicione <code>data-max-width="620px"</code> ao elemento{" "}
          <code>div</code>.
        </small>
      </div>
    </section>
  );
}
