import { Link } from "@tanstack/react-router";
import { AlertTriangle, BellRing, ChevronRight, MessageCircleMore } from "lucide-react";

import type { WeatherIntelligenceData } from "@/lib/weather/weather-intelligence.types";

import "./HomeOperationalNavigation.css";

const shortcuts = [
  { label: "Previsão de hoje", description: "Hora a hora", to: "/tempo-hoje-pelotas" },
  { label: "Radar e satélite", description: "Região", to: "/cameras-ao-vivo-pelotas" },
  { label: "Medições locais", description: "Embrapa", to: "/estacao-embrapa-pelotas" },
  { label: "Situação das águas", description: "Laranjal", to: "/situacao-hidrologica-pelotas" },
  { label: "Metodologia", description: "Fontes", to: "/metodologia" },
] as const;

export function HomeOperationalNavigation({ data }: { data: WeatherIntelligenceData }) {
  const activeAlerts = data.weather.alerts.filter((alert) => alert.period === "active");
  const relevantAlert = activeAlerts.find((alert) => alert.relevance === "pelotas") ?? activeAlerts[0];
  const hasAlert = Boolean(relevantAlert);

  return (
    <section className="home-operational" aria-label="Avisos e acessos rápidos">
      <div className={`home-operational-alert${hasAlert ? " is-active" : ""}`}>
        <span className="home-operational-alert-icon" aria-hidden="true">
          {hasAlert ? <AlertTriangle /> : <BellRing />}
        </span>
        <div>
          <small>{hasAlert ? "Aviso oficial vigente" : "Alertas oficiais e prevenção"}</small>
          <strong>{hasAlert ? relevantAlert?.headline || relevantAlert?.event : "Acompanhe os avisos para Pelotas"}</strong>
          <p>
            {hasAlert
              ? "Consulte a área de alertas para verificar vigência, severidade e orientações da fonte oficial."
              : "O portal reúne avisos do INMET e os canais públicos usados pela Defesa Civil."}
          </p>
        </div>
        <Link to="/alertas">
          {hasAlert ? "Ver alerta" : "Consultar avisos"}
          <ChevronRight aria-hidden="true" />
        </Link>
      </div>

      <div className="home-operational-whatsapp">
        <span className="home-operational-whatsapp-icon" aria-hidden="true">
          <MessageCircleMore />
        </span>
        <div>
          <small>Canal preventivo</small>
          <strong>Receba novos alertas pelo WhatsApp</strong>
          <p>Veja os canais oficiais disponíveis e como se cadastrar para receber comunicados.</p>
        </div>
        <Link to="/alertas">
          Abrir orientações
          <ChevronRight aria-hidden="true" />
        </Link>
      </div>

      <nav className="home-operational-shortcuts" aria-label="Principais áreas do portal">
        {shortcuts.map((shortcut, index) => (
          <Link to={shortcut.to} key={shortcut.to}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <strong>{shortcut.label}</strong>
              <small>{shortcut.description}</small>
            </div>
            <ChevronRight aria-hidden="true" />
          </Link>
        ))}
      </nav>
    </section>
  );
}
