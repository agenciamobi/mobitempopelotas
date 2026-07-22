import type { Metadata } from "next";
import Link from "next/link";
import { ForecastPageShell } from "@/components/forecast-page-shell";
import { WeatherHistoryChart } from "@/components/weather-history-chart";
import { absoluteUrl } from "@/lib/site";
import { getPelotasWeatherHistory } from "@/lib/weather-history-service";
import { getPelotasWeather } from "@/lib/weather-service";

export const revalidate = 21600;

export const metadata: Metadata = {
  title: "Clima em Pelotas: tempo, chuva e histórico recente",
  description:
    "Entenda a diferença entre tempo e clima em Pelotas e consulte observações atuais, previsão de 7 dias e dados recentes de temperatura, chuva e vento.",
  alternates: { canonical: "/clima-em-pelotas" },
  openGraph: {
    title: "Clima em Pelotas, RS",
    description:
      "Acompanhe observações atuais, previsão e histórico meteorológico recente de Pelotas.",
    url: "/clima-em-pelotas",
  },
};

export default async function ClimaEmPelotasPage() {
  const [weather, history] = await Promise.all([
    getPelotasWeather(),
    getPelotasWeatherHistory(),
  ]);

  const hasReliableWeather = !weather.source.isFallback;
  const hasReliableHistory = !history.source.isFallback && history.days.length > 0;
  const { summary } = history;

  const faqs = [
    {
      question: "Qual é a diferença entre tempo e clima?",
      answer:
        "Tempo descreve as condições observadas ou previstas para horas e dias. Clima exige a análise de séries longas para identificar padrões de uma região.",
    },
    {
      question: "Os últimos 30 dias definem o clima de Pelotas?",
      answer:
        "Não. O histórico recente ajuda a comparar o período atual, mas não substitui uma normal climatológica calculada com muitos anos de observações.",
    },
    {
      question: "Quais dados o TEMPO Pelotas publica nesta página?",
      answer:
        "O portal reúne condições atuais quando há observação válida, previsão de até 7 dias e histórico meteorológico recente de até 30 dias, sempre identificando as fontes e limitações.",
    },
    {
      question: "De onde vêm as informações meteorológicas?",
      answer:
        "As condições observadas podem usar a estação da Embrapa Clima Temperado quando a leitura está válida e recente. A previsão e o histórico recente utilizam serviços meteorológicos identificados na metodologia do portal.",
    },
  ];

  const pageSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "Clima em Pelotas",
        description:
          "Página sobre tempo, clima, previsão e histórico meteorológico recente de Pelotas, Rio Grande do Sul.",
        url: absoluteUrl("/clima-em-pelotas"),
        about: {
          "@type": "Place",
          name: "Pelotas, Rio Grande do Sul, Brasil",
          geo: {
            "@type": "GeoCoordinates",
            latitude: -31.7654,
            longitude: -52.3376,
          },
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
    ],
  };

  return (
    <ForecastPageShell
      weather={weather}
      eyebrow="Tempo, clima e dados recentes"
      title="Clima em Pelotas"
      description="Entenda o que está acontecendo agora, o que está previsto e o que os últimos dias mostram — sem confundir previsão com padrão climático de longo prazo."
      currentPath="/clima-em-pelotas"
      heroStat={{
        label: hasReliableHistory ? summary.periodLabel : "Histórico recente",
        value: hasReliableHistory ? history.days.length : "Sem dados",
        detail: hasReliableHistory
          ? "dias analisados, não uma normal climatológica"
          : "aguardando uma série confiável",
        ariaLabel: hasReliableHistory
          ? `${history.days.length} dias analisados no histórico meteorológico recente de Pelotas`
          : "Histórico recente temporariamente indisponível",
        tone: "history",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(pageSchema).replace(/</g, "\\u003c"),
        }}
      />

      <section className="topic-section topic-copy" aria-labelledby="climate-difference-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Conceito essencial</span>
            <h2 id="climate-difference-title">Tempo e clima não são a mesma coisa</h2>
          </div>
          <p>
            Uma previsão informa o que pode acontecer nas próximas horas ou dias. Para descrever o clima de uma cidade, é necessário analisar séries meteorológicas longas e consistentes.
          </p>
        </div>
        <div className="copy-columns">
          <div>
            <h3>Tempo agora e previsão</h3>
            <p>
              Temperatura, chuva, vento e condição do céu mudam continuamente. Esses dados são usados nas páginas de hoje, amanhã e dos próximos 7 dias.
            </p>
          </div>
          <div>
            <h3>Histórico recente</h3>
            <p>
              Os últimos 30 dias ajudam a comparar máximas, mínimas, chuva e rajadas do período recente, mas não representam sozinhos o clima de Pelotas.
            </p>
          </div>
          <div>
            <h3>Normal climatológica</h3>
            <p>
              Médias climáticas de longo prazo só devem ser publicadas quando houver uma série oficial adequada, com período, estação e metodologia claramente identificados.
            </p>
          </div>
          <div>
            <h3>Transparência das fontes</h3>
            <p>
              O portal informa quando usa observação, previsão, histórico recente ou contingência. Dados demonstrativos não são apresentados como medições reais.
            </p>
          </div>
        </div>
      </section>

      {hasReliableWeather ? (
        <section className="topic-metrics" aria-label="Condições e fontes meteorológicas atuais">
          <article>
            <span>Temperatura atual</span>
            <strong>{weather.current.temperature}°C</strong>
            <small>{weather.current.condition}</small>
          </article>
          <article>
            <span>Fonte da condição atual</span>
            <strong>{weather.current.source.name}</strong>
            <small>{weather.current.updatedAt}</small>
          </article>
          <article>
            <span>Horizonte da previsão</span>
            <strong>{weather.daily.length} dias</strong>
            <small>Somente o período fornecido pela fonte</small>
          </article>
          <article>
            <span>Fonte da previsão</span>
            <strong>{weather.source.forecastName ?? weather.source.name}</strong>
            <small>Atualização automática</small>
          </article>
        </section>
      ) : (
        <section className="history-note" aria-labelledby="climate-weather-unavailable-title">
          <span className="eyebrow">Condição atual indisponível</span>
          <h2 id="climate-weather-unavailable-title">Os dados meteorológicos não estão disponíveis agora</h2>
          <p>
            O portal não substitui a fonte ausente por números demonstrativos. As páginas voltam a exibir as medições e previsões quando a consulta confiável é restabelecida.
          </p>
        </section>
      )}

      {hasReliableHistory ? (
        <>
          <section className="topic-section" aria-labelledby="climate-recent-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Leitura do período recente</span>
                <h2 id="climate-recent-title">O que aconteceu nos últimos {history.days.length} dias</h2>
              </div>
              <p>
                Estes valores descrevem apenas o intervalo de {summary.periodLabel}. Eles servem para comparação recente, não para definir médias climáticas permanentes.
              </p>
            </div>
            <div className="history-summary" aria-label="Resumo meteorológico recente">
              <article>
                <span>Média das máximas</span>
                <strong>{summary.averageMax}°C</strong>
                <small>{summary.periodLabel}</small>
              </article>
              <article>
                <span>Média das mínimas</span>
                <strong>{summary.averageMin}°C</strong>
                <small>Durante o período analisado</small>
              </article>
              <article>
                <span>Chuva acumulada</span>
                <strong>{summary.totalPrecipitation.toFixed(1)} mm</strong>
                <small>Total estimado no período</small>
              </article>
              <article>
                <span>Rajada mais forte</span>
                <strong>{summary.strongestWindGust} km/h</strong>
                <small>Maior valor encontrado</small>
              </article>
            </div>
          </section>

          <WeatherHistoryChart days={history.days} />

          <section className="history-note" aria-labelledby="climate-history-source-title">
            <span className="eyebrow">Origem do histórico recente</span>
            <h2 id="climate-history-source-title">Dados identificados e período delimitado</h2>
            <p>
              O gráfico usa {history.source.name}. O período analisado é informado na própria página para evitar que uma leitura recente seja confundida com uma normal climatológica.
            </p>
            <Link href="/historico-climatico-pelotas">Ver o histórico recente completo</Link>
          </section>
        </>
      ) : (
        <section className="history-note" aria-labelledby="climate-history-unavailable-title">
          <span className="eyebrow">Histórico temporariamente indisponível</span>
          <h2 id="climate-history-unavailable-title">Nenhuma série demonstrativa será exibida</h2>
          <p>
            O histórico recente volta a aparecer quando uma fonte confiável ou o arquivo meteorológico próprio estiver disponível.
          </p>
        </section>
      )}

      <section className="topic-section topic-copy" aria-labelledby="climate-paths-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Consulte por objetivo</span>
            <h2 id="climate-paths-title">Escolha o dado adequado para cada decisão</h2>
          </div>
        </div>
        <div className="copy-columns">
          <div>
            <h3>Para sair agora</h3>
            <p>Consulte as condições atuais, a previsão por hora e os avisos meteorológicos.</p>
            <Link href="/tempo-hoje-pelotas">Ver o tempo de hoje</Link>
          </div>
          <div>
            <h3>Para organizar o próximo dia</h3>
            <p>Veja máxima, mínima, chuva e rajadas previstas para amanhã.</p>
            <Link href="/tempo-amanha-pelotas">Ver o tempo de amanhã</Link>
          </div>
          <div>
            <h3>Para planejar a semana</h3>
            <p>Use somente o horizonte de 7 dias atualmente fornecido pela integração meteorológica.</p>
            <Link href="/previsao-7-dias-pelotas">Ver a previsão de 7 dias</Link>
          </div>
          <div>
            <h3>Para entender as fontes</h3>
            <p>Consulte a origem, a frequência de atualização e as limitações de cada conjunto de dados.</p>
            <Link href="/metodologia">Ver fontes e metodologia</Link>
          </div>
        </div>
      </section>

      <section className="topic-section topic-copy" aria-labelledby="climate-faq-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Dúvidas comuns</span>
            <h2 id="climate-faq-title">Perguntas sobre o clima em Pelotas</h2>
          </div>
        </div>
        <div className="faq-list">
          {faqs.map((faq) => (
            <details key={faq.question}>
              <summary>{faq.question}</summary>
              <p>{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </ForecastPageShell>
  );
}
