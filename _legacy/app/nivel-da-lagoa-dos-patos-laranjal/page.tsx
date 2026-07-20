import type { Metadata } from "next";
import { ForecastPageShell } from "@/components/forecast-page-shell";
import { PelotasHydrologyWidget } from "@/components/pelotas-hydrology-widget";
import { getLaranjalLevelData } from "@/lib/laranjal-level";
import { absoluteUrl } from "@/lib/site";
import { LAGOON_LEVEL_SOURCE } from "@/lib/lagoon-level";
import { getPelotasWeather } from "@/lib/weather-service";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Nível da Lagoa dos Patos no Laranjal em tempo real",
  description:
    "Acompanhe o nível da Lagoa dos Patos na Estação Laranjal, em Pelotas, e veja a relação com vento e chuva.",
  alternates: { canonical: "/nivel-da-lagoa-dos-patos-laranjal" },
  openGraph: {
    title: "Nível da Lagoa dos Patos no Laranjal",
    description:
      "Veja o nível medido na Praia do Laranjal e saiba o que observar.",
    url: "/nivel-da-lagoa-dos-patos-laranjal",
  },
};

export default async function NivelDaLagoaPage() {
  const [weather, laranjalLevel] = await Promise.all([
    getPelotasWeather(),
    getLaranjalLevelData(),
  ]);
  const today = weather.daily[0];
  const maxHourlyGust = Math.max(
    weather.current.windGust,
    ...weather.hourly.map((hour) => hour.windGust),
  );

  const webpageSchema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Nível da Lagoa dos Patos na Estação Laranjal",
    url: absoluteUrl("/nivel-da-lagoa-dos-patos-laranjal"),
    description:
      "Nível da Lagoa dos Patos na Praia do Laranjal, em Pelotas, com informações de vento e chuva.",
    inLanguage: "pt-BR",
    about: {
      "@type": "BodyOfWater",
      name: "Lagoa dos Patos",
    },
    isBasedOn: LAGOON_LEVEL_SOURCE.dashboardUrl,
    provider: {
      "@type": "Organization",
      name: LAGOON_LEVEL_SOURCE.name,
    },
  };

  return (
    <ForecastPageShell
      weather={weather}
      eyebrow="Praia do Laranjal"
      title="Nível da Lagoa dos Patos"
      description="Veja a medição atual, acompanhe se o nível está subindo ou baixando e confira também o vento, a chuva e os avisos oficiais."
      currentPath="/nivel-da-lagoa-dos-patos-laranjal"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webpageSchema).replace(/</g, "\\u003c"),
        }}
      />

      <PelotasHydrologyWidget
        initialData={laranjalLevel}
        weather={{
          windSpeed: weather.current.windSpeed,
          windDirection: weather.current.windDirection,
          windGust: maxHourlyGust,
          precipitation: today?.precipitation ?? 0,
        }}
      />

      <section className="topic-section lagoon-explanation" aria-labelledby="lagoon-explanation-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Use a informação com atenção</span>
            <h2 id="lagoon-explanation-title">O que observar no medidor</h2>
          </div>
          <p>
            Um único número não conta toda a situação. Observe como o nível muda ao longo das horas e
            compare com o vento, a chuva e os comunicados das autoridades.
          </p>
        </div>

        <div className="lagoon-explanation-grid">
          <article>
            <span>01</span>
            <h3>Veja se o nível continua subindo</h3>
            <p>
              Acompanhe vários horários no gráfico. Uma alta contínua merece mais atenção do que uma
              mudança pequena em uma única leitura.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>Observe o vento e a chuva</h3>
            <p>
              O vento pode empurrar ou segurar a água perto do Laranjal. A chuva em Pelotas e em outras
              regiões que deságuam na lagoa também pode aumentar o nível.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>Confirme os avisos oficiais</h3>
            <p>
              Em caso de risco, siga as orientações da Defesa Civil, Prefeitura, Sanep e demais órgãos
              responsáveis pela segurança da população.
            </p>
          </article>
        </div>

        <div className="lagoon-disclaimer">
          <strong>O medidor ajuda no acompanhamento</strong>
          <p>
            O TEMPO Pelotas não determina quando um bairro vai alagar e não emite ordens de saída. Em
            situações de risco, siga os avisos oficiais. A medição é fornecida pela fonte indicada no quadro.
          </p>
        </div>
      </section>
    </ForecastPageShell>
  );
}
