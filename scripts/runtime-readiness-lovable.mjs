import { readFile } from "node:fs/promises";

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

async function readProductionEnvironment() {
  try {
    const path = new URL("../.env.production", import.meta.url);
    return parseDotenv(await readFile(path, "utf8"));
  } catch {
    return {};
  }
}

const production = await readProductionEnvironment();
const aliases = {
  VITE_SITE_URL: production.VITE_SITE_URL,
  VITE_SUPABASE_MODE: production.VITE_SUPABASE_MODE,
  SUPABASE_MODE:
    process.env.MOBI_SUPABASE_MODE ?? process.env.SUPABASE_MODE ?? production.VITE_SUPABASE_MODE,
  VITE_SUPABASE_URL: production.VITE_SUPABASE_URL,
  SUPABASE_URL:
    process.env.MOBI_SUPABASE_URL ?? process.env.SUPABASE_URL ?? production.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: production.VITE_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_PUBLISHABLE_KEY:
    process.env.MOBI_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    production.VITE_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SECRET_KEY:
    process.env.MOBI_SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY,
};

for (const [key, value] of Object.entries(aliases)) {
  if (!normalize(process.env[key]) && normalize(value)) process.env[key] = value;
}

await import("./runtime-readiness.mjs");
