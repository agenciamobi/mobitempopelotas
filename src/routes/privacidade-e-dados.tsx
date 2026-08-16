import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteFooter } from "@/components/layout/Footer";
import { SiteHeader } from "@/components/layout/Header";
import { absoluteUrl, SITE_NAME } from "@/lib/site-config";

import "@/production/styles/home-editorial-shell.css";
import "@/production/styles/home-clone.css";
import "@/production/styles/header-hero-fullwidth-v32.css";
import "./privacidade-e-dados.css";

const privacyFooterSource = {
  name: "Tempo Pelotas",
  url: "/privacidade-e-dados",
  isFallback: false,
  observationName: "Dados da conta e preferências",
  forecastName: "Privacidade e LGPD",
};

export const Route = createFileRoute("/privacidade-e-dados")({
  head: () => ({
    meta: [
      { title: `Privacidade e dados pessoais | ${SITE_NAME}` },
      {
        name: "description",
        content:
          "Entenda quais dados o Tempo Pelotas usa, por que usa, como protegemos sua conta e como exercer seus direitos de privacidade.",
      },
      { name: "robots", content: "index, follow" },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/privacidade-e-dados") }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="site-shell site-shell--home-editorial privacy-page">
      <SiteHeader />

      <main id="conteudo-principal" className="privacy-main">
        <header className="privacy-hero">
          <span className="eyebrow">Privacidade e dados</span>
          <h1>Como o Tempo Pelotas trata seus dados pessoais</h1>
          <p>
            O portal pode ser usado sem conta. Login, preferências e notificações são recursos
            opcionais e só usam os dados necessários para funcionar.
          </p>
        </header>

        <div className="privacy-grid">
          <section className="privacy-card">
            <span className="eyebrow">Uso público</span>
            <h2>Previsão sem cadastro</h2>
            <p>
              As páginas públicas de previsão do tempo, alertas, imagens, situação hidrológica e
              metodologia não exigem que você crie uma conta.
            </p>
          </section>

          <section className="privacy-card">
            <span className="eyebrow">Conta opcional</span>
            <h2>Login e perfil</h2>
            <p>
              Se você escolher entrar com Google, usamos a identidade fornecida pelo provedor para
              criar ou acessar sua conta. Nome de exibição e imagem de perfil podem ser atualizados
              pelo próprio usuário.
            </p>
          </section>

          <section className="privacy-card">
            <span className="eyebrow">Preferências</span>
            <h2>Alertas e comunicações</h2>
            <p>
              As preferências registram quais assuntos você quer receber, como alertas
              meteorológicos, situação das águas, resumo diário e novidades da comunidade.
            </p>
          </section>

          <section className="privacy-card">
            <span className="eyebrow">Notificações</span>
            <h2>Web Push</h2>
            <p>
              Quando você autoriza notificações no navegador, armazenamos os identificadores
              técnicos necessários para entregar as mensagens. Esses dados não são usados para
              publicidade comportamental.
            </p>
          </section>

          <section className="privacy-card privacy-card--wide">
            <span className="eyebrow">Proteção</span>
            <h2>Segurança e isolamento</h2>
            <p>
              As credenciais administrativas do Supabase ficam somente no servidor. O navegador
              recebe apenas a chave pública quando a integração está habilitada.
            </p>
            <p>
              As tabelas da conta usam políticas que limitam a leitura ao próprio usuário. A
              exclusão é executada somente após confirmação explícita e validação da sessão.
            </p>
          </section>

          <section className="privacy-card privacy-card--wide">
            <span className="eyebrow">Seus direitos</span>
            <h2>Baixar, corrigir, revogar ou excluir</h2>
            <p>
              Na área da conta, você pode corrigir o nome de exibição, alterar autorizações, baixar
              um arquivo JSON com seus dados e remover definitivamente a conta. A exclusão não afeta
              o acesso às páginas públicas do portal.
            </p>
            <div className="privacy-actions">
              <Link to="/conta" search={{}}>Abrir minha conta</Link>
              <Link to="/metodologia">Consultar metodologia e fontes</Link>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter source={privacyFooterSource} />
    </div>
  );
}
