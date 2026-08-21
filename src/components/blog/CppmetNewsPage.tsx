import { ExternalLink, Newspaper, Radio, RefreshCw } from "lucide-react";

import type { CppmetNewsFeed } from "@/lib/content/cppmet-news.server";

import "./CppmetNewsPage.css";
import "./CppmetNewsAccentContract.css";

type CppmetNewsPageProps = {
  feed: CppmetNewsFeed;
};

function formatPublishedAt(value: string | null) {
  if (!value) return "Data não informada";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data não informada";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "long",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function formatFetchedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "agora";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

export function CppmetNewsPage({ feed }: CppmetNewsPageProps) {
  return (
    <div className="cppmet-blog">
      <section className="cppmet-blog__hero" aria-labelledby="cppmet-blog-title">
        <div className="cppmet-blog__hero-copy">
          <p className="cppmet-blog__eyebrow">
            <Newspaper aria-hidden="true" size={18} />
            Notícias meteorológicas
          </p>
          <h1 id="cppmet-blog-title">Publicações do CPPMet / UFPel</h1>
          <p className="cppmet-blog__lead editorial-answer-summary">
            Acompanhe notícias, análises e comunicados publicados pelo Centro de Pesquisas e
            Previsões Meteorológicas da UFPel. O Tempo Pelotas lê o feed RSS oficial e mantém o
            conteúdo original na fonte.
          </p>
        </div>

        <a
          className="cppmet-blog__source-link"
          href={feed.source.siteUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Acessar CPPMet / UFPel
          <ExternalLink aria-hidden="true" size={17} />
        </a>
      </section>

      <section className="cppmet-blog__source-bar" aria-label="Estado da fonte">
        <div>
          <span className={`cppmet-blog__status cppmet-blog__status--${feed.status}`}>
            <Radio aria-hidden="true" size={15} />
            {feed.status === "live" ? "RSS disponível" : "RSS temporariamente indisponível"}
          </span>
          <span className="cppmet-blog__updated">
            <RefreshCw aria-hidden="true" size={14} />
            Consulta: {formatFetchedAt(feed.source.fetchedAt)}
          </span>
        </div>
        <p>
          Fonte: <strong>{feed.source.name}</strong>. O Tempo Pelotas não altera títulos nem publica
          o artigo completo; cada item leva à publicação original.
        </p>
      </section>

      {feed.status === "live" && feed.items.length > 0 ? (
        <section className="cppmet-blog__grid" aria-label="Últimas publicações do CPPMet">
          {feed.items.map((item, index) => (
            <article
              className={`cppmet-blog__card${index === 0 ? " cppmet-blog__card--featured" : ""}`}
              key={item.url}
            >
              <div className="cppmet-blog__card-meta">
                <time dateTime={item.publishedAt ?? undefined}>
                  {formatPublishedAt(item.publishedAt)}
                </time>
                {item.categories.length > 0 ? <span>{item.categories[0]}</span> : null}
              </div>
              <h2>{item.title}</h2>
              {item.excerpt ? <p>{item.excerpt}</p> : null}
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                Ler publicação original
                <ExternalLink aria-hidden="true" size={16} />
              </a>
            </article>
          ))}
        </section>
      ) : (
        <section className="cppmet-blog__empty" aria-live="polite">
          <h2>As publicações não puderam ser carregadas agora</h2>
          <p>
            A página continua disponível sem inventar ou reutilizar conteúdo antigo como se fosse
            atual. Você pode consultar diretamente o site do CPPMet enquanto o feed não responde.
          </p>
          <a href={feed.source.siteUrl} target="_blank" rel="noopener noreferrer">
            Consultar CPPMet / UFPel
            <ExternalLink aria-hidden="true" size={16} />
          </a>
        </section>
      )}
    </div>
  );
}
