import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { parseRadarPayloadForArea } from "../src/lib/redemet/redemet-radar.server.ts";
import { parseRedemetStscPayload } from "../src/lib/redemet/redemet-stsc.server.ts";

const radarRoute = readFileSync("src/routes/api/redemet/radar.ts", "utf8");
const satelliteRoute = readFileSync("src/routes/api/redemet/satellite.ts", "utf8");
const stormsRoute = readFileSync("src/routes/api/redemet/storms.ts", "utf8");
const radarServer = readFileSync("src/lib/redemet/redemet-radar.server.ts", "utf8");
const redemetFunctions = readFileSync("src/lib/redemet/redemet.functions.ts", "utf8");
const radarPage = readFileSync("src/routes/radar-e-satelite-pelotas.tsx", "utf8");
const envExample = readFileSync(".env.example", "utf8");
const cssEntry = readFileSync("src/production/production-styles.css", "utf8");
const radarEditorialCss = readFileSync(
  "src/production/styles/home-radar-editorial-v45.css",
  "utf8",
);
const radarCohesionCss = readFileSync(
  "src/production/styles/home-radar-embrapa-cohesion-v46.css",
  "utf8",
);
const radarUsabilityCss = readFileSync(
  "src/production/styles/home-weekly-radar-usability-v47.css",
  "utf8",
);
const weeklyPortal = readFileSync(
  "src/production/components/home-trend-editorial-portal.tsx",
  "utf8",
);

test("REDEMET limits animation payloads", () => {
  assert.match(radarRoute, /const MAX_FRAMES = 8;/);
  assert.match(satelliteRoute, /const MAX_FRAMES = 8;/);
  assert.match(stormsRoute, /const MAX_FRAMES = 12;/);
  assert.match(radarRoute, /Math\.min\(MAX_FRAMES/);
  assert.match(satelliteRoute, /Math\.min\(MAX_FRAMES/);
  assert.match(stormsRoute, /Math\.min\(MAX_FRAMES/);
});

test("radar parser keeps only the requested station from the official response shape", () => {
  const payload = {
    status: true,
    data: {
      tipo: "maxcappi",
      radar: [
        [
          {
            localidade: "sg",
            lon_min: "-59.1897",
            lon_max: "-50.839",
            lat_min: "-32.809304",
            lat_max: "-25.5734",
            path:
              "https://estatico-redemet.decea.mil.br/radar/2026/08/18/sg/maxcappi/maps/santiago.png",
            data: "2026-08-18 00:56:39",
          },
          {
            localidade: "cn",
            lon_min: "-57.0713",
            lon_max: "-48.32162",
            lat_min: "-34.988056",
            lat_max: "-27.7468",
            path: null,
            data: null,
          },
        ],
      ],
    },
  };

  const cangucu = parseRadarPayloadForArea(payload, "cn", 8);
  const santiago = parseRadarPayloadForArea(payload, "sg", 8);

  assert.equal(cangucu.matchingRecords, 1);
  assert.equal(cangucu.recordsWithPath, 0);
  assert.equal(cangucu.frames.length, 0);

  assert.equal(santiago.matchingRecords, 1);
  assert.equal(santiago.recordsWithPath, 1);
  assert.equal(santiago.frames.length, 1);
  assert.match(santiago.frames[0].imageUrl, /sg%2Fmaxcappi/);
  assert.equal(santiago.frames[0].bounds.west, -59.1897);
  assert.equal(santiago.frames[0].bounds.east, -50.839);
  assert.equal(santiago.frames[0].bounds.south, -32.809304);
  assert.equal(santiago.frames[0].bounds.north, -25.5734);
});

test("radar request follows the HAR contract and keeps Santiago as operational fallback", () => {
  assert.match(radarServer, /const DEFAULT_RADAR_AREA = "sg";/);
  assert.match(radarServer, /const FALLBACK_RADAR_AREAS = \["sg", "cn"\]/);
  assert.doesNotMatch(radarServer, /searchParams\.set\("area"/);
  assert.match(radarServer, /searchParams\.set\("anima", String\(frameCount\)\)/);
  assert.match(radarServer, /searchParams\.set\("api_key", key\)/);
  assert.match(radarServer, /boundsContainPoint\(frame\.bounds, PELOTAS_COORDINATES\)/);
  assert.match(envExample, /^REDEMET_RADAR_AREA=sg$/m);
  assert.match(radarPage, /Radar meteorológico de Santiago com cobertura sobre Pelotas/);
  assert.doesNotMatch(radarPage, /"Radar meteorológico de Canguçu"/);
});

test("STSC parser accepts the response shape observed in the REDEMET HAR", () => {
  const payload = {
    status: true,
    message: 200,
    data: [
      {
        cor: "#ff0000",
        start: "2026-08-17 23:49",
        stop: "2026-08-18 00:04",
        horario: "2026-08-17 23:50:59",
        ultima_ocorrencia: "2026-08-17 23:50:59",
        pontos: [
          { la: "-31.75", lo: "-52.35" },
          { la: "-10.00", lo: "-40.00" },
        ],
      },
    ],
  };

  const frames = parseRedemetStscPayload(payload);

  assert.equal(frames.length, 1);
  assert.equal(frames[0].points.length, 1);
  assert.equal(frames[0].points[0].latitude, -31.75);
  assert.equal(frames[0].points[0].longitude, -52.35);
  assert.equal(frames[0].observedAt, "2026-08-18T02:50:59.000Z");
  assert.match(stormsRoute, /redemet-stsc\.server/);
  assert.match(redemetFunctions, /fetchRedemetStorms.*redemet-stsc\.server/s);
  assert.doesNotMatch(
    redemetFunctions,
    /fetchRedemetSatellite\s*,\s*fetchRedemetStorms\s*}\s*from\s*"\.\/redemet\.server"/,
  );
});

test("radar editorial section skips offscreen rendering", () => {
  assert.match(cssEntry, /home-radar-editorial-v45\.css/);
  assert.match(cssEntry, /home-radar-embrapa-cohesion-v46\.css/);
  assert.match(cssEntry, /home-weekly-radar-usability-v47\.css/);
  assert.match(radarEditorialCss, /content-visibility:\s*auto/);
  assert.match(radarEditorialCss, /contain-intrinsic-size:/);
  assert.match(radarCohesionCss, /contain:\s*layout paint style/);
});

test("radar final layers reduce expensive effects and preserve map gestures", () => {
  assert.match(radarCohesionCss, /backdrop-filter:\s*none\s*!important/);
  assert.match(radarCohesionCss, /grid-template-columns:\s*minmax\(300px, 0\.58fr\)/);
  assert.match(radarUsabilityCss, /\.radar-player\s*\{[\s\S]*pointer-events:\s*none/);
  assert.match(radarUsabilityCss, /map-canvas--satellite[\s\S]*width:\s*min\(680px/);
  assert.match(radarUsabilityCss, /maplibregl-ctrl-bottom-right[\s\S]*top:\s*82px/);
});

test("weekly cards receive adaptive summaries for all visible days", () => {
  assert.match(weeklyPortal, /weather\.daily\.slice\(1, 5\)/);
  assert.match(weeklyPortal, /home-next-days__day-summary/);
  assert.match(radarUsabilityCss, /home-next-days__day-summary/);
});
