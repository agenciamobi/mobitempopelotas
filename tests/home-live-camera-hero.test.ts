import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const homeRoute = readFileSync("src/routes/index.tsx", "utf8");
const productionHome = readFileSync("src/production/ProductionHome.tsx", "utf8");
const weatherHero = readFileSync("src/production/components/weather-hero.tsx", "utf8");
const heroStyles = readFileSync(
  "src/production/components/weather-hero-direction.css",
  "utf8",
);
const liveBackground = readFileSync(
  "src/production/components/home-live-camera-background.tsx",
  "utf8",
);

test("homepage does not block SSR on camera discovery", () => {
  assert.doesNotMatch(homeRoute, /getWeatherCameras/);
  assert.doesNotMatch(homeRoute, /cameraData/);
  assert.match(homeRoute, /weather, laranjal, guaiba, lagoon/);
  assert.match(productionHome, /getWeatherCameras/);
  assert.match(productionHome, /useEffect/);
  assert.match(productionHome, /useState<WeatherCameraData \| null>\(null\)/);
  assert.match(productionHome, /getWeatherCameras\(\)/);
  assert.match(productionHome, /setCameraData\(nextCameraData\)/);
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

test("camera discovery failure preserves the normal weather hero", () => {
  assert.match(productionHome, /\.catch\(\(\) => \{/);
  assert.match(productionHome, /cameraData \? getLiveLaranjalCamera\(cameraData\) : null/);
  assert.match(productionHome, /liveCameraBackground=/);
  assert.match(productionHome, /liveLaranjalCamera \? \(/);
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
  assert.match(liveBackground, /tabIndex=\{-1\}/);
  assert.match(liveBackground, /aria-hidden="true"/);
  assert.match(weatherHero, /\{liveCameraBackground\}/);
});

test("live camera source remains identified and links to the camera page", () => {
  assert.match(productionHome, /className="tp-home-hero-source"/);
  assert.match(productionHome, /Câmera do Laranjal ao vivo/);
  assert.match(productionHome, /Céu e clima em tempo real/);
  assert.match(productionHome, /to="\/cameras-ao-vivo-pelotas"/);
  assert.match(productionHome, /aria-label="Abrir a câmera ao vivo da Praia do Laranjal"/);
});

test("camera geometry is owned by the stable Hero component", () => {
  assert.match(liveBackground, /tp-home-hero__live-camera/);
  assert.match(heroStyles, /\.tp-home-hero__live-camera\s*\{[\s\S]*position:\s*absolute/);
  assert.match(heroStyles, /\.tp-home-hero__live-camera\.is-ready\s*\{[\s\S]*opacity:\s*1/);
  assert.match(heroStyles, /\.tp-home-hero__live-camera iframe\s*\{[\s\S]*pointer-events:\s*none/);
  assert.match(heroStyles, /width:\s*max\(100%,\s*177\.78vh\)/);
  assert.match(heroStyles, /height:\s*max\(100%,\s*56\.25vw\)/);
  assert.match(
    heroStyles,
    /\.tp-home-hero:has\(\.tp-home-hero__live-camera\.is-ready\) \.tp-home-hero__overlay/,
  );
  assert.match(
    heroStyles,
    /\.tp-home-hero:has\(\.tp-home-hero__live-camera\.is-ready\) \.tp-home-hero__photo/,
  );
});

test("Hero camera composition no longer uses historical camera class names", () => {
  assert.doesNotMatch(liveBackground, /className=\{`weather-hero-live-camera/);
  assert.doesNotMatch(productionHome, /home-hero-camera-shell/);
  assert.doesNotMatch(productionHome, /home-hero-camera-source/);
  assert.doesNotMatch(weatherHero, /weather-hero--editorial-v7[01]/);
  assert.doesNotMatch(heroStyles, /weather-hero--editorial-v7[01]/);
});

test("Hero camera keeps responsive and reduced-motion behavior in its own stylesheet", () => {
  assert.match(heroStyles, /@media \(max-width: 1040px\)/);
  assert.match(heroStyles, /@media \(max-width: 720px\)/);
  assert.match(heroStyles, /@media \(max-width: 460px\)/);
  assert.match(heroStyles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(heroStyles, /@media \(prefers-reduced-transparency: reduce\)/);
});
