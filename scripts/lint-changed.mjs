import { spawnSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

const ROOT = process.cwd();
const BASELINE_ROOT = join(ROOT, `.lint-baseline-${process.pid}`);
const LINTABLE_PATTERN = /\.(?:[cm]?js|jsx|ts|tsx)$/u;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
    ...options,
  });

  if (result.error) throw result.error;
  return result;
}

function git(args, { allowFailure = false } = {}) {
  const result = run("git", ["-c", `safe.directory=${ROOT}`, ...args]);

  if (!allowFailure && result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args.join(" ")} falhou.`);
  }

  return result;
}

function commitExists(ref) {
  if (!ref) return false;
  return git(["rev-parse", "--verify", `${ref}^{commit}`], {
    allowFailure: true,
  }).status === 0;
}

function resolveBase() {
  const requestedBase = process.env.LINT_BASE_SHA?.trim();

  if (
    requestedBase &&
    !/^0+$/u.test(requestedBase) &&
    commitExists(requestedBase)
  ) {
    return requestedBase;
  }

  const head = git(["rev-parse", "HEAD"]).stdout.trim();

  if (commitExists("origin/main")) {
    const mergeBase = git(["merge-base", "origin/main", "HEAD"], {
      allowFailure: true,
    }).stdout.trim();

    if (mergeBase && mergeBase !== head) return mergeBase;
  }

  if (commitExists("HEAD^")) {
    return git(["rev-parse", "HEAD^"]).stdout.trim();
  }

  throw new Error(
    "Não foi possível determinar a revisão-base para o lint incremental.",
  );
}

function collectChangedFiles(base) {
  const output = git([
    "diff",
    "--name-status",
    "-z",
    "--diff-filter=ACMR",
    `${base}...HEAD`,
  ]).stdout;
  const tokens = output.split("\0").filter(Boolean);
  const entries = [];

  for (let index = 0; index < tokens.length; ) {
    const status = tokens[index++];
    let basePath;
    let path;

    if (status.startsWith("R") || status.startsWith("C")) {
      basePath = tokens[index++];
      path = tokens[index++];
    } else {
      path = tokens[index++];
      basePath = path;
    }

    if (!path || !LINTABLE_PATTERN.test(path)) continue;
    if (path === "scripts/lint-changed.mjs") continue;
    if (path.endsWith("routeTree.gen.ts")) continue;

    entries.push({ basePath, path });
  }

  return entries;
}

function eslintBinary() {
  return resolve(ROOT, "node_modules/eslint/bin/eslint.js");
}

function runEslint(paths) {
  if (!paths.length) return [];

  const result = run(process.execPath, [
    eslintBinary(),
    "--format",
    "json",
    ...paths,
  ]);

  if (result.status !== 0 && result.status !== 1) {
    throw new Error(
      result.stderr.trim() || `ESLint encerrou com status ${result.status}.`,
    );
  }

  try {
    return JSON.parse(result.stdout || "[]");
  } catch (error) {
    throw new Error(
      `Não foi possível interpretar a saída JSON do ESLint: ${error.message}`,
    );
  }
}

async function prepareBaseline(entries, base) {
  const paths = [];

  for (const entry of entries) {
    const source = git(["show", `${base}:${entry.basePath}`], {
      allowFailure: true,
    });

    if (source.status !== 0) continue;

    const target = join(BASELINE_ROOT, entry.path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, source.stdout, "utf8");
    paths.push(target);
  }

  return paths;
}

function normalizedPath(value) {
  return value.replaceAll("\\", "/");
}

function summarize(results, root) {
  const byFile = new Map();
  let errorCount = 0;

  for (const result of results) {
    const path = normalizedPath(relative(root, result.filePath));
    const rules = byFile.get(path) ?? new Map();

    for (const message of result.messages) {
      if (message.severity !== 2) continue;

      errorCount += 1;
      const rule = message.ruleId ?? "<fatal>";
      const current = rules.get(rule) ?? { count: 0, examples: [] };
      current.count += 1;

      if (current.examples.length < 3) {
        current.examples.push(
          `${message.line ?? 0}:${message.column ?? 0} ${message.message}`,
        );
      }

      rules.set(rule, current);
    }

    byFile.set(path, rules);
  }

  return { byFile, errorCount };
}

function compare(current, baseline) {
  const regressions = [];

  for (const [path, rules] of current.byFile) {
    for (const [rule, details] of rules) {
      const baselineCount = baseline.byFile.get(path)?.get(rule)?.count ?? 0;

      if (details.count <= baselineCount) continue;

      regressions.push({
        baselineCount,
        currentCount: details.count,
        examples: details.examples,
        path,
        rule,
      });
    }
  }

  return regressions;
}

async function main() {
  const base = resolveBase();
  const entries = collectChangedFiles(base);

  if (!entries.length) {
    console.log(
      "Lint incremental: nenhum arquivo JavaScript/TypeScript alterado.",
    );
    return;
  }

  console.log(`Lint incremental: comparando ${entries.length} arquivo(s).`);
  console.log(`Base: ${base}`);

  const baselinePaths = await prepareBaseline(entries, base);
  const currentResults = runEslint(entries.map((entry) => entry.path));
  const baselineResults = runEslint(baselinePaths);
  const current = summarize(currentResults, ROOT);
  const baseline = summarize(baselineResults, BASELINE_ROOT);
  const regressions = compare(current, baseline);

  if (!regressions.length) {
    console.log(
      `Aprovado: ${current.errorCount} erro(s) atual(is), ` +
        `${baseline.errorCount} herdado(s) na base e nenhuma regressão.`,
    );
    return;
  }

  console.error("O lint incremental encontrou novas violações:");

  for (const regression of regressions) {
    const delta = regression.currentCount - regression.baselineCount;
    console.error(
      `- ${regression.path} [${regression.rule}]: ` +
        `${regression.currentCount} atual(is), ` +
        `${regression.baselineCount} na base (+${delta}).`,
    );

    for (const example of regression.examples) {
      console.error(`  ${example}`);
    }
  }

  process.exitCode = 1;
}

try {
  await main();
} finally {
  await rm(BASELINE_ROOT, { force: true, recursive: true });
}
