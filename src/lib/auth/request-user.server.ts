import type { User } from "@supabase/supabase-js";

import { createSupabaseRequestClient } from "@/lib/supabase/request-client.server";
import { getSupabaseServerConfig } from "@/lib/supabase/server-client.server";

export type VerifiedRequestUser = {
  configured: boolean;
  user: User | null;
  responseHeaders: Headers;
};

function isMissingSessionError(error: { name?: string; message?: string }) {
  return (
    error.name === "AuthSessionMissingError" ||
    error.message?.toLowerCase().includes("auth session missing") === true
  );
}

export async function getVerifiedRequestUser(request: Request): Promise<VerifiedRequestUser> {
  const config = getSupabaseServerConfig();
  if (!config.isPublicConfigured) {
    return { configured: false, user: null, responseHeaders: new Headers() };
  }

  const { client, responseHeaders } = createSupabaseRequestClient(request);
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error && !isMissingSessionError(error)) throw error;

  return {
    configured: true,
    user: user ?? null,
    responseHeaders,
  };
}
