import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const productionHome = readFileSync("src/production/ProductionHome.tsx", "utf8");
const sectionNavigation = readFileSync(
  "src/production/components/home-section-navigation.tsx",
  "utf8",
);
const semanticDashboard = readFileSync(
  "src/production/components/home-editorial-dashboard-semantic.tsx",
  "utf8",
);
const weatherHero = readFileSync("src/production/components/weather-hero.tsx", "utf8");
const todayRoute = readFileSync("src/routes/tempo-hoje-pelotas.tsx", "utf8");

test("the homepage radar shortcut resolves to an existing section anchor", () => {
  assert.match(sectionNavigation, /href:\s*"#regiao"/);
  assert.match(semanticDashboard, /hasClass\(className, "home-map-story"\)/);
  assert.match(semanticDashboard, /normalizedId\s*=\s*"regiao"/);
});

test("the hourly forecast copy matches the seven-hour window rendered on home", () => {
  assert.match(semanticDashboard, /Veja como o tempo deve mudar nas próximas horas/);
});

test("the hero separates current wording from forecast wording", () => {
  assert.match(weatherHero, /if \(icon === "rain"\) return "Chuva"/);
  assert.match(weatherHero, /if \(icon === "storm"\) return "Trovoadas"/);
  assert.match(weatherHero, /if \(icon === "wind"\) return "Tempo ventoso"/);
  assert.doesNotMatch(weatherHero, /\{weatherConditionLabels\[heroIcon\]\} agora em Pelotas/);
});

test("the home targets now while the dedicated route targets today's forecast", () => {
  assert.match(weatherHero, /Tempo agora em Pelotas/);
  assert.doesNotMatch(weatherHero, /Tempo em Pelotas hoje/);
  assert.match(todayRoute, /Tempo hoje em Pelotas: previsão por hora/);
});

test("the hero does not credit a static photo while the live camera is visible", () => {
  assert.match(
    weatherHero,
    /\{liveCameraBackground \? null : \([\s\S]*className="weather-hero-credit"/,
  );
});

test("any official Pelotas alert raises the homepage to at least attention", () => {
  assert.match(productionHome, /const hasPelotasOfficialAlerts = pelotasOfficialAlerts\.length > 0/);
  assert.match(
    productionHome,
    /verifiedPelotasAlerts\.some\([\s\S]*hasPelotasOfficialAlerts[\s\S]*\? "attention"/,
  );
});
