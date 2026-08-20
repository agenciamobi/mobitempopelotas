import { ExternalLink, PhoneCall } from "lucide-react";

import "./EmergencyFooterStrip.css";

const emergencyPhones = [
  { number: "190", label: "Brigada Militar" },
  { number: "192", label: "SAMU" },
  { number: "193", label: "Bombeiros" },
] as const;

const DEFESA_CIVIL_URL = "https://defesacivil.rs.gov.br/";
const DEFESA_CIVIL_LOGO_URL =
  "https://defesacivil.rs.gov.br/themes/defesacivil/images/logos/logo.png";

export function EmergencyFooterStrip() {
  return (
    <section
      className="tp-public-service-strip"
      aria-label="Telefones úteis e cadastro para alertas da Defesa Civil do Rio Grande do Sul"
    >
      <div className="tp-public-service-strip__inner">
        <section className="tp-public-service-phones" aria-labelledby="tp-public-service-phones-title">
          <h2 id="tp-public-service-phones-title">Telefones úteis</h2>
          <div className="tp-public-service-phones__grid">
            {emergencyPhones.map((phone) => (
              <a
                key={phone.number}
                href={`tel:${phone.number}`}
                aria-label={`Ligar para ${phone.label} no número ${phone.number}`}
              >
                <strong>
                  <PhoneCall aria-hidden="true" />
                  {phone.number}
                </strong>
                <span>{phone.label}</span>
              </a>
            ))}
          </div>
        </section>

        <section
          className="tp-public-service-civil-defense"
          aria-labelledby="tp-public-service-civil-defense-title"
        >
          <div className="tp-public-service-civil-defense__identity">
            <img
              src={DEFESA_CIVIL_LOGO_URL}
              alt="Símbolo da Defesa Civil do Rio Grande do Sul"
              width={82}
              height={82}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
            />
            <div>
              <span>Defesa Civil RS</span>
              <h2 id="tp-public-service-civil-defense-title">
                Receba mensagens da Defesa Civil
              </h2>
            </div>
            <a
              href={DEFESA_CIVIL_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Abrir o portal oficial da Defesa Civil do Rio Grande do Sul em nova aba"
            >
              Portal oficial
              <ExternalLink aria-hidden="true" />
            </a>
          </div>

          <div className="tp-public-service-civil-defense__signup">
            <p>
              Para receber alertas no celular, envie gratuitamente um SMS para o número
              <strong> 40199 </strong>
              com o <strong>CEP</strong> da área de interesse.
            </p>
            <a href="sms:40199" aria-label="Enviar SMS para 40199 e cadastrar um CEP">
              Enviar SMS para 40199
            </a>
          </div>
        </section>
      </div>
    </section>
  );
}
