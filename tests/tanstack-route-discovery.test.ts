import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const directoryRoute = readFileSync("src/routes/tempo-na-regiao-sul-rs.tsx", "utf8");
const cityRoute = readFileSync("src/routes/tempo-em/$citySlug.tsx", "utf8");

test("regional routes expose literal paths to the TanStack route crawler", () => {
  assert.match(
    directoryRoute,
    /createFileRoute\("\/tempo-na-regiao-sul-rs"\)/,
    "A rota do diretório regional deve usar uma string literal em createFileRoute.",
  );
  assert.doesNotMatch(
    directoryRoute,
    /createFileRoute\(PAGE_PATH\)/,
    "Constantes impedem o crawler de associar o arquivo à rota antes de gerar os tipos.",
  );
  assert.match(
    cityRoute,
    /createFileRoute\("\/tempo-em\/\$citySlug"\)/,
    "A rota municipal dinâmica deve preservar o segmento $citySlug como literal.",
  );
});

test("dynamic route reads the generated citySlug parameter", () => {
  assert.match(cityRoute, /params\.citySlug/);
  assert.match(cityRoute, /getRegionalCityWeather/);
});
