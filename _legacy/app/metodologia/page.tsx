import type { Metadata } from "next";
import Link from "next/link";
import { ForecastPageShell } from "@/components/forecast-page-shell";
import {
  HYDROLOGY_DATA_SOURCES,
  HYDROLOGY_STATIONS,
} from "@/lib/hydrology";
import { absoluteUrl } from "@/lib/site";
import { getPelotasWeather } from "@/lib/weather-service";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "De onde vêm as informações do TEMPO Pelotas",
  description:
    "Saiba de onde vêm a previsão, as medições da Embrapa, o nível da lagoa e as informações sobre o Guaíba.",
  alternates: { canonical: "/metodologia" },
  openGraph: {
    title: "Fontes das informações do TEMPO Pelotas",
    description:
      "Veja quem fornece cada informação e quais cuidados o portal toma antes de exibi-la.",
    url: "/metodologia",
  },
};

const validationRules = [
  {
    title: "Sempre mostramos a fonte",
    description:
      "Cada informação deve indicar quem é responsável pela medição ou previsão e quando ela foi atualizada.",
  },
  {
    title: "Uma leitura antiga não substitui uma nova",
    description:
      "Quando guardamos valores anteriores, impedimos que uma informação mais velha apareça como se fosse a mais recente.",
  },
  {
    title: "Só mostramos valores reconhecidos",
    description:
      "Quando um número não pode ser confirmado, ele é ignorado e a página informa que a medição está indisponível.",
  },
  {
    title: "Medição e previsão são diferentes",
    description:
      "O que foi medido por uma estação aparece separado do que está previsto para as próximas horas ou dias.",
  },
  {
    title: "Falhas ficam visíveis",
    description:
      "Quando uma estação atrasa, uma página fica fora do ar ou uma informação não pode ser lida, o visitante é avisado.",
  },
  {
    title: "Não criamos alertas oficiais",
    description:
      "O portal não inventa marcas de risco para bairros e não substitui os avisos da Defesa Civil e das autoridades responsáveis.",
  },
];

export default async function MetodologiaPage() {
  const weather = await getPelotasWeather();

  const techArticleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Fontes das informações do TEMPO Pelotas",
    description:
      "Explicação pública sobre a origem e os cuidados adotados com as informações exibidas no portal.",
    url: absoluteUrl("/metodologia"),
    inLanguage: "pt-BR",
    dateModified: new Date().toISOString(),
    author: {
      "@type": "Organization",
      name: "TEMPO Pelotas",
    },
  };

  return (
    <ForecastPageShell
      weather={weather}
      eyebrow="Transparência"
      title="De onde vêm as informações"
      description="Veja quem fornece cada medição e previsão, como o portal apresenta esses valores e quais limites devem ser considerados."
      currentPath="/metodologia"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(techArticleSchema).replace(/</g, "\\u003c"),
        }}
      />

      <section className="topic-section" aria-labelledby="method-purpose-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Nosso objetivo</span>
            <h2 id="method-purpose-title">Facilitar o acesso a informações importantes</h2>
          </div>
          <p>
            O TEMPO Pelotas reúne informações que estavam espalhadas em diferentes páginas. Nosso papel
            é apresentá-las de forma clara, mostrar quem é responsável por cada valor e avisar quando uma
            informação estiver atrasada ou indisponível.
          </p>
        </div>

        <div className="methodology-rules-grid">
          <article>
            <h3>Previsão do tempo</h3>
            <p>
              A temperatura, a chuva e o vento previstos vêm do Open-Meteo, que reúne previsões de grandes serviços meteorológicos internacionais.
            </p>
          </article>
          <article>
            <h3>Medições da Embrapa</h3>
            <p>
              Temperatura, umidade, pressão, vento e chuva são consultados na página pública da Embrapa Clima Temperado em Pelotas.
            </p>
          </article>
          <article>
            <h3>Nível da Lagoa dos Patos</h3>
            <p>
              O medidor da Praia do Laranjal é fornecido pelo LabHidroSens / UFPel e aparece sem alteração dentro do portal.
            </p>
          </article>
          <article>
            <h3>Nível do Guaíba</h3>
            <p>
              O acompanhamento de Porto Alegre é apresentado pelo projeto Nível Guaíba, que reúne informações da ANA e do Serviço Geológico do Brasil.
            </p>
          </article>
        </div>
      </section>

      <section className="topic-section" aria-labelledby="method-embrapa-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Medições da Embrapa</span>
            <h2 id="method-embrapa-title">Como os valores chegam ao portal</h2>
          </div>
          <p>
            O TEMPO Pelotas consulta periodicamente a página pública da estação e mostra os mesmos valores encontrados nela.
          </p>
        </div>

        <div className="methodology-rules-grid">
          <article>
            <h3>Consulta frequente</h3>
            <p>
              A página da Embrapa é consultada várias vezes ao longo do dia para buscar as medições mais recentes.
            </p>
          </article>
          <article>
            <h3>Valores mantidos como publicados</h3>
            <p>
              O portal organiza os números para facilitar a leitura, mas não altera a temperatura, a chuva, o vento ou os demais valores.
            </p>
          </article>
          <article>
            <h3>Somente informações reconhecidas</h3>
            <p>
              Quando um valor não aparece de forma clara na página original, ele não é preenchido por aproximação.
            </p>
          </article>
          <article>
            <h3>A fonte original continua disponível</h3>
            <p>
              Todas as páginas mantêm um caminho para consultar diretamente a instituição responsável pela informação.
            </p>
          </article>
        </div>
      </section>

      <section className="topic-section" aria-labelledby="method-sources-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Fontes consultadas</span>
            <h2 id="method-sources-title">Quem fornece cada informação</h2>
          </div>
          <p>
            Algumas fontes já aparecem no portal. Outras ainda estão sendo estudadas e não são apresentadas como se estivessem funcionando.
          </p>
        </div>

        <div className="methodology-source-grid">
          {HYDROLOGY_DATA_SOURCES.map((source) => (
            <article key={source.id}>
              <span className={`source-status source-status--${source.status}`}>
                {source.statusLabel}
              </span>
              <small>{source.organization}</small>
              <h3>{source.name}</h3>
              <p>{source.description}</p>
              <a href={source.url} target="_blank" rel="noreferrer">
                Consultar responsável
                <span aria-hidden="true">↗</span>
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="topic-section" aria-labelledby="method-stations-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Locais de medição das águas</span>
            <h2 id="method-stations-title">Pontos acompanhados na região</h2>
          </div>
          <p>
            Cada ponto possui uma identificação própria. Como os medidores podem usar referências diferentes,
            o número de uma cidade não deve ser comparado diretamente com o de outra.
          </p>
        </div>

        <div className="hydrology-stations-grid">
          {HYDROLOGY_STATIONS.map((station) => (
            <article key={station.code}>
              <span className="station-code">Identificação ANA {station.code}</span>
              <small>{station.city}</small>
              <h3>{station.name}</h3>
              <p>{station.role}</p>
              <a href={station.officialUrl} target="_blank" rel="noreferrer">
                Consultar medição oficial
                <span aria-hidden="true">↗</span>
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="topic-section" aria-labelledby="method-validation-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Cuidados com as informações</span>
            <h2 id="method-validation-title">Como evitamos confundir o visitante</h2>
          </div>
          <p>
            Estas regras ajudam a separar o que foi medido, o que está previsto e o que ainda não está disponível.
          </p>
        </div>

        <div className="methodology-rules-grid">
          {validationRules.map((rule) => (
            <article key={rule.title}>
              <h3>{rule.title}</h3>
              <p>{rule.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="topic-section" aria-labelledby="method-raw-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Informações públicas</span>
            <h2 id="method-raw-title">Arquivos disponíveis para consulta</h2>
          </div>
          <p>
            Pesquisadores, estudantes e outros projetos também podem consultar os resumos públicos mantidos pelo TEMPO Pelotas.
          </p>
        </div>

        <div className="raw-data-grid">
          <a href="/pelotas.json">
            <strong>Resumo de Pelotas</strong>
            <span>Reúne previsão, medições da Embrapa e informações sobre as águas.</span>
          </a>
          <a href="/api/weather/embrapa">
            <strong>Medições da Embrapa</strong>
            <span>Apresenta os valores reconhecidos na estação de Pelotas.</span>
          </a>
          <a href="/api/weather">
            <strong>Previsão do tempo</strong>
            <span>Reúne temperatura, chuva, vento e previsão para os próximos dias.</span>
          </a>
          <a href="/api/weather/history">
            <strong>Últimos 30 dias</strong>
            <span>Apresenta temperatura, chuva e rajadas do período recente.</span>
          </a>
          <a href="/feed">
            <strong>Atualizações do portal</strong>
            <span>Permite acompanhar as principais informações publicadas pelo TEMPO Pelotas.</span>
          </a>
        </div>
      </section>

      <section className="topic-section" aria-labelledby="method-limit-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Importante</span>
            <h2 id="method-limit-title">O portal não substitui as autoridades</h2>
          </div>
        </div>

        <div className="lagoon-disclaimer">
          <strong>Em situações de risco, siga os avisos oficiais</strong>
          <p>
            O TEMPO Pelotas não determina quando uma área vai alagar, não emite ordens de saída e não
            consegue garantir que todas as fontes externas estarão disponíveis o tempo todo. Em risco
            iminente, siga a Defesa Civil e as autoridades responsáveis.
          </p>
        </div>

        <div className="hydrology-home-actions">
          <Link className="hydrology-primary-action" href="/situacao-hidrologica-pelotas">
            Ver situação das águas
            <span aria-hidden="true">→</span>
          </Link>
          <Link className="hydrology-secondary-action" href="/estacao-embrapa-pelotas">
            Ver medições da Embrapa
          </Link>
          <Link className="hydrology-secondary-action" href="/">
            Voltar à página inicial
          </Link>
        </div>
      </section>
    </ForecastPageShell>
  );
}
