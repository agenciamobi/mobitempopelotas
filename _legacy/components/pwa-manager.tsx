"use client";

import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

type PushConfig = {
  enabled: boolean;
  publicKey: string | null;
};

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((character) => character.charCodeAt(0)));
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function InstallIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 3v12M7 10l5 5 5-5" />
      <path d="M4 18v2h16v-2" />
    </svg>
  );
}

export function PwaManager() {
  const [isReady, setIsReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [pushConfig, setPushConfig] = useState<PushConfig>({ enabled: false, publicKey: null });
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const supportsPush = useMemo(
    () =>
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window,
    [],
  );

  useEffect(() => {
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const fullscreenQuery = window.matchMedia("(display-mode: fullscreen)");
    const updateInstalledState = () => {
      setIsInstalled(
        standaloneQuery.matches ||
          fullscreenQuery.matches ||
          Boolean((navigator as NavigatorWithStandalone).standalone),
      );
    };
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

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    const initialize = async () => {
      try {
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
          await navigator.serviceWorker.ready;

          if ("PushManager" in window) {
            setSubscription(await registration.pushManager.getSubscription());
          }
        }

        if ("Notification" in window) setPermission(Notification.permission);

        const response = await fetch("/api/push/config", {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (response.ok) setPushConfig((await response.json()) as PushConfig);
      } catch (error) {
        console.error("Não foi possível iniciar os recursos do aplicativo:", error);
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
    };
  }, []);

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
        setMessage("Aplicativo instalado.");
      }
    } finally {
      setIsBusy(false);
    }
  }

  async function enableNotifications() {
    setMessage(null);

    if (!supportsPush) {
      setMessage("Este navegador não oferece notificações para aplicativos web.");
      return;
    }
    if (!pushConfig.enabled || !pushConfig.publicKey) {
      setMessage("As notificações estão sendo preparadas e ainda não podem ser ativadas.");
      return;
    }

    setIsBusy(true);
    try {
      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);

      if (nextPermission !== "granted") {
        setMessage("A permissão não foi concedida. Ela pode ser alterada nas configurações do navegador.");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const currentSubscription =
        (await registration.pushManager.getSubscription()) ||
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(pushConfig.publicKey),
        }));
      const response = await fetch("/api/push/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: currentSubscription.toJSON(),
          topics: ["weather", "water", "community"],
        }),
      });

      if (!response.ok) {
        await currentSubscription.unsubscribe().catch(() => false);
        throw new Error("O portal não conseguiu salvar a inscrição.");
      }

      setSubscription(currentSubscription);
      setMessage("Avisos ativados neste aparelho.");
    } catch (error) {
      console.error("Não foi possível ativar as notificações:", error);
      setMessage("Não foi possível ativar os avisos agora. Tente novamente em alguns instantes.");
    } finally {
      setIsBusy(false);
    }
  }

  async function disableNotifications() {
    if (!subscription) return;

    setIsBusy(true);
    setMessage(null);
    try {
      await fetch("/api/push/subscription", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
      setSubscription(null);
      setMessage("Avisos desativados neste aparelho.");
    } catch (error) {
      console.error("Não foi possível desativar as notificações:", error);
      setMessage("Não foi possível desativar os avisos agora.");
    } finally {
      setIsBusy(false);
    }
  }

  async function testNotification() {
    if (permission !== "granted") return;

    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification("TEMPO Pelotas", {
      body: "Os avisos estão funcionando neste aparelho.",
      icon: "/pwa-icons/192",
      badge: "/pwa-icons/192",
      tag: "teste-tempo-pelotas",
      data: { url: "/" },
    });
  }

  if (!isReady) return null;

  const launcherLabel = subscription
    ? "Avisos ativos"
    : isInstalled
      ? "Ativar avisos"
      : "Instalar app";

  return (
    <>
      <button
        className={`pwa-launcher${subscription ? " is-active" : ""}`}
        type="button"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
      >
        <span>{subscription ? <BellIcon /> : <InstallIcon />}</span>
        {launcherLabel}
      </button>

      {isOpen ? (
        <div className="pwa-dialog-backdrop" role="presentation" onMouseDown={() => setIsOpen(false)}>
          <section
            className="pwa-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pwa-dialog-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button className="pwa-dialog-close" type="button" onClick={() => setIsOpen(false)} aria-label="Fechar">
              ×
            </button>
            <span className="eyebrow">Aplicativo Tempo Pelotas</span>
            <h2 id="pwa-dialog-title">Tenha a previsão e os avisos no celular</h2>
            <p className="pwa-dialog-intro">
              Instale o portal como aplicativo e escolha se deseja receber informações sobre tempo,
              águas e comunicados importantes para Pelotas.
            </p>

            <div className="pwa-option-list">
              <article>
                <span className="pwa-option-icon"><InstallIcon /></span>
                <div>
                  <strong>{isInstalled ? "Aplicativo instalado" : "Instalar no aparelho"}</strong>
                  <p>Acesso rápido pela tela inicial, com uma página básica disponível mesmo sem conexão.</p>
                </div>
                {!isInstalled ? (
                  <button type="button" onClick={installApp} disabled={isBusy}>Instalar</button>
                ) : (
                  <span className="pwa-status-badge">Ativo</span>
                )}
              </article>

              <article>
                <span className="pwa-option-icon"><BellIcon /></span>
                <div>
                  <strong>Receber avisos</strong>
                  <p>Previsão diária e comunicados enviados mesmo quando o portal não estiver aberto.</p>
                </div>
                {subscription ? (
                  <button type="button" className="is-secondary" onClick={disableNotifications} disabled={isBusy}>
                    Desativar
                  </button>
                ) : (
                  <button type="button" onClick={enableNotifications} disabled={isBusy || permission === "denied"}>
                    Ativar
                  </button>
                )}
              </article>
            </div>

            {permission === "denied" ? (
              <p className="pwa-permission-note">
                As notificações estão bloqueadas no navegador. Abra as configurações do site para liberar a permissão.
              </p>
            ) : null}

            {message ? <p className="pwa-feedback" role="status">{message}</p> : null}

            {subscription && permission === "granted" ? (
              <button className="pwa-test-button" type="button" onClick={testNotification}>
                Testar uma notificação neste aparelho
              </button>
            ) : null}

            <small className="pwa-disclaimer">
              Os avisos do Tempo Pelotas ajudam no acompanhamento, mas não substituem alertas e orientações da Defesa Civil, INMET e autoridades locais.
            </small>
          </section>
        </div>
      ) : null}
    </>
  );
}
