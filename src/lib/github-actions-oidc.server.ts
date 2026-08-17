import { createPublicKey, verify } from "node:crypto";

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

function decodeJwtSegment(segment: string) {
  return JSON.parse(Buffer.from(segment, "base64url").toString("utf8")) as unknown;
}

function audienceMatches(audience: string | string[]) {
  const audiences = Array.isArray(audience) ? audience : [audience];
  return audiences.includes(WEATHER_AI_GITHUB_OIDC_AUDIENCE);
}

function safeFailure(reason: string): GithubOidcVerification {
  return { valid: false, reason };
}

export async function verifyWeatherAiGithubActionsToken(
  token: string,
  options: VerificationOptions = {},
): Promise<GithubOidcVerification> {
  try {
    const segments = token.split(".");
    if (segments.length !== 3 || segments.some((segment) => !segment)) {
      return safeFailure("token-malformed");
    }

    const [encodedHeader, encodedPayload, encodedSignature] = segments;
    const header = jwtHeaderSchema.parse(decodeJwtSegment(encodedHeader));
    const fetchImpl = options.fetchImpl ?? fetch;
    const jwksResponse = await fetchImpl(GITHUB_OIDC_JWKS_URL, {
      headers: {
        Accept: "application/json",
        "User-Agent": "TempoPelotas-GitHub-OIDC/1.0",
      },
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    });

    if (!jwksResponse.ok) return safeFailure(`jwks-http-${jwksResponse.status}`);

    const jwks = jwksSchema.parse(await jwksResponse.json());
    const jwk = jwks.keys.find(
      (candidate) =>
        candidate.kid === header.kid &&
        (!candidate.alg || candidate.alg === "RS256") &&
        (!candidate.use || candidate.use === "sig"),
    );
    if (!jwk) return safeFailure("signing-key-not-found");

    const publicKey = createPublicKey({ key: jwk, format: "jwk" });
    const signatureValid = verify(
      "RSA-SHA256",
      Buffer.from(`${encodedHeader}.${encodedPayload}`),
      publicKey,
      Buffer.from(encodedSignature, "base64url"),
    );
    if (!signatureValid) return safeFailure("invalid-signature");

    const claims = jwtClaimsSchema.parse(decodeJwtSegment(encodedPayload));
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
  } catch {
    return safeFailure("token-verification-failed");
  }
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
