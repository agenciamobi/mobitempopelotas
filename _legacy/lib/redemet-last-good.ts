import "server-only";

type RedemetCacheable = {
  configured: boolean;
  available: boolean;
  sourceLabel: string;
  error: string | null;
};

type CacheEntry<T> = {
  value: T;
  storedAt: number;
};

type GlobalWithRedemetCache = typeof globalThis & {
  __tempoPelotasRedemetLastGood?: Map<string, CacheEntry<RedemetCacheable>>;
};

const globalCache = globalThis as GlobalWithRedemetCache;
const cache =
  globalCache.__tempoPelotasRedemetLastGood ??
  new Map<string, CacheEntry<RedemetCacheable>>();

globalCache.__tempoPelotasRedemetLastGood = cache;

const MAX_LAST_GOOD_AGE_MS = 2 * 60 * 60 * 1_000;

export async function withRedemetLastGood<T extends RedemetCacheable>(
  key: string,
  loader: () => Promise<T>,
): Promise<T> {
  const result = await loader();

  if (result.available) {
    cache.set(key, { value: result, storedAt: Date.now() });
    return result;
  }

  if (!result.configured) return result;

  const previous = cache.get(key) as CacheEntry<T> | undefined;
  if (!previous || Date.now() - previous.storedAt > MAX_LAST_GOOD_AGE_MS) {
    return result;
  }

  return {
    ...previous.value,
    sourceLabel: `${previous.value.sourceLabel} · último quadro válido`,
    error:
      result.error ||
      "A atualização mais recente falhou; exibindo o último quadro válido.",
  };
}
