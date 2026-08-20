import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    // O documento não rola em window/html/body: ViewportScrollRoot é o único
    // viewport vertical e faz o reset de rota de forma determinística.
    scrollRestoration: false,
    defaultPreload: "intent",
    defaultPreloadDelay: 0,
    defaultPreloadStaleTime: 60 * 1_000,
    defaultStaleTime: 60 * 1_000,
  });

  return router;
};
