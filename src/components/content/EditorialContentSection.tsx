import { Link } from "@tanstack/react-router";

import type { EditorialContentDefinition } from "@/lib/editorial-content";

import "./EditorialContentSection.css";

type EditorialContentSectionProps = {
  id: string;
  content: EditorialContentDefinition;
};

export function EditorialContentSection({ id, content }: EditorialContentSectionProps) {
  const titleId = `${id}-title`;
  const faqTitleId = `${id}-faq-title`;

  return (
    <section className="editorial-answer-section" aria-labelledby={titleId} id={id}>
      <div className="editorial-answer-intro">
        <div className="editorial-answer-copy">
          <p className="editorial-answer-eyebrow">{content.eyebrow}</p>
          <h2 id={titleId}>{content.title}</h2>
          <p className="editorial-answer-summary">{content.answer}</p>
        </div>

        <ul className="editorial-answer-facts" aria-label="Pontos essenciais">
          {content.facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </div>

      <div className="editorial-answer-grid">
        <div className="editorial-answer-faq" aria-labelledby={faqTitleId}>
          <p className="editorial-answer-eyebrow">Perguntas frequentes</p>
          <h3 id={faqTitleId}>Respostas sobre esta informação</h3>

          <div className="editorial-answer-faq-list">
            {content.faqs.map((faq) => (
              <details key={faq.question}>
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>

        <nav className="editorial-answer-related" aria-label="Conteúdos relacionados">
          <p className="editorial-answer-eyebrow">Continue consultando</p>
          <h3>Informações relacionadas</h3>

          <ul>
            {content.relatedLinks.map((link, index) => {
              const descriptionId = `${id}-related-${index + 1}-description`;

              return (
                <li key={link.href}>
                  <Link to={link.href} aria-describedby={descriptionId}>
                    <span>
                      <strong>{link.label}</strong>
                      <small id={descriptionId}>{link.description}</small>
                    </span>
                    <span aria-hidden="true">→</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </section>
  );
}
