import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";
import test from "node:test";

const files = [
  "tests/database-security.test.ts",
  "tests/open-meteo-edge.test.ts",
  "tests/production-weather-integrity.test.ts",
  "tests/today-home-visual.test.ts",
  "tests/visitor-language-menu-pages.test.ts",
  "tests/atmospheric-intelligence.test.ts",
  "tests/meteogram-page.test.ts",
  "tests/camera-monitoring-page.test.ts",
  "tests/hydrology-overview-page.test.ts",
  "tests/regional-city-editorial.test.ts",
];

test("diagnóstico temporário dos contratos quebrados", () => {
  let failures = 0;

  for (const file of files) {
    const result = spawnSync(process.execPath, ["--test", file], {
      encoding: "utf8",
      env: process.env,
    });

    if (result.status === 0) continue;
    failures += 1;

    const combined = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
    const tail = combined.slice(-6000);
    const payload = Buffer.from(tail, "utf8").toString("base64");
    console.log(`::error file=${file}::DIAG64:${payload}`);
  }

  assert.equal(failures, 0, `${failures} contratos continuam quebrados`);
});
