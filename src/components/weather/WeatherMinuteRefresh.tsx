import { useRouter, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

const WEATHER_ROUTES = new Set([
  "/",
  "/alertas",
  "/cameras-ao-vivo-pelotas",
  "/chuva-em-pelotas",
  "/clima-em-pelotas",
  "/estacao-embrapa-pelotas",
  "/historico-climatico-pelotas",
  "/mapa-de-geadas-rio-grande-do-sul",
  "/meteograma-pelotas",
  "/metodologia",
  "/nivel-da-lagoa-dos-patos-laranjal",
  "/previsao-7-dias-pelotas",
  "/radar-e-satelite-pelotas",
  "/situacao-hidrologica-pelotas",
  "/tempo-amanha-pelotas",
  "/tempo-hoje-pelotas",
  "/vento-em-pelotas",
]);

const REFRESH_INTERVAL_MS = 60_000;

export function WeatherMinuteRefresh() {
  const router = useRouter();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const lastRefreshAt = useRef(Date.now());
  const refreshing = useRef(false);

  useEffect(() => {
    if (!WEATHER_ROUTES.has(pathname)) return;

    const refresh = async () => {
      if (refreshing.current || document.visibilityState !== "visible" || !navigator.onLine) return;
      refreshing.current = true;
      try {
        await router.invalidate();
        lastRefreshAt.current = Date.now();
      } finally {
        refreshing.current = false;
      }
    };

    const refreshIfDue = () => {
      if (Date.now() - lastRefreshAt.current >= REFRESH_INTERVAL_MS - 1_000) {
        void refresh();
      }
    };

    const interval = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    window.addEventListener("focus", refreshIfDue);
    document.addEventListener("visibilitychange", refreshIfDue);
    window.addEventListener("online", refreshIfDue);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshIfDue);
      document.removeEventListener("visibilitychange", refreshIfDue);
      window.removeEventListener("online", refreshIfDue);
    };
  }, [pathname, router]);

  return null;
}
