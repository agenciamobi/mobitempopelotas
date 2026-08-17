import assert from "node:assert/strict";
import { generateKeyPairSync, sign } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  WEATHER_AI_GITHUB_OIDC_AUDIENCE,
  verifyWeatherAiGithubActionsRequest,
  verifyWeatherAiGithubActionsToken,
} from "../src/lib/github-actions-oidc.server.ts";
import {
  fetchAllowedPushEndpoint,
  hasBearerSecret,
  isAllowedPushEndpoint,
  isSameOriginRequest,
  pushJsonResponse,
  readLimitedJson,
  safeInternalPath,
} from "../src/lib/push/push-http.server.ts";

test("aceita somente endpoints HTTPS de provedores push conhecidos", () => {
  assert.equal(isAllowedPushEndpoint("https://fcm.googleapis.com/fcm/send/abc"), true);
  assert.equal(
    isAllowedPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/abc"),
    true,
  );
  assert.equal(isAllowedPushEndpoint("https://web.push.apple.com/Q123"), true);
  assert.equal(isAllowedPushEndpoint("https://wns.notify.windows.com/?token=abc"), true);

  assert.equal(isAllowedPushEndpoint("http://fcm.googleapis.com/fcm/send/abc"), false);
  assert.equal(isAllowedPushEndpoint("https://example.com/push"), false);
  assert.equal(isAllowedPushEndpoint("https://push.apple.com.evil.example/push"), false);
  assert.equal(isAllowedPushEndpoint("https://user:secret@fcm.googleapis.com/push"), false);
  assert.equal(isAllowedPushEndpoint("https://fcm.googleapis.com:8443/push"), false);
  assert.equal(isAllowedPushEndpoint("not-a-url"), false);
});

test("a entrega real exige destino permitido e bloqueia redirects", async () => {
  let observedInit: RequestInit | undefined;
  let fetchCalls = 0;

  const response = await fetchAllowedPushEndpoint(
    "https://fcm.googleapis.com/fcm/send/abc",
    { method: "POST", body: "payload" },
    async (_input, init) => {
      fetchCalls += 1;
      observedInit = init;
      return new Response(null, { status: 201 });
    },
  );

  assert.equal(fetchCalls, 1);
  assert.equal(observedInit?.redirect, "error");
  assert.equal(response.status, 201);

  await assert.rejects(
    fetchAllowedPushEndpoint("https://example.com/redirect", { method: "POST" }, async () => {
      fetchCalls += 1;
      return new Response(null, { status: 201 });
    }),
    /Destino de web push não permitido/,
  );
  assert.equal(fetchCalls, 1);

  const redirectedResponse = new Proxy(new Response(null, { status: 201 }), {
    get(target, property, receiver) {
      if (property === "redirected") return true;
      return Reflect.get(target, property, receiver);
    },
  });

  await assert.rejects(
    fetchAllowedPushEndpoint(
      "https://fcm.googleapis.com/fcm/send/abc",
      { method: "POST" },
      async () => redirectedResponse,
    ),
    /tentou redirecionar/,
  );
});

test("mantém apenas caminhos internos seguros", () => {
  assert.equal(safeInternalPath("/alertas"), "/alertas");
  assert.equal(
    safeInternalPath(" /situacao-hidrologica-pelotas?origem=push "),
    "/situacao-hidrologica-pelotas?origem=push",
  );
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

function createGithubOidcFixture() {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const publicJwk = publicKey.export({ format: "jwk" });
  const nowSeconds = 2_000_000_000;

  function token(overrides: Record<string, unknown> = {}, signingKey = privateKey) {
    const header = {
      alg: "RS256",
      kid: "tempo-pelotas-test-key",
      typ: "JWT",
    };
    const payload = {
      iss: "https://token.actions.githubusercontent.com",
      aud: WEATHER_AI_GITHUB_OIDC_AUDIENCE,
      sub: "repo:agenciamobi@157939955/mobitempopelotas@1306185236:ref:refs/heads/main",
      exp: nowSeconds + 300,
      iat: nowSeconds - 10,
      nbf: nowSeconds - 10,
      repository: "agenciamobi/mobitempopelotas",
      repository_id: "1306185236",
      repository_owner: "agenciamobi",
      repository_owner_id: "157939955",
      ref: "refs/heads/main",
      workflow_ref:
        "agenciamobi/mobitempopelotas/.github/workflows/weather-ai-snapshots.yml@refs/heads/main",
      event_name: "schedule",
      runner_environment: "github-hosted",
      ...overrides,
    };
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const signature = sign("RSA-SHA256", Buffer.from(signingInput), signingKey).toString("base64url");
    return `${signingInput}.${signature}`;
  }

  const fetchImpl = async () =>
    new Response(
      JSON.stringify({
        keys: [
          {
            ...publicJwk,
            kid: "tempo-pelotas-test-key",
            alg: "RS256",
            use: "sig",
          },
        ],
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );

  return {
    token,
    fetchImpl,
    now: nowSeconds * 1_000,
  };
}

test("aceita OIDC do workflow Weather AI na main e recusa claims fora do contrato", async () => {
  const fixture = createGithubOidcFixture();
  const valid = await verifyWeatherAiGithubActionsToken(fixture.token(), {
    fetchImpl: fixture.fetchImpl,
    now: fixture.now,
  });
  assert.deepEqual(valid, { valid: true });

  const wrongAudience = await verifyWeatherAiGithubActionsToken(
    fixture.token({ aud: "outro-servico" }),
    { fetchImpl: fixture.fetchImpl, now: fixture.now },
  );
  assert.deepEqual(wrongAudience, { valid: false, reason: "invalid-audience" });

  const wrongRepository = await verifyWeatherAiGithubActionsToken(
    fixture.token({ repository_id: "999" }),
    { fetchImpl: fixture.fetchImpl, now: fixture.now },
  );
  assert.deepEqual(wrongRepository, { valid: false, reason: "invalid-repository-id" });

  const wrongWorkflow = await verifyWeatherAiGithubActionsToken(
    fixture.token({
      workflow_ref: "agenciamobi/mobitempopelotas/.github/workflows/quality.yml@refs/heads/main",
    }),
    { fetchImpl: fixture.fetchImpl, now: fixture.now },
  );
  assert.deepEqual(wrongWorkflow, { valid: false, reason: "invalid-workflow-ref" });

  const expired = await verifyWeatherAiGithubActionsToken(fixture.token({ exp: 1_999_999_000 }), {
    fetchImpl: fixture.fetchImpl,
    now: fixture.now,
  });
  assert.deepEqual(expired, { valid: false, reason: "token-expired" });
});

test("recusa token OIDC com assinatura diferente da chave publicada", async () => {
  const fixture = createGithubOidcFixture();
  const attacker = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const result = await verifyWeatherAiGithubActionsToken(fixture.token({}, attacker.privateKey), {
    fetchImpl: fixture.fetchImpl,
    now: fixture.now,
  });

  assert.deepEqual(result, { valid: false, reason: "invalid-signature" });
});

test("extrai o bearer OIDC da requisição e o workflow não depende mais de secret compartilhado", async () => {
  const fixture = createGithubOidcFixture();
  const request = new Request("https://tempopelotas.com.br/api/cron/push-daily?task=weather-ai", {
    headers: { Authorization: `Bearer ${fixture.token()}` },
  });
  const verification = await verifyWeatherAiGithubActionsRequest(request, {
    fetchImpl: fixture.fetchImpl,
    now: fixture.now,
  });
  assert.deepEqual(verification, { valid: true });

  const workflow = readFileSync(".github/workflows/weather-ai-snapshots.yml", "utf8");
  assert.match(workflow, /id-token:\s*write/);
  assert.match(workflow, /ACTIONS_ID_TOKEN_REQUEST_URL/);
  assert.match(workflow, /tempo-pelotas-weather-ai/);
  assert.doesNotMatch(workflow, /TEMPO_PELOTAS_CRON_SECRET/);
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
