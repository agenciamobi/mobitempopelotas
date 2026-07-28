import { Link } from "@tanstack/react-router";
import { Activity, ArrowLeft, ArrowRight, Clock3, ExternalLink, Gauge, Waves } from "lucide-react";

import type { LaranjalLevelData } from "@/lib/hydrology/laranjal-level.server";

import "./HydrologyEditorialHero.css";

function formatDateTime(value: string | null) {
  if (!value) return "Horário não informado";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Horário não informado";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function trendLabel(value: number | null) {
  if (value === null) return "Tendência não informada";
  if (value > 0.25) return `Subindo ${value.toFixed(1).replace(".", ",")} cm/h`;
  if (value < -0.25) return `Baixando ${Math.abs(value).toFixed(1).replace(".", ",")} cm/h`;
  return "Pouca mudança recente";
}

function changeLabel(value: number | null) {
  if (value === null) return "—";
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1).replace(".", ",")} cm`;
}

export function HydrologyEditorialHero({
  level,
  variant,
}: {
  level: LaranjalLevelData;
  variant: "overview" | "detail";
}) {
  const overview = variant === "overview";
  const statusLabel =
    level.status === "live"
      ? "Leitura atualizada"
      : level.status === "stale"
        ? "Última leitura conhecida"
        : "Leitura indisponível";

  return (
    <header className={`hydrology-editorial-hero hydrology-editorial-hero-${variant}`}>
      <div className="hydrology-editorial-copy">
        <Link className="hydrology-editorial-back" to={overview ? "/" : "/situacao-hidrologica-pelotas"}>
          <ArrowLeft aria-hidden="true" /> {overview ? "Visão geral" : "Situação das águas"}
        </Link>
        <span className="hydrology-editorial-eyebrow">
          {overview ? "Águas e segurança em Pelotas" : "Medição local · Estação Laranjal"}
        </span>
        <h1>
          {overview
            ? "Acompanhe as águas que influenciam Pelotas."
            : "Nível da Lagoa dos Patos no Laranjal."}
        </h1>
        <p>
          {overview
            ? "Comece pela leitura local da Estação Laranjal, observe a mudança recente e compare com outros pontos da Lagoa e do Guaíba."
            : "Acompanhe a medição pública do LabHidroSens/UFPel, a evolução das últimas 24 horas e as informações de chuva e vento para Pelotas."}
        </p>

        <div className="hydrology-editorial-points" aria-label="Informações principais">
          <span>Leitura local com horário e origem</span>
          <span>Mudança recente sem classificação automática de risco</span>
        </div>

        <div className="hydrology-editorial-actions">
          <a href="#hydrology-level-title">
            Ver nível e histórico <ArrowRight aria-hidden="true" />
          </a>
          {overview ? (
            <Link to="/nivel-da-lagoa-dos-patos-laranjal">Abrir página da estação</Link>
          ) : (
            <a href={level.source.url} target="_blank" rel="noopener noreferrer">
              Abrir página da estação <ExternalLink aria-hidden="true" />
            </a>
          )}
        </div>
      </div>

      <div className="hydrology-editorial-media">
        <div className="hydrology-editorial-watermark" aria-hidden="true">
          <Waves />
        </div>
        <article className="hydrology-editorial-card" aria-label="Resumo da leitura da Estação Laranjal">
          <div className="hydrology-editorial-card-line" aria-hidden="true" />
          <header>
            <div>
              <strong>Estação Laranjal</strong>
              <small>Praia do Laranjal · Pelotas/RS</small>
            </div>
            <span className={`hydrology-editorial-status is-${level.status}`}>
              <i aria-hidden="true" /> {statusLabel}
            </span>
          </header>

          <div className="hydrology-editorial-value">
            <Waves aria-hidden="true" />
            <strong>{level.currentLevel === null ? "—" : level.currentLevel.toFixed(2).replace(".", ",")}</strong>
            <span>m</span>
          </div>

          <div className="hydrology-editorial-trend">
            <Activity aria-hidden="true" />
            <div><span>Mudança recente</span><strong>{trendLabel(level.trendCmPerHour)}</strong></div>
          </div>

          <dl>
            <div><dt>1 hora</dt><dd>{changeLabel(level.change1hCm)}</dd></div>
            <div><dt>6 horas</dt><dd>{changeLabel(level.change6hCm)}</dd></div>
            <div><dt>24 horas</dt><dd>{changeLabel(level.change24hCm)}</dd></div>
          </dl>

          <footer>
            <Clock3 aria-hidden="true" />
            <span>Leitura de {formatDateTime(level.updatedAt)}</span>
          </footer>
        </article>

        <div className="hydrology-editorial-caption">
          <Gauge aria-hidden="true" />
          <span>Referência própria da estação · não é cota oficial de inundação</span>
        </div>
      </div>
    </header>
  );
}
