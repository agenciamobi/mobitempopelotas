#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const API_BASE_URL = "https://stations.windy.com/api/v2";
const OPEN_STATIONS_URL = `${API_BASE_URL}/opendata/station`;
const PELOTAS = {
  name: "Pelotas, RS",
  latitude: -31.7654,
  longitude: -52.3376,
};
const MAX_PAGES = 25;

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(scriptDirectory, "..");

typecheckRuntime();
await loadLocalEnvironment();

const apiKey = process.env.WINDY_STATIONS_API_KEY?.trim();
const radiusKm = readPositiveNumber("WINDY_STATIONS_DIAGNOSTIC_RADIUS_KM", 150);
const observationLimit = Math.floor(
  readPositiveNumber("WINDY_STATIONS_DIAGNOSTIC_OBSERVATION_LIMIT", 20),
);

if (!apiKey) {
  console.error(
    [
      "WINDY_STATIONS_API_KEY não está configurada.",
      "Adicione a chave em .env.local e execute novamente:",
      "npm run windy:diagnose",
    ].join("\n"),
  );
  process.exit(1);
}

console.log("Consultando o catálogo aberto da Windy Stations...");

const catalogue = await fetchStationCatalogue(apiKey);
const normalizedStations = catalogue.records
  .map(normalizeStation)
  .filter((station) => station !== null)
  .map((station) => ({
    ...station,
    distanceKm: haversineDistanceKm(
      PELOTAS.latitude,
      PELOTAS.longitude,
      station.latitude,
      station.longitude,
    ),
  }))
  .sort((left, right) => left.distanceKm - right.distanceKm);

const nearbyStations = normalizedStations.filter(
  (station) => station.distanceKm <= radiusKm,
);
const stationsForObservation = nearbyStations.slice(0, observationLimit);

console.log(
  `Catálogo: ${normalizedStations.length} estações normalizadas em ${catalogue.pages} página(s).`,
);
console.log(
  `Cobertura local: ${nearbyStations.length} estação(ões) em um raio de ${radiusKm} km de ${PELOTAS.name}.`,
);

const stationReports = [];

for (const [index, station] of stationsForObservation.entries()) {
  process.stdout.write(
    `\rConsultando observações ${index + 1}/${stationsForObservation.length}: ${station.name.slice(0, 48).padEnd(48)}`,
  );

  stationReports.push({
    ...station,
    observation: await fetchLatestObservation(station.id, apiKey),
  });
}

if (stationsForObservation.length > 0) process.stdout.write("\n");

printStationTable(stationReports);

const generatedAt = new Date().toISOString();
const report = {
  generatedAt,
  purpose:
    "Diagnóstico local. A Embrapa permanece como fonte canônica das condições observadas em Pelotas.",
  source: {
    name: "Windy Stations Open Data",
    catalogueUrl: OPEN_STATIONS_URL,
  },
  center: PELOTAS,
  radiusKm,
  catalogue: {
    pagesFetched: catalogue.pages,
    rawRecordsFound: catalogue.records.length,
    normalizedStations: normalizedStations.length,
    nearbyStations: nearbyStations.length,
  },
  nearbyStations: stationReports,
};

const outputDirectory = path.join(projectDirectory, ".diagnostics");
const outputPath = path.join(
  outputDirectory,
  `windy-stations-${generatedAt.replaceAll(":", "-")}.json`,
);

await mkdir(outputDirectory, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

console.log(`\nRelatório salvo em ${path.relative(projectDirectory, outputPath)}.`);
console.log(
  "A chave não foi gravada no relatório. Revise os campos reais retornados antes de criar qualquer componente público.",
);

function typecheckRuntime() {
  const major = Number(process.versions.node.split(".")[0]);

  if (!Number.isFinite(major) || major < 20) {
    console.error("Este diagnóstico exige Node.js 20 ou superior.");
    process.exit(1);
  }
}

async function loadLocalEnvironment() {
  const candidates = [".env.local", ".env"];

  for (const filename of candidates) {
    try {
      const content = await readFile(path.join(projectDirectory, filename), "utf8");

      for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#")) continue;

        const separator = line.indexOf("=");
        if (separator <= 0) continue;

        const key = line.slice(0, separator).trim();
        let value = line.slice(separator + 1).trim();

        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        if (!(key in process.env)) process.env[key] = value;
      }
    } catch (error) {
      if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
        continue;
      }

      throw error;
    }
  }
}

function readPositiveNumber(name, fallback) {
  const rawValue = process.env[name]?.trim();
  if (!rawValue) return fallback;

  const parsed = Number(rawValue.replace(",", "."));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function fetchJson(url, apiKey) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "windy-api-key": apiKey,
    },
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    const message = await response.text().catch(() => "");
    throw new Error(
      `Windy Stations respondeu com status ${response.status}${message ? `: ${message.slice(0, 240)}` : ""}`,
    );
  }

  return response.json();
}

async function fetchStationCatalogue(apiKey) {
  const records = [];
  const visited = new Set();
  let currentUrl = OPEN_STATIONS_URL;
  let pages = 0;

  while (currentUrl && pages < MAX_PAGES && !visited.has(currentUrl)) {
    visited.add(currentUrl);
    const payload = await fetchJson(currentUrl, apiKey);
    const pageRecords = findBestRecordArray(payload);
    records.push(...pageRecords);
    pages += 1;
    currentUrl = resolveNextPageUrl(payload, currentUrl);
  }

  return { records, pages };
}

async function fetchLatestObservation(stationId, apiKey) {
  try {
    const payload = await fetchJson(
      `${API_BASE_URL}/opendata/station/${encodeURIComponent(stationId)}/observation`,
      apiKey,
    );
    const records = findBestRecordArray(payload);
    const latest = selectLatestRecord(records) ?? asRecord(payload);

    if (!latest) {
      return {
        status: "empty",
        observedAt: null,
        numericFields: {},
        availableKeys: [],
        raw: payload,
      };
    }

    return {
      status: "available",
      observedAt: findTimestamp(latest),
      numericFields: collectNumericFields(latest),
      availableKeys: Object.keys(latest).sort(),
      raw: latest,
    };
  } catch (error) {
    return {
      status: "error",
      observedAt: null,
      numericFields: {},
      availableKeys: [],
      error: error instanceof Error ? error.message : "Falha desconhecida",
    };
  }
}

function normalizeStation(value) {
  const record = asRecord(value);
  if (!record) return null;

  const location = asRecord(record.location);
  const coordinates = Array.isArray(record.coordinates) ? record.coordinates : null;
  const geometry = asRecord(record.geometry);
  const geometryCoordinates = Array.isArray(geometry?.coordinates)
    ? geometry.coordinates
    : null;

  const id = firstString(record, ["id", "stationId", "stationID", "station_id", "_id"]);
  const latitude = firstNumber(record, ["latitude", "lat"]) ??
    firstNumber(location, ["latitude", "lat"]) ??
    numberAt(coordinates, 1) ??
    numberAt(geometryCoordinates, 1);
  const longitude = firstNumber(record, ["longitude", "lon", "lng"]) ??
    firstNumber(location, ["longitude", "lon", "lng"]) ??
    numberAt(coordinates, 0) ??
    numberAt(geometryCoordinates, 0);

  if (!id || latitude === null || longitude === null) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;

  return {
    id,
    name:
      firstString(record, ["name", "stationName", "title", "displayName"]) ??
      `Estação ${id}`,
    latitude,
    longitude,
    elevation:
      firstNumber(record, ["elevation", "altitude", "height"]) ??
      firstNumber(location, ["elevation", "altitude", "height"]),
    operator: extractLabel(record.operator ?? record.owner ?? record.organization),
    license: extractLabel(record.license ?? record.licence),
    raw: record,
  };
}

function findBestRecordArray(payload) {
  const candidates = [];

  function visit(value, depth = 0) {
    if (depth > 7) return;

    if (Array.isArray(value)) {
      const records = value.map(asRecord).filter(Boolean);
      if (records.length > 0) candidates.push(records);
      for (const item of value) visit(item, depth + 1);
      return;
    }

    const record = asRecord(value);
    if (!record) return;
    for (const child of Object.values(record)) visit(child, depth + 1);
  }

  visit(payload);

  return candidates.sort((left, right) => scoreRecordArray(right) - scoreRecordArray(left))[0] ?? [];
}

function scoreRecordArray(records) {
  const sample = records.slice(0, 12);
  return records.length + sample.reduce((score, record) => {
    const keys = Object.keys(record).map((key) => key.toLowerCase());
    const coordinateBonus = keys.some((key) => ["lat", "latitude"].includes(key)) ? 20 : 0;
    const longitudeBonus = keys.some((key) => ["lon", "lng", "longitude"].includes(key)) ? 20 : 0;
    const idBonus = keys.some((key) => key === "id" || key.includes("station")) ? 10 : 0;
    const timestampBonus = keys.some((key) => key.includes("time") || key === "ts") ? 6 : 0;
    return score + coordinateBonus + longitudeBonus + idBonus + timestampBonus;
  }, 0);
}

function resolveNextPageUrl(payload, currentUrl) {
  const root = asRecord(payload);
  if (!root) return null;

  const pagination =
    asRecord(root.pagination) ?? asRecord(root.meta) ?? asRecord(root.pageInfo) ?? root;
  const links = asRecord(root.links) ?? asRecord(pagination.links);
  const explicitNext =
    firstString(pagination, ["next", "nextUrl", "nextPageUrl", "next_page_url"]) ??
    firstString(links, ["next"]);

  if (explicitNext) {
    try {
      return new URL(explicitNext, API_BASE_URL).toString();
    } catch {
      return null;
    }
  }

  const page = firstNumber(pagination, ["page", "currentPage", "current_page"]);
  const totalPages = firstNumber(pagination, ["totalPages", "lastPage", "last_page"]);

  if (page !== null && totalPages !== null && page < totalPages) {
    const nextUrl = new URL(currentUrl);
    nextUrl.searchParams.set("page", String(page + 1));
    return nextUrl.toString();
  }

  const offset = firstNumber(pagination, ["offset", "skip"]);
  const limit = firstNumber(pagination, ["limit", "pageSize", "page_size"]);
  const total = firstNumber(pagination, ["total", "count"]);

  if (offset !== null && limit !== null && total !== null && offset + limit < total) {
    const nextUrl = new URL(currentUrl);
    nextUrl.searchParams.set("offset", String(offset + limit));
    nextUrl.searchParams.set("limit", String(limit));
    return nextUrl.toString();
  }

  return null;
}

function selectLatestRecord(records) {
  if (records.length === 0) return null;

  return [...records].sort((left, right) => {
    const leftTime = timestampToEpoch(findTimestamp(left));
    const rightTime = timestampToEpoch(findTimestamp(right));
    return rightTime - leftTime;
  })[0];
}

function findTimestamp(record) {
  const raw =
    firstString(record, [
      "timestamp",
      "observedAt",
      "observationTime",
      "datetime",
      "dateTime",
      "createdAt",
      "updatedAt",
      "time",
    ]) ?? firstNumber(record, ["ts", "timestamp"]);

  if (raw === null) return null;
  if (typeof raw === "number") {
    const epoch = raw < 10_000_000_000 ? raw * 1000 : raw;
    return new Date(epoch).toISOString();
  }

  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : raw;
}

function collectNumericFields(record, prefix = "", output = {}, depth = 0) {
  if (depth > 3) return output;

  for (const [key, value] of Object.entries(record)) {
    const field = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "number" && Number.isFinite(value)) {
      output[field] = value;
      continue;
    }

    const child = asRecord(value);
    if (child) collectNumericFields(child, field, output, depth + 1);
  }

  return output;
}

function printStationTable(stations) {
  if (stations.length === 0) {
    console.log("Nenhuma estação próxima foi encontrada no recorte consultado.");
    return;
  }

  const rows = stations.map((station) => ({
    Distância: `${station.distanceKm.toFixed(1)} km`,
    Estação: station.name,
    ID: station.id,
    Atualização: station.observation.observedAt ?? station.observation.status,
    Campos: Object.keys(station.observation.numericFields).slice(0, 8).join(", ") || "—",
  }));

  console.table(rows);
}

function haversineDistanceKm(latitudeA, longitudeA, latitudeB, longitudeB) {
  const earthRadiusKm = 6371;
  const toRadians = (value) => (value * Math.PI) / 180;
  const latitudeDelta = toRadians(latitudeB - latitudeA);
  const longitudeDelta = toRadians(longitudeB - longitudeA);
  const startLatitude = toRadians(latitudeA);
  const endLatitude = toRadians(latitudeB);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(startLatitude) * Math.cos(endLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function firstString(record, keys) {
  if (!record) return null;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }

  return null;
}

function firstNumber(record, keys) {
  if (!record) return null;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value.replace(",", "."));
      if (Number.isFinite(parsed)) return parsed;
    }
  }

  return null;
}

function numberAt(values, index) {
  if (!values || values.length <= index) return null;
  const value = values[index];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function extractLabel(value) {
  if (typeof value === "string" && value.trim()) return value.trim();
  const record = asRecord(value);
  return record
    ? firstString(record, ["name", "title", "label", "operatorName", "organizationName"])
    : null;
}

function timestampToEpoch(value) {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
