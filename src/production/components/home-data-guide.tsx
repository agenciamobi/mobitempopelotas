import { Link } from "@tanstack/react-router";

import { HOME_EDITORIAL_CONTENT } from "@/lib/editorial-content";

import "./home-data-guide.css";

const dataTypes = [
  {
    label: "Observação",
    text: "É o que foi realmente medido por uma estação. Na Home, a Embrapa é a principal referência meteorológica local quando a leitura está disponível.",
  },
  {
    label: "Previsão",
    text: "É uma estimativa para as próximas horas e dias. Pode mudar conforme novas rodadas dos modelos e novas observações entram no sistema.",
  },
  {
    label: "Aviso oficial",
    text: "É um comunicado emitido por órgão competente, como o INMET. Tem natureza diferente da previsão e da interpretação editorial do portal.",
  },
  {
    label: "Radar e satélite",
    text: "São produtos de monitoramento por imagem. Ajudam a acompanhar chuva, nuvens e trovoadas observadas, mas não projetam sozinhos o que ocorrerá depois.",
  },
] as const;

export function HomeDataGuide() {
  return (
    <section
      className="tp-home-guide"
      id="como-interpretar-o-tempo"
      aria-labelledby="tp-home-guide-title"
    >
      <header className="tp-home-guide__intro">
        <div>
          <span>Entenda os dados</span>
          <h2 id="tp-home-guide-title">Nem toda informação meteorológica significa a mesma coisa</h2>
          <p>{HOME_EDITORIAL_CONTENT.answer}</p>
        </div>
      </header>

      <div className="tp-home-guide__types" aria-label="Tipos de informação do portal">
        {dataTypes.map((item) => (
          <article key={item.label}>
            <strong>{item.label}</strong>
            <p>{item.text}</p>
          </article>
        ))}
      </div>

      <div className="tp-home-guide__details">
        <div className="tp-home-guide__faq">
          <span>Perguntas frequentes</span>
          <h3>Como interpretar as informações do portal</h3>
          <div>
            {HOME_EDITORIAL_CONTENT.faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>

        <nav className="tp-home-guide__related" aria-label="Informações relacionadas">
          <span>Transparência</span>
          <h3>Fontes e aprofundamento</h3>
          <ul>
            {HOME_EDITORIAL_CONTENT.relatedLinks.map((link) => (
              <li key={link.href}>
                <Link to={link.href}>
                  <span>
                    <strong>{link.label}</strong>
                    <small>{link.description}</small>
                  </span>
                  <b aria-hidden="true">→</b>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
