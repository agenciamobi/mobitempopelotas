import Link from "next/link";

const pages = [
  {
    href: "/tempo-hoje-pelotas",
    title: "Tempo hoje",
    description: "Veja como está o tempo agora e nas próximas horas.",
  },
  {
    href: "/tempo-amanha-pelotas",
    title: "Tempo amanhã",
    description: "Confira máxima, mínima, chuva e rajadas para o próximo dia.",
  },
  {
    href: "/previsao-7-dias-pelotas",
    title: "Previsão de 7 dias",
    description: "Confira temperaturas, chuva e vento para a semana.",
  },
  {
    href: "/clima-em-pelotas",
    title: "Clima em Pelotas",
    description: "Entenda previsão, observação e histórico meteorológico recente.",
  },
  {
    href: "/chuva-em-pelotas",
    title: "Chuva em Pelotas",
    description: "Veja a chance de chuva e o volume previsto.",
  },
  {
    href: "/vento-em-pelotas",
    title: "Vento em Pelotas",
    description: "Acompanhe a velocidade, a direção e as rajadas.",
  },
  {
    href: "/estacao-embrapa-pelotas",
    title: "Estação Embrapa",
    description: "Veja o que foi medido pela estação em Pelotas.",
  },
  {
    href: "/situacao-hidrologica-pelotas",
    title: "Situação das águas",
    description: "Entenda o Guaíba, a Lagoa dos Patos e Pelotas.",
  },
  {
    href: "/nivel-da-lagoa-dos-patos-laranjal",
    title: "Nível da Lagoa dos Patos",
    description: "Acompanhe o medidor da Praia do Laranjal.",
  },
  {
    href: "/historico-climatico-pelotas",
    title: "Últimos 30 dias",
    description: "Compare temperatura, chuva e vento recentes.",
  },
  {
    href: "/cameras-ao-vivo-pelotas",
    title: "Câmeras de Pelotas",
    description: "Observe o Laranjal, o Centro e o São Gonçalo.",
  },
  {
    href: "/metodologia",
    title: "Fontes das informações",
    description: "Saiba de onde vêm os dados e como são usados.",
  },
  {
    href: "/alertas",
    title: "Avisos meteorológicos",
    description: "Consulte avisos oficiais de chuva, temporal e vento.",
  },
];

type WeatherNavigationProps = {
  currentPath?: string;
};

export function WeatherNavigation({ currentPath }: WeatherNavigationProps) {
  return (
    <section className="related-weather" aria-labelledby="related-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Continue acompanhando</span>
          <h2 id="related-title">Tempo, águas e segurança em Pelotas</h2>
        </div>
      </div>
      <div className="related-weather-grid">
        {pages
          .filter((page) => page.href !== currentPath)
          .map((page) => (
            <Link href={page.href} key={page.href}>
              <strong>{page.title}</strong>
              <span>{page.description}</span>
              <i aria-hidden="true">→</i>
            </Link>
          ))}
      </div>
    </section>
  );
}
