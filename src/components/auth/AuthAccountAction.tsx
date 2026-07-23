import { useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "@/production/compat/NextLink";

export function AuthAccountAction() {
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) {
      setReady(true);
      return;
    }

    let active = true;

    void client.auth.getUser().then(({ data }) => {
      if (!active) return;
      setAuthenticated(Boolean(data.user));
      setReady(true);
    });

    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setAuthenticated(Boolean(session?.user));
      setReady(true);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!ready) {
    return <span className="header-account-link is-loading" aria-hidden="true" />;
  }

  return (
    <Link
      className={`header-account-link${authenticated ? " is-authenticated" : ""}`}
      href={authenticated ? "/minha-conta" : "/entrar?next=/minha-conta"}
      aria-label={authenticated ? "Abrir minha conta" : "Entrar na conta do Tempo Pelotas"}
    >
      {authenticated ? <span aria-hidden="true">✓</span> : null}
      <strong>{authenticated ? "Minha conta" : "Entrar"}</strong>
    </Link>
  );
}
