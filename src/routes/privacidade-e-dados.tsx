import { createFileRoute, Link } from "@tanstack/react-router";

import { createPageHead } from "@/lib/page-meta";
import { createEditorialPageJsonLd } from "@/lib/structured-data";
import { SiteFooter } from "@/production/components/site-footer";
import { SiteHeader } from "@/production/components/site-header";
import type { WeatherData } from "@/production/lib/weather-data";
import "@/production/production-styles";

const PAGE_TITLE = "Privacidade, dados e retenção no Tempo Pelotas";
const PAGE_DESCRIPTION =
  "Entenda quais dados a conta utiliza, por quanto tempo são mantidos e como baixar ou excluir suas informações no Tempo Pelotas.";
const PAGE_PATH = "/privacidade-e-dados";

const privacyFooterSource = {
  name: "Tempo Pelotas",
  url: "/metodologia",
  isFallback: false,
  observationName: "Política de privacidade",
  observationUrl: PAGE_PATH,
  forecastName: "Metodologia e fontes",
  forecastUrl: "/metodologia",
} satisfies WeatherData["source"];

export const Route = createFileRoute("/privacidade-e-dados")({
  head: () =>
    createPageHead(PAGE_TITLE, PAGE_DESCRIPTION, PAGE_PATH, [
      createEditorialPageJsonLd({
        name: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
        path: PAGE_PATH,
        breadcrumbs: [
          { name: "Início", path: "/" },
          { name: "Privacidade e dados", path: PAGE_PATH },
        ],
        about: ["Privacidade no Tempo Pelotas", "Retenção de dados", "Direitos da conta"],
      }),
    ]),
  component: PrivacyDataPage,
});

function PrivacyDataPage() {
  return (
    <div className="site-shell">
      <SiteHeader advisoryLevel="normal" />

      <main className="privacy-page" id="conteudo-principal" tabIndex={-1}>
        <header className="privacy-hero">
          <div>
            <span className="eyebrow">Privacidade e controle</span>
            <h1>Seus dados devem ser compreensíveis e estar sob seu controle</h1>
            <p>
              O Tempo Pelotas mantém previsão, avisos oficiais, radar, satélite, câmeras e situação
              das águas acessíveis sem login. A conta existe somente para identificação básica e
              preferências opcionais.
            </p>
          </div>

          <aside className="privacy-summary" aria-label="Resumo da política">
            <strong>Conta opcional</strong>
            <span>
              Você pode consultar o portal sem cadastro, alterar preferências a qualquer momento,
              baixar uma cópia dos seus dados ou excluir definitivamente a conta.
            </span>
          </aside>
        </header>

        <div className="privacy-grid">
          <section className="privacy-card">
            <span className="eyebrow">O que é utilizado</span>
            <h2>Dados básicos e escolhas do visitante</h2>
            <ul>
              <li>nome, e-mail e imagem fornecidos pelo Google;</li>
              <li>preferências de alertas, águas, resumo diário e novidades;</li>
              <li>histórico de alterações dessas preferências, com data e versão da política;</li>
              <li>dados técnicos do aparelho quando notificações são ativadas.</li>
            </ul>
          </section>

          <section className="privacy-card">
            <span className="eyebrow">O que não depende da conta</span>
            <h2>Informação meteorológica continua pública</h2>
            <p>
              Previsão do tempo, chuva, vento, imagens de radar e satélite, avisos oficiais, câmeras
              e níveis das águas não são bloqueados para visitantes sem conta.
            </p>
            <p>
              O portal não comercializa dados pessoais e não usa a conta para alterar ou esconder
              informações públicas.
            </p>
          </section>

          <section className="privacy-card">
            <span className="eyebrow">Retenção</span>
            <h2>Por quanto tempo os dados permanecem</h2>
            <ul>
              <li>
                perfil, preferências e histórico de consentimentos permanecem enquanto a conta
                estiver ativa;
              </li>
              <li>ao excluir a conta, esses registros são removidos em cascata;</li>
              <li>inscrições push vinculadas à conta também são removidas com a exclusão;</li>
              <li>
                inscrições anônimas permanecem no aparelho até desativação ou até o provedor indicar
                expiração;
              </li>
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
              <Link to="/minha-conta">Abrir minha conta</Link>
              <Link to="/metodologia">Consultar metodologia e fontes</Link>
            </div>
          </section>
        </div>
      </main>

      <SiteFooter source={privacyFooterSource} />
    </div>
  );
}
