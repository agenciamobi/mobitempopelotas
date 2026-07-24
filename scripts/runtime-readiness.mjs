import { createECDH } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const CANONICAL_SITE_URL = "https://tempopelotas.com.br";
const GEMINI_ENABLED_VALUES = new Set(["true", "1", "on"]);
const PLACEHOLDER_PATTERN = /(change[-_ ]?me|placeholder|example|your[-_ ]|todo|replace[-_ ]?me)/i;
const REQUIRED_TEMPLATE_KEYS = [
  "VITE_SUPABASE_MODE",
  "SUPABASE_MODE",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "CRON_SECRET",
  "VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_SUBJECT",
  "PUSH_ADMIN_SECRET",
  "REDEMET_API_KEY",
  "REDEMET_API_BASE_URL",
  "VITE_SITE_URL",
];
const FORBIDDEN_CLIENT_KEYS = [
  "VITE_SUPABASE_SECRET_KEY",
  "VITE_SUPABASE_SERVICE_ROLE_KEY",
  "VITE_VAPID_PRIVATE_KEY",
  "VITE_CRON_SECRET",
  "VITE_PUSH_ADMIN_SECRET",
  "VITE_REDEMET_API_KEY",
  "VITE_GEMINI_API_KEY",
];

const mode = process.argv.includes("--example") ? "example" : "production";
const outputDirectory = path.resolve("artifacts/runtime-readiness");
const checks = [];

function normalize(value) {
  const normalized = typeof value === "string" ? value.trim() : "";
  return normalized || null;
}

function parseDotenv(content) {
  const values = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator < 1) continue;

    const key = line.slice(0, separator).trim();
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^(["'])(.*)\1$/, "$2");
    values[key] = value;
  }

  return values;
}

function addCheck(name, passed, details) {
  checks.push({ name, status: passed ? "passed" : "failed", details });
  const label = passed ? "PASS" : "FAIL";
  const logger = passed ? console.log : console.error;
  logger(`${label} ${name} — ${details}`);
}

function hasKey(values, key) {
  return Object.prototype.hasOwnProperty.call(values, key);
}

function isHttpsUrl(value) {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidVapidSubject(value) {
  if (!value) return false;

  if (value.startsWith("mailto:")) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.slice(7));
  }

  return isHttpsUrl(value);
}

function decodeBase64Url(value) {
  if (!value || !/^[A-Za-z0-9_-]+$/.test(value)) return null;

  try {
    return Buffer.from(value, "base64url");
  } catch {
    return null;
  }
}

function validateVapidKeyPair(publicKey, privateKey) {
  const publicBytes = decodeBase64Url(publicKey);
  const privateBytes = decodeBase64Url(privateKey);

  if (publicBytes?.length !== 65 || publicBytes[0] !== 4 || privateBytes?.length !== 32) {
    return false;
  }

  try {
    const keyAgreement = createECDH("prime256v1");
    keyAgreement.setPrivateKey(privateBytes);
    const derivedPublicKey = keyAgreement.getPublicKey(undefined, "uncompressed");
    return derivedPublicKey.equals(publicBytes);
  } catch {
    return false;
  }
}

function looksLikePlaceholder(value) {
  if (!value) return true;
  return PLACEHOLDER_PATTERN.test(value);
}

function formatMissing(keys) {
  return keys.length === 0 ? "nenhuma" : keys.join(", ");
}

function validateForbiddenClientKeys(values, hasValue) {
  const exposed = FORBIDDEN_CLIENT_KEYS.filter((key) => hasValue(values, key));
  const passed = exposed.length === 0;
  const details = passed
    ? "nenhum segredo server-only usa prefixo VITE_"
    : `variáveis inseguras: ${exposed.join(", ")}`;

  addCheck("Segredos fora do bundle cliente", passed, details);
}

function validateTemplate(values) {
  const missing = REQUIRED_TEMPLATE_KEYS.filter((key) => !hasKey(values, key));
  const declarationsComplete = missing.length === 0;

  addCheck(
    "Declarações obrigatórias",
    declarationsComplete,
    declarationsComplete
      ? "todas as variáveis operacionais estão documentadas"
      : `ausentes: ${formatMissing(missing)}`,
  );

  addCheck(
    "Host canônico do template",
    normalize(values.VITE_SITE_URL) === CANONICAL_SITE_URL,
    `VITE_SITE_URL deve usar ${CANONICAL_SITE_URL}`,
  );

  const safeDefaultMode = values.VITE_SUPABASE_MODE === "mock" && values.SUPABASE_MODE === "mock";
  addCheck(
    "Modo seguro por padrão",
    safeDefaultMode,
    "o template deve permanecer em mock até a validação do Supabase oficial",
  );

  addCheck(
    "Base REDEMET segura",
    isHttpsUrl(normalize(values.REDEMET_API_BASE_URL)),
    "REDEMET_API_BASE_URL deve usar HTTPS",
  );

  addCheck(
    "Assunto VAPID documentado",
    isValidVapidSubject(normalize(values.VAPID_SUBJECT)),
    "VAPID_SUBJECT deve usar mailto: ou uma URL HTTPS",
  );

  validateForbiddenClientKeys(values, hasKey);
}

function validateProduction(values) {
  const value = (key) => normalize(values[key]);

  addCheck(
    "Host canônico de produção",
    value("VITE_SITE_URL") === CANONICAL_SITE_URL,
    `VITE_SITE_URL deve ser exatamente ${CANONICAL_SITE_URL}`,
  );

  const externalMode =
    value("SUPABASE_MODE") === "external" && value("VITE_SUPABASE_MODE") === "external";
  addCheck(
    "Supabase externo habilitado",
    externalMode,
    "SUPABASE_MODE e VITE_SUPABASE_MODE devem ser external",
  );

  const publicUrl = value("VITE_SUPABASE_URL");
  const serverUrl = value("SUPABASE_URL");
  addCheck(
    "URLs do Supabase",
    isHttpsUrl(publicUrl) && publicUrl === serverUrl,
    "as URLs pública e server-side devem existir, usar HTTPS e ser idênticas",
  );

  const publicKey = value("VITE_SUPABASE_PUBLISHABLE_KEY");
  const serverPublicKey = value("SUPABASE_PUBLISHABLE_KEY");
  const publishableKeysMatch = Boolean(
    publicKey &&
    serverPublicKey &&
    publicKey === serverPublicKey &&
    !looksLikePlaceholder(publicKey),
  );
  addCheck(
    "Publishable key do Supabase",
    publishableKeysMatch,
    "as publishable keys pública e server-side devem existir e ser idênticas",
  );

  const adminKey = value("SUPABASE_SECRET_KEY") ?? value("SUPABASE_SERVICE_ROLE_KEY");
  const adminKeyIsValid = Boolean(
    adminKey && !looksLikePlaceholder(adminKey) && adminKey !== publicKey,
  );
  addCheck(
    "Chave administrativa do Supabase",
    adminKeyIsValid,
    "uma chave administrativa server-only válida deve estar configurada",
  );

  const cronSecret = value("CRON_SECRET");
  const pushAdminSecret = value("PUSH_ADMIN_SECRET");
  const secretsAreStrong = [cronSecret, pushAdminSecret].every((secret) =>
    Boolean(secret && secret.length >= 32 && !looksLikePlaceholder(secret)),
  );
  addCheck(
    "Segredos operacionais",
    secretsAreStrong && cronSecret !== pushAdminSecret,
    "CRON_SECRET e PUSH_ADMIN_SECRET devem ter ao menos 32 caracteres e ser distintos",
  );

  const vapidPublic = value("VAPID_PUBLIC_KEY");
  const vapidPrivate = value("VAPID_PRIVATE_KEY");
  addCheck(
    "Par VAPID",
    validateVapidKeyPair(vapidPublic, vapidPrivate),
    "as chaves devem formar o mesmo par P-256 e usar ponto público não comprimido",
  );

  addCheck(
    "Assunto VAPID",
    isValidVapidSubject(value("VAPID_SUBJECT")),
    "VAPID_SUBJECT deve usar mailto: ou uma URL HTTPS",
  );

  const redemetIsConfigured = Boolean(
    value("REDEMET_API_KEY") && isHttpsUrl(value("REDEMET_API_BASE_URL")),
  );
  addCheck("REDEMET", redemetIsConfigured, "a chave deve existir e a URL base deve usar HTTPS");

  const geminiFlag = value("GEMINI_WEATHER_ENABLED")?.toLowerCase() ?? "";
  const geminiEnabled = GEMINI_ENABLED_VALUES.has(geminiFlag);
  const geminiKey = value("GEMINI_API_KEY");
  const geminiIsConfigured =
    !geminiEnabled || Boolean(geminiKey && !looksLikePlaceholder(geminiKey));
  addCheck(
    "Gemini opcional",
    geminiIsConfigured,
    geminiEnabled
      ? "GEMINI_API_KEY é obrigatória quando o recurso está habilitado"
      : "síntese Gemini desabilitada ou não exigida",
  );

  validateForbiddenClientKeys(values, (environment, key) => Boolean(normalize(environment[key])));
}

const values =
  mode === "example"
    ? parseDotenv(await readFile(path.resolve(".env.example"), "utf8"))
    : process.env;

if (mode === "example") validateTemplate(values);
else validateProduction(values);

await mkdir(outputDirectory, { recursive: true });
const report = {
  generatedAt: new Date().toISOString(),
  mode,
  canonicalSiteUrl: CANONICAL_SITE_URL,
  passed: checks.filter((check) => check.status === "passed").length,
  failed: checks.filter((check) => check.status === "failed").length,
  checks,
};
const reportPath = path.join(outputDirectory, "report.json");
const reportContent = `${JSON.stringify(report, null, 2)}\n`;
await writeFile(reportPath, reportContent);

console.log(`\nResultado: ${report.passed} aprovados; ${report.failed} reprovados.`);
console.log(`Relatório sanitizado: ${reportPath}`);

if (report.failed > 0) process.exitCode = 1;
