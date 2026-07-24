import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createECDH } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

const SCRIPT_PATH = path.resolve("scripts/runtime-readiness-lovable.mjs");
const REPORT_PATH = path.join("artifacts", "runtime-readiness", "report.json");

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

test("preflight do Lovable usa .env.production e MOBI_SUPABASE_SECRET_KEY", () => {
  const workspace = mkdtempSync(path.join(tmpdir(), "mobi-lovable-readiness-"));
  const vapid = generateVapidPair();
  const adminKey = "sb_secret_external_contract_987654321";
  const environment: NodeJS.ProcessEnv = {
    ...process.env,
    MOBI_SUPABASE_MODE: "external",
    MOBI_SUPABASE_SECRET_KEY: adminKey,
    CRON_SECRET: "c".repeat(40),
    PUSH_ADMIN_SECRET: "p".repeat(40),
    VAPID_PUBLIC_KEY: vapid.publicKey,
    VAPID_PRIVATE_KEY: vapid.privateKey,
    VAPID_SUBJECT: "mailto:contato@agenciamobi.com.br",
    REDEMET_API_KEY: "redemet-contract-key",
    REDEMET_API_BASE_URL: "https://api-redemet.decea.mil.br/",
    GEMINI_WEATHER_ENABLED: "false",
  };

  for (const key of [
    "SUPABASE_MODE",
    "SUPABASE_URL",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_SECRET_KEY",
    "VITE_SITE_URL",
    "VITE_SUPABASE_MODE",
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
  ]) {
    delete environment[key];
  }

  try {
    const result = spawnSync(process.execPath, [SCRIPT_PATH], {
      cwd: workspace,
      env: environment,
      encoding: "utf8",
    });
    const reportPath = path.join(workspace, REPORT_PATH);

    assert.equal(existsSync(reportPath), true, result.stderr);
    const report = JSON.parse(readFileSync(reportPath, "utf8")) as {
      failed: number;
      checks: Array<{ name: string; status: string }>;
    };

    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.equal(report.failed, 0);
    assert.equal(
      report.checks.every((check) => check.status === "passed"),
      true,
    );
    assert.equal(`${result.stdout}\n${result.stderr}`.includes(adminKey), false);
  } finally {
    rmSync(workspace, { recursive: true, force: true });
  }
});
