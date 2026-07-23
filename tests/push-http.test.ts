import assert from "node:assert/strict";
import test from "node:test";

import {
  hasBearerSecret,
  isAllowedPushEndpoint,
  isSameOriginRequest,
  pushJsonResponse,
  readLimitedJson,
  safeInternalPath,
} from "../src/lib/push/push-http.server.ts";

test("aceita somente endpoints HTTPS de provedores push conhecidos", () => {
  assert.equal(isAllowedPushEndpoint("https://fcm.googleapis.com/fcm/send/abc"), true);
  assert.equal(isAllowedPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/abc"), true);
  assert.equal(isAllowedPushEndpoint("https://web.push.apple.com/Q123"), true);
  assert.equal(isAllowedPushEndpoint("https://wns.notify.windows.com/?token=abc"), true);

  assert.equal(isAllowedPushEndpoint("http://fcm.googleapis.com/fcm/send/abc"), false);
  assert.equal(isAllowedPushEndpoint("https://example.com/push"), false);
  assert.equal(isAllowedPushEndpoint("https://push.apple.com.evil.example/push"), false);
  assert.equal(isAllowedPushEndpoint("https://user:secret@fcm.googleapis.com/push"), false);
  assert.equal(isAllowedPushEndpoint("https://fcm.googleapis.com:8443/push"), false);
  assert.equal(isAllowedPushEndpoint("not-a-url"), false);
});

test("mantém apenas caminhos internos seguros", () => {
  assert.equal(safeInternalPath("/alertas"), "/alertas");
  assert.equal(safeInternalPath(" /situacao-hidrologica-pelotas?origem=push "), "/situacao-hidrologica-pelotas?origem=push");
  assert.equal(safeInternalPath("https://example.com"), "/");
  assert.equal(safeInternalPath("//example.com"), "/");
  assert.equal(safeInternalPath("/alertas\\externo"), "/");
  assert.equal(safeInternalPath(null, "/tempo-hoje-pelotas"), "/tempo-hoje-pelotas");
  assert.equal(safeInternalPath(`/${"a".repeat(400)}`).length, 300);
});

test("exige origem exata em operações do navegador", () => {
  const valid = new Request("https://tempopelotas.com.br/api/push/subscription", {
    headers: { Origin: "https://tempopelotas.com.br" },
  });
  const otherOrigin = new Request("https://tempopelotas.com.br/api/push/subscription", {
    headers: { Origin: "https://example.com" },
  });
  const missingOrigin = new Request("https://tempopelotas.com.br/api/push/subscription");

  assert.equal(isSameOriginRequest(valid), true);
  assert.equal(isSameOriginRequest(otherOrigin), false);
  assert.equal(isSameOriginRequest(missingOrigin), false);
});

test("compara o bearer administrativo sem aceitar segredo vazio", () => {
  const request = new Request("https://tempopelotas.com.br/api/push/broadcast", {
    headers: { Authorization: "Bearer segredo-correto" },
  });

  assert.equal(hasBearerSecret(request, "segredo-correto"), true);
  assert.equal(hasBearerSecret(request, "outro-segredo"), false);
  assert.equal(hasBearerSecret(request, "   "), false);
  assert.equal(hasBearerSecret(request, undefined), false);
});

test("recusa corpo sem JSON, inválido ou acima do limite declarado", async () => {
  const wrongType = await readLimitedJson(
    new Request("https://tempopelotas.com.br/api/push/subscription", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "texto",
    }),
  );
  assert.deepEqual(wrongType, {
    ok: false,
    status: 415,
    error: "O corpo deve ser enviado como JSON.",
  });

  const invalidJson = await readLimitedJson(
    new Request("https://tempopelotas.com.br/api/push/subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    }),
  );
  assert.equal(invalidJson.ok, false);
  if (!invalidJson.ok) assert.equal(invalidJson.status, 400);

  const oversized = await readLimitedJson(
    new Request("https://tempopelotas.com.br/api/push/subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": "20000",
      },
      body: "{}",
    }),
  );
  assert.equal(oversized.ok, false);
  if (!oversized.ok) assert.equal(oversized.status, 413);
});

test("produz respostas privadas, não indexáveis e sem sniffing", async () => {
  const response = pushJsonResponse({ success: true });

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.deepEqual(await response.json(), { success: true });
});
