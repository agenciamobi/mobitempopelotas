import { readFile, writeFile } from "node:fs/promises";

async function replaceOnce(path, oldValue, newValue) {
  const content = await readFile(path, "utf8");
  if (content.includes(newValue)) return false;
  if (!content.includes(oldValue)) {
    throw new Error(`Trecho esperado não encontrado em ${path}`);
  }
  await writeFile(path, content.replace(oldValue, newValue), "utf8");
  return true;
}

await replaceOnce(
  "src/lib/push/web-push.server.ts",
  `          if (statusCode === 404 || statusCode === 410) {
            await deletePushSubscription(subscription.endpoint).catch(() => undefined);
            result.removed += 1;
            return;
          }`,
  `          if (statusCode === 404 || statusCode === 410) {
            try {
              await deletePushSubscription(subscription.endpoint);
              result.removed += 1;
            } catch (cleanupError) {
              result.failed += 1;
              console.error("[push] Endpoint expirado, mas a inscrição não foi removida", {
                statusCode,
                message:
                  cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
              });
            }
            return;
          }`,
);

await replaceOnce(
  "src/components/pwa/PushNotificationsManager.tsx",
  `    const previousElement = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;`,
  `    const previousElement = document.activeElement as HTMLElement | null;
    const launcherElement = launcherRef.current;
    const previousOverflow = document.body.style.overflow;`,
);

await replaceOnce(
  "src/components/pwa/PushNotificationsManager.tsx",
  `      window.requestAnimationFrame(() => (previousElement ?? launcherRef.current)?.focus());`,
  `      window.requestAnimationFrame(() => (previousElement ?? launcherElement)?.focus());`,
);
