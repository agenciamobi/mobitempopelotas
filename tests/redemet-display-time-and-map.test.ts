import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  formatRedemetDateTime,
  getRedemetFreshness,
  latestReportedRedemetFrameTime,
  latestUsableRedemetFrameTime,
} from "../src/lib/redemet/redemet-display-time.ts";

const radarMap = readFileSync("src/components/redemet/RadarMapFrame.tsx", "utf8");
const radarMapStyles = readFileSync("src/components/redemet/RadarMapFrame.module.css", "utf8");
const overview = readFileSync("src/components/redemet/RedemetOverview.tsx", "utf8");
const stscServer = readFileSync("src/lib/redemet/redemet-stsc.server.ts", "utf8");

test("future REDEMET timestamps cannot become the overview latest image", () => {
  const now = Date.parse("2026-08-21T07:20:00Z");
  const valid = "2026-08-21T07:06:00Z";
  const impossibleFuture = "2026-08-21T10:03:00Z";

  assert.equal(
    latestUsableRedemetFrameTime(
      [{ observedAt: valid }, { observedAt: impossibleFuture }],
      now,
    ),
    valid,
  );
  assert.equal(
    latestReportedRedemetFrameTime([{ observedAt: valid }, { observedAt: impossibleFuture }]),
    impossibleFuture,
  );
  assert.match(formatRedemetDateTime(valid, now), /21\/08.*04:06/);
  assert.equal(formatRedemetDateTime(impossibleFuture, now), "Horário da fonte em verificação");
  assert.deepEqual(getRedemetFreshness(impossibleFuture, now), {
    tone: "unknown",
    label: "Horário da fonte em verificação",
    relative: "Aguardando confirmação do horário informado pela fonte",
  });
});

test("STSC no-zone timestamps keep the REDEMET UTC reference", () => {
  assert.match(stscServer, /A REDEMET\/TSC usa referência UTC/);
  assert.match(stscServer, /`\$\{normalized\}Z`/);
  assert.doesNotMatch(stscServer, /`\$\{normalized\}-03:00`/);
});

test("radar frames are georeferenced over the existing MapLibre base", () => {
  assert.match(overview, /<RadarMapFrame/);
  assert.match(overview, /kind === "radar"/);
  assert.match(radarMap, /import\("maplibre-gl"\)/);
  assert.match(radarMap, /tiles\.openfreemap\.org\/styles\/liberty/);
  assert.match(radarMap, /type:\s*"image"/);
  assert.match(radarMap, /\[bounds\.west, bounds\.north\]/);
  assert.match(radarMap, /\[bounds\.east, bounds\.north\]/);
  assert.match(radarMap, /\[bounds\.east, bounds\.south\]/);
  assert.match(radarMap, /\[bounds\.west, bounds\.south\]/);
  assert.match(radarMap, /"raster-opacity":\s*0\.58/);
  assert.match(radarMap, /PELOTAS_COORDINATES/);
  assert.match(radarMap, /failed \? \([\s\S]*className=\{styles\.rawFallback\}/);
  assert.match(radarMap, /role="region"/);
  assert.doesNotMatch(radarMap, /role="img"/);
  assert.match(radarMapStyles, /\.rawFallback/);
  assert.match(radarMap, /Base cartográfica indisponível/);
});
