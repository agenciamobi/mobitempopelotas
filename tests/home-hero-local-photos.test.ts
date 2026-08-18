import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const HERO_PATH = new URL("../src/production/components/weather-hero.tsx", import.meta.url);
const RESOLVER_PATH = new URL("../src/production/lib/hero-photo-presentation.ts", import.meta.url);

const expectedAssets = [
  "/weather/hero/pelotas-laranjal-chuva.webp",
  "/weather/hero/pelotas-nevoeiro-centro.webp",
  "/weather/hero/pelotas-ceu-limpo.webp",
  "/weather/hero/pelotas-parcialmente-nublado.avif",
];

test("o hero estático usa somente o acervo local de Pelotas", async () => {
  const [hero, resolver] = await Promise.all([
    readFile(HERO_PATH, "utf8"),
    readFile(RESOLVER_PATH, "utf8"),
  ]);

  assert.match(hero, /resolveHeroPhoto/);
  assert.match(hero, /data-photo-kind=\{heroPhoto\.kind\}/);
  assert.doesNotMatch(hero, /commons\.wikimedia|Heavy_Rain|Sunset_over_Calm_Lake|Amanhecer_na_Praia/);

  for (const asset of expectedAssets) {
    assert.ok(resolver.includes(asset), `o resolvedor precisa registrar ${asset}`);
  }
});
