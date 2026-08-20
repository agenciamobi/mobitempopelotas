import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const footerSource = readFileSync("src/components/layout/Footer.tsx", "utf8");
const stripSource = readFileSync("src/components/layout/EmergencyFooterStrip.tsx", "utf8");
const stripCss = readFileSync("src/components/layout/EmergencyFooterStrip.css", "utf8");

test("the public-service strip is rendered before both footer variants", () => {
  assert.match(footerSource, /import \{ EmergencyFooterStrip \}/);
  assert.equal((footerSource.match(/<EmergencyFooterStrip \/>/g) ?? []).length, 2);
  assert.match(footerSource, /<EmergencyFooterStrip \/>\s*<footer className="tp-home-footer-shell">/);
  assert.match(footerSource, /<EmergencyFooterStrip \/>\s*<footer className="editorial-footer-shell">/);
});

test("the strip publishes emergency phones and the official Civil Defense SMS signup", () => {
  for (const phone of ["190", "192", "193"]) {
    assert.match(stripSource, new RegExp(`number: "${phone}"`));
  }

  assert.match(stripSource, /sms:40199/);
  assert.match(stripSource, /Defesa Civil RS/);
  assert.match(stripSource, /defesacivil\.rs\.gov\.br/);
  assert.match(stripSource, /CEP/);
});

test("the strip keeps the RS Civil Defense reference palette and responsive two-column layout", () => {
  assert.match(stripCss, /--tp-public-service-blue:\s*#00167b/);
  assert.match(stripCss, /--tp-public-service-orange:\s*#ef6213/);
  assert.match(stripCss, /grid-template-columns:\s*minmax\(0, 1fr\) minmax\(0, 1fr\)/);
  assert.match(stripCss, /@media \(max-width: 940px\)[\s\S]*grid-template-columns:\s*1fr/);
  assert.doesNotMatch(stripCss, /!important/);
});
