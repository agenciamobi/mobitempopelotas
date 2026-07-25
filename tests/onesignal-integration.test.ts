import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const ROOT_ROUTE_PATH = new URL("../src/routes/__root.tsx", import.meta.url);
const PWA_MANAGER_PATH = new URL("../src/components/pwa/PwaManager.tsx", import.meta.url);
const ONESIGNAL_WORKER_PATH = new URL(
  "../public/push/onesignal/OneSignalSDKWorker.js",
  import.meta.url,
);

test("inicializa o OneSignal Web SDK v16 com worker isolado", async () => {
  const rootRoute = await readFile(ROOT_ROUTE_PATH, "utf8");

  assert.match(rootRoute, /cdn\.onesignal\.com\/sdks\/web\/v16\/OneSignalSDK\.page\.js/);
  assert.match(rootRoute, /94e94002-7b9e-4b02-8661-62ad9080e3d3/);
  assert.match(rootRoute, /web\.onesignal\.auto\.66c89079-ab76-4c24-84be-2fca07f56f6c/);
  assert.match(rootRoute, /serviceWorkerPath: "push\/onesignal\/OneSignalSDKWorker\.js"/);
  assert.match(rootRoute, /serviceWorkerParam: \{ scope: "\/push\/onesignal\/" \}/);
  assert.match(rootRoute, /notifyButton:[\s\S]*enable: true/);
  assert.match(rootRoute, /position: "bottom-left"/);
});

test("mantém o service worker PWA no escopo raiz sem conflito com o OneSignal", async () => {
  const [pwaManager, oneSignalWorker] = await Promise.all([
    readFile(PWA_MANAGER_PATH, "utf8"),
    readFile(ONESIGNAL_WORKER_PATH, "utf8"),
  ]);

  assert.match(pwaManager, /navigator\.serviceWorker\.register\("\/sw\.js", \{/);
  assert.match(pwaManager, /scope: "\/"/);
  assert.equal(
    oneSignalWorker.trim(),
    'importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");',
  );
});

test("não monta o gerenciador legado de inscrições junto do OneSignal", async () => {
  const rootRoute = await readFile(ROOT_ROUTE_PATH, "utf8");

  assert.doesNotMatch(rootRoute, /PushNotificationsManager/);
});
