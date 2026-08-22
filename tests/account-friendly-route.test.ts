import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const accountRoute = readFileSync("src/routes/conta.tsx", "utf8");
const dashboardRoute = readFileSync("src/routes/painel.tsx", "utf8");
const legacyLoginRoute = readFileSync("src/routes/entrar.tsx", "utf8");
const legacyAccountRoute = readFileSync("src/routes/minha-conta.tsx", "utf8");
const callbackRoute = readFileSync("src/routes/auth/callback.ts", "utf8");
const accountAction = readFileSync("src/components/auth/AuthAccountAction.tsx", "utf8");
const accountPage = readFileSync("src/components/auth/AccountPage.tsx", "utf8");
const loginCard = readFileSync("src/components/auth/GoogleLoginCard.tsx", "utf8");
const siteLayout = readFileSync("src/components/layout/SiteLayout.tsx", "utf8");
const privacyPage = readFileSync("src/routes/privacidade-e-dados.tsx", "utf8");

test("friendly account route serves both visitor login and authenticated preferences", () => {
  assert.match(accountRoute, /createFileRoute\("\/conta"\)/);
  assert.match(accountRoute, /getAccountSnapshot/);
  assert.match(accountRoute, /snapshot\.status === "unauthenticated"/);
  assert.match(accountRoute, /<GoogleLoginCard nextPath=\{nextPath\}/);
  assert.match(accountRoute, /<AccountPage snapshot=\{snapshot\}/);
  assert.match(accountRoute, /absoluteUrl\("\/conta"\)/);
  assert.match(accountRoute, /noindex, nofollow/);
});

test("authenticated dashboard is a separate noindex route shared by Free and PRO", () => {
  assert.match(dashboardRoute, /createFileRoute\("\/painel"\)/);
  assert.match(dashboardRoute, /getAccountSnapshot/);
  assert.match(dashboardRoute, /redirect\(\{ to: "\/conta", search: \{ next: "\/painel" \} \}\)/);
  assert.match(dashboardRoute, /<AccountDashboard snapshot=\{snapshot\}/);
  assert.match(dashboardRoute, /noindex, nofollow/);
});

test("legacy account URLs permanently redirect to the friendly route", () => {
  assert.match(legacyLoginRoute, /createFileRoute\("\/entrar"\)/);
  assert.match(legacyLoginRoute, /href:\s*`?\$?\{?target\.pathname/);
  assert.match(legacyLoginRoute, /statusCode:\s*301/);
  assert.match(legacyLoginRoute, /tempo-pelotas\.invalid\/conta/);

  assert.match(legacyAccountRoute, /createFileRoute\("\/minha-conta"\)/);
  assert.match(legacyAccountRoute, /href:\s*"\/conta"/);
  assert.match(legacyAccountRoute, /statusCode:\s*301/);
});

test("active authentication flow no longer generates the old query URL", () => {
  for (const source of [callbackRoute, accountAction, accountPage, loginCard, privacyPage]) {
    assert.doesNotMatch(source, /\/entrar\?next=\/minha-conta/);
  }

  assert.match(callbackRoute, /new URL\("\/conta", origin\)/);
  assert.match(callbackRoute, /safeNextPath\([^,]+, "\/conta"\)/);
  assert.match(accountAction, /href=\{authenticated \? "\/painel" : "\/conta"\}/);
  assert.match(accountPage, /window\.location\.assign\("\/conta"\)/);
  assert.match(accountPage, /<Link to="\/painel">Abrir meu painel/);
  assert.match(loginCard, /safeNextPath\(nextPath, "\/conta"\)/);
  assert.match(privacyPage, /<Link to="\/conta">Abrir minha conta<\/Link>/);
});

test("account and dashboard routes are rendered without the generic topic shell", () => {
  assert.match(siteLayout, /"\/conta"/);
  assert.match(siteLayout, /"\/painel"/);
  assert.match(siteLayout, /standaloneRoutes\.has\(resolvedPathname\)/);
});

test("superadmin route remains intentionally absent", () => {
  assert.doesNotMatch(accountRoute, /\/sistema/);
  assert.doesNotMatch(dashboardRoute, /\/sistema/);
  assert.doesNotMatch(accountAction, /\/sistema/);
});
