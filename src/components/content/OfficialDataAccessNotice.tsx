import { ExternalLink, Radio, Waves } from "lucide-react";

import "./OfficialDataAccessNotice.css";

type OfficialDataAccessNoticeProps = {
  scope?: "all" | "meteorology" | "hydrology";
};

export function OfficialDataAccessNotice({
  scope = "all",
}: OfficialDataAccessNoticeProps) {
  const showRedemet = scope === "all" || scope === "meteorology";
  const showAna = scope === "all" || scope === "hydrology";

  return (
    <section
      className="official-data-access"
      aria-labelledby={`official-data-access-title-${scope}`}
    >
      <div className="official-data-access__intro">
        <span>Integrações institucionais</span>
        <h2 id={`official-data-access-title-${scope}`}>
          Acesso autorizado a fontes oficiais por conexão entre sistemas
        </h2>
        <p>
          O Tempo Pelotas mantém acessos institucionais autorizados para consultar e integrar
          informações oficiais sem expor credenciais no navegador. Cada dado continua identificado
          pela instituição de origem, horário de observação e estado de disponibilidade.
        </p>
        <small>
          A autorização de acesso às plataformas e APIs não representa chancela editorial das
          instituições sobre análises, sínteses ou textos produzidos pelo Tempo Pelotas.
        </small>
      </div>

      <div className="official-data-access__grid">
        {showRedemet ? (
          <article>
            <div className="official-data-access__topline">
              <span className="official-data-access__icon" aria-hidden="true">
                <Radio />
              </span>
              <span className="official-data-access__status">Integração ativa</span>
            </div>
            <p>REDEMET / DECEA</p>
            <h3>Rede de Meteorologia do Comando da Aeronáutica</h3>
            <div>
              O portal possui acesso autorizado à API da REDEMET para coleta automatizada de
              produtos meteorológicos oficiais. A integração é feita no servidor e alimenta
              recursos como radar, imagens de satélite e ocorrências de trovoadas do produto STSC,
              sempre preservando a origem e o horário do quadro recebido.
            </div>
            <a
              href="https://redemet.decea.mil.br/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Abrir o portal oficial da REDEMET em nova aba"
            >
              Portal oficial da REDEMET <ExternalLink aria-hidden="true" />
            </a>
          </article>
        ) : null}

        {showAna ? (
          <article>
            <div className="official-data-access__topline">
              <span className="official-data-access__icon" aria-hidden="true">
                <Waves />
              </span>
              <span className="official-data-access__status is-implementation">
                Integração em implantação
              </span>
            </div>
            <p>ANA / SNIRH / RHN</p>
            <h3>Rede Hidrometeorológica Nacional</h3>
            <div>
              O Tempo Pelotas possui acesso autorizado à plataforma integrada da Agência Nacional
              de Águas e Saneamento Básico para coleta e exibição de informações
              hidrometeorológicas da Rede Hidrometeorológica Nacional. A RHN integra o Sistema
              Nacional de Informações sobre Recursos Hídricos e reúne registros como níveis,
              vazões, chuvas e outras variáveis observadas por estações hidrometeorológicas. A
              incorporação desses dados ao portal está sendo feita de forma gradual, com validação
              de unidade, referência, horário e situação de cada estação antes da publicação.
            </div>
            <div className="official-data-access__links">
              <a
                href="https://www.snirh.gov.br/hidroweb/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abrir o Portal HidroWeb do SNIRH em nova aba"
              >
                Portal HidroWeb <ExternalLink aria-hidden="true" />
              </a>
              <a
                href="https://www.snirh.gov.br/hidrotelemetria/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abrir o Portal Hidrotelemetria do SNIRH em nova aba"
              >
                Hidrotelemetria <ExternalLink aria-hidden="true" />
              </a>
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}
