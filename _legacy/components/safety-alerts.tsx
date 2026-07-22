"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SafetyBanner } from "@/lib/safety-banners";

function SafetyIcon({ id }: { id: SafetyBanner["id"] }) {
  if (id === "sms") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="5" y="2.5" width="14" height="19" rx="3" />
        <path d="M8 7.5h8M8 11h5M10 18h4" />
      </svg>
    );
  }

  if (id === "cell-broadcast") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 2.8 19h18.4L12 3Z" />
        <path d="M12 9v4.5M12 17.2v.1" />
      </svg>
    );
  }

  if (id === "official-channel") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5.5h16v11H8l-4 3v-14Z" />
        <path d="M8 9h8M8 12.5h5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.5-4A8 8 0 1 1 20 11.5Z" />
      <path d="M8.5 9.5c.8 2.3 2 3.5 4.3 4.3l1.2-1 2 .8-.4 2c-.2.8-1 1.3-1.8 1.2-4.5-.7-7.9-4.1-8.6-8.6-.1-.8.4-1.6 1.2-1.8l2-.4.8 2-1 .9.3.6Z" />
    </svg>
  );
}

function BannerAction({ banner }: { banner: SafetyBanner }) {
  if (!banner.actionLabel || !banner.actionUrl) return null;

  if (banner.external) {
    return (
      <a href={banner.actionUrl} target="_blank" rel="noreferrer">
        {banner.actionLabel}
        <span aria-hidden="true">↗</span>
      </a>
    );
  }

  return (
    <Link href={banner.actionUrl}>
      {banner.actionLabel}
      <span aria-hidden="true">→</span>
    </Link>
  );
}

export function SafetyAlertBanner({ banner }: { banner: SafetyBanner }) {
  const storageKey = `tempo-pelotas:safety-banner:${banner.id}`;
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(window.sessionStorage.getItem(storageKey) === "dismissed");
  }, [storageKey]);

  if (dismissed) return null;

  const dismiss = () => {
    window.sessionStorage.setItem(storageKey, "dismissed");
    setDismissed(true);
  };

  return (
    <aside
      className={`safety-alert-banner safety-alert-banner--${banner.tone}`}
      aria-label="Orientação preventiva da Defesa Civil"
    >
      <div className="safety-alert-banner__icon">
        <SafetyIcon id={banner.id} />
      </div>
      <div className="safety-alert-banner__content">
        <span>{banner.eyebrow}</span>
        <strong>{banner.title}</strong>
        <p>{banner.description}</p>
      </div>
      <div className="safety-alert-banner__actions">
        <BannerAction banner={banner} />
        <button type="button" onClick={dismiss} aria-label="Ocultar esta orientação durante a sessão">
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </aside>
  );
}

export function SafetyChannelsDirectory({
  banners,
  sourceName,
  sourceUrl,
}: {
  banners: SafetyBanner[];
  sourceName: string;
  sourceUrl: string;
}) {
  return (
    <section
      className="safety-channels"
      id="canais-defesa-civil"
      aria-labelledby="safety-channels-title"
    >
      <div className="section-heading">
        <div>
          <span className="eyebrow">Prepare-se antes do risco</span>
          <h2 id="safety-channels-title">Receba avisos oficiais da Defesa Civil</h2>
        </div>
        <p>
          Escolha os canais adequados para sua rotina. O cadastro é gratuito e complementa os avisos exibidos pelo portal.
        </p>
      </div>

      <div className="safety-channels__grid">
        {banners.map((banner) => (
          <article className={`safety-channel-card safety-channel-card--${banner.tone}`} key={banner.id}>
            <div className="safety-channel-card__icon">
              <SafetyIcon id={banner.id} />
            </div>
            <span>{banner.eyebrow}</span>
            <h3>{banner.title}</h3>
            <p>{banner.description}</p>
            <BannerAction banner={banner} />
          </article>
        ))}
      </div>

      <p className="safety-channels__source">
        Conteúdo preventivo baseado em orientação oficial de{" "}
        <a href={sourceUrl} target="_blank" rel="noreferrer">
          {sourceName}
          <span aria-hidden="true">↗</span>
        </a>
        . Avisos ativos devem ser confirmados na publicação original do órgão responsável.
      </p>
    </section>
  );
}
