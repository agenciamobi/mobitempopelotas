import { useRouterState } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";

type ViewportScrollRootProps = {
  children: ReactNode;
};

const EDITABLE_SELECTOR = [
  "input",
  "textarea",
  "select",
  '[contenteditable="true"]',
  '[role="textbox"]',
].join(",");

const MODAL_SELECTOR = [
  '[role="dialog"][aria-modal="true"]',
  '[data-radix-dialog-content][data-state="open"]',
  '[data-vaul-drawer][data-state="open"]',
].join(",");

function verticalWheelDelta(event: WheelEvent, viewportHeight: number) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) return event.deltaY * 18;
  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) return event.deltaY * viewportHeight;
  return event.deltaY;
}

function canScrollElement(element: HTMLElement, deltaY: number) {
  const style = window.getComputedStyle(element);
  if (!/(auto|scroll|overlay)/.test(style.overflowY)) return false;
  if (element.scrollHeight <= element.clientHeight + 1) return false;

  const maximum = element.scrollHeight - element.clientHeight;
  if (deltaY > 0) return element.scrollTop < maximum - 1;
  if (deltaY < 0) return element.scrollTop > 1;
  return false;
}

function hasScrollableAncestor(target: EventTarget | null, root: HTMLElement, deltaY: number) {
  let element = target instanceof HTMLElement ? target : null;

  while (element && element !== root) {
    if (canScrollElement(element, deltaY)) return true;
    element = element.parentElement;
  }

  return false;
}

function isModalOpen() {
  return Array.from(document.querySelectorAll<HTMLElement>(MODAL_SELECTOR)).some((element) => {
    const style = window.getComputedStyle(element);
    return (
      !element.hidden &&
      element.getAttribute("aria-hidden") !== "true" &&
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      element.getClientRects().length > 0
    );
  });
}

function shouldPreserveKeyboardBehavior(target: EventTarget | null, key: string) {
  if (!(target instanceof Element)) return false;
  if (target.closest(EDITABLE_SELECTOR)) return true;

  if (key === " " || key === "Spacebar") {
    return Boolean(target.closest('button, a[href], summary, [role="button"]'));
  }

  return false;
}

export function ViewportScrollRoot({ children }: ViewportScrollRootProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const previousScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey || isModalOpen()) return;

      const deltaY = verticalWheelDelta(event, root.clientHeight);
      if (!deltaY || Math.abs(deltaY) <= Math.abs(event.deltaX)) return;
      if (hasScrollableAncestor(event.target, root, deltaY)) return;

      event.preventDefault();
      root.scrollTop += deltaY;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || isModalOpen()) {
        return;
      }
      if (shouldPreserveKeyboardBehavior(event.target, event.key)) return;

      const page = Math.max(240, root.clientHeight * 0.88);
      let destination: number | null = null;

      switch (event.key) {
        case "ArrowDown":
          destination = root.scrollTop + 56;
          break;
        case "ArrowUp":
          destination = root.scrollTop - 56;
          break;
        case "PageDown":
          destination = root.scrollTop + page;
          break;
        case "PageUp":
          destination = root.scrollTop - page;
          break;
        case "Home":
          destination = 0;
          break;
        case "End":
          destination = root.scrollHeight;
          break;
        case " ":
        case "Spacebar":
          destination = root.scrollTop + (event.shiftKey ? -page : page);
          break;
        default:
          return;
      }

      event.preventDefault();
      root.scrollTo({ top: destination, behavior: "auto" });
    };

    window.addEventListener("wheel", handleWheel, { capture: true, passive: false });
    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      window.history.scrollRestoration = previousScrollRestoration;
      window.removeEventListener("wheel", handleWheel, true);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const resetViewport = () => {
      root.scrollTop = 0;
      root.scrollLeft = 0;
    };

    // O scroll real pertence a este elemento, não a window/html/body. O reset
    // imediato evita carregar a rota nova na posição anterior; os dois frames
    // seguintes neutralizam scroll anchoring/restauração tardia após o commit.
    resetViewport();

    let secondFrame = 0;
    const firstFrame = window.requestAnimationFrame(() => {
      resetViewport();
      secondFrame = window.requestAnimationFrame(resetViewport);
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
      if (secondFrame) window.cancelAnimationFrame(secondFrame);
    };
  }, [pathname]);

  return (
    <div
      ref={rootRef}
      id="page-scroll-root"
      className="page-scroll-root"
      tabIndex={-1}
      data-scroll-viewport="true"
    >
      {children}
    </div>
  );
}
