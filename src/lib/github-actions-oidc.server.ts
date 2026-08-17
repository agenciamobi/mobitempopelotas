import { z } from "zod";

const GITHUB_OIDC_ISSUER = "https://token.actions.githubusercontent.com";
const GITHUB_OIDC_JWKS_URL = `${GITHUB_OIDC_ISSUER}/.well-known/jwks`;
const EXPECTED_REPOSITORY = "agenciamobi/mobitempopelotas";
const EXPECTED_REPOSITORY_ID = "1306185236";
const EXPECTED_REPOSITORY_OWNER = "agenciamobi";
const EXPECTED_REPOSITORY_OWNER_ID = "157939955";
const EXPECTED_REF = "refs/heads/main";
const EXPECTED_WORKFLOW_REF = `${EXPECTED_REPOSITORY}/.github/workflows/weather-ai-snapshots.yml@${EXPECTED_REF}`;
const EXPECTED_SUBJECTS = new Set([
  `repo:${EXPECTED_REPOSITORY}:ref:${EXPECTED_REF}`,
  `repo:${EXPECTED_REPOSITORY_OWNER}@${EXPECTED_REPOSITORY_OWNER_ID}/mobitempopelotas@${EXPECTED_REPOSITORY_ID}:ref:${EXPECTED_REF}`,
]);
const ALLOWED_EVENTS = new Set(["schedule", "workflow_dispatch", "push"]);
const CLOCK_TOLERANCE_SECONDS = 30;
const JWKS_TIMEOUT_MS = 10_000;

export const WEATHER_AI_GITHUB_OIDC_AUDIENCE = "tempo-pelotas-weather-ai";

const jwtHeaderSchema = z.object({
  alg: z.literal("RS256"),
  kid: z.string().min(1),
  typ: z.string().optional(),
});

const jwtClaimsSchema = z
  .object({
    iss: z.literal(GITHUB_OIDC_ISSUER),
    aud: z.union([z.string(), z.array(z.string())]),
    sub: z.string().min(1),
    exp: z.number().int(),
    iat: z.number().int(),
    nbf: z.number().int().optional(),
    repository: z.literal(EXPECTED_REPOSITORY),
    repository_id: z.union([z.string(), z.number()]),
    repository_owner: z.literal(EXPECTED_REPOSITORY_OWNER),
    repository_owner_id: z.union([z.string(), z.number()]),
    ref: z.literal(EXPECTED_REF),
    workflow_ref: z.string().min(1),
    event_name: z.string().min(1),
    runner_environment: z.string().optional(),
  })
  .passthrough();

const jwkSchema = z
  .object({
    kty: z.literal("RSA"),
    kid: z.string().min(1),
    n: z.string().min(1),
    e: z.string().min(1),
    alg: z.string().optional(),
    use: z.string().optional(),
  })
  .passthrough();

const jwksSchema = z.object({
  keys: z.array(jwkSchema).min(1),
});

type GithubSigningKey = z.infer<typeof jwkSchema>;

// Cópia das chaves públicas expostas pelo JWKS oficial do GitHub em 17/08/2026.
// Não são segredos. O runtime tenta o JWKS remoto primeiro e usa esta cópia somente
// quando a infraestrutura bloqueia a consulta externa. O kid continua obrigatório.
const EMBEDDED_GITHUB_OIDC_KEYS: readonly GithubSigningKey[] = [
  {
    kty: "RSA",
    alg: "RS256",
    use: "sig",
    kid: "cc413527-173f-5a05-976e-9c52b1d7b431",
    n: "w4M936N3ZxNaEblcUoBm-xu0-V9JxNx5S7TmF0M3SBK-2bmDyAeDdeIOTcIVZHG-ZX9N9W0u1yWafgWewHrsz66BkxXq3bscvQUTAw7W3s6TEeYY7o9shPkFfOiU3x_KYgOo06SpiFdymwJflRs9cnbaU88i5fZJmUepUHVllP2tpPWTi-7UA3AdP3cdcCs5bnFfTRKzH2W0xqKsY_jIG95aQJRBDpbiesefjuyxcQnOv88j9tCKWzHpJzRKYjAUM6OPgN4HYnaSWrPJj1v41eEkFM1kORuj-GSH2qMVD02VklcqaerhQHIqM-RjeHsN7G05YtwYzomE5G-fZuwgvQ",
    e: "AQAB",
  },
  {
    kty: "RSA",
    alg: "RS256",
    use: "sig",
    kid: "38826b17-6a30-5f9b-b169-8beb8202f723",
    n: "5Manmy-zwsk3wEftXNdKFZec4rSWENW4jTGevlvAcU9z3bgLBogQVvqYLtu9baVm2B3rfe5onadobq8po5UakJ0YsTiiEfXWdST7YI2Sdkvv-hOYMcZKYZ4dFvuSO1vQ2DgEkw_OZNiYI1S518MWEcNxnPU5u67zkawAGsLlmXNbOylgVfBRJrG8gj6scr-sBs4LaCa3kg5IuaCHe1pB-nSYHovGV_z0egE83C098FfwO1dNZBWeo4Obhb5Z-ZYFLJcZfngMY0zJnCVNmpHQWOgxfGikh3cwi4MYrFrbB4NTlxbrQ3bL-rGKR5X318veyDlo8Dyz2KWMobT4wB9U1Q",
    e: "AQAB",
  },
  {
    kty: "RSA",
    alg: "RS256",
    use: "sig",
    kid: "38E9B30B3A023A1B72309921A69A42FCC496C42C",
    n: "tEq2Fp9HcdT5MwMsB_UTm8j_woJJLi3sA-y0RX2tioTm581seyfvOH6lJ5JmHVtS-_fb8B2tRT1pznHQSNq14PsJdu9bp5egbWmIz-5RvhqoM-oKem_MJENCNFuqXijRLT47FRdfH3inqde1vJlA_JJHCqYMKIpHH7kqNFYcCpwr0vk80Hc2rTyL0uBXI7NqBZbtUgNoyucWO5O7QQrPNOmlr-GI8aFckFRfobCaCOiH9qW02FtkV74fwBGVCNhNf3a1CK81-O8xEGimvVydI_pQA5B8QqVuQjY_ntOu555HdirA0hKkY6fsE9eZCMFmWDHZ2kSWLjhabxWxIzSzXQ",
    e: "AQAB",
  },
  {
    kty: "RSA",
    alg: "RS256",
    use: "sig",
    kid: "4F3E9AD8C9A6F5EB3173006F4FA630E28F43DCE9",
    n: "tGevqhkBGn8NB0dKxs8Ddxhn-xZPm55svcSlkJZEOwDOXDLl_0-iVOVKNJfcHHLHvMqa6zh2DDcpAWZi2FpeBAJupsrymqwzllxOODWKWoVIoaIjOO7h1JLiF9Knwuq-o6BPtKdwOT-bOrXRzChMtQsc5C1Auex-D0Z6loObBuK1Lkm0RK9ISQsLqBEwq8g0OOupI_shU1r2rT2G0nkZ0CvxVlQeUGShFi8Mdys2s5LPqBwjC4LKwjk8moWQV32KEccbTPKxnG_539DxRglHJgHPHisSVGsfZIUXi2chtXdQHZPdVve8ZRmknCykZtkJ6K87llSUXi7oyzhCIZdiUQ",
    e: "AQAB",
  },
];

type OidcFetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

type GithubOidcVerification =
  | { valid: true }
  | {
      valid: false;
      reason: string;
    };

type VerificationOptions = {
  fetchImpl?: OidcFetch;
  now?: number;
};

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes.buffer;
}

function decodeJwtSegment(segment: string) {
  return JSON.parse(new TextDecoder().decode(decodeBase64Url(segment))) as unknown;
}

function audienceMatches(audience: string | string[]) {
  const audiences = Array.isArray(audience) ? audience : [audience];
  return audiences.includes(WEATHER_AI_GITHUB_OIDC_AUDIENCE);
}

function safeFailure(reason: string): GithubOidcVerification {
  return { valid: false, reason };
}

function validSigningKey(candidate: GithubSigningKey, kid: string) {
  return (
    candidate.kid === kid &&
    (!candidate.alg || candidate.alg === "RS256") &&
    (!candidate.use || candidate.use === "sig")
  );
}

async function fetchGithubJwks(fetchImpl: OidcFetch) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), JWKS_TIMEOUT_MS);

  try {
    const response = await fetchImpl(GITHUB_OIDC_JWKS_URL, {
      headers: { Accept: "application/json" },
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false as const, reason: `jwks-http-${response.status}` };

    const parsed = jwksSchema.safeParse(await response.json());
    if (!parsed.success) return { ok: false as const, reason: "jwks-invalid" };
    return { ok: true as const, value: parsed.data };
  } catch {
    return { ok: false as const, reason: "jwks-unavailable" };
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveGithubSigningKey(kid: string, fetchImpl: OidcFetch) {
  const jwksResult = await fetchGithubJwks(fetchImpl);
  if (jwksResult.ok) {
    const remoteKey = jwksResult.value.keys.find((candidate) => validSigningKey(candidate, kid));
    if (remoteKey) return { ok: true as const, value: remoteKey, source: "remote" as const };
  }

  const embeddedKey = EMBEDDED_GITHUB_OIDC_KEYS.find((candidate) => validSigningKey(candidate, kid));
  if (embeddedKey) return { ok: true as const, value: embeddedKey, source: "embedded" as const };

  return {
    ok: false as const,
    reason: jwksResult.ok ? "signing-key-not-found" : jwksResult.reason,
  };
}

async function verifyRs256Signature(
  jwk: GithubSigningKey,
  signingInput: string,
  encodedSignature: string,
) {
  try {
    const publicKey = await crypto.subtle.importKey(
      "jwk",
      jwk,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    const signatureValid = await crypto.subtle.verify(
      { name: "RSASSA-PKCS1-v1_5" },
      publicKey,
      decodeBase64Url(encodedSignature),
      new TextEncoder().encode(signingInput),
    );
    return signatureValid ? null : "invalid-signature";
  } catch {
    return "signature-verification-unavailable";
  }
}

export async function verifyWeatherAiGithubActionsToken(
  token: string,
  options: VerificationOptions = {},
): Promise<GithubOidcVerification> {
  const segments = token.split(".");
  if (segments.length !== 3 || segments.some((segment) => !segment)) {
    return safeFailure("token-malformed");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = segments;
  const parsedHeader = jwtHeaderSchema.safeParse(
    (() => {
      try {
        return decodeJwtSegment(encodedHeader);
      } catch {
        return null;
      }
    })(),
  );
  if (!parsedHeader.success) return safeFailure("header-invalid");

  const fetchImpl = options.fetchImpl ?? fetch;
  const signingKeyResult = await resolveGithubSigningKey(parsedHeader.data.kid, fetchImpl);
  if (!signingKeyResult.ok) return safeFailure(signingKeyResult.reason);

  const signatureError = await verifyRs256Signature(
    signingKeyResult.value,
    `${encodedHeader}.${encodedPayload}`,
    encodedSignature,
  );
  if (signatureError) return safeFailure(signatureError);

  let decodedClaims: unknown;
  try {
    decodedClaims = decodeJwtSegment(encodedPayload);
  } catch {
    return safeFailure("claims-invalid");
  }
  const parsedClaims = jwtClaimsSchema.safeParse(decodedClaims);
  if (!parsedClaims.success) return safeFailure("claims-invalid");

  const claims = parsedClaims.data;
  const nowSeconds = Math.floor((options.now ?? Date.now()) / 1_000);

  if (!audienceMatches(claims.aud)) return safeFailure("invalid-audience");
  if (claims.exp <= nowSeconds - CLOCK_TOLERANCE_SECONDS) return safeFailure("token-expired");
  if (claims.iat > nowSeconds + CLOCK_TOLERANCE_SECONDS) return safeFailure("issued-in-future");
  if (claims.nbf !== undefined && claims.nbf > nowSeconds + CLOCK_TOLERANCE_SECONDS) {
    return safeFailure("not-active-yet");
  }
  if (String(claims.repository_id) !== EXPECTED_REPOSITORY_ID) {
    return safeFailure("invalid-repository-id");
  }
  if (String(claims.repository_owner_id) !== EXPECTED_REPOSITORY_OWNER_ID) {
    return safeFailure("invalid-owner-id");
  }
  if (!EXPECTED_SUBJECTS.has(claims.sub)) return safeFailure("invalid-subject");
  if (claims.workflow_ref !== EXPECTED_WORKFLOW_REF) return safeFailure("invalid-workflow-ref");
  if (!ALLOWED_EVENTS.has(claims.event_name)) return safeFailure("invalid-event");
  if (claims.runner_environment && claims.runner_environment !== "github-hosted") {
    return safeFailure("invalid-runner-environment");
  }

  return { valid: true };
}

export async function verifyWeatherAiGithubActionsRequest(
  request: Request,
  options: VerificationOptions = {},
) {
  const authorization = request.headers.get("authorization")?.trim() ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) return safeFailure("bearer-missing");
  return verifyWeatherAiGithubActionsToken(match[1], options);
}
