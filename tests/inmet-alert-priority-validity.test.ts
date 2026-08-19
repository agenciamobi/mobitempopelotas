import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const panel = readFileSync("src/production/components/inmet-alerts-panel.tsx", "utf8");
const source = readFileSync("src/lib/weather/inmet.server.ts", "utf8");
const homeStyles = readFileSync("src/production/components/inmet-alerts-home.css", "utf8");

test("home INMET panel prioritizes active Pelotas alerts by severity", () => {
  assert.match(panel, /const severityRank: Record<InmetAlert\["severity"\], number>/);
  assert.match(panel, /const relevanceRank: Record<InmetAlert\["relevance"\], number>/);
  assert.match(panel, /const periodRank: Record<InmetAlert\["period"\], number>/);
  assert.match(panel, /periodDifference = periodRank\[first\.period\] - periodRank\[second\.period\]/);
  assert.match(panel, /severityDifference = severityRank\[second\.severity\] - severityRank\[first\.severity\]/);
  assert.match(panel, /const primary = primaryHomeAlert\(data\)/);
  assert.match(panel, /data-alert-period=\{primary\.period\}/);
  assert.match(panel, /data-alert-severity=\{primary\.severity\}/);
});

test("validity label never concatenates an absent start time", () => {
  assert.match(panel, /if \(end\) return `Em vigor até \$\{end\}`/);
  assert.match(panel, /if \(start\) return `Em vigor desde \$\{start\}`/);
  assert.match(panel, /return "Em vigor — horário não informado pelo INMET"/);
  assert.doesNotMatch(panel, /if \(!alert\.expiresAt\)[\s\S]*`Em vigor desde \$\{start\}`/);
});

test("INMET municipal parser accepts current date and severity field variants", () => {
  for (const alias of [
    "dtInicio",
    "dataHoraInicio",
    "inicioVigencia",
    "dtFim",
    "dataHoraFim",
    "fimVigencia",
    "corAviso",
    "nivelAviso",
  ]) {
    assert.match(source, new RegExp(`"${alias}"`));
  }

  assert.match(source, /\^\\d\{10\}\$/);
  assert.match(source, /\^\\d\{13\}\$/);
  assert.match(source, /compact === "3"/);
  assert.match(source, /compact === "2"/);
  assert.match(source, /compact === "1"/);
  assert.match(source, /ff0000/);
  assert.match(source, /ff8c00/);
  assert.match(source, /ffff00/);
});

test("normalized alert list keeps active severe notices first inside each area", () => {
  assert.match(source, /const periodRank = \{ active: 0, upcoming: 1 \}/);
  assert.match(source, /const severityRank: Record<InmetAlertSeverity, number>/);
  assert.match(source, /periodDifference = periodRank\[first\.period\] - periodRank\[second\.period\]/);
  assert.match(source, /severityDifference = severityRank\[second\.severity\] - severityRank\[first\.severity\]/);
});

test("home alert semantic colors remain tied to verified severity", () => {
  assert.match(homeStyles, /\.tp-home-alert\.is-officially-classified\.severity-potential[\s\S]*--risk:\s*#d6ae00/);
  assert.match(homeStyles, /\.tp-home-alert\.is-officially-classified\.severity-danger[\s\S]*--risk:\s*#ef7d2f/);
  assert.match(homeStyles, /\.tp-home-alert\.is-officially-classified\.severity-great-danger[\s\S]*--risk:\s*#d93636/);
  assert.match(homeStyles, /\.tp-home-alert__topline span[\s\S]*var\(--risk\)/);
});
