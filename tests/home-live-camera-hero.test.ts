import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const homeRoute = readFileSync("src/routes/index.tsx", "utf8");
const productionHome = readFileSync("src/production/ProductionHome.tsx", "utf8");
const weatherHero = readFileSync("src/production/components/weather-hero.tsx", "utf8");
const liveBackground = readFileSync(
  "src/production/components/home-live-camera-background.tsx",
  "utf8",
);
const cameraStyles = readFileSync(
  "src/production/styles/home-hero-live-camera-v54.css",
  "utf8",
);
const styleImports = readFileSync("src/production/production-styles.ts", "utf8");
const globalStyles = readFileSync("src/production/production-styles.css", "utf8");

test("homepage loads camera data together with weather and hydrology", () => {
  assert.match(homeRoute, /getWeatherCameras/);
  assert.match(homeRoute, /weather, laranjal, guaiba, lagoon, cameraData/);
  assert.match(homeRoute, /cameraData=\{cameraData\}/);
});

test("only a live Laranjal stream with secure preview and embed URLs reaches the hero", () => {
  assert.match(productionHome, /item\.id === "laranjal"/);
  assert.match(productionHome, /camera\.status !== "online"/);
  assert.match(productionHome, /camera\.broadcastStatus !== "live"/);
  assert.match(productionHome, /!camera\.embedUrl/);
  assert.match(productionHome, /!camera\.thumbnailUrl/);
  assert.match(productionHome, /previewUrl\.protocol !== "https:"/);
  assert.match(productionHome, /--home-live-camera-image/);
  assert.match(productionHome, /HomeLiveCameraBackground/);
  assert.match(productionHome, /embedUrl=\{liveLaranjalCamera\.embedUrl\}/);
});

test("live player is silent, control-free, deferred and non-interactive", () => {
  assert.match(liveBackground, /autoplay", "1"/);
  assert.match(liveBackground, /mute", "1"/);
  assert.match(liveBackground, /controls", "0"/);
  assert.match(liveBackground, /playsinline", "1"/);
  assert.match(liveBackground, /disablekb", "1"/);
  assert.match(liveBackground, /window\.setTimeout\(\(\) => setShouldLoad\(true\), 700\)/);
  assert.match(liveBackground, /prefers-reduced-motion: reduce/);
  assert.match(liveBackground, /tabIndex=\{-1\}/);
  assert.match(liveBackground, /aria-hidden="true"/);
  assert.match(weatherHero, /\{liveCameraBackground\}/);
});

test("live camera source remains identified and links to the camera page", () => {
  assert.match(productionHome, /Câmera do Laranjal ao vivo/);
  assert.match(productionHome, /Céu e clima em tempo real/);
  assert.match(productionHome, /to="\/cameras-ao-vivo-pelotas"/);
  assert.match(productionHome, /aria-label="Abrir a câmera ao vivo da Praia do Laranjal"/);
});

test("camera video is responsive and preserves thumbnail and editorial fallbacks", () => {
  assert.match(cameraStyles, /var\(--home-live-camera-image\)/);
  assert.match(cameraStyles, /image-set\(/);
  assert.match(cameraStyles, /\.weather-hero-live-camera/);
  assert.match(cameraStyles, /\.weather-hero-live-camera iframe/);
  assert.match(cameraStyles, /scale\(1\.46\)/);
  assert.match(cameraStyles, /opacity:\s*0/);
  assert.match(cameraStyles, /\.is-ready iframe\s*\{[\s\S]*opacity:\s*1/);
  assert.match(cameraStyles, /\.weather-hero-credit\s*\{[\s\S]*display:\s*none/);
  assert.match(cameraStyles, /@media \(max-width: 900px\)/);
  assert.match(cameraStyles, /@media \(max-width: 620px\)/);
  assert.match(cameraStyles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("live camera layer is loaded after the existing homepage refinements", () => {
  const tsSemantic = styleImports.indexOf("home-water-semantic-v53.css");
  const tsCamera = styleImports.indexOf("home-hero-live-camera-v54.css");
  const cssSemantic = globalStyles.indexOf("home-water-semantic-v53.css");
  const cssCamera = globalStyles.indexOf("home-hero-live-camera-v54.css");

  assert.ok(tsSemantic >= 0 && tsCamera > tsSemantic);
  assert.ok(cssSemantic >= 0 && cssCamera > cssSemantic);
});
