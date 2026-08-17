import { Activity, ArrowDownRight, ArrowUpRight, Clock3, ExternalLink, Waves } from "lucide-react";
import { useEffect, useRef } from "react";

import type { LaranjalLevelData } from "@/lib/hydrology/laranjal-level.server";

import styles from "./LaranjalLevelEmbed.module.css";

function formatDateTime(value: string | null) {
  if (!value) return "Horário indisponível";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Horário indisponível";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function trendPresentation(value: number | null) {
  if (value === null)
    return { label: "Tendência indisponível", className: styles.neutral, Icon: Activity };
  if (value > 0.25)
    return {
      label: `Subindo ${value.toFixed(1).replace(".", ",")} cm/h`,
      className: styles.rising,
      Icon: ArrowUpRight,
    };
  if (value < -0.25)
    return {
      label: `Baixando ${Math.abs(value).toFixed(1).replace(".", ",")} cm/h`,
      className: styles.falling,
      Icon: ArrowDownRight,
    };
  return { label: "Nível estável", className: styles.neutral, Icon: Activity };
}

function MiniChart({ data }: { data: LaranjalLevelData }) {
  if (data.series.length < 2) {
    return (
      <div className={styles.chartUnavailable}>
        <Activity aria-hidden="true" />
        <span>Histórico recente indisponível</span>
      </div>
    );
  }

  const width = 640;
  const height = 154;
  const paddingX = 8;
  const paddingY = 14;
  const values = data.series.map((point) => point.level);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const range = Math.max(0.02, maximum - minimum);
  const coordinates = data.series.map((point, index) => ({
    x: paddingX + (index / (data.series.length - 1)) * (width - paddingX * 2),
    y: paddingY + ((maximum - point.level) / range) * (height - paddingY * 2),
  }));
  const line = coordinates.map((point) => `${point.x},${point.y}`).join(" ");
  const area = [
    `M ${coordinates[0]?.x ?? paddingX} ${height - paddingY}`,
    ...coordinates.map((point) => `L ${point.x} ${point.y}`),
    `L ${coordinates.at(-1)?.x ?? width - paddingX} ${height - paddingY}`,
    "Z",
  ].join(" ");

  return (
    <div className={styles.chart}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Evolução recente do nível da Lagoa dos Patos no Laranjal"
      >
        <defs>
          <linearGradient id="embed-laranjal-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.32" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} />
        <line x1={paddingX} y1={height / 2} x2={width - paddingX} y2={height / 2} />
        <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} />
        <path d={area} fill="url(#embed-laranjal-area)" />
        <polyline
          points={line}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={coordinates.at(-1)?.x} cy={coordinates.at(-1)?.y} r="6" fill="currentColor" />
      </svg>
      <div className={styles.chartLabels}>
        <span>24 horas</span>
        <strong>
          {minimum.toFixed(2).replace(".", ",")}–{maximum.toFixed(2).replace(".", ",")} m
        </strong>
        <span>Última leitura</span>
      </div>
    </div>
  );
}

function parentMessageOrigin() {
  try {
    return document.referrer ? new URL(document.referrer).origin : "*";
  } catch {
    return "*";
  }
}

export function LaranjalLevelEmbed({ data }: { data: LaranjalLevelData }) {
  const rootRef = useRef<HTMLElement>(null);
  const trend = trendPresentation(data.trendCmPerHour);
  const TrendIcon = trend.Icon;
  const live = data.status === "live";

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.parent === window) return;

    const targetOrigin = parentMessageOrigin();
    const report = () => {
      window.parent.postMessage(
        {
          type: "tempo-pelotas:widget-resize",
          widget: "nivel-laranjal",
          height: Math.ceil(root.getBoundingClientRect().height + 2),
        },
        targetOrigin,
      );
    };

    report();
    const observer = new ResizeObserver(report);
    observer.observe(root);
    window.addEventListener("load", report, { once: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("load", report);
    };
  }, []);

  return (
    <main ref={rootRef} className={styles.viewport}>
      <article className={styles.card} aria-labelledby="embed-laranjal-title">
        <div className={styles.brandLine} aria-hidden="true" />
        <header className={styles.header}>
          <div className={styles.identity}>
            <span className={styles.icon}>
              <Waves aria-hidden="true" />
            </span>
            <div>
              <span className={styles.kicker}>Estação Laranjal · Pelotas/RS</span>
              <h1 id="embed-laranjal-title">Nível da Lagoa dos Patos</h1>
            </div>
          </div>
          <span className={`${styles.status} ${live ? styles.live : styles.stale}`}>
            <i aria-hidden="true" />{" "}
            {live ? "Tempo real" : data.status === "stale" ? "Última leitura" : "Indisponível"}
          </span>
        </header>

        <section className={styles.reading} aria-label="Leitura atual">
          <div className={styles.value}>
            <strong>
              {data.currentLevel === null ? "—" : data.currentLevel.toFixed(2).replace(".", ",")}
            </strong>
            <span>m</span>
          </div>
          <div className={`${styles.trend} ${trend.className}`}>
            <TrendIcon aria-hidden="true" />
            <span>{trend.label}</span>
          </div>
        </section>

        <MiniChart data={data} />

        <footer className={styles.footer}>
          <div>
            <Clock3 aria-hidden="true" />
            <span>Atualizado em {formatDateTime(data.updatedAt)}</span>
          </div>
          <a
            href="https://tempopelotas.com.br/nivel-da-lagoa-dos-patos-laranjal"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ver detalhes <ExternalLink aria-hidden="true" />
          </a>
        </footer>

        <p className={styles.source}>Fonte: LabHidroSens / UFPel · Apresentação: Tempo Pelotas</p>
      </article>
    </main>
  );
}
