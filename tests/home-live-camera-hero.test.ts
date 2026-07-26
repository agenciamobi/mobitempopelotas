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
const proportionalStyles = readFileSync(
  "src/production/styles/home-hero-proportional-v62.css",
  "utf8",
);
const nativeScaleStyles = readFileSync(
  "src/production/styles/home-live-camera-native-scale-v63.css",
  "utf8",
);
const exactGeometryStyles = readFileSync(
  "src/production/styles/home-live-camera-exact-geometry-v64.css",
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

test("camera uses native scale and exact 16:9 iframe geometry", () => {
  assert.match(cameraStyles, /var\(--home-live-camera-image\)/);
  assert.match(cameraStyles, /image-set\(/);
  assert.match(cameraStyles, /\.weather-hero-live-camera/);
  assert.match(cameraStyles, /scale\(var\(--home-live-camera-crop\)\)/);
  assert.match(proportionalStyles, /aspect-ratio:\s*16\s*\/\s*9/);
  assert.match(nativeScaleStyles, /--home-live-camera-crop:\s*1\s*;/);
  assert.match(exactGeometryStyles, /\.weather-hero-live-camera iframe/);
  assert.match(exactGeometryStyles, /inset:\s*0/);
  assert.match(exactGeometryStyles, /width:\s*100%/);
  assert.match(exactGeometryStyles, /height:\s*100%/);
  assert.match(exactGeometryStyles, /min-width:\s*0/);
  assert.match(exactGeometryStyles, /min-height:\s*0/);
  assert.match(exactGeometryStyles, /aspect-ratio:\s*16\s*\/\s*9/);
  assert.match(exactGeometryStyles, /transform:\s*none/);
  assert.match(exactGeometryStyles, /@media \(min-width:\s*1181px\)[\s\S]*top:\s*50%[\s\S]*translateY\(-50%\)/);
  assert.match(cameraStyles, /overflow:\s*hidden/);
  assert.match(cameraStyles, /opacity:\s*0/);
  assert.match(cameraStyles, /\.is-ready iframe\s*\{[\s\S]*opacity:\s*1/);
  assert.match(cameraStyles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("weather card and camera source receive restrained final polish", () => {
  assert.match(exactGeometryStyles, /\.weather-hero-now\s*\{[\s\S]*translateX\(clamp\(10px, 1vw, 18px\)\)/);
  assert.match(exactGeometryStyles, /box-shadow:\s*0 12px 30px rgb\(7 30 47 \/ 15%\)/);
  assert.match(exactGeometryStyles, /backdrop-filter:\s*blur\(10px\) saturate\(116%\)/);
  assert.match(exactGeometryStyles, /\.home-hero-camera-source\s*\{[\s\S]*background:\s*rgb\(5 28 43 \/ 72%\)/);
  assert.match(exactGeometryStyles, /@media \(max-width:\s*900px\)[\s\S]*\.weather-hero-now\s*\{[\s\S]*transform:\s*none/);
  assert.match(exactGeometryStyles, /prefers-reduced-transparency:\s*reduce/);
});

test("exact geometry is loaded after scale and proportional refinements", () => {
  const tsCamera = styleImports.indexOf("home-hero-live-camera-v54.css");
  const tsProportional = styleImports.indexOf("home-hero-proportional-v62.css");
  const tsNative = styleImports.indexOf("home-live-camera-native-scale-v63.css");
  const tsGeometry = styleImports.indexOf("home-live-camera-exact-geometry-v64.css");
  const cssCamera = globalStyles.indexOf("home-hero-live-camera-v54.css");
  const cssProportional = globalStyles.indexOf("home-hero-proportional-v62.css");
  const cssNative = globalStyles.indexOf("home-live-camera-native-scale-v63.css");
  const cssGeometry = globalStyles.indexOf("home-live-camera-exact-geometry-v64.css");

  assert.ok(
    tsCamera >= 0 && tsProportional > tsCamera && tsNative > tsProportional && tsGeometry > tsNative,
  );
  assert.ok(
    cssCamera >= 0 &&
      cssProportional > cssCamera &&
      cssNative > cssProportional &&
      cssGeometry > cssNative,
  );
});
