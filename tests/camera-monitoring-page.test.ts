import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const route = readFileSync("src/routes/cameras-ao-vivo-pelotas.tsx", "utf8");
const page = readFileSync("src/components/cameras/CameraPageV2.tsx", "utf8");
const styles = readFileSync("src/components/cameras/CameraPageV2.css", "utf8");

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

test("camera states distinguish live, replay, configured and preparing", () => {
  assert.match(page, /type CameraPresentationState = "live" \| "replay" \| "configured" \| "preparing"/);
  assert.match(page, /Ao vivo agora/);
  assert.match(page, /Última transmissão/);
  assert.match(page, /Player configurado/);
  assert.match(page, /Em preparação/);
  assert.match(page, /camera\.status !== "online" \|\| !camera\.embedUrl/);
  assert.match(page, /camera\.broadcastStatus === "live"/);
  assert.match(page, /camera\.broadcastStatus === "replay"/);
  assert.match(route, /Player configurado significa que existe uma incorporação/);
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
  assert.match(route, /O carregamento sob demanda reduz requisições externas/);
});

test("camera thumbnails and external links preserve privacy and accessibility", () => {
  assert.match(page, /decoding="async"/);
  assert.match(page, /referrerPolicy="no-referrer"/);
  assert.match(page, /alt=""/);
  assert.match(page, /target="_blank" rel="noopener noreferrer"/);
  assert.match(page, /provedor externo, em nova aba/);
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
  assert.match(page, /camera\.embedUrl && camera\.publicUrl/);
  assert.match(page, /const videoSchema = verifiedVideo \?/);
  assert.match(page, /isLiveBroadcast: verifiedVideo\.broadcastStatus === "live"/);
  assert.doesNotMatch(page, /broadcastStatus === null[^\n]{0,120}VideoObject/);
});

test("camera context separates visual observation, current fields and forecasts", () => {
  assert.match(page, /currentProvenance\.temperature/);
  assert.match(page, /hourly\.slice\(0, 12\)/);
  assert.match(page, /hourly\.slice\(0, 24\)/);
  assert.match(page, /Previsão nas próximas 12 horas/);
  assert.match(page, /Previsão nas próximas 24 horas/);
  assert.match(page, /Não é uma leitura produzida pela câmera/);
  assert.match(page, /Uma imagem não mede temperatura, vento, volume de chuva ou nível da água/);
  assert.match(route, /A imagem complementa radar, estação e previsão, mas não mede variáveis meteorológicas/);
});

test("missing cameras and players never receive simulated imagery", () => {
  assert.match(page, /O portal não cria imagens demonstrativas/);
  assert.match(page, /O ponto permanece cadastrado sem simular imagem ou transmissão/);
  assert.match(page, /Player ainda não disponível/);
  assert.match(route, /Ponto em preparação permanece visível sem imagem simulada/);
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
