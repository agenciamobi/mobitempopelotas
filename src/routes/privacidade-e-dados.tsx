import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { absoluteUrl, SITE_NAME } from "@/lib/site-config";

import "./privacidade-e-dados.css";

export const Route = createFileRoute("/privacidade-e-dados")({
  head: () => ({
    meta: [
      { title: `Privacidade e dados | ${SITE_NAME}` },
      {
        name: "description",
        content:
          "Entenda como o Tempo Pelotas trata dados pessoais, preferências, notificações e informações de conta.",
      },
    ],
    links: [{ rel: "canonical", href: absoluteUrl("/privacidade-e-dados") }],
  }),
  component: PrivacyPage,
});

const privacyFooterSource = {
  name: "Tempo Pelotas",
  url: "/privacidade-e-dados",
  isFallback: false,
  observationName: null,
  observationUrl: null,
  forecastName: null,
  forecastUrl: null,
};

function PrivacyPage() {
  return (
    <div className="privacy-page">
      <SiteHeader />

      <main className="privacy-main" id="conteudo-principal">
        <header className="privacy-hero">
          <span className="eyebrow">Privacidade e dados</span>
          <h1>Seus dados são usados apenas para os recursos que você escolhe ativar</h1>
          <p>
            O Tempo Pelotas mantém a previsão e os alertas públicos sem exigir conta. Login,
            preferências e notificações são recursos opcionais e usam somente os dados necessários
            para funcionar.
          </p>
        </header>

        <div className="privacy-grid">
          <section className="privacy-card">
            <span className="eyebrow">Sem conta</span>
            <h2>Previsão e alertas continuam públicos</h2>
            <p>
              Você pode consultar o portal sem criar perfil e sem compartilhar nome ou e-mail. Dados
              técnicos de acesso podem ser processados pela infraestrutura de hospedagem para
              segurança, entrega e diagnóstico operacional.
            </p>
          </section>

          <section className="privacy-card">
            <span className="eyebrow">Conta opcional</span>
            <h2>O login usa sua conta Google</h2>
            <p>
              Quando você escolhe entrar, o Supabase Auth recebe a identidade necessária para criar
              sua sessão. O portal pode guardar nome de exibição, e-mail e foto do perfil quando
              fornecidos pelo provedor de autenticação.
            </p>
          </section>

          <section className="privacy-card">
            <span className="eyebrow">Preferências</span>
            <h2>Autorizações ficam vinculadas à sua conta</h2>
            <p>
              Preferências de resumo diário, alertas meteorológicos, situação das águas e novidades
              da comunidade são armazenadas para que o portal respeite suas escolhas nos próximos
              acessos.
            </p>
          </section>

          <section className="privacy-card">
            <span className="eyebrow">Notificações</span>
            <h2>Web Push depende de autorização do navegador</h2>
            <p>
              O portal só registra uma inscrição Push depois da sua autorização. O endpoint e as
              chaves técnicas da inscrição são usados exclusivamente para entregar os avisos que
              você habilitou.
            </p>
          </section>

          <section className="privacy-card privacy-card--wide">
            <span className="eyebrow">Como usamos os dados</span>
            <h2>Finalidades limitadas ao serviço</h2>
            <ul>
              <li>autenticar a conta e manter a sessão;</li>
              <li>salvar preferências e consentimentos escolhidos pelo usuário;</li>
              <li>entregar notificações autorizadas;</li>
              <li>permitir exportação e exclusão dos próprios dados;</li>
              <li>métricas agregadas de disparo não guardam identificação do visitante.</li>
            </ul>
          </section>

          <section className="privacy-card">
            <span className="eyebrow">Segurança</span>
            <h2>Credenciais não entram na exportação</h2>
            <p>
              Tokens de sessão, chaves administrativas e material criptográfico de entrega não são
              enviados para a interface nem incluídos no arquivo de exportação.
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
              <Link to="/conta" search={{ erro: undefined }}>
                Abrir minha conta
              </Link>
              <Link to="/metodologia">Consultar metodologia e fontes</Link>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter source={privacyFooterSource} />
    </div>
  );
}
