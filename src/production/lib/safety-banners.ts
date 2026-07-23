export type SafetyBannerTone = "information" | "attention" | "severe";

export type SafetyBanner = {
  id: "sms" | "whatsapp" | "cell-broadcast" | "official-channel";
  eyebrow: string;
  title: string;
  description: string;
  actionLabel?: string;
  actionUrl?: string;
  tone: SafetyBannerTone;
  external?: boolean;
};

export const DEFESA_CIVIL_GUIDANCE_SOURCE = {
  name: "Governo do Rio Grande do Sul · Defesa Civil",
  url: "https://www.estado.rs.gov.br/como-se-cadastrar-para-receber-avisos-e-alertas-da-defesa-civil-no-celular",
  reviewedAt: "2026-07-21",
};

export const SAFETY_BANNERS: SafetyBanner[] = [
  {
    id: "sms",
    eyebrow: "Avisos gratuitos no celular",
    title: "Cadastre seu CEP no serviço 40199",
    description:
      "Envie por SMS o CEP da sua casa, trabalho ou outra área de interesse para o número 40199 e receba avisos da Defesa Civil.",
    actionLabel: "Ver todos os canais",
    actionUrl: "/alertas#canais-defesa-civil",
    tone: "information",
  },
  {
    id: "whatsapp",
    eyebrow: "Defesa Civil Nacional",
    title: "Receba avisos também pelo WhatsApp",
    description:
      "Inicie a conversa, envie “Oi” e escolha as localidades que deseja acompanhar. O canal nacional não substitui os avisos específicos do Rio Grande do Sul.",
    actionLabel: "Abrir WhatsApp",
    actionUrl: "https://wa.me/556120344611",
    tone: "attention",
    external: true,
  },
  {
    id: "cell-broadcast",
    eyebrow: "Alertas severos e extremos",
    title: "O Cell Broadcast não exige cadastro",
    description:
      "Em situações graves, celulares conectados às redes 4G ou 5G na área de risco podem receber uma mensagem sobreposta à tela, com som, vibração e orientações de segurança.",
    tone: "severe",
  },
  {
    id: "official-channel",
    eyebrow: "Informação oficial do Estado",
    title: "Siga o canal da Defesa Civil RS",
    description:
      "Acompanhe comunicados, orientações preventivas e atualizações publicadas diretamente pela Defesa Civil do Rio Grande do Sul.",
    actionLabel: "Abrir canal oficial",
    actionUrl: "https://www.whatsapp.com/channel/0029VbAHjAn2f3EQlWU7nz2E",
    tone: "information",
    external: true,
  },
];

export function getFeaturedSafetyBanner(hasOfficialAlerts: boolean) {
  return SAFETY_BANNERS.find((banner) =>
    hasOfficialAlerts ? banner.id === "whatsapp" : banner.id === "sms",
  )!;
}
