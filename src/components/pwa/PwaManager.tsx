import { useEffect, useRef, useState } from "react";

import "./pwa-manager.css";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

function InstallIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v12M7 10l5 5 5-5" />
      <path d="M4 18v2h16v-2" />
    </svg>
  );
}

function UpdateIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 11a8 8 0 1 0-2.3 5.7" />
      <path d="M20 4v7h-7" />
    </svg>
  );
}

function isStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    Boolean((navigator as NavigatorWithStandalone).standalone)
  );
}

export function PwaManager() {
  const launcherRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const refreshingRef = useRef(false);
  const [isReady, setIsReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const fullscreenQuery = window.matchMedia("(display-mode: fullscreen)");
    const updateInstalledState = () => setIsInstalled(isStandaloneMode());
    const userAgent = navigator.userAgent.toLowerCase();

    setIsIos(/iphone|ipad|ipod/.test(userAgent));
    updateInstalledState();
    standaloneQuery.addEventListener("change", updateInstalledState);
    fullscreenQuery.addEventListener("change", updateInstalledState);

    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setMessage("O Tempo Pelotas foi instalado neste aparelho.");
    };

    const handleControllerChange = () => {
      if (refreshingRef.current) return;
      refreshingRef.current = true;
      window.location.reload();
    };

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);
    navigator.serviceWorker?.addEventListener("controllerchange", handleControllerChange);

    let updateTimer: number | undefined;
    let registration: ServiceWorkerRegistration | null = null;

    const initialize = async () => {
      try {
        if ("serviceWorker" in navigator) {
          registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });

          if (registration.waiting) setWaitingWorker(registration.waiting);

          registration.addEventListener("updatefound", () => {
            const installingWorker = registration?.installing;
            if (!installingWorker) return;

            installingWorker.addEventListener("statechange", () => {
              if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                setWaitingWorker(registration?.waiting ?? installingWorker);
              }
            });
          });

          updateTimer = window.setInterval(() => {
            void registration?.update();
          }, 60 * 60 * 1000);
        }
      } catch (error) {
        console.error("Não foi possível iniciar o aplicativo do Tempo Pelotas:", error);
      } finally {
        setIsReady(true);
      }
    };

    void initialize();

    return () => {
      standaloneQuery.removeEventListener("change", updateInstalledState);
      fullscreenQuery.removeEventListener("change", updateInstalledState);
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
      navigator.serviceWorker?.removeEventListener("controllerchange", handleControllerChange);
      if (updateTimer) window.clearInterval(updateTimer);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousElement = document.activeElement as HTMLElement | null;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setIsOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.requestAnimationFrame(() => dialogRef.current?.focus());

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.requestAnimationFrame(() => (previousElement ?? launcherRef.current)?.focus());
    };
  }, [isOpen]);

  async function installApp() {
    setMessage(null);

    if (!installPrompt) {
      setMessage(
        isIos
          ? "No iPhone ou iPad, toque em Compartilhar e depois em Adicionar à Tela de Início."
          : "Abra o menu do navegador e escolha Instalar aplicativo ou Adicionar à tela inicial.",
      );
      return;
    }

    setIsBusy(true);
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;

      if (choice.outcome === "accepted") {
        setIsInstalled(true);
        setInstallPrompt(null);
        setMessage("Aplicativo instalado neste aparelho.");
      } else {
        setMessage("A instalação foi cancelada. Você pode tentar novamente quando desejar.");
      }
    } finally {
      setIsBusy(false);
    }
  }

  function applyUpdate() {
    if (!waitingWorker) return;
    setIsBusy(true);
    setMessage("Atualizando o portal com a versão mais recente...");
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  }

  if (!isReady || (isInstalled && !waitingWorker)) return null;

  const hasUpdate = Boolean(waitingWorker);
  const launcherLabel = hasUpdate ? "Atualizar portal" : "Instalar app";

  return (
    <>
      <button
        ref={launcherRef}
        className={`pwa-launcher${hasUpdate ? " is-update" : ""}`}
        type="button"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
      >
        <span>{hasUpdate ? <UpdateIcon /> : <InstallIcon />}</span>
        {launcherLabel}
      </button>

      {isOpen ? (
        <div className="pwa-dialog-backdrop" role="presentation" onMouseDown={() => setIsOpen(false)}>
          <section
            ref={dialogRef}
            className="pwa-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-dialog-title"
            tabIndex={-1}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="pwa-dialog-close"
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Fechar"
            >
              ×
            </button>

            <span className="pwa-dialog-eyebrow">Aplicativo Tempo Pelotas</span>
            <h2 id="pwa-dialog-title">
              {hasUpdate ? "Há uma nova versão disponível" : "Tenha o portal na tela inicial"}
            </h2>
            <p className="pwa-dialog-intro">
              {hasUpdate
                ? "Atualize para receber as correções mais recentes do portal. A página será recarregada automaticamente."
                : "Instale o Tempo Pelotas para abrir o portal com mais rapidez e ter uma página de orientação disponível mesmo sem conexão."}
            </p>

            <div className="pwa-option-card">
              <span className="pwa-option-icon">{hasUpdate ? <UpdateIcon /> : <InstallIcon />}</span>
              <div>
                <strong>{hasUpdate ? "Atualização pronta" : "Instalar no aparelho"}</strong>
                <p>
                  {hasUpdate
                    ? "Os dados meteorológicos continuarão sendo consultados nas fontes oficiais após a atualização."
                    : "A instalação não altera os dados do portal e não envia notificações sem sua autorização."}
                </p>
              </div>
              <button type="button" onClick={hasUpdate ? applyUpdate : installApp} disabled={isBusy}>
                {isBusy ? "Aguarde" : hasUpdate ? "Atualizar" : "Instalar"}
              </button>
            </div>

            {message ? <p className="pwa-feedback" role="status">{message}</p> : null}

            <small className="pwa-disclaimer">
              A página offline serve apenas como orientação. Previsão, alertas e níveis das águas
              precisam de conexão para serem atualizados.
            </small>
          </section>
        </div>
      ) : null}
    </>
  );
}
