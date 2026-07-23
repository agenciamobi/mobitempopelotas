import { useEffect, useRef, useState } from "react";

import "./push-notifications.css";

const TOPIC_OPTIONS = [
  {
    value: "weather",
    label: "Tempo e avisos oficiais",
    description: "Resumo da previsão e indicação quando houver aviso oficial do INMET.",
  },
  {
    value: "water",
    label: "Situação das águas",
    description: "Atualizações relevantes sobre níveis e monitoramento hidrológico.",
  },
  {
    value: "community",
    label: "Novidades do portal",
    description: "Novas câmeras, fontes e recursos úteis para Pelotas.",
  },
] as const;

const TOPICS_STORAGE_KEY = "tempo-pelotas-push-topics";
const DEFAULT_TOPICS = ["weather", "water"] as const;
const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

type PushTopic = (typeof TOPIC_OPTIONS)[number]["value"];
type PushConfig = { enabled: boolean; publicKey: string | null };

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function urlBase64ToUint8Array(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((character) => character.charCodeAt(0)));
}

function readStoredTopics(): PushTopic[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(TOPICS_STORAGE_KEY) ?? "null");
    if (!Array.isArray(parsed)) return [...DEFAULT_TOPICS];

    const allowed = new Set<PushTopic>(TOPIC_OPTIONS.map((option) => option.value));
    const topics = parsed.filter((topic): topic is PushTopic => allowed.has(topic as PushTopic));
    return topics.length > 0 ? Array.from(new Set(topics)) : [...DEFAULT_TOPICS];
  } catch {
    return [...DEFAULT_TOPICS];
  }
}

function focusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true",
  );
}

export function PushNotificationsManager() {
  const launcherRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [supportsPush, setSupportsPush] = useState(false);
  const [config, setConfig] = useState<PushConfig>({ enabled: false, publicKey: null });
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [topics, setTopics] = useState<PushTopic[]>([...DEFAULT_TOPICS]);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const supported =
      "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupportsPush(supported);
    setTopics(readStoredTopics());

    const initialize = async () => {
      try {
        if (!supported) return;

        setPermission(Notification.permission);
        const [registration, response] = await Promise.all([
          navigator.serviceWorker.ready,
          fetch("/api/push/config", {
            headers: { Accept: "application/json" },
            cache: "no-store",
          }),
        ]);

        setSubscription(await registration.pushManager.getSubscription());
        if (response.ok) setConfig((await response.json()) as PushConfig);
      } catch (error) {
        console.error("Não foi possível iniciar os avisos do Tempo Pelotas:", error);
      } finally {
        setIsReady(true);
      }
    };

    void initialize();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousElement = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const elements = focusableElements(dialogRef.current);
      if (elements.length === 0) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = elements[0];
      const last = elements.at(-1) ?? first;
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === dialogRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.requestAnimationFrame(() => dialogRef.current?.focus());

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.requestAnimationFrame(() => (previousElement ?? launcherRef.current)?.focus());
    };
  }, [isOpen]);

  function toggleTopic(topic: PushTopic) {
    setTopics((current) => {
      if (current.includes(topic)) {
        return current.length === 1 ? current : current.filter((item) => item !== topic);
      }
      return [...current, topic];
    });
  }

  async function saveSubscription(currentSubscription: PushSubscription) {
    const response = await fetch("/api/push/subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscription: currentSubscription.toJSON(),
        topics,
      }),
    });

    if (!response.ok) throw new Error("O portal não conseguiu salvar a inscrição.");
    window.localStorage.setItem(TOPICS_STORAGE_KEY, JSON.stringify(topics));
  }

  async function enableNotifications() {
    setMessage(null);

    if (!supportsPush) {
      setMessage("Este navegador não oferece notificações para aplicativos web.");
      return;
    }
    if (!config.enabled || !config.publicKey) {
      setMessage("Os avisos estão sendo preparados e ainda não podem ser ativados.");
      return;
    }

    setIsBusy(true);
    try {
      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);
      if (nextPermission !== "granted") {
        setMessage(
          "A permissão não foi concedida. Ela pode ser alterada nas configurações do navegador.",
        );
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const currentSubscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(config.publicKey),
        }));

      await saveSubscription(currentSubscription);
      setSubscription(currentSubscription);
      setMessage("Avisos ativados neste aparelho.");
    } catch (error) {
      console.error("Não foi possível ativar as notificações:", error);
      setMessage("Não foi possível ativar os avisos agora. Tente novamente em instantes.");
    } finally {
      setIsBusy(false);
    }
  }

  async function updateTopics() {
    if (!subscription) return;

    setIsBusy(true);
    setMessage(null);
    try {
      await saveSubscription(subscription);
      setMessage("Tipos de aviso atualizados.");
    } catch (error) {
      console.error("Não foi possível atualizar os tipos de aviso:", error);
      setMessage("Não foi possível atualizar suas escolhas agora.");
    } finally {
      setIsBusy(false);
    }
  }

  async function disableNotifications() {
    if (!subscription) return;

    setIsBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/push/subscription", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      await subscription.unsubscribe();
      setSubscription(null);
      setPermission(Notification.permission);
      setMessage(
        response.ok
          ? "Avisos desativados neste aparelho."
          : "Avisos desativados no navegador; o cadastro antigo será removido automaticamente.",
      );
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
    await registration.showNotification("Tempo Pelotas", {
      body: "Os avisos estão funcionando neste aparelho.",
      icon: "/brand/tempo-pelotas-icon.svg",
      badge: "/brand/tempo-pelotas-icon.svg",
      tag: "teste-tempo-pelotas",
      data: { url: "/" },
    });
  }

  if (!isReady || (!supportsPush && !subscription) || (!config.enabled && !subscription)) {
    return null;
  }

  return (
    <>
      <button
        ref={launcherRef}
        className={`push-launcher${subscription ? " is-active" : ""}`}
        type="button"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
      >
        <span>
          <BellIcon />
        </span>
        {subscription ? "Avisos ativos" : "Receber avisos"}
      </button>

      {isOpen ? (
        <div
          className="push-dialog-backdrop"
          role="presentation"
          onMouseDown={() => setIsOpen(false)}
        >
          <section
            ref={dialogRef}
            className="push-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="push-dialog-title"
            aria-describedby="push-dialog-description"
            tabIndex={-1}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              className="push-dialog-close"
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Fechar"
            >
              ×
            </button>

            <span className="push-dialog-eyebrow">Avisos no aparelho</span>
            <h2 id="push-dialog-title">Escolha o que merece sua atenção</h2>
            <p className="push-dialog-intro" id="push-dialog-description">
              Receba resumos e atualizações úteis mesmo com o portal fechado. A previsão do tempo é
              informação meteorológica; quando houver alerta, o aviso oficial e sua fonte serão
              identificados claramente.
            </p>

            <fieldset className="push-topic-list">
              <legend>Tipos de informação</legend>
              {TOPIC_OPTIONS.map((option) => (
                <label key={option.value} className="push-topic-option">
                  <input
                    type="checkbox"
                    checked={topics.includes(option.value)}
                    onChange={() => toggleTopic(option.value)}
                  />
                  <span>
                    <strong>{option.label}</strong>
                    <small>{option.description}</small>
                  </span>
                </label>
              ))}
            </fieldset>

            <div className="push-dialog-actions">
              {subscription ? (
                <>
                  <button type="button" onClick={updateTopics} disabled={isBusy}>
                    {isBusy ? "Salvando" : "Salvar escolhas"}
                  </button>
                  <button
                    type="button"
                    className="is-secondary"
                    onClick={disableNotifications}
                    disabled={isBusy}
                  >
                    Desativar avisos
                  </button>
                  <button type="button" className="is-text" onClick={testNotification}>
                    Testar neste aparelho
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={enableNotifications}
                  disabled={isBusy || permission === "denied"}
                >
                  {isBusy ? "Ativando" : "Ativar avisos"}
                </button>
              )}
            </div>

            {permission === "denied" ? (
              <p className="push-permission-note">
                As notificações estão bloqueadas no navegador. Abra as configurações deste site para
                liberar a permissão.
              </p>
            ) : null}

            {message ? (
              <p className="push-feedback" role="status">
                {message}
              </p>
            ) : null}

            <small className="push-disclaimer">
              Nenhum aviso substitui orientações da Defesa Civil, do INMET ou de outros órgãos
              oficiais. Você pode alterar ou desativar estas escolhas a qualquer momento.
            </small>
          </section>
        </div>
      ) : null}
    </>
  );
}
