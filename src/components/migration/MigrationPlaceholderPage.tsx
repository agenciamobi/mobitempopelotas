type MigrationPlaceholderPageProps = {
  title?: string;
  description?: string;
};

export function MigrationPlaceholderPage({
  title = "Projeto em migração",
  description =
    "A estrutura desta página já foi portada para a nova aplicação. Os dados e componentes meteorológicos serão conectados na próxima etapa.",
}: MigrationPlaceholderPageProps) {
  return (
    <section className="migration-page" aria-labelledby="migration-page-title">
      <p className="migration-kicker">Tempo Pelotas</p>
      <h1 id="migration-page-title">{title}</h1>
      <p>{description}</p>
      <span className="migration-status">Projeto em migração</span>
    </section>
  );
}
