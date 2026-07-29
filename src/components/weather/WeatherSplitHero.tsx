import type { ReactNode } from "react";

import "./WeatherSplitHero.css";

export type WeatherSplitHeroTone = "moderate" | "elevated" | "strong" | "unknown";

type WeatherSplitHeroFact = {
  label: string;
  value: string;
};

type WeatherSplitHeroProps = {
  titleId: string;
  eyebrow: string;
  title: ReactNode;
  description: ReactNode;
  back?: ReactNode;
  actions?: ReactNode;
  tone?: WeatherSplitHeroTone;
  badgeIcon?: ReactNode;
  badgeLabel: string;
  updatedLabel: string;
  currentLabel: string;
  currentValue: string;
  currentDetail: string;
  highlightIcon?: ReactNode;
  highlightLabel: string;
  highlightValue: string;
  highlightDetail: string;
  facts: WeatherSplitHeroFact[];
  footer: ReactNode;
  className?: string;
};

export function WeatherSplitHero({
  titleId,
  eyebrow,
  title,
  description,
  back,
  actions,
  tone = "moderate",
  badgeIcon,
  badgeLabel,
  updatedLabel,
  currentLabel,
  currentValue,
  currentDetail,
  highlightIcon,
  highlightLabel,
  highlightValue,
  highlightDetail,
  facts,
  footer,
  className = "",
}: WeatherSplitHeroProps) {
  return (
    <section
      className={`weather-split-hero${className ? ` ${className}` : ""}`}
      aria-labelledby={titleId}
    >
      <div className="weather-split-hero__copy">
        {back}
        <span className="weather-split-hero__eyebrow">{eyebrow}</span>
        <h1 id={titleId}>{title}</h1>
        <p>{description}</p>
        {actions ? <div className="weather-split-hero__actions">{actions}</div> : null}
      </div>

      <aside className={`weather-split-hero__card is-${tone}`}>
        <header>
          <span>
            {badgeIcon}
            {badgeLabel}
          </span>
          <small>{updatedLabel}</small>
        </header>

        <div className="weather-split-hero__current">
          <span>{currentLabel}</span>
          <strong>{currentValue}</strong>
          <small>{currentDetail}</small>
        </div>

        <div className="weather-split-hero__highlight">
          {highlightIcon}
          <span>
            <small>{highlightLabel}</small>
            <strong>{highlightValue}</strong>
            <b>{highlightDetail}</b>
          </span>
        </div>

        <dl>
          {facts.slice(0, 2).map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>

        <footer>{footer}</footer>
      </aside>
    </section>
  );
}
