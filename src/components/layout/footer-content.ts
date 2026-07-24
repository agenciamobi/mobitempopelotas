const footerLeadByTopic = {
  forecast: {
    eyebrow: "Previsão para Pelotas",
    title: "Planeje o dia com informação local.",
    description:
      "Temperatura, chuva, vento e tendência dos próximos dias reunidos para decisões mais seguras.",
  },
  monitoring: {
    eyebrow: "Monitoramento local",
    title: "Observe o tempo além da previsão.",
    description:
      "Medições da Embrapa, radar, satélite, câmeras e histórico para acompanhar as condições locais.",
  },
  water: {
    eyebrow: "Águas de Pelotas e região",
    title: "Acompanhe níveis, tendências e alertas.",
    description:
      "Leituras do Laranjal, Lagoa dos Patos e pontos regionais organizadas com contexto e procedência.",
  },
  alerts: {
    eyebrow: "Segurança meteorológica",
    title: "Consulte os avisos antes de decidir.",
    description:
      "Alertas oficiais e informações locais para orientar atividades, deslocamentos e cuidados preventivos.",
  },
  general: {
    eyebrow: "Tempo e águas de Pelotas",
    title: "Informação local para acompanhar o dia.",
    description:
      "Previsão, medições, avisos oficiais e situação das águas reunidos em um único portal.",
  },
} as const;

function footerTopic(pathname: string): keyof typeof footerLeadByTopic {
  if (pathname === "/alertas") return "alerts";
  if (
    pathname.startsWith("/situacao-hidrologica-pelotas") ||
    pathname.startsWith("/nivel-da-lagoa-dos-patos-laranjal")
  ) {
    return "water";
  }
  if (
    pathname.startsWith("/estacao-embrapa-pelotas") ||
    pathname.startsWith("/radar-e-satelite-pelotas") ||
    pathname.startsWith("/historico-climatico-pelotas") ||
    pathname.startsWith("/cameras-ao-vivo-pelotas") ||
    pathname.startsWith("/metodologia")
  ) {
    return "monitoring";
  }
  if (
    pathname === "/" ||
    pathname.startsWith("/tempo-") ||
    pathname.startsWith("/previsao-") ||
    pathname.startsWith("/chuva-em-pelotas") ||
    pathname.startsWith("/vento-em-pelotas")
  ) {
    return "forecast";
  }
  return "general";
}

export function getFooterLead(pathname: string) {
  return footerLeadByTopic[footerTopic(pathname)];
}
