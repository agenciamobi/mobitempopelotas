import { useEffect, useState } from "react";

type HomeLiveCameraBackgroundProps = {
  embedUrl: string;
  title: string;
};

function buildBackgroundPlayerUrl(embedUrl: string) {
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

    return url.toString();
  } catch {
    return null;
  }
}

export function HomeLiveCameraBackground({
  embedUrl,
  title,
}: HomeLiveCameraBackgroundProps) {
  const playerUrl = buildBackgroundPlayerUrl(embedUrl);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setShouldLoad(false);
    setIsReady(false);

    if (!playerUrl) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setTimeout(() => setShouldLoad(true), 700);
    return () => window.clearTimeout(timer);
  }, [playerUrl]);

  if (!playerUrl) return null;

  return (
    <div
      className={`weather-hero-live-camera${isReady ? " is-ready" : ""}`}
      aria-hidden="true"
    >
      {shouldLoad ? (
        <iframe
          src={playerUrl}
          title={`${title} — transmissão visual ao vivo sem áudio`}
          tabIndex={-1}
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setIsReady(true)}
        />
      ) : null}
    </div>
  );
}
