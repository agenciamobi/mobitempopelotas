import type { Metadata } from "next";
import Link from "next/link";
import { ForecastPageShell } from "@/components/forecast-page-shell";
import { InmetAlertsPanel } from "@/components/inmet-alerts-panel";
import { SafetyChannelsDirectory } from "@/components/safety-alerts";
import { getInmetAlerts } from "@/lib/inmet-alerts";
import {
  DEFESA_CIVIL_GUIDANCE_SOURCE,
  SAFETY_BANNERS,
} from "@/lib/safety-banners";
import { formatMillimeters, getWeatherAdvisory } from "@/lib/weather-insights";
import { getPelotasWeather } from "@/lib/weather-service";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Avisos do INMET e condições de atenção em Pelotas",
  description:
    "Consulte avisos meteorológicos oficiais do INMET para Pelotas e o Rio Grande do Sul, além da leitura de chuva e vento prevista para a cidade.",
  alternates: { canonical: "/alertas" },
  openGraph: {
    title: "Avisos meteorológicos para Pelotas e o Rio Grande do Sul",
    description:
      "Acompanhe avisos oficiais do INMET e condições previstas de chuva, vento e temporais em Pelotas, RS.",
    url: "/alertas",
  },
};

export default async function AlertasPage() {
  const [weather, inmetAlerts] = await Promise.all([
    getPelotasWeather(),
    getInmetAlerts(),
  ]);
  const advisory = getWeatherAdvisory(weather);
  const today = weather.daily[0];
  const maxHourlyRain = Math.max(
    today?.rainChance ?? 0,
    ...weather.hourly.map((hour) => hour.precipitation),
  );
  const maxHourlyGust = Math.max(
    weather.current.windGust,
    ...weather.hourly.map((hour) => hour.windGust),
  );
  const inmetAvailable = inmetAlerts.status === "live";
  const officialAlertCount = inmetAvailable ? inmetAlerts.counts.total : null;

  return (
    <ForecastPageShell
      weather={weather}
      eyebrow="Avisos e atenção meteorológica"
      title="O que exige atenção em Pelotas e no RS"
      description="Primeiro, consulte os avisos oficiais do INMET. Depois, veja a leitura calculada pelo TEMPO Pelotas para chuva, vento e temporais previstos na cidade."
      currentPath="/alertas"
      heroStat={{
        label: inmetAvailable ? "Avisos oficiais encontrados" : "Consulta oficial",
        value: officialAlertCount ?? "—",
        detail: inmetAvailable
          ? officialAlertCount === 1
            ? "aviso no Rio Grande do Sul"
            : "avisos no Rio Grande do Sul"
          : "INMET temporariamente indisponível",
        ariaLabel: inmetAvailable
          ? `${officialAlertCount} avisos oficiais encontrados no Rio Grande do Sul`
          : "Consulta aos avisos oficiais do INMET temporariamente indisponível",
        tone: "alerts",
      }}
    >
      <InmetAlertsPanel data={inmetAlerts} />

      <SafetyChannelsDirectory
        banners={SAFETY_BANNERS}
        sourceName={DEFESA_CIVIL_GUIDANCE_SOURCE.name}
        sourceUrl={DEFESA_CIVIL_GUIDANCE_SOURCE.url}
      />

      <section className={`advisory-panel advisory-panel--${advisory.level}`} aria-labelledby="advisory-title">
        <div className="advisory-symbol" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M12 3 2 20h20L12 3Zm0 6v5m0 3v.01" /></svg>
        </div>
        <div>
          <span className="eyebrow">Leitura calculada pelo TEMPO Pelotas</span>
          <h2 id="advisory-title">{advisory.title}</h2>
          <p>{advisory.description}</p>
          {advisory.reasons.length ? (
            <ul>
              {advisory.reasons.map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
          ) : null}
        </div>
      </section>

      <section className="topic-metrics" aria-label="Informações usadas na avaliação local">
        <article>
          <span>Maior chance de chuva</span>
          <strong>{maxHourlyRain}%</strong>
          <small>Hoje e próximas horas</small>
        </article>
        <article>
          <span>Volume de chuva previsto</span>
          <strong>{formatMillimeters(today?.precipitation ?? 0)} mm</strong>
          <small>Para hoje</small>
        </article>
        <article>
          <span>Rajada mais forte prevista</span>
          <strong>{maxHourlyGust} km/h</strong>
          <small>Agora e próximas horas</small>
        </article>
        <article>
          <span>Tempo agora</span>
          <strong>{weather.current.temperature}°C</strong>
          <small>{weather.current.condition}</small>
        </article>
      </section>

      <section className="lagoon-alert-card" aria-label="Nível da Lagoa dos Patos">
        <span aria-hidden="true">≋</span>
        <div>
          <strong>Nível da Lagoa dos Patos no Laranjal</strong>
          <small>
            Veja se o nível está subindo ou baixando e compare com vento, chuva e avisos oficiais.
          </small>
        </div>
        <Link href="/nivel-da-lagoa-dos-patos-laranjal">Ver medidor</Link>
      </section>

      <section className="topic-section" aria-labelledby="monitoring-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Como calculamos a atenção local</span>
            <h2 id="monitoring-title">O que significa cada situação</h2>
          </div>
          <p>Esta classificação organiza dados da previsão para Pelotas. Ela é independente dos avisos oficiais emitidos pelo INMET ou pela Defesa Civil.</p>
        </div>
        <div className="threshold-grid">
          <article>
            <span className="threshold-dot threshold-dot--normal" aria-hidden="true" />
            <h3>Sem sinal importante no momento</h3>
            <p>A previsão não mostra temporal, chuva muito volumosa ou rajadas fortes para o período analisado.</p>
          </article>
          <article>
            <span className="threshold-dot threshold-dot--attention" aria-hidden="true" />
            <h3>Atenção</h3>
            <p>Há chance alta de chuva, volume mais elevado ou rajadas que merecem acompanhamento.</p>
          </article>
          <article>
            <span className="threshold-dot threshold-dot--warning" aria-hidden="true" />
            <h3>Atenção redobrada</h3>
            <p>A previsão mostra temporal, chuva muito volumosa ou rajadas fortes. Consulte imediatamente os avisos oficiais.</p>
          </article>
        </div>
      </section>

      <section className="topic-section topic-copy" aria-labelledby="official-alerts-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Segurança</span>
            <h2 id="official-alerts-title">Siga sempre as orientações oficiais</h2>
          </div>
        </div>
        <div className="copy-columns">
          <div>
            <h3>Defesa Civil</h3>
            <p>Em situações de risco, siga as orientações da Defesa Civil do Rio Grande do Sul e da Defesa Civil de Pelotas.</p>
          </div>
          <div>
            <h3>INMET e autoridades locais</h3>
            <p>Confirme a área abrangida no aviso original e evite deslocamentos ou atividades externas quando houver recomendação de segurança.</p>
          </div>
        </div>
        <p className="data-note">
          A ausência de aviso nesta página não garante ausência de risco. O serviço oficial pode ficar indisponível ou ser atualizado a qualquer momento.
        </p>
      </section>
    </ForecastPageShell>
  );
}
