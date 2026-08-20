import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const layout = readFileSync("src/components/layout/SiteLayout.tsx", "utf8");
const navigationCompat = readFileSync("src/production/compat/navigation.ts", "utf8");
const navigationCss = readFileSync("src/components/layout/route-navigation.css", "utf8");
const router = readFileSync("src/router.tsx", "utf8");

test("site shell follows the resolved route with a hydration-safe fallback", () => {
  assert.match(
    layout,
    /state\.resolvedLocation\?\.pathname \?\? state\.location\?\.pathname \?\? "\/"/,
  );
  assert.match(layout, /standaloneRoutes\.has\(resolvedPathname\)/);
  assert.match(layout, /\[resolvedPathname\]/);
  assert.doesNotMatch(layout, /state\.resolvedLocation\.pathname/);
});

test("standalone production shell uses the same safe resolved-route priority", () => {
  assert.match(
    navigationCompat,
    /state\.resolvedLocation\?\.pathname \?\? state\.location\?\.pathname \?\? "\/"/,
  );
  assert.doesNotMatch(navigationCompat, /state\.resolvedLocation\.pathname/);
});

test("route loading uses a lightweight progress indicator instead of another shell", () => {
  assert.match(layout, /function RouteNavigationProgress/);
  assert.match(layout, /className={`route-navigation-progress/);
  assert.match(layout, /aria-busy=\{isLoading\}/);
  assert.match(layout, /Boolean\(state\.isLoading\)/);
  assert.doesNotMatch(layout, /isLoading[\s\S]*<Header \/>[\s\S]*<Header \/>/);
  assert.match(navigationCss, /position:\s*fixed/);
  assert.match(navigationCss, /height:\s*3px/);
  assert.match(navigationCss, /@media \(prefers-reduced-motion: reduce\)/);
});

test("router preloads intended destinations immediately and keeps the result fresh for the click", () => {
  assert.match(router, /defaultPreload:\s*"intent"/);
  assert.match(router, /defaultPreloadDelay:\s*0/);
  assert.match(router, /defaultPreloadStaleTime:\s*60 \* 1_000/);
  assert.match(router, /defaultStaleTime:\s*60 \* 1_000/);
  assert.match(router, /scrollRestoration:\s*false/);
  assert.doesNotMatch(router, /defaultPreloadStaleTime:\s*0/);
});
