"use client";

import { ExternalLink, Info, Layers3 } from "lucide-react";
import { useState } from "react";

import "./SimagroModelProducts.css";

const SIMAGRO_URL = "https://simagro.rs.gov.br/";

const PRODUCTS = [
  {
    id: "wrf",
    label: "WRF",
    title: "Meteograma WRF para Pelotas",
    description:
      "Produto gráfico do modelo WRF disponibilizado pelo SIMAGRO RS para Pelotas.",
    imageUrl:
      "https://simagro.rs.gov.br/data/produtos/latest/meteogramas/meteograma_wrf_4914.png",
  },
  {
    id: "gfs",
    label: "GFS",
    title: "Meteograma GFS para Pelotas",
    description:
      "Produto gráfico do modelo GFS disponibilizado pelo SIMAGRO RS para Pelotas.",
    imageUrl:
      "https://simagro.rs.gov.br/data/produtos/latest/meteogramas/meteograma_gfs_4914.png",
  },
  {
    id: "agro",
    label: "GFS Agro",
    title: "Agrometeograma GFS para Pelotas",
    description:
      "Versão agrometeorológica do produto GFS disponibilizada pelo SIMAGRO RS.",
    imageUrl:
      "https://simagro.rs.gov.br/data/produtos/latest/meteogramas/agrometeograma_gfs_4914.png",
  },
] as const;

type ProductId = (typeof PRODUCTS)[number]["id"];

export function SimagroModelProducts() {
  const [selectedId, setSelectedId] = useState<ProductId>("wrf");
  const [failedIds, setFailedIds] = useState<ProductId[]>([]);
  const selected = PRODUCTS.find((product) => product.id === selectedId) ?? PRODUCTS[0];
  const failed = failedIds.includes(selected.id);

  return (
    <section
      className="simagro-model-products"
      id="modelos-simagro"
      aria-labelledby="simagro-model-products-title"
    >
      <header>
        <div>
          <span className="simagro-model-products__eyebrow">
            <Layers3 aria-hidden="true" /> Modelagem complementar · SIMAGRO RS
          </span>
          <h2 id="simagro-model-products-title">Veja também os meteogramas WRF e GFS para Pelotas</h2>
        </div>
        <p>
          Estes gráficos são produtos visuais de modelagem publicados pelo SIMAGRO RS. Eles servem para
          comparação e contexto. Os valores horários principais desta página continuam vindo das fontes
          estruturadas identificadas no próprio Tempo Pelotas.
        </p>
      </header>

      <div className="simagro-model-products__tabs" aria-label="Escolha o produto do SIMAGRO RS">
        {PRODUCTS.map((product) => (
          <button
            key={product.id}
            type="button"
            className={product.id === selected.id ? "is-active" : undefined}
            aria-pressed={product.id === selected.id}
            onClick={() => setSelectedId(product.id)}
          >
            <strong>{product.label}</strong>
            <span>{product.title}</span>
          </button>
        ))}
      </div>

      <figure className="simagro-model-products__viewer">
        <div className="simagro-model-products__viewer-heading">
          <div>
            <span>Produto selecionado</span>
            <strong>{selected.title}</strong>
            <small>{selected.description}</small>
          </div>
          <a href={SIMAGRO_URL} target="_blank" rel="noopener noreferrer">
            Abrir SIMAGRO RS <ExternalLink aria-hidden="true" />
          </a>
        </div>

        {failed ? (
          <div className="simagro-model-products__unavailable" role="status">
            <strong>O gráfico do SIMAGRO não carregou nesta consulta.</strong>
            <span>
              O restante do meteograma continua disponível. Você também pode consultar o produto
              diretamente no portal oficial do SIMAGRO RS.
            </span>
          </div>
        ) : (
          <img
            key={selected.id}
            src={selected.imageUrl}
            alt={`${selected.title}, produto gráfico de previsão do SIMAGRO RS`}
            loading="lazy"
            decoding="async"
            onError={() =>
              setFailedIds((current) =>
                current.includes(selected.id) ? current : [...current, selected.id],
              )
            }
          />
        )}

        <figcaption>
          <Info aria-hidden="true" />
          <span>
            O arquivo é exibido como imagem oficial da fonte. O Tempo Pelotas não usa OCR nem leitura de
            pixels para transformar esse gráfico em temperatura, chuva, vento ou qualquer outro valor
            numérico. Confira no próprio gráfico a data, o ciclo e a legenda do produto.
          </span>
        </figcaption>
      </figure>
    </section>
  );
}
