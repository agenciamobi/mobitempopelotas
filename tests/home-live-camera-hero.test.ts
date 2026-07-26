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

test("a secure live Laranjal embed reaches the hero without requiring a thumbnail", () => {
  assert.match(productionHome, /item\.id === "laranjal"/);
  assert.match(productionHome, /camera\.status !== "online"/);
  assert.match(productionHome, /camera\.broadcastStatus !== "live"/);
  assert.match(productionHome, /!camera\.embedUrl/);
  assert.doesNotMatch(productionHome, /!camera\.thumbnailUrl/);
  assert.doesNotMatch(productionHome, /previewUrl/);
  assert.doesNotMatch(productionHome, /--home-live-camera-image/);
  assert.match(productionHome, /HomeLiveCameraBackground/);
  assert.match(productionHome, /embedUrl=\{liveLaranjalCamera\.embedUrl\}/);
});

test("live player is silent, immediate, retryable and non-interactive", () => {
  assert.match(liveBackground, /autoplay", "1"/);
  assert.match(liveBackground, /mute", "1"/);
  assert.match(liveBackground, /controls", "0"/);
  assert.match(liveBackground, /playsinline", "1"/);
  assert.match(liveBackground, /disablekb", "1"/);
  assert.match(liveBackground, /MAX_RELOAD_ATTEMPTS\s*=\s*2/);
  assert.match(liveBackground, /PLAYER_RETRY_DELAY_MS\s*=\s*9_000/);
  assert.match(liveBackground, /setAttempt\(\(current\) => Math\.min\(current \+ 1/);
  assert.match(liveBackground, /loading="eager"/);
  assert.match(liveBackground, /onError=\{retryPlayer\}/);
  assert.doesNotMatch(liveBackground, /setShouldLoad/);
  assert.doesNotMatch(liveBackground, /prefers-reduced-motion: reduce/);
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

test("camera has no visual fallback and keeps native 16:9 geometry", () => {
  assert.doesNotMatch(cameraStyles, /--home-live-camera-image/);
  assert.doesNotMatch(cameraStyles, /image-set\(/);
  assert.match(cameraStyles, /\.has-live-camera \.weather-hero-photo\s*\{[\s\S]*background:\s*transparent/);
  assert.match(cameraStyles, /\.has-live-camera \.weather-hero-photo\s*\{[\s\S]*opacity:\s*0/);
  assert.match(cameraStyles, /\.weather-hero-live-camera\s*\{[\s\S]*background:\s*transparent/);
  assert.match(cameraStyles, /\.has-live-camera \.weather-hero-overlay\s*\{[\s\S]*background:\s*transparent/);
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
  assert.match(cameraStyles, /overflow:\s*hidden/);
  assert.match(cameraStyles, /opacity:\s*0/);
  assert.match(cameraStyles, /\.is-ready iframe\s*\{[\s\S]*opacity:\s*1/);
  assert.match(cameraStyles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*display:\s*block/);
});

test("transparent media layers and live iframe share the same responsive box", () => {
  assert.match(
    exactGeometryStyles,
    /\.weather-hero-photo,\s*[\s\S]*\.weather-hero-overlay,\s*[\s\S]*\.weather-hero-live-camera\s*\{[\s\S]*width:\s*44\.5%[\s\S]*aspect-ratio:\s*16\s*\/\s*9[\s\S]*translateY\(-50%\)/,
  );
  assert.match(
    exactGeometryStyles,
    /@media \(max-width:\s*900px\)[\s\S]*\.weather-hero-photo,[\s\S]*\.weather-hero-overlay,[\s\S]*\.weather-hero-live-camera[\s\S]*left:\s*8px[\s\S]*aspect-ratio:\s*16\s*\/\s*9/,
  );
  assert.match(
    exactGeometryStyles,
    /@media \(max-width:\s*620px\)[\s\S]*\.weather-hero-photo,[\s\S]*\.weather-hero-overlay,[\s\S]*\.weather-hero-live-camera[\s\S]*left:\s*6px/,
  );
});

test("weather card and camera source receive restrained final polish", () => {
  assert.match(
    exactGeometryStyles,
    /\.has-live-camera \.weather-hero-now\s*\{[\s\S]*translateX\(clamp\(10px, 1vw, 18px\)\)/,
  );
  assert.match(exactGeometryStyles, /box-shadow:\s*0 12px 30px rgb\(7 30 47 \/ 15%\)/);
  assert.match(exactGeometryStyles, /backdrop-filter:\s*blur\(10px\) saturate\(116%\)/);
  assert.match(
    exactGeometryStyles,
    /\.has-live-camera \.home-hero-camera-source\s*\{[\s\S]*background:\s*rgb\(5 28 43 \/ 72%\)/,
  );
  assert.match(
    exactGeometryStyles,
    /@media \(max-width:\s*900px\)[\s\S]*\.has-live-camera \.weather-hero-now\s*\{[\s\S]*transform:\s*none/,
  );
  assert.match(exactGeometryStyles, /prefers-reduced-transparency:\s*reduce/);
});

test("short desktop viewports receive a compact PWA launcher", () => {
  assert.match(exactGeometryStyles, /@media \(min-width:\s*901px\) and \(max-height:\s*900px\)/);
  assert.match(exactGeometryStyles, /\.pwa-launcher\s*\{[\s\S]*min-height:\s*2\.35rem/);
  assert.match(exactGeometryStyles, /font-size:\s*0\.68rem/);
  assert.match(exactGeometryStyles, /\.pwa-launcher > span\s*\{[\s\S]*width:\s*1\.65rem/);
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
