import { Link } from "@tanstack/react-router";

import {
  FLOOD_2024_HYDROLOGICAL_PATH,
  FLOOD_2024_SOURCE_ORGANIZATIONS,
  FLOOD_2024_TIMELINE,
} from "@/lib/content/flood-2024-pelotas";

import "./Flood2024HistoricalPage.css";

export function Flood2024Hero() {
  return (
    <section className="tp-flood-hero" aria-labelledby="tp-flood-hero-title">
      <div className="tp-flood-hero__inner">
        <div className="tp-flood-hero__copy">
          <span>Registro histórico · abril a julho de 2024</span>
          <h1 id="tp-flood-hero-title">Enchente de 2024 em Pelotas e no Laranjal</h1>
          <p>
            A maior enchente da história recente de Pelotas não começou em Pelotas. A água percorreu
            rios do Centro e do Norte do Estado, passou pelo Guaíba, avançou pela Lagoa dos Patos e
            chegou dias depois ao Laranjal e ao Canal São Gonçalo.
          </p>
        </div>

        <div className="tp-flood-hero__summary" aria-label="Marcos do evento">
          <div>
            <span>Canal São Gonçalo</span>
            <strong>3,04 m</strong>
            <small>máximo registrado pela régua usada na emergência</small>
          </div>
          <div>
            <span>Sala de Situação</span>
            <strong>28 dias</strong>
            <small>de operação coletiva durante a fase crítica</small>
          </div>
          <div>
            <span>UBS Laranjal</span>
            <strong>54 dias</strong>
            <small>até a reabertura após a inundação</small>
          </div>
        </div>
      </div>
    </section>
  );
}

function HydrologicalPath() {
  return (
    <div className="tp-flood-path" aria-label="Caminho da cheia de 2024">
      {FLOOD_2024_HYDROLOGICAL_PATH.map((item, index) => (
        <div className="tp-flood-path__step" key={item}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <strong>{item}</strong>
          {index < FLOOD_2024_HYDROLOGICAL_PATH.length - 1 ? (
            <b aria-hidden="true">↓</b>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function Flood2024HistoricalPage() {
  return (
    <article className="tp-flood-history">
      <nav className="tp-flood-history__index" aria-label="Nesta página">
        <span>Nesta página</span>
        <a href="#como-a-agua-chegou">Como a água chegou</a>
        <a href="#linha-do-tempo">Linha do tempo</a>
        <a href="#por-que-pelotas-inundou">Por que Pelotas inundou depois</a>
        <a href="#caminho-da-cheia">Caminho da cheia</a>
        <a href="#ensinamentos">O que o evento ensinou</a>
      </nav>

      <section className="tp-flood-history__lead" id="como-a-agua-chegou">
        <div>
          <span>Como a água chegou até Pelotas</span>
          <h2>Um desastre hidrológico que percorreu centenas de quilômetros</h2>
        </div>
        <div className="tp-flood-history__lead-copy">
          <p>
            O desastre que chegou ao sul do Rio Grande do Sul havia começado dias antes, centenas de
            quilômetros ao norte. Chuvas extraordinárias elevaram rios como Taquari, Caí, Sinos e
            Jacuí, levando um volume excepcional de água para o Guaíba.
          </p>
          <p>
            Depois de atingir níveis históricos em Porto Alegre, essa água seguiu seu caminho natural
            para a Lagoa dos Patos. A grande extensão da Lagoa fez com que a cheia se propagasse
            gradualmente para o sul, alcançando municípios como Arambaré, São Lourenço do Sul,
            Pelotas, São José do Norte e Rio Grande.
          </p>
          <p>
            Em Pelotas, o nível já elevado da Lagoa dos Patos se combinou com chuvas locais,
            contribuição do Canal São Gonçalo e da Lagoa Mirim, direção dos ventos, condições de maré
            e limitações momentâneas do escoamento pelo estuário de Rio Grande.
          </p>
          <p>
            O resultado foi uma inundação prolongada que atingiu principalmente áreas baixas do
            município, incluindo o Laranjal, Colônia Z3, Pontal da Barra e regiões próximas ao Canal
            São Gonçalo.
          </p>
        </div>

        <div className="tp-flood-history__chain">
          <strong>
            Chuvas extremas no RS → rios da Bacia do Guaíba → Guaíba → Lagoa dos Patos → Pelotas e
            Laranjal → Rio Grande → Oceano Atlântico
          </strong>
          <p>
            Essa sequência explica uma característica marcante da enchente de 2024: enquanto Porto
            Alegre enfrentava seu período mais crítico no início de maio, Pelotas ainda aguardava a
            propagação de grande parte daquele volume de água pela Lagoa dos Patos.
          </p>
        </div>
      </section>

      <section className="tp-flood-timeline" id="linha-do-tempo" aria-labelledby="tp-flood-timeline-title">
        <header>
          <span>Linha do tempo</span>
          <h2 id="tp-flood-timeline-title">Da chuva extrema ao retorno das famílias</h2>
          <p>
            A camada “onde estava a água” acompanha cada momento para mostrar como o problema avançou
            pelo sistema hidrológico antes de atingir Pelotas e, depois, como a cidade entrou na fase
            de drenagem e reconstrução.
          </p>
        </header>

        <div className="tp-flood-timeline__list">
          {FLOOD_2024_TIMELINE.map((item) => (
            <section className={`tp-flood-event is-${item.stage}`} key={`${item.date}-${item.title}`}>
              <div className="tp-flood-event__date">
                <span>{item.date}</span>
                <small>Onde estava o problema</small>
                <strong>{item.stageLabel}</strong>
              </div>
              <div className="tp-flood-event__body">
                <h3>{item.title}</h3>
                {item.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {item.highlight ? <b className="tp-flood-event__highlight">{item.highlight}</b> : null}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="tp-flood-explanation" id="por-que-pelotas-inundou">
        <div>
          <span>Por que Pelotas inundou dias depois de Porto Alegre?</span>
          <h2>A cheia não foi um evento isolado da cidade</h2>
        </div>
        <div>
          <p>
            Grande parte da água que atingiu o município percorreu centenas de quilômetros antes de
            chegar ao sul do Estado.
          </p>
          <p>
            Enquanto rios do Centro e do Norte descarregavam no sistema do Guaíba, a Lagoa dos Patos
            precisava receber e transportar esse enorme volume em direção ao único grande caminho de
            saída para o Oceano Atlântico, pelo estuário de Rio Grande.
          </p>
          <p>
            O processo é lento porque a Lagoa dos Patos possui enorme extensão e está inserida em uma
            região de relevo muito plano. Em determinados momentos, vento e maré ainda dificultaram o
            escoamento e provocaram deslocamento e empilhamento da água.
          </p>
          <p>
            Por isso, acompanhar apenas a chuva em Pelotas não seria suficiente para compreender o
            risco que se aproximava.
          </p>
          <blockquote>
            O que acontece no Guaíba pode representar, dias depois, uma ameaça para as comunidades do
            sul da Lagoa dos Patos.
          </blockquote>
        </div>
      </section>

      <section className="tp-flood-route" id="caminho-da-cheia">
        <header>
          <span>O caminho da cheia de 2024</span>
          <h2>Do Centro e Norte do Estado até o Oceano Atlântico</h2>
          <p>
            O trajeto abaixo conecta o pico observado no Guaíba ao avanço posterior pela Lagoa dos
            Patos e ajuda a explicar por que o risco para Pelotas continuava mesmo depois do momento
            mais crítico em Porto Alegre.
          </p>
        </header>
        <HydrologicalPath />
      </section>

      <section className="tp-flood-lessons" id="ensinamentos">
        <div>
          <span>O que a enchente de 2024 ensinou</span>
          <h2>Monitorar Pelotas exige olhar muito além do nível do Laranjal</h2>
        </div>
        <div>
          <p>É necessário acompanhar simultaneamente:</p>
          <ul>
            <li>o Guaíba;</li>
            <li>a Lagoa dos Patos de norte a sul;</li>
            <li>o Canal São Gonçalo;</li>
            <li>a Lagoa Mirim;</li>
            <li>a chuva regional;</li>
            <li>os ventos;</li>
            <li>as condições de escoamento no estuário de Rio Grande.</li>
          </ul>
          <p>
            A água que ameaça Pelotas amanhã pode estar hoje a centenas de quilômetros de distância.
            É por isso que o monitoramento integrado dos diferentes pontos da bacia é uma ferramenta
            importante para antecipação e compreensão do risco.
          </p>
        </div>
      </section>

      <section className="tp-flood-sources" aria-labelledby="tp-flood-sources-title">
        <div>
          <span>Sobre esta linha do tempo</span>
          <h2 id="tp-flood-sources-title">Registro histórico e referências</h2>
        </div>
        <div>
          <p>
            Esta página reúne informações históricas e dados publicados durante e após a enchente de
            abril e maio de 2024 por órgãos públicos, instituições de pesquisa e sistemas oficiais de
            monitoramento.
          </p>
          <p>
            Os valores apresentados correspondem aos sistemas, estações e réguas utilizados nas
            fontes citadas à época. Diferentes estações podem utilizar referências altimétricas
            distintas e, portanto, seus valores absolutos não devem ser comparados diretamente sem
            considerar o datum e a referência de cada medição.
          </p>
          <div className="tp-flood-sources__organizations">
            {FLOOD_2024_SOURCE_ORGANIZATIONS.map((source) => (
              <span key={source}>{source}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="tp-flood-related" aria-label="Continue acompanhando">
        <div>
          <span>Monitoramento atual</span>
          <h2>O evento de 2024 explica por que o portal acompanha toda a Lagoa</h2>
        </div>
        <div className="tp-flood-related__links">
          <Link to="/situacao-hidrologica-pelotas">
            Situação atual das águas <span aria-hidden="true">→</span>
          </Link>
          <Link to="/nivel-da-lagoa-dos-patos-laranjal">
            Nível e histórico do Laranjal <span aria-hidden="true">→</span>
          </Link>
          <Link to="/metodologia">
            Como os dados funcionam <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </article>
  );
}
