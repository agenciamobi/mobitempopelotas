import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = readFileSync("src/routes/__root.tsx", "utf8");
const manifest = readFileSync("public/manifest.webmanifest", "utf8");
const serviceWorker = readFileSync("public/sw.js", "utf8");
const offline = readFileSync("public/offline.html", "utf8");
const iconRoute = readFileSync("src/routes/brand/tempo-pelotas-icon[.]png.ts", "utf8");
const maskableRoute = readFileSync("src/routes/brand/tempo-pelotas-maskable[.]png.ts", "utf8");

test("site head prioritizes the uploaded PNG for favicon and Apple touch icon", () => {
  assert.match(root, /rel: "icon", href: "\/brand\/tempo-pelotas-icon\.png"/);
  assert.match(root, /rel: "apple-touch-icon", href: "\/brand\/tempo-pelotas-icon\.png"/);
  assert.doesNotMatch(root, /rel: "apple-touch-icon", href: "\/brand\/tempo-pelotas-icon\.svg"/);
});

test("PWA manifest exposes PNG any and maskable icons", () => {
  const parsed = JSON.parse(manifest) as {
    icons: Array<{ src: string; sizes: string; type: string; purpose: string }>;
  };

  assert.ok(
    parsed.icons.some(
      (icon) =>
        icon.src === "/brand/tempo-pelotas-icon.png" &&
        icon.type === "image/png" &&
        icon.purpose === "any",
    ),
  );
  assert.ok(
    parsed.icons.some(
      (icon) =>
        icon.src === "/brand/tempo-pelotas-maskable.png" &&
        icon.type === "image/png" &&
        icon.purpose === "maskable",
    ),
  );
});

test("PNG icon routes return immutable image responses", () => {
  for (const route of [iconRoute, maskableRoute]) {
    assert.match(route, /createFileRoute\("\/brand\/tempo-pelotas-[^\"]+\.png"\)/);
    assert.match(route, /Content-Type": "image\/png"/);
    assert.match(route, /max-age=31536000, immutable/);
    assert.match(route, /Uint8Array\.from\(Buffer\.from\(ICON_BASE64, "base64"\)\)/);
  }
});

test("installed and offline experiences cache and display the PNG identity", () => {
  assert.match(serviceWorker, /tempo-pelotas-v4/);
  assert.match(serviceWorker, /\/brand\/tempo-pelotas-icon\.png/);
  assert.match(serviceWorker, /\/brand\/tempo-pelotas-maskable\.png/);
  assert.match(offline, /src="\/brand\/tempo-pelotas-icon\.png"/);
});
