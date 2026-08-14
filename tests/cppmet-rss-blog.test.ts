import assert from "node:assert/strict";
import test from "node:test";

import { parseCppmetRss } from "../src/lib/content/cppmet-news.server.ts";

const RSS_SAMPLE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>CPPMET – UFPEL</title>
    <item>
      <title><![CDATA[Frente fria &amp; chuva em Pelotas]]></title>
      <link>https://wp.ufpel.edu.br/cppmet/2026/08/14/frente-fria/</link>
      <pubDate>Fri, 14 Aug 2026 12:00:00 +0000</pubDate>
      <category><![CDATA[Previsão]]></category>
      <description><![CDATA[<p>Análise regional com <strong>chuva</strong> e vento.</p>]]></description>
    </item>
    <item>
      <title>Entrada externa não permitida</title>
      <link>https://example.com/noticia</link>
      <pubDate>Fri, 14 Aug 2026 11:00:00 +0000</pubDate>
      <description>Não deve entrar.</description>
    </item>
  </channel>
</rss>`;

test("parseCppmetRss mantém apenas publicações oficiais do CPPMet/UFPel", () => {
  const items = parseCppmetRss(RSS_SAMPLE);

  assert.equal(items.length, 1);
  assert.equal(items[0]?.title, "Frente fria & chuva em Pelotas");
  assert.equal(items[0]?.url, "https://wp.ufpel.edu.br/cppmet/2026/08/14/frente-fria/");
  assert.equal(items[0]?.excerpt, "Análise regional com chuva e vento.");
  assert.deepEqual(items[0]?.categories, ["Previsão"]);
  assert.equal(items[0]?.publishedAt, "2026-08-14T12:00:00.000Z");
});

test("parseCppmetRss não inventa itens quando o XML não contém posts válidos", () => {
  assert.deepEqual(parseCppmetRss("<rss><channel></channel></rss>"), []);
});
