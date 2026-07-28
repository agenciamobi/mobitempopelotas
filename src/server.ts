import "./lib/error-capture";

import { createCanonicalRedirectResponse } from "./lib/canonical-host";
import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";
import { fetchAggregatedPelotasWeather } from "./lib/weather/aggregated-weather.server";
import type { WeatherIconName } from "./lib/weather/types";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

type DirectObsStatus = {
  status: "live" | "unavailable";
  temperature: number | null;
  condition: string;
  icon: WeatherIconName;
};

const OBS_WIDGET_PATH = "/embed/status-tempo-agora";
const OBS_WIDGET_API_PATH = "/api/widgets/status-tempo-agora";
const EMBED_PATHS = new Set(["/embed/nivel-laranjal", OBS_WIDGET_PATH]);
const EMBED_CACHE_CONTROL = "public, max-age=60, s-maxage=60, stale-while-revalidate=300";
const EMBED_CDN_CACHE_CONTROL = "max-age=60, stale-while-revalidate=300";
const EMBED_ROBOTS_POLICY = "noindex, nofollow, noarchive, nosnippet, noimageindex";
const OBS_REFRESH_INTERVAL_MS = 5 * 60 * 1_000;

const CONDITION_LABELS: Record<WeatherIconName, string> = {
  sun: "Ensolarado",
  moon: "Céu limpo",
  "partly-cloudy": "Parcialmente nublado",
  "partly-cloudy-night": "Parcialmente nublado",
  cloud: "Nublado",
  rain: "Chuva",
  storm: "Trovoadas",
  wind: "Ventoso",
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

async function getDirectObsStatus(): Promise<DirectObsStatus> {
  const weather = await fetchAggregatedPelotasWeather();
  const observation = weather.current;
  const conditionHour = weather.hourly[0] ?? null;
  const icon: WeatherIconName = conditionHour?.icon ?? "cloud";

  if (!observation || observation.temperature === null) {
    return {
      status: "unavailable",
      temperature: null,
      condition: "Indisponível",
      icon: "cloud",
    };
  }

  return {
    status: "live",
    temperature: Math.round(observation.temperature),
    condition: conditionHour ? CONDITION_LABELS[icon] : "Condição indisponível",
    icon,
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderObsWidgetDocument(data: DirectObsStatus) {
  const temperature = data.temperature === null ? "—" : String(data.temperature);
  const unavailableClass = data.status === "unavailable" ? " is-unavailable" : "";

  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="robots" content="${EMBED_ROBOTS_POLICY}">
  <meta name="googlebot" content="${EMBED_ROBOTS_POLICY}">
  <meta name="theme-color" content="#071e2f">
  <title>Status do tempo agora em Pelotas — OBS</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    * { box-sizing: border-box; }
    html, body { width: 100%; min-width: 0; min-height: 100%; margin: 0; overflow: hidden; background: transparent; }
    body { display: grid; place-items: center; padding: clamp(8px, 2.5vw, 18px); }
    .widget { --accent: #69eee4; position: relative; display: grid; width: min(100%, 520px); min-height: 190px; grid-template-columns: minmax(112px, .7fr) minmax(0, 1.3fr); align-items: center; gap: clamp(16px, 4vw, 34px); padding: clamp(20px, 4.5vw, 36px); overflow: hidden; border: 1px solid rgb(255 255 255 / 18%); border-radius: clamp(22px, 4vw, 34px); background: radial-gradient(circle at 10% 8%, rgb(24 189 205 / 24%), transparent 15rem), radial-gradient(circle at 94% 92%, rgb(94 44 237 / 28%), transparent 18rem), linear-gradient(145deg, rgb(7 30 47 / 95%), rgb(18 48 70 / 93%)); box-shadow: 0 24px 68px rgb(0 0 0 / 32%), inset 0 1px 0 rgb(255 255 255 / 10%); color: #fff; isolation: isolate; }
    .widget::before { position: absolute; inset: 0 0 auto; height: 4px; background: linear-gradient(90deg, #18bdcd 0 30%, #5e2ced 30% 62%, #e70b85 62% 82%, #f27035 82%); content: ""; }
    .widget::after { position: absolute; right: -82px; bottom: -104px; width: 235px; height: 235px; border: 1px solid rgb(255 255 255 / 10%); border-radius: 999px; content: ""; pointer-events: none; }
    .widget.is-unavailable { --accent: #f9a66f; }
    .icon { position: relative; z-index: 1; display: grid; width: clamp(108px, 24vw, 148px); aspect-ratio: 1; place-items: center; border: 1px solid rgb(255 255 255 / 14%); border-radius: clamp(22px, 4vw, 31px); background: rgb(255 255 255 / 8%); box-shadow: inset 0 1px 0 rgb(255 255 255 / 11%); color: var(--accent); }
    .icon svg { width: 72%; height: 72%; overflow: visible; filter: drop-shadow(0 10px 22px rgb(0 0 0 / 18%)); }
    .icon [data-layer] { display: none; }
    .widget[data-icon="sun"] [data-layer="sun"], .widget[data-icon="moon"] [data-layer="moon"], .widget[data-icon="cloud"] [data-layer="cloud"], .widget[data-icon="rain"] [data-layer="cloud"], .widget[data-icon="rain"] [data-layer="rain"], .widget[data-icon="storm"] [data-layer="cloud"], .widget[data-icon="storm"] [data-layer="rain"], .widget[data-icon="storm"] [data-layer="storm"], .widget[data-icon="wind"] [data-layer="wind"], .widget[data-icon="partly-cloudy"] [data-layer="sun-small"], .widget[data-icon="partly-cloudy"] [data-layer="cloud"], .widget[data-icon="partly-cloudy-night"] [data-layer="moon-small"], .widget[data-icon="partly-cloudy-night"] [data-layer="cloud"] { display: block; }
    .reading { position: relative; z-index: 1; display: grid; min-width: 0; align-content: center; gap: 8px; }
    .condition { overflow-wrap: anywhere; color: rgb(255 255 255 / 80%); font-size: clamp(1.35rem, 5vw, 2.35rem); font-weight: 720; letter-spacing: -.045em; line-height: 1; text-wrap: balance; }
    .is-unavailable .condition { color: #ffd8c2; }
    .temperature { display: inline-flex; align-items: flex-start; color: #fff; font-size: clamp(4.6rem, 15vw, 7.9rem); font-weight: 730; letter-spacing: -.095em; line-height: .8; text-shadow: 0 12px 34px rgb(0 0 0 / 24%); }
    .temperature small { margin-top: .08em; margin-left: .06em; color: rgb(255 255 255 / 74%); font-size: .28em; font-weight: 720; letter-spacing: -.04em; }
    @media (max-width: 420px) { body { padding: 6px; } .widget { min-height: 158px; grid-template-columns: 88px minmax(0, 1fr); gap: 13px; padding: 16px; border-radius: 22px; } .icon { width: 88px; border-radius: 20px; } .condition { font-size: clamp(1.08rem, 6.5vw, 1.55rem); } .temperature { font-size: clamp(3.8rem, 20vw, 5.35rem); } }
    @media (max-width: 270px) { .widget { grid-template-columns: minmax(0, 1fr); justify-items: center; text-align: center; } .reading { justify-items: center; } }
  </style>
</head>
<body>
  <main class="widget${unavailableClass}" data-icon="${escapeHtml(data.icon)}" aria-label="Status do tempo agora em Pelotas" aria-live="polite" aria-atomic="true">
    <div class="icon" aria-hidden="true">
      <svg viewBox="0 0 96 96" fill="none">
        <g data-layer="sun"><circle cx="48" cy="48" r="17" fill="currentColor"/><g stroke="currentColor" stroke-width="5" stroke-linecap="round"><path d="M48 8v11M48 77v11M8 48h11M77 48h11M20 20l8 8M68 68l8 8M76 20l-8 8M28 68l-8 8"/></g></g>
        <path data-layer="moon" d="M70 62c-22 5-40-12-36-34 2-8 6-14 12-19-20 1-36 18-36 39 0 22 18 40 40 40 18 0 33-12 38-28-5 1-11 2-18 2Z" fill="currentColor"/>
        <circle data-layer="sun-small" cx="64" cy="29" r="15" fill="currentColor" opacity=".85"/>
        <path data-layer="moon-small" d="M76 43c-15 3-27-8-24-23 1-5 4-9 8-12-14 1-24 12-24 26 0 15 12 27 27 27 12 0 23-8 26-19-4 1-8 1-13 1Z" fill="currentColor" opacity=".85"/>
        <path data-layer="cloud" d="M70 70H29c-11 0-19-7-19-17 0-9 7-16 16-17 3-12 13-20 26-20 15 0 27 11 28 26 8 2 13 7 13 14 0 8-7 14-16 14h-7Z" fill="currentColor"/>
        <g data-layer="rain" stroke="currentColor" stroke-width="5" stroke-linecap="round" opacity=".8"><path d="m31 78-4 8M50 78l-4 8M69 78l-4 8"/></g>
        <path data-layer="storm" d="M52 68h13L54 83h9L42 94l7-16h-9l12-10Z" fill="currentColor"/>
        <g data-layer="wind" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 35h47c10 0 10-16 0-16-6 0-9 4-9 8M12 50h66c10 0 10 17 0 17-6 0-9-4-9-8M12 65h36"/></g>
      </svg>
    </div>
    <div class="reading">
      <span class="condition">${escapeHtml(data.condition)}</span>
      <strong class="temperature"><span>${escapeHtml(temperature)}</span><small>°C</small></strong>
    </div>
  </main>
  <script>
    (() => {
      const widget = document.querySelector('.widget');
      const condition = document.querySelector('.condition');
      const temperature = document.querySelector('.temperature > span');
      if (!widget || !condition || !temperature) return;

      const refresh = async () => {
        try {
          const response = await fetch('${OBS_WIDGET_API_PATH}?t=' + Date.now(), { cache: 'no-store', headers: { Accept: 'application/json' } });
          if (!response.ok) throw new Error('HTTP ' + response.status);
          const data = await response.json();
          widget.dataset.icon = data.icon || 'cloud';
          widget.classList.toggle('is-unavailable', data.status !== 'live');
          condition.textContent = data.condition || 'Indisponível';
          temperature.textContent = data.temperature == null ? '—' : String(data.temperature);
        } catch {
          widget.dataset.icon = 'cloud';
          widget.classList.add('is-unavailable');
          condition.textContent = 'Indisponível';
          temperature.textContent = '—';
        }
      };

      window.setInterval(refresh, ${OBS_REFRESH_INTERVAL_MS});
    })();
  </script>
</body>
</html>`;
}

function obsWidgetHeaders(contentType: string, cacheControl: string) {
  return {
    "Content-Type": contentType,
    "Content-Language": "pt-BR",
    "Cache-Control": cacheControl,
    "CDN-Cache-Control": cacheControl,
    "Cross-Origin-Resource-Policy": "cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
    "Referrer-Policy": "no-referrer",
    "X-Robots-Tag": EMBED_ROBOTS_POLICY,
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; img-src data:; frame-ancestors *; base-uri 'none'; form-action 'none'",
  };
}

async function handleDirectObsWidget(request: Request) {
  const { pathname } = new URL(request.url);
  if (pathname !== OBS_WIDGET_PATH && pathname !== OBS_WIDGET_API_PATH) return null;

  try {
    const data = await getDirectObsStatus();

    if (pathname === OBS_WIDGET_API_PATH) {
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: obsWidgetHeaders(
          "application/json; charset=utf-8",
          "public, max-age=0, s-maxage=300, stale-while-revalidate=60",
        ),
      });
    }

    return new Response(renderObsWidgetDocument(data), {
      status: 200,
      headers: obsWidgetHeaders(
        "text/html; charset=utf-8",
        "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
      ),
    });
  } catch (error) {
    console.error("Falha ao responder widget OBS:", error);
    const unavailable: DirectObsStatus = {
      status: "unavailable",
      temperature: null,
      condition: "Indisponível",
      icon: "cloud",
    };

    if (pathname === OBS_WIDGET_API_PATH) {
      return new Response(JSON.stringify(unavailable), {
        status: 503,
        headers: obsWidgetHeaders("application/json; charset=utf-8", "no-store"),
      });
    }

    return new Response(renderObsWidgetDocument(unavailable), {
      status: 200,
      headers: obsWidgetHeaders("text/html; charset=utf-8", "no-store"),
    });
  }
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

function withFrameAncestors(policy: string | null, value: string) {
  const directives = (policy ?? "")
    .split(";")
    .map((directive) => directive.trim())
    .filter(Boolean)
    .filter((directive) => !directive.toLowerCase().startsWith("frame-ancestors"));
  directives.push(`frame-ancestors ${value}`);
  return `${directives.join("; ")};`;
}

function applyRouteResponseHeaders(request: Request, response: Response) {
  const pathname = new URL(request.url).pathname;
  if (!EMBED_PATHS.has(pathname)) return response;

  const headers = new Headers(response.headers);
  headers.delete("X-Frame-Options");
  headers.set(
    "Content-Security-Policy",
    withFrameAncestors(headers.get("Content-Security-Policy"), "*"),
  );
  headers.set("Cross-Origin-Resource-Policy", "cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("X-Robots-Tag", EMBED_ROBOTS_POLICY);
  headers.set("Content-Language", "pt-BR");

  if (response.ok) {
    headers.set("Cache-Control", EMBED_CACHE_CONTROL);
    headers.set("CDN-Cache-Control", EMBED_CDN_CACHE_CONTROL);
  } else {
    headers.set("Cache-Control", "no-store");
    headers.set("CDN-Cache-Control", "no-store");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const directObsWidget = await handleDirectObsWidget(request);
    if (directObsWidget) return directObsWidget;

    const canonicalRedirect = createCanonicalRedirectResponse(request);
    if (canonicalRedirect) return canonicalRedirect;

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      return applyRouteResponseHeaders(request, normalized);
    } catch (error) {
      console.error(error);
      const response = new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
      return applyRouteResponseHeaders(request, response);
    }
  },
};
