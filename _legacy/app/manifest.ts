import type { MetadataRoute } from "next";
import { getWeatherCameras } from "@/lib/weather-cameras";

export default function manifest(): MetadataRoute.Manifest {
  const hasOnlineCamera = getWeatherCameras().some(
    (camera) => camera.status === "online",
  );
  const shortcuts = [
    {
      name: "Tempo agora",
      short_name: "Agora",
      description: "Abrir as condições atuais de Pelotas.",
      url: "/",
    },
    {
      name: "Previsão de 7 dias",
      short_name: "7 dias",
      description: "Consultar máximas, mínimas e tendência semanal.",
      url: "/previsao-7-dias-pelotas",
    },
    {
      name: "Situação das águas",
      short_name: "Águas",
      description: "Acompanhar Guaíba, Lagoa dos Patos e contexto de Pelotas.",
      url: "/situacao-hidrologica-pelotas",
    },
    {
      name: "Nível da Lagoa dos Patos",
      short_name: "Lagoa",
      description: "Abrir o medidor da Estação Laranjal.",
      url: "/nivel-da-lagoa-dos-patos-laranjal",
    },
    ...(hasOnlineCamera
      ? [
          {
            name: "Câmeras de Pelotas",
            short_name: "Câmeras",
            description: "Abrir os pontos de observação visual da cidade.",
            url: "/cameras-ao-vivo-pelotas",
          },
        ]
      : []),
    {
      name: "Condições de atenção",
      short_name: "Alertas",
      description: "Abrir as condições que merecem acompanhamento.",
      url: "/alertas",
    },
  ];

  return {
    id: "/",
    name: "TEMPO Pelotas",
    short_name: "Tempo Pelotas",
    description:
      "Previsão do tempo e situação das águas para ajudar a comunidade de Pelotas a se preparar.",
    start_url: "/",
    scope: "/",
    display: "fullscreen",
    background_color: "#eaf0f3",
    theme_color: "#071e2f",
    lang: "pt-BR",
    orientation: "portrait-primary",
    categories: ["weather", "utilities", "local", "news"],
    shortcuts,
    icons: [
      {
        src: "/brand/tempo-pelotas-icon",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/brand/tempo-pelotas-icon",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
