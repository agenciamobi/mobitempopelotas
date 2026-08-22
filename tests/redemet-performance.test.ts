import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { parseRadarPayloadForArea } from "../src/lib/redemet/redemet-radar.server.ts";
import { parseRedemetStscPayload } from "../src/lib/redemet/redemet-stsc.server.ts";

const radarRoute = readFileSync("src/routes/api/redemet/radar.ts", "utf8");
const satelliteRoute = readFileSync("src/routes/api/redemet/satellite.ts", "utf8");
const stormsRoute = readFileSync("src/routes/api/redemet/storms.ts", "utf8");
const radarServer = readFileSync("src/lib/redemet/redemet-radar.server.ts", "utf8");
const stormsServer = readFileSync("src/lib/redemet/redemet-stsc.server.ts", "utf8");
const redemetFunctions = readFileSync("src/lib/redemet/redemet.functions.ts", "utf8");
const radarPage = readFileSync("src/routes/radar-e-satelite-pelotas.tsx", "utf8");
const envExample = readFileSync(".env.example", "utf8");
const cssEntry = readFileSync("src/production/production-styles.css", "utf8");
const radarComponent = readFileSync(
  "src/production/components/home-radar-editorial.tsx",
  "utf8",
);
const radarCss = readFileSync(
  "src/production/components/home-radar-editorial.css",
  "utf8",
);
const weatherMap = readFileSync("src/production/components/weather-map.tsx", "utf8");
const radarMapFrame = readFileSync("src/components/redemet/RadarMapFrame.tsx", "utf8");

test("REDEMET limits animation payloads", () => {
  assert.match(radarRoute, /const MAX_FRAMES = 8;/);
  assert.match(satelliteRoute, /const MAX_FRAMES = 8;/);
  assert.match(stormsRoute, /const MAX_FRAMES = 12;/);
  assert.match(radarRoute, /Math\.min\(MAX_FRAMES/);
  assert.match(satelliteRoute, /Math\.min\(MAX_FRAMES/);
  assert.match(stormsRoute, /Math\.min\(MAX_FRAMES/);
  assert.match(stormsServer, /const DEFAULT_FRAMES = 12;/);
  assert.match(stormsServer, /const MAX_FRAMES = 12;/);
});

test("REDEMET overview requests the same compact windows used by public contracts", () => {
  assert.match(redemetFunctions, /const IMAGE_FRAME_WINDOW = 8;/);
  assert.match(redemetFunctions, /const STORM_FRAME_WINDOW = 12;/);
  assert.match(redemetFunctions, /fetchRedemetRadarResilient\(IMAGE_FRAME_WINDOW\)/);
  assert.match(redemetFunctions, /fetchRedemetSatellite\("realcada", IMAGE_FRAME_WINDOW\)/);
  assert.match(redemetFunctions, /fetchInmetSatellite\(IMAGE_FRAME_WINDOW\)/);
  assert.match(redemetFunctions, /fetchRedemetStorms\(STORM_FRAME_WINDOW\)/);
  assert.doesNotMatch(redemetFunctions, /storms:20/);
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
  assert.equal(frames[0].observedAt, "2026-08-17T23:50:59.000Z");
  assert.match(stormsRoute, /redemet-stsc\.server/);
  assert.match(redemetFunctions, /fetchRedemetStorms.*redemet-stsc\.server/s);
  assert.doesNotMatch(
    redemetFunctions,
    /fetchRedemetSatellite\s*,\s*fetchRedemetStorms\s*}\s*from\s*"\.\/redemet\.server"/,
  );
});

test("STSC requests the animation window upstream instead of slicing a single default frame", () => {
  assert.match(stormsServer, /requestOfficialStsc\(frameCount: number\)/);
  assert.match(stormsServer, /searchParams\.set\("anima", String\(frameCount\)\)/);
  assert.match(stormsServer, /const payload = await requestOfficialStsc\(framesRequested\);/);
  assert.match(
    stormsServer,
    /clampFrameCount\(frameCount, MAX_FRAMES, DEFAULT_FRAMES\)/,
  );
});

test("radar editorial section skips offscreen rendering in its isolated component", () => {
  assert.match(radarComponent, /className="tp-home-radar"/);
  assert.match(radarComponent, /<WeatherMap regionalWeather=\{regionalWeather\} \/>/);
  assert.match(radarCss, /content-visibility:\s*auto/);
  assert.match(radarCss, /contain-intrinsic-size:/);
  assert.doesNotMatch(cssEntry, /home-radar-editorial-v45\.css/);
  assert.doesNotMatch(cssEntry, /home-weekly-radar-usability-v47\.css/);
});

test("radar isolated layer preserves map gestures and compact operational controls", () => {
  assert.match(radarCss, /\.tp-home-radar \.map-canvas\s*\{[\s\S]*cursor:\s*grab/);
  assert.match(radarCss, /\.tp-home-radar \.radar-player\s*\{[\s\S]*pointer-events:\s*none/);
  assert.match(radarCss, /map-canvas--satellite[\s\S]*width:\s*min\(680px/);
  assert.match(radarCss, /maplibregl-ctrl-bottom-right[\s\S]*top:\s*80px/);
  assert.doesNotMatch(radarCss, /!important/);
});

test("radar and satellite maps start roughly three zoom levels wider", () => {
  assert.match(weatherMap, /center: PELOTAS_CENTER,[\s\S]*zoom: 4\.4,[\s\S]*minZoom: 4/);
  assert.doesNotMatch(weatherMap, /zoom: 7\.4/);
  assert.match(radarMapFrame, /fitBoundsOptions: \{ padding: 28, maxZoom: 4\.5 \}/);
  assert.match(radarMapFrame, /\{ padding: 28, maxZoom: 4\.5, duration: 0 \}/);
  assert.doesNotMatch(radarMapFrame, /maxZoom: 7\.5/);
});
