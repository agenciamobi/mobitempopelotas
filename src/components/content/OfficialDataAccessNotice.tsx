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
          Integração e disseminação de informações oficiais
        </h2>
        <p>
          O Tempo Pelotas atua como plataforma local de integração, organização e disseminação de
          informações oficiais. REDEMET/DECEA e ANA/SNIRH/RHN permanecem identificados como as
          fontes institucionais dos dados; o portal faz a conexão entre sistemas, contextualiza a
          informação para Pelotas e preserva origem, horário e estado de disponibilidade.
        </p>
        <small>
          O acesso técnico às plataformas e APIs não significa homologação, certificação, parceria
          formal ou chancela editorial dessas instituições sobre análises, sínteses ou textos
          produzidos pelo Tempo Pelotas.
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
              O Tempo Pelotas possui credenciais de acesso à API da REDEMET/DECEA para integração
              automatizada de produtos meteorológicos oficiais. A consulta acontece no servidor e
              alimenta recursos como radar, imagens de satélite e ocorrências de trovoadas do
              produto STSC, sempre preservando a identificação da REDEMET, do produto e do horário
              recebido.
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
              O responsável pelo Tempo Pelotas teve acesso concedido à plataforma integrada da
              Agência Nacional de Águas e Saneamento Básico para consulta e futura integração de
              informações hidrometeorológicas da Rede Hidrometeorológica Nacional. A RHN integra o
              Sistema Nacional de Informações sobre Recursos Hídricos e reúne registros como níveis,
              vazões, chuvas e outras variáveis observadas por estações hidrometeorológicas. A
              incorporação ao portal está sendo feita gradualmente, com validação de unidade,
              referência, horário, estação operadora e situação do dado antes de qualquer publicação.
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
