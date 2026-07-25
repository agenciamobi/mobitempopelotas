import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const homeRoute = readFileSync("src/routes/index.tsx", "utf8");
const productionHome = readFileSync("src/production/ProductionHome.tsx", "utf8");
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

test("only a live Laranjal stream with a secure thumbnail replaces the hero photo", () => {
  assert.match(productionHome, /item\.id === "laranjal"/);
  assert.match(productionHome, /camera\.status !== "online"/);
  assert.match(productionHome, /camera\.broadcastStatus !== "live"/);
  assert.match(productionHome, /!camera\.thumbnailUrl/);
  assert.match(productionHome, /previewUrl\.protocol !== "https:"/);
  assert.match(productionHome, /--home-live-camera-image/);
  assert.match(productionHome, /home-hero-camera-shell\$\{liveLaranjalCamera/);
});

test("live camera source remains identified and links to the camera page", () => {
  assert.match(productionHome, /Câmera do Laranjal ao vivo/);
  assert.match(productionHome, /Imagem atual da transmissão/);
  assert.match(productionHome, /to="\/cameras-ao-vivo-pelotas"/);
  assert.match(productionHome, /aria-label="Abrir a câmera ao vivo da Praia do Laranjal"/);
});

test("camera background is responsive and preserves the editorial fallback", () => {
  assert.match(cameraStyles, /var\(--home-live-camera-image\)/);
  assert.match(cameraStyles, /image-set\(/);
  assert.match(cameraStyles, /background-size:\s*cover, cover/);
  assert.match(cameraStyles, /\.weather-hero-credit\s*\{[\s\S]*display:\s*none/);
  assert.match(cameraStyles, /@media \(max-width: 900px\)/);
  assert.match(cameraStyles, /@media \(max-width: 620px\)/);
  assert.match(cameraStyles, /\.home-hero-camera-source/);
});

test("live camera layer is loaded after the existing homepage refinements", () => {
  const tsSemantic = styleImports.indexOf("home-water-semantic-v53.css");
  const tsCamera = styleImports.indexOf("home-hero-live-camera-v54.css");
  const cssSemantic = globalStyles.indexOf("home-water-semantic-v53.css");
  const cssCamera = globalStyles.indexOf("home-hero-live-camera-v54.css");

  assert.ok(tsSemantic >= 0 && tsCamera > tsSemantic);
  assert.ok(cssSemantic >= 0 && cssCamera > cssSemantic);
});
