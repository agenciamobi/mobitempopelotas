import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createECDH } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const SCRIPT_PATH = path.resolve("scripts/runtime-readiness.mjs");
const REPORT_PATH = path.join("artifacts", "runtime-readiness", "report.json");
const CANONICAL_SITE_URL = "https://www.tempopelotas.com.br";
const MANAGED_ENVIRONMENT_KEYS = [
  "VITE_SITE_URL",
  "VITE_SUPABASE_MODE",
  "SUPABASE_MODE",
  "VITE_SUPABASE_URL",
  "SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "CRON_SECRET",
  "PUSH_ADMIN_SECRET",
  "VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT",
  "REDEMET_API_KEY",
  "REDEMET_API_BASE_URL",
  "GEMINI_WEATHER_ENABLED",
  "GEMINI_API_KEY",
  "VITE_SUPABASE_SECRET_KEY",
  "VITE_SUPABASE_SERVICE_ROLE_KEY",
  "VITE_VAPID_PRIVATE_KEY",
  "VITE_CRON_SECRET",
  "VITE_PUSH_ADMIN_SECRET",
  "VITE_REDEMET_API_KEY",
  "VITE_GEMINI_API_KEY",
] as const;

type ReadinessCheck = {
  name: string;
  status: "passed" | "failed";
  details: string;
};

type ReadinessReport = {
  generatedAt: string;
  mode: string;
  canonicalSiteUrl: string;
  passed: number;
  failed: number;
  checks: ReadinessCheck[];
};

type ReadinessOutcome = {
  status: number | null;
  stdout: string;
  stderr: string;
  report: ReadinessReport;
  environment: NodeJS.ProcessEnv;
};

function generateVapidPair() {
  const keyAgreement = createECDH("prime256v1");
  keyAgreement.generateKeys();
  const rawPrivateKey = keyAgreement.getPrivateKey();
  const privateKey = Buffer.alloc(32);
  rawPrivateKey.copy(privateKey, privateKey.length - rawPrivateKey.length);

  return {
    publicKey: keyAgreement.getPublicKey(undefined, "uncompressed").toString("base64url"),
    privateKey: privateKey.toString("base64url"),
  };
}

function sanitizedParentEnvironment() {
  const environment: NodeJS.ProcessEnv = { ...process.env };

  for (const key of MANAGED_ENVIRONMENT_KEYS) {
    delete environment[key];
  }

  return environment;
}

function validEnvironment(overrides: NodeJS.ProcessEnv = {}) {
  const vapid = generateVapidPair();
  const publishableKey = "sb_publishable_live_contract_123456789";

  return {
    ...sanitizedParentEnvironment(),
    VITE_SITE_URL: CANONICAL_SITE_URL,
    VITE_SUPABASE_MODE: "external",
    SUPABASE_MODE: "external",
    VITE_SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_URL: "https://project.supabase.co",
    VITE_SUPABASE_PUBLISHABLE_KEY: publishableKey,
    SUPABASE_PUBLISHABLE_KEY: publishableKey,
    SUPABASE_SECRET_KEY: "sb_secret_live_contract_987654321",
    CRON_SECRET: "c".repeat(40),
    PUSH_ADMIN_SECRET: "p".repeat(40),
    VAPID_PUBLIC_KEY: vapid.publicKey,
    VAPID_PRIVATE_KEY: vapid.privateKey,
    VAPID_SUBJECT: "mailto:contato@agenciamobi.com.br",
    REDEMET_API_KEY: "redemet-live-contract-key",
    REDEMET_API_BASE_URL: "https://api-redemet.decea.mil.br/",
    GEMINI_WEATHER_ENABLED: "false",
    GEMINI_API_KEY: "",
    ...overrides,
  } satisfies NodeJS.ProcessEnv;
}

function runReadiness(overrides: NodeJS.ProcessEnv = {}): ReadinessOutcome {
  const workspace = mkdtempSync(path.join(tmpdir(), "mobi-runtime-readiness-"));
  const environment = validEnvironment(overrides);

  try {
    const result = spawnSync(process.execPath, [SCRIPT_PATH], {
      cwd: workspace,
      env: environment,
      encoding: "utf8",
    });
    const reportPath = path.join(workspace, REPORT_PATH);

    assert.equal(
      existsSync(reportPath),
      true,
      `o preflight deve produzir relatório; stderr: ${result.stderr}`,
    );

    const report = JSON.parse(readFileSync(reportPath, "utf8")) as ReadinessReport;

    return {
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      report,
      environment,
    };
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
}

function findCheck(report: ReadinessReport, name: string) {
  const check = report.checks.find((item) => item.name === name);
  assert.ok(check, `verificação ausente no relatório: ${name}`);
  return check;
}

test("aprova ambiente coerente sem expor credenciais no relatório ou console", () => {
  const outcome = runReadiness();

  assert.equal(outcome.status, 0, outcome.stderr);
  assert.equal(outcome.report.mode, "production");
  assert.equal(outcome.report.canonicalSiteUrl, CANONICAL_SITE_URL);
  assert.equal(outcome.report.failed, 0);
  assert.equal(
    outcome.report.checks.every((check) => check.status === "passed"),
    true,
  );

  const observableOutput = `${outcome.stdout}\n${outcome.stderr}\n${JSON.stringify(outcome.report)}`;
  const sensitiveValues = [
    outcome.environment.SUPABASE_SECRET_KEY,
    outcome.environment.CRON_SECRET,
    outcome.environment.PUSH_ADMIN_SECRET,
    outcome.environment.VAPID_PRIVATE_KEY,
    outcome.environment.REDEMET_API_KEY,
  ];

  for (const sensitiveValue of sensitiveValues) {
    assert.ok(sensitiveValue);
    assert.equal(observableOutput.includes(sensitiveValue), false);
  }
});

test("reprova chaves VAPID válidas que não pertencem ao mesmo par", () => {
  const publicPair = generateVapidPair();
  const privatePair = generateVapidPair();
  const outcome = runReadiness({
    VAPID_PUBLIC_KEY: publicPair.publicKey,
    VAPID_PRIVATE_KEY: privatePair.privateKey,
  });

  assert.equal(outcome.status, 1);
  assert.equal(findCheck(outcome.report, "Par VAPID").status, "failed");
});

test("exige chave Gemini para todos os valores de ativação aceitos pelo runtime", async (t) => {
  for (const enabledValue of ["true", "1", "on"]) {
    await t.test(enabledValue, () => {
      const outcome = runReadiness({
        GEMINI_WEATHER_ENABLED: enabledValue,
        GEMINI_API_KEY: "",
      });

      assert.equal(outcome.status, 1);
      assert.equal(findCheck(outcome.report, "Gemini opcional").status, "failed");
    });
  }

  await t.test("on com chave configurada", () => {
    const outcome = runReadiness({
      GEMINI_WEATHER_ENABLED: "on",
      GEMINI_API_KEY: "gemini-live-contract-key",
    });

    assert.equal(outcome.status, 0, outcome.stderr);
    assert.equal(findCheck(outcome.report, "Gemini opcional").status, "passed");
  });
});

test("reprova segredo server-only configurado com prefixo VITE_", () => {
  const outcome = runReadiness({ VITE_CRON_SECRET: "x".repeat(40) });

  assert.equal(outcome.status, 1);
  assert.equal(findCheck(outcome.report, "Segredos fora do bundle cliente").status, "failed");
});
