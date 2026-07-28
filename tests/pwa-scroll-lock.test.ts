import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pwaManager = readFileSync("src/components/pwa/PwaManager.tsx", "utf8");

test("restaura o scroll quando o diálogo PWA deixa de existir", () => {
  assert.match(
    pwaManager,
    /const shouldLockBodyScroll = isOpen && \(hasUpdate \|\| canInstall\);/,
  );
  assert.match(pwaManager, /if \(!shouldLockBodyScroll\) return;/);
  assert.match(pwaManager, /\}, \[shouldLockBodyScroll\]\);/);
});

test("fecha o diálogo quando a instalação é cancelada ou falha", () => {
  assert.match(
    pwaManager,
    /if \(choice\.outcome === "accepted"\)[\s\S]*else \{[\s\S]*setIsOpen\(false\);/,
  );
  assert.match(
    pwaManager,
    /catch \(error\) \{[\s\S]*setInstallPrompt\(null\);[\s\S]*setIsOpen\(false\);/,
  );
});
