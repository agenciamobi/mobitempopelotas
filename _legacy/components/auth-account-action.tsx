"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient, isSupabaseBrowserConfigured } from "@/lib/supabase/client";

export function AuthAccountAction() {
  const configured = isSupabaseBrowserConfigured();
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (active) {
        setUser(data.user ?? null);
        setReady(true);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (!configured) return null;

  if (!ready) {
    return <span className="header-account-link is-loading" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <Link className="header-account-link" href="/entrar?next=/minha-conta">
        Entrar
      </Link>
    );
  }

  const name =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
    user.email ||
    "Conta";
  const initial = name.trim().charAt(0).toUpperCase() || "U";

  return (
    <Link
      className="header-account-link is-authenticated"
      href="/minha-conta"
      title={`Abrir a conta de ${name}`}
      aria-label={`Abrir minha conta, conectado como ${name}`}
    >
      <span aria-hidden="true">{initial}</span>
      <strong>{name.split(" ")[0]}</strong>
    </Link>
  );
}
