import { Link } from "@tanstack/react-router";

import { HOME_EDITORIAL_CONTENT } from "@/lib/editorial-content";

import "./home-data-guide.css";

export function HomeDataGuide() {
  return (
    <section
      className="tp-home-guide"
      id="como-interpretar-o-tempo"
      aria-labelledby="tp-home-guide-title"
    >
      <header className="tp-home-guide__intro">
        <div>
          <span>{HOME_EDITORIAL_CONTENT.eyebrow}</span>
          <h2 id="tp-home-guide-title">{HOME_EDITORIAL_CONTENT.title}</h2>
          <p>{HOME_EDITORIAL_CONTENT.answer}</p>
        </div>

        <ul aria-label="Pontos essenciais">
          {HOME_EDITORIAL_CONTENT.facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </header>

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
          <span>Continue consultando</span>
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
