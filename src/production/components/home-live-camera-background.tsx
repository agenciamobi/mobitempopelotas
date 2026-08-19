import { useEffect, useMemo, useState } from "react";

const MAX_RELOAD_ATTEMPTS = 2;
const PLAYER_RETRY_DELAY_MS = 9_000;

type HomeLiveCameraBackgroundProps = {
  embedUrl: string;
  title: string;
};

function buildBackgroundPlayerUrl(embedUrl: string, attempt: number) {
  try {
    const url = new URL(embedUrl);
    if (url.protocol !== "https:") return null;

    url.searchParams.set("autoplay", "1");
    url.searchParams.set("mute", "1");
    url.searchParams.set("controls", "0");
    url.searchParams.set("playsinline", "1");
    url.searchParams.set("disablekb", "1");
    url.searchParams.set("fs", "0");
    url.searchParams.set("iv_load_policy", "3");
    url.searchParams.set("modestbranding", "1");
    url.searchParams.set("rel", "0");
    url.searchParams.set("tp_reload", String(attempt));

    return url.toString();
  } catch {
    return null;
  }
}

export function HomeLiveCameraBackground({
  embedUrl,
  title,
}: HomeLiveCameraBackgroundProps) {
  const [attempt, setAttempt] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const playerUrl = useMemo(() => buildBackgroundPlayerUrl(embedUrl, attempt), [attempt, embedUrl]);

  useEffect(() => {
    setAttempt(0);
    setIsReady(false);
  }, [embedUrl]);

  useEffect(() => {
    if (!playerUrl || isReady || attempt >= MAX_RELOAD_ATTEMPTS) return;

    const timer = window.setTimeout(() => {
      setIsReady(false);
      setAttempt((current) => Math.min(current + 1, MAX_RELOAD_ATTEMPTS));
    }, PLAYER_RETRY_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [attempt, isReady, playerUrl]);

  if (!playerUrl) return null;

  function retryPlayer() {
    if (attempt >= MAX_RELOAD_ATTEMPTS) return;
    setIsReady(false);
    setAttempt((current) => Math.min(current + 1, MAX_RELOAD_ATTEMPTS));
  }

  return (
    <div
      className={`tp-home-hero__live-camera${isReady ? " is-ready" : ""}`}
      data-player-attempt={attempt}
      aria-hidden="true"
    >
      <iframe
        key={`${embedUrl}-${attempt}`}
        src={playerUrl}
        title={`${title} — transmissão visual ao vivo sem áudio`}
        tabIndex={-1}
        loading="eager"
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => setIsReady(true)}
        onError={retryPlayer}
      />
    </div>
  );
}
