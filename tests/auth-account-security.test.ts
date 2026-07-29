import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { safeNextPath } from "../src/lib/auth/paths.ts";

const loginCard = readFileSync("src/components/auth/GoogleLoginCard.tsx", "utf8");
const callbackRoute = readFileSync("src/routes/auth/callback.ts", "utf8");
const signoutRoute = readFileSync("src/routes/auth/signout.ts", "utf8");
const accountRoute = readFileSync("src/routes/conta.tsx", "utf8");
const exportRoute = readFileSync("src/routes/api/account/export.ts", "utf8");
const deleteRoute = readFileSync("src/routes/api/account/delete.ts", "utf8");

function assertPrivateResponseContract(source: string) {
  assert.match(source, /Cache-Control["']?,?\s*["']private, no-store, max-age=0/);
  assert.match(source, /Pragma["']?,?\s*["']no-cache/);
}

test("retorno pós-login aceita somente caminhos internos normalizados", () => {
  assert.equal(safeNextPath("/conta", "/"), "/conta");
  assert.equal(safeNextPath("/conta?aba=privacidade#consentimentos", "/"), "/conta?aba=privacidade#consentimentos");
  assert.equal(safeNextPath("https://exemplo.com/roubo", "/conta"), "/conta");
  assert.equal(safeNextPath("//exemplo.com/roubo", "/conta"), "/conta");
  assert.equal(safeNextPath("/\\exemplo.com/roubo", "/conta"), "/conta");
  assert.equal(safeNextPath("javascript:alert(1)", "/conta"), "/conta");
  assert.equal(safeNextPath(null, "/conta"), "/conta");
});

test("login Google usa PKCE do Supabase e callback do próprio domínio", () => {
  assert.match(loginCard, /signInWithOAuth/);
  assert.match(loginCard, /provider:\s*["']google["']/);
  assert.match(loginCard, /new URL\(["']\/auth\/callback["'], window\.location\.origin\)/);
  assert.match(loginCard, /callback\.searchParams\.set\(["']next["'], safeNextPath/);
  assert.match(loginCard, /redirectTo:\s*callback\.toString\(\)/);
  assert.match(loginCard, /prompt:\s*["']select_account["']/);
});

test("callback troca o código no servidor e não aceita redirect externo", () => {
  assert.match(callbackRoute, /safeNextPath\(url\.searchParams\.get\(["']next["']\), ["']\/conta["']\)/);
  assert.match(callbackRoute, /client\.auth\.exchangeCodeForSession\(code\)/);
  assert.match(callbackRoute, /new URL\(next, url\.origin\)/);
  assertPrivateResponseContract(callbackRoute);
  assert.match(callbackRoute, /Vary["']?,?\s*["']Cookie/);
  assert.match(callbackRoute, /status:\s*302/);
});

test("área de conta é opcional, privada e não indexável", () => {
  assert.match(accountRoute, /name:\s*["']robots["'], content:\s*["']noindex, nofollow["']/);
  assert.match(accountRoute, /loader:\s*\(\)\s*=>\s*getAccountSnapshot\(\)/);
  assert.match(accountRoute, /snapshot\.status === ["']unauthenticated["']/);
  assert.match(accountRoute, /GoogleLoginCard nextPath=["']\/conta["']/);
});

test("exportação exige sessão e omite tokens e chaves criptográficas", () => {
  assert.match(exportRoute, /getVerifiedRequestUser\(request\)/);
  assert.match(exportRoute, /status:\s*401/);
  assert.match(exportRoute, /Content-Disposition/);
  assert.match(exportRoute, /X-Robots-Tag["']?,?\s*["']noindex, nofollow/);
  assertPrivateResponseContract(exportRoute);
  assert.match(exportRoute, /\.select\(["']endpoint,user_agent,topics,created_at,updated_at,last_seen_at["']\)/);
  assert.doesNotMatch(exportRoute, /\.select\(["'][^"']*(?:p256dh|auth|access_token|refresh_token|service_role)[^"']*["']\)/);
  assert.match(exportRoute, /Chaves criptográficas de entrega e credenciais de sessão não fazem parte da exportação/);
});

test("exclusão exige origem, frase exata, sessão revalidada e cascata administrativa", () => {
  assert.match(deleteRoute, /isSameOriginRequest\(request\)/);
  assert.match(deleteRoute, /readLimitedJson\(request\)/);
  assert.match(deleteRoute, /z\.literal\(["']EXCLUIR MINHA CONTA["']\)/);
  assert.match(deleteRoute, /client\.auth\.getUser\(\)/);
  assert.match(deleteRoute, /admin\.auth\.admin\.deleteUser\(user\.id\)/);
  assert.match(deleteRoute, /client\.auth\.signOut\(\{ scope: ["']local["'] \}\)/);
  assert.match(deleteRoute, /handlers:\s*\{\s*POST:/s);
});

test("logout aceita apenas POST da mesma origem e encerra somente a sessão local", () => {
  assert.match(signoutRoute, /isSameOriginRequest\(request\)/);
  assert.match(signoutRoute, /status:\s*403/);
  assert.match(signoutRoute, /client\.auth\.signOut\(\{ scope: ["']local["'] \}\)/);
  assert.match(signoutRoute, /status:\s*303/);
  assertPrivateResponseContract(signoutRoute);
  assert.match(signoutRoute, /handlers:\s*\{\s*POST:/s);
  assert.doesNotMatch(signoutRoute, /handlers:\s*\{[^}]*GET:/s);
});
