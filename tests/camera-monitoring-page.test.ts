import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/cameras-ao-vivo-pelotas.tsx", "utf8");
const page = readFileSync("src/components/cameras/CameraPageV2.tsx", "utf8");
const styles = readFileSync("src/components/cameras/CameraPageV2.css", "utf8");
const cameraServer = readFileSync("src/lib/cameras/cameras.server.ts", "utf8");
const youtubeServer = readFileSync("src/lib/cameras/youtube.server.ts", "utf8");

const cameraSource = `${route}\n${page}`;

test("camera route uses the shared shell and parallel real data loaders", () => {
  assert.match(route, /createFileRoute\("\/cameras-ao-vivo-pelotas"\)/);
  assert.match(route, /getWeatherCameras\(\)/);
  assert.match(route, /getWeatherIntelligence\(\)/);
  assert.match(route, /Promise\.all/);
  assert.match(route, /InternalWeatherPageShell/);
  assert.match(route, /CameraPageHero/);
  assert.match(route, /CameraPageV2/);
  assert.match(route, /pageClassName="internal-weather-shell--cameras"/);
  assert.match(route, /showOfficialAlerts=\{false\}/);
  assert.match(route, /staleTime: 3 \* 60 \* 1_000/);
  assert.match(route, /createFaqPageJsonLd\(PAGE_PATH, CAMERAS_PAGE_CONTENT\.faqs\)/);
});

test("camera discovery is bounded and does not stack YouTube fallback timeouts", () => {
  assert.match(cameraServer, /configuredLaranjalEmbedUrl/);
  assert.match(
    cameraServer,
    /configuredLaranjalEmbedUrl \? null : await getLatestLaranjalStream\(\)/,
  );
  assert.match(youtubeServer, /const REQUEST_TIMEOUT_MS = 5_000/);
  assert.match(youtubeServer, /const signal = AbortSignal\.timeout\(REQUEST_TIMEOUT_MS\)/);
  assert.match(youtubeServer, /const apiStreamPromise/);
  assert.match(youtubeServer, /const publicStreamPromise/);
  assert.match(youtubeServer, /const latestReplayPromise/);
  assert.match(
    youtubeServer,
    /Promise\.all\(\[[\s\S]*apiStreamPromise,[\s\S]*publicStreamPromise,[\s\S]*latestReplayPromise,[\s\S]*\]\)/,
  );
});

test("camera states distinguish live, replay, configured and preparing", () => {
  assert.match(page, /type CameraPresentationState = "live" \| "replay" \| "configured" \| "preparing"/);
  assert.match(page, /Ao vivo agora/);
  assert.match(page, /Última transmissão/);
  assert.match(page, /Vídeo disponível/);
  assert.match(page, /Em preparação/);
  assert.match(page, /camera\.status !== "online" \|\| !camera\.embedUrl/);
  assert.match(page, /camera\.broadcastStatus === "live"/);
  assert.match(page, /camera\.broadcastStatus === "replay"/);
  assert.match(route, /Vídeo disponível sem confirmação/);
});

test("external player loads only after explicit visitor interaction", () => {
  assert.match(page, /const \[playerOpen, setPlayerOpen\] = useState\(false\)/);
  assert.match(page, /playerOpen \? \(/);
  assert.match(page, /onClick=\{\(\) => setPlayerOpen\(true\)\}/);
  assert.match(page, /<iframe/);
  assert.match(page, /loading="lazy"/);
  assert.match(page, /referrerPolicy="strict-origin-when-cross-origin"/);
  assert.match(page, /allowFullScreen/);
  assert.match(page, /setPlayerOpen\(false\)/);
  assert.match(route, /Isso melhora o carregamento da página/);
});

test("camera thumbnails and external links preserve privacy and accessibility", () => {
  assert.match(page, /decoding="async"/);
  assert.match(page, /referrerPolicy="no-referrer"/);
  assert.match(page, /alt=""/);
  assert.match(page, /target="_blank"[\s\S]*?rel="noopener noreferrer"/);
  assert.match(page, /página original, em nova aba/);
  assert.match(page, /aria-live="polite"/);
  assert.match(page, /aria-pressed=\{active\}/);
});

test("publication age uses the camera query timestamp instead of Date.now", () => {
  assert.match(page, /relativePublication\(value: string \| null, referenceTime: string\)/);
  assert.match(page, /reference\.getTime\(\) - date\.getTime\(\)/);
  assert.match(page, /referenceTime=\{cameraData\.source\.fetchedAt\}/);
  assert.doesNotMatch(page, /Date\.now\(\)/);
});

test("VideoObject is emitted only for verified live or replay players", () => {
  assert.match(page, /const verifiedVideo = cameraData\.cameras\.find/);
  assert.match(page, /camera\.broadcastStatus === "live" \|\| camera\.broadcastStatus === "replay"/);
  assert.match(page, /camera\.embedUrl\s*&&\s*camera\.publicUrl/);
  assert.match(page, /const videoSchema = verifiedVideo\s*\?/);
  assert.match(page, /isLiveBroadcast: verifiedVideo\.broadcastStatus === "live"/);
  assert.doesNotMatch(page, /broadcastStatus === null[^\n]{0,120}VideoObject/);
});

test("camera context separates visual observation, current fields and forecasts", () => {
  assert.match(page, /currentProvenance\.temperature/);
  assert.match(page, /hourly[\s\S]*\.slice\(0, 12\)/);
  assert.match(page, /hourly[\s\S]*\.slice\(0, 24\)/);
  assert.match(page, /Nas próximas 12 horas/);
  assert.match(page, /Nas próximas 24 horas/);
  assert.match(page, /Informação meteorológica, não produzida pela câmera/);
  assert.match(page, /Uma imagem não mede temperatura, vento, volume de chuva ou nível da água/);
  assert.match(route, /A câmera ajuda a observar o céu e o local, mas não mede/);
});

test("missing cameras and players never receive simulated imagery", () => {
  assert.match(page, /O portal não usa imagens demonstrativas/);
  assert.match(page, /sem usar vídeo ou imagem simulada/);
  assert.match(page, /Imagem ainda não disponível/);
  assert.match(route, /ponto em preparação permanece sem imagem/);
  assert.doesNotMatch(cameraSource, /placeholder\.com|picsum|unsplash/i);
});

test("camera page follows the current responsive retail system", () => {
  assert.match(styles, /internal-weather-shell--cameras \.camera-v2-hero/);
  assert.match(styles, /max-width: var\(--internal-weather-frame-max/);
  assert.match(styles, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(styles, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(styles, /content-visibility:\s*auto/);
  assert.match(styles, /scroll-margin-top:\s*8rem/);
  assert.match(styles, /@media \(max-width: 1280px\)/);
  assert.match(styles, /@media \(max-width: 980px\)/);
  assert.match(styles, /@media \(max-width: 680px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /@media \(forced-colors: active\)/);
  assert.match(styles, /:focus-visible/);
  assert.doesNotMatch(styles, /font-size:\s*0\.[0-6][0-9]rem/);
});
