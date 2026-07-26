import { useEffect, useRef, useState } from "react";

type NavigatorConnection = EventTarget & {
  effectiveType?: string;
  saveData?: boolean;
};

type NavigatorWithConnection = Navigator & {
  connection?: NavigatorConnection;
  mozConnection?: NavigatorConnection;
  webkitConnection?: NavigatorConnection;
  standalone?: boolean;
};

type ConnectivityNotice = "offline" | "restored" | null;

function isStandaloneMode() {
  const navigatorWithStandalone = navigator as NavigatorWithConnection;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    Boolean(navigatorWithStandalone.standalone)
  );
}

function getConnection() {
  const navigatorWithConnection = navigator as NavigatorWithConnection;
  return (
    navigatorWithConnection.connection ??
    navigatorWithConnection.mozConnection ??
    navigatorWithConnection.webkitConnection ??
    null
  );
}

export function PwaAppExperience() {
  const wasOfflineRef = useRef(false);
  const restoredTimerRef = useRef<number | null>(null);
  const [notice, setNotice] = useState<ConnectivityNotice>(null);

  useEffect(() => {
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const fullscreenQuery = window.matchMedia("(display-mode: fullscreen)");
    const connection = getConnection();

    const updateDisplayMode = () => {
      document.documentElement.dataset.pwaMode = isStandaloneMode() ? "standalone" : "browser";
    };

    const updateConnectionPreferences = () => {
      document.documentElement.dataset.saveData = connection?.saveData ? "true" : "false";
      document.documentElement.dataset.effectiveConnection = connection?.effectiveType ?? "unknown";
    };

    const requestAppUpdate = () => {
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      void navigator.serviceWorker?.getRegistration("/").then((registration) => registration?.update());
    };

    const updateOnlineState = () => {
      document.documentElement.dataset.network = navigator.onLine ? "online" : "offline";

      if (!navigator.onLine) {
        wasOfflineRef.current = true;
        setNotice("offline");
        return;
      }

      if (wasOfflineRef.current) {
        wasOfflineRef.current = false;
        setNotice("restored");
        if (restoredTimerRef.current) window.clearTimeout(restoredTimerRef.current);
        restoredTimerRef.current = window.setTimeout(() => setNotice(null), 3200);
      } else {
        setNotice(null);
      }

      requestAppUpdate();
    };

    updateDisplayMode();
    updateConnectionPreferences();
    updateOnlineState();

    standaloneQuery.addEventListener("change", updateDisplayMode);
    fullscreenQuery.addEventListener("change", updateDisplayMode);
    connection?.addEventListener("change", updateConnectionPreferences);
    window.addEventListener("online", updateOnlineState);
    window.addEventListener("offline", updateOnlineState);
    document.addEventListener("visibilitychange", requestAppUpdate);

    return () => {
      standaloneQuery.removeEventListener("change", updateDisplayMode);
      fullscreenQuery.removeEventListener("change", updateDisplayMode);
      connection?.removeEventListener("change", updateConnectionPreferences);
      window.removeEventListener("online", updateOnlineState);
      window.removeEventListener("offline", updateOnlineState);
      document.removeEventListener("visibilitychange", requestAppUpdate);
      if (restoredTimerRef.current) window.clearTimeout(restoredTimerRef.current);
      delete document.documentElement.dataset.pwaMode;
      delete document.documentElement.dataset.saveData;
      delete document.documentElement.dataset.effectiveConnection;
      delete document.documentElement.dataset.network;
    };
  }, []);

  if (!notice) return null;

  return (
    <div
      className={`pwa-connectivity-notice is-${notice}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span aria-hidden="true" />
      <div>
        <strong>{notice === "offline" ? "Você está sem conexão" : "Conexão restabelecida"}</strong>
        <small>
          {notice === "offline"
            ? "As informações abertas podem estar desatualizadas."
            : "O app voltou a consultar as fontes meteorológicas."}
        </small>
      </div>
    </div>
  );
}
