import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const CANONICAL_SITE_URL = "https://www.tempopelotas.com.br";
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
    const value = line.slice(separator + 1).trim().replace(/^(["'])(.*)\1$/, "$2");
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
  if (value.startsWith("mailto:")) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.slice(7));
  return isHttpsUrl(value);
}

function decodedBase64UrlLength(value) {
  if (!value || !/^[A-Za-z0-9_-]+$/.test(value)) return null;

  try {
    return Buffer.from(value, "base64url").length;
  } catch {
    return null;
  }
}

function looksLikePlaceholder(value) {
  if (!value) return true;
  return /(change[-_ ]?me|placeholder|example|your[-_ ]|todo|replace[-_ ]?me)/i.test(value);
}

function validateTemplate(values) {
  const requiredDeclarations = [
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

  const missing = requiredDeclarations.filter((key) => !hasKey(values, key));
  addCheck(
    "Declarações obrigatórias",
    missing.length === 0,
    missing.length === 0 ? "todas as variáveis operacionais estão documentadas" : `ausentes: ${missing.join(", ")}`,
  );

  addCheck(
    "Host canônico do template",
    normalize(values.VITE_SITE_URL) === CANONICAL_SITE_URL,
    `VITE_SITE_URL deve usar ${CANONICAL_SITE_URL}`,
  );

  addCheck(
    "Modo seguro por padrão",
    values.VITE_SUPABASE_MODE === "mock" && values.SUPABASE_MODE === "mock",
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

  const forbiddenClientKeys = [
    "VITE_SUPABASE_SECRET_KEY",
    "VITE_SUPABASE_SERVICE_ROLE_KEY",
    "VITE_VAPID_PRIVATE_KEY",
    "VITE_CRON_SECRET",
    "VITE_PUSH_ADMIN_SECRET",
    "VITE_REDEMET_API_KEY",
    "VITE_GEMINI_API_KEY",
  ];
  const exposed = forbiddenClientKeys.filter((key) => hasKey(values, key));
  addCheck(
    "Segredos fora do bundle cliente",
    exposed.length === 0,
    exposed.length === 0 ? "nenhum segredo server-only usa prefixo VITE_" : `declarações inseguras: ${exposed.join(", ")}`,
  );
}

function validateProduction(values) {
  const value = (key) => normalize(values[key]);

  addCheck(
    "Host canônico de produção",
    value("VITE_SITE_URL") === CANONICAL_SITE_URL,
    `VITE_SITE_URL deve ser exatamente ${CANONICAL_SITE_URL}`,
  );

  addCheck(
    "Supabase externo habilitado",
    value("SUPABASE_MODE") === "external" && value("VITE_SUPABASE_MODE") === "external",
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
  addCheck(
    "Publishable key do Supabase",
    Boolean(publicKey && serverPublicKey && publicKey === serverPublicKey && !looksLikePlaceholder(publicKey)),
    "as publishable keys pública e server-side devem existir e ser idênticas",
  );

  const adminKey = value("SUPABASE_SECRET_KEY") ?? value("SUPABASE_SERVICE_ROLE_KEY");
  addCheck(
    "Chave administrativa do Supabase",
    Boolean(adminKey && !looksLikePlaceholder(adminKey) && adminKey !== publicKey),
    "uma chave administrativa server-only válida deve estar configurada",
  );

  const cronSecret = value("CRON_SECRET");
  const pushAdminSecret = value("PUSH_ADMIN_SECRET");
  const secretsAreStrong = [cronSecret, pushAdminSecret].every(
    (secret) => Boolean(secret && secret.length >= 32 && !looksLikePlaceholder(secret)),
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
    decodedBase64UrlLength(vapidPublic) === 65 && decodedBase64UrlLength(vapidPrivate) === 32,
    "a chave pública deve decodificar para 65 bytes e a privada para 32 bytes",
  );

  addCheck(
    "Assunto VAPID",
    isValidVapidSubject(value("VAPID_SUBJECT")),
    "VAPID_SUBJECT deve usar mailto: ou uma URL HTTPS",
  );

  addCheck(
    "REDEMET",
    Boolean(value("REDEMET_API_KEY") && isHttpsUrl(value("REDEMET_API_BASE_URL"))),
    "a chave deve existir e a URL base deve usar HTTPS",
  );

  const geminiEnabled = value("GEMINI_WEATHER_ENABLED")?.toLowerCase() === "true";
  addCheck(
    "Gemini opcional",
    !geminiEnabled || Boolean(value("GEMINI_API_KEY") && !looksLikePlaceholder(value("GEMINI_API_KEY"))),
    geminiEnabled ? "GEMINI_API_KEY é obrigatória quando o recurso está habilitado" : "síntese Gemini desabilitada ou não exigida",
  );

  const forbiddenClientKeys = [
    "VITE_SUPABASE_SECRET_KEY",
    "VITE_SUPABASE_SERVICE_ROLE_KEY",
    "VITE_VAPID_PRIVATE_KEY",
    "VITE_CRON_SECRET",
    "VITE_PUSH_ADMIN_SECRET",
    "VITE_REDEMET_API_KEY",
    "VITE_GEMINI_API_KEY",
  ];
  const exposed = forbiddenClientKeys.filter((key) => value(key));
  addCheck(
    "Ausência de segredos VITE_",
    exposed.length === 0,
    exposed.length === 0 ? "nenhum segredo server-only está exposto ao cliente" : `variáveis inseguras configuradas: ${exposed.join(", ")}`,
  );
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
await writeFile(path.join(outputDirectory, "report.json"), `${JSON.stringify(report, null, 2)}\n`);

console.log(`\nResultado: ${report.passed} aprovados; ${report.failed} reprovados.`);
console.log(`Relatório sanitizado: ${path.join(outputDirectory, "report.json")}`);

if (report.failed > 0) process.exitCode = 1;
