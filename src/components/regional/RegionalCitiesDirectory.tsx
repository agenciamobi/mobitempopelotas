import { ArrowRight, MapPin } from "lucide-react";

import { REGIONAL_CITY_GROUPS, regionalCityPath } from "@/lib/regional-cities";

import styles from "./RegionalCitiesDirectory.module.css";

export function RegionalCitiesDirectory() {
  return (
    <div className={`${styles.page} regional-cities-directory`}>
      <section className={styles.hero}>
        <span>Tempo Pelotas · Central regional</span>
        <h1>Previsão do tempo por cidade na Zona Sul do RS</h1>
        <p>
          Consulte páginas locais com condição estimada, previsão para sete dias, chuva, vento e
          avisos meteorológicos municipais do INMET. Pelotas permanece como núcleo editorial do
          portal, com cobertura ampliada para a região sul do Rio Grande do Sul.
        </p>
        <div>
          <strong>{REGIONAL_CITY_GROUPS.reduce((total, group) => total + group.cities.length, 0)}</strong>
          <span>municípios disponíveis</span>
        </div>
      </section>

      <section className={styles.directory} aria-label="Cidades com previsão local">
        {REGIONAL_CITY_GROUPS.map((group) => (
          <article key={group.name}>
            <header>
              <MapPin aria-hidden="true" />
              <div>
                <span>Região</span>
                <h2>{group.name}</h2>
              </div>
            </header>
            <div>
              {group.cities.map((city) => (
                <a href={regionalCityPath(city)} key={city.slug}>
                  <strong>{city.name}</strong>
                  <small>{city.descriptor}</small>
                  <ArrowRight aria-hidden="true" />
                </a>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className={styles.method}>
        <div>
          <span>Metodologia</span>
          <h2>Uma página específica para cada município</h2>
          <p>
            Cada endereço usa as coordenadas centrais do município para consultar a previsão por
            modelo e o código IBGE para consultar avisos municipais do INMET. O conteúdo não é uma
            simples substituição automática do nome da cidade.
          </p>
        </div>
        <ul>
          <li>URLs permanentes e indexáveis para pesquisa local.</li>
          <li>Previsão atualizada de temperatura, chuva e vento.</li>
          <li>Avisos oficiais consultados pelo código do município.</li>
          <li>Links entre cidades da mesma área regional.</li>
        </ul>
      </section>
    </div>
  );
}
