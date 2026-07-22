import type { Metadata } from "next";
import { ForecastPageShell } from "@/components/forecast-page-shell";
import { PelotasHydrologyWidget } from "@/components/pelotas-hydrology-widget";
import { getLaranjalLevelData } from "@/lib/laranjal-level";
import { LAGOON_LEVEL_SOURCE } from "@/lib/lagoon-level";
import { absoluteUrl } from "@/lib/site";
import { getPelotasWeather } from "@/lib/weather-service";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Nível da Lagoa dos Patos no Laranjal",
  description:
    "Acompanhe a leitura atual e o histórico recente da Estação Laranjal, com dados públicos do LabHidroSens/UFPel.",
  alternates: { canonical: "/nivel-da-lagoa-dos-patos-laranjal" },
  openGraph: {
    title: "Nível da Lagoa dos Patos no Laranjal",
    description:
      "Veja a medição atual, a variação recente e o horário da última leitura da Estação Laranjal.",
    url: "/nivel-da-lagoa-dos-patos-laranjal",
  },
};

function formatLevel(value: number | null) {
  if (value === null) return "UFPel";

  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} m`;
}

export default async function NivelDaLagoaPage() {
  const [weather, laranjal] = await Promise.all([
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
      "Leitura atual e histórico recente da Estação Laranjal, em Pelotas, com contexto meteorológico local.",
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
      description="Acompanhe a leitura da Estação Laranjal e a variação das últimas horas. Os dados vêm da telemetria pública do LabHidroSens/UFPel; o TEMPO Pelotas não define cota de risco ou ordem de saída."
      currentPath="/nivel-da-lagoa-dos-patos-laranjal"
      heroStat={{
        label:
          laranjal.status === "live"
            ? "Leitura atual"
            : laranjal.status === "stale"
              ? "Última leitura disponível"
              : "Fonte local",
        value: formatLevel(laranjal.currentLevel),
        detail:
          laranjal.status === "live"
            ? "Estação Laranjal atualizada"
            : laranjal.status === "stale"
              ? "dados com atualização atrasada"
              : "LabHidroSens/UFPel",
        ariaLabel:
          laranjal.currentLevel === null
            ? "Fonte local: LabHidroSens e UFPel"
            : `Nível atual da Lagoa dos Patos no Laranjal: ${formatLevel(laranjal.currentLevel)}`,
        tone: "water",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webpageSchema).replace(/</g, "\\u003c"),
        }}
      />

      <PelotasHydrologyWidget
        initialData={laranjal}
        weather={{
          windSpeed: weather.current.windSpeed,
          windDirection: weather.current.windDirection,
          windGust: maxHourlyGust,
          precipitation: today?.precipitation ?? 0,
        }}
      />

      <section
        className="topic-section lagoon-explanation"
        aria-labelledby="lagoon-explanation-title"
      >
        <div className="section-heading">
          <div>
            <span className="eyebrow">Contexto meteorológico</span>
            <h2 id="lagoon-explanation-title">Vento e chuva em Pelotas</h2>
          </div>
          <p>
            Os dados meteorológicos ajudam a contextualizar o comportamento da água,
            mas não são usados pelo portal para classificar risco no Laranjal.
          </p>
        </div>

        <div className="lagoon-explanation-grid">
          <article>
            <span>01</span>
            <h3>Vento agora</h3>
            <p>
              {weather.current.windSpeed} km/h, direção {weather.current.windDirection}.
            </p>
          </article>
          <article>
            <span>02</span>
            <h3>Rajada prevista</h3>
            <p>Até {maxHourlyGust} km/h nas próximas horas.</p>
          </article>
          <article>
            <span>03</span>
            <h3>Chuva prevista hoje</h3>
            <p>{today?.precipitation ?? 0} mm na previsão diária para Pelotas.</p>
          </article>
        </div>

        <div className="lagoon-disclaimer">
          <strong>Medição e referencial permanecem com a UFPel</strong>
          <p>
            O portal organiza a telemetria pública para facilitar a leitura. Para
            conferência técnica, consulte o painel original. Em situações de risco,
            siga a Defesa Civil e as autoridades responsáveis.
          </p>
        </div>
      </section>
    </ForecastPageShell>
  );
}
