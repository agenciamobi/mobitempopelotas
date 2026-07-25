import { useRouterState } from "@tanstack/react-router";

export function usePathname() {
  return useRouterState({ select: (state) => state.resolvedLocation.pathname });
}
