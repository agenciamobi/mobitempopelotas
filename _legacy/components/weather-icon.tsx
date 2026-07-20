import type { WeatherIconName } from "@/lib/weather-data";

type WeatherIconProps = {
  name: WeatherIconName;
  className?: string;
  title?: string;
};

export function WeatherIcon({ name, className = "", title }: WeatherIconProps) {
  const commonProps = {
    className,
    viewBox: "0 0 96 96",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    role: title ? ("img" as const) : undefined,
    "aria-hidden": title ? undefined : true,
  };

  if (name === "sun") {
    return (
      <svg {...commonProps}>
        {title ? <title>{title}</title> : null}
        <circle cx="48" cy="48" r="17" fill="currentColor" />
        <g stroke="currentColor" strokeWidth="5" strokeLinecap="round">
          <path d="M48 8v11" />
          <path d="M48 77v11" />
          <path d="M8 48h11" />
          <path d="M77 48h11" />
          <path d="m20 20 8 8" />
          <path d="m68 68 8 8" />
          <path d="m76 20-8 8" />
          <path d="m28 68-8 8" />
        </g>
      </svg>
    );
  }

  if (name === "moon") {
    return (
      <svg {...commonProps}>
        {title ? <title>{title}</title> : null}
        <path
          d="M70 62c-22 5-40-12-36-34 2-8 6-14 12-19-20 1-36 18-36 39 0 22 18 40 40 40 18 0 33-12 38-28-5 1-11 2-18 2Z"
          fill="currentColor"
        />
        <circle cx="71" cy="23" r="4" fill="currentColor" opacity=".55" />
        <circle cx="84" cy="39" r="3" fill="currentColor" opacity=".4" />
      </svg>
    );
  }

  if (name === "wind") {
    return (
      <svg {...commonProps}>
        {title ? <title>{title}</title> : null}
        <g stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 35h47c10 0 10-16 0-16-6 0-9 4-9 8" />
          <path d="M12 50h66c10 0 10 17 0 17-6 0-9-4-9-8" />
          <path d="M12 65h36" />
        </g>
      </svg>
    );
  }

  const hasRain = name === "rain" || name === "storm";
  const hasSun = name === "partly-cloudy";
  const hasMoon = name === "partly-cloudy-night";

  return (
    <svg {...commonProps}>
      {title ? <title>{title}</title> : null}
      {hasSun ? (
        <g className="weather-icon-sun">
          <circle cx="62" cy="30" r="15" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="4" strokeLinecap="round">
            <path d="M62 5v8" />
            <path d="M62 47v8" />
            <path d="M37 30h8" />
            <path d="M79 30h8" />
            <path d="m44 12 6 6" />
            <path d="m74 42 6 6" />
            <path d="m80 12-6 6" />
          </g>
        </g>
      ) : null}
      {hasMoon ? (
        <path
          className="weather-icon-moon"
          d="M76 43c-15 3-27-8-24-23 1-5 4-9 8-12-14 1-24 12-24 26 0 15 12 27 27 27 12 0 23-8 26-19-4 1-8 1-13 1Z"
          fill="currentColor"
        />
      ) : null}
      <path
        d="M70 70H29c-11 0-19-7-19-17 0-9 7-16 16-17 3-12 13-20 26-20 15 0 27 11 28 26 8 2 13 7 13 14 0 8-7 14-16 14h-7Z"
        fill="currentColor"
      />
      {hasRain ? (
        <g stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity=".78">
          <path d="m31 78-4 8" />
          <path d="m50 78-4 8" />
          <path d="m69 78-4 8" />
        </g>
      ) : null}
      {name === "storm" ? (
        <path d="M52 69h13L54 84h9L42 94l7-16h-9l12-9Z" fill="currentColor" />
      ) : null}
    </svg>
  );
}
