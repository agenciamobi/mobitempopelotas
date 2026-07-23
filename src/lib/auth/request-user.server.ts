import type { User } from "@supabase/supabase-js";

import { createSupabaseRequestClient } from "@/lib/supabase/request-client.server";
import { getSupabaseServerConfig } from "@/lib/supabase/server-client.server";

export type VerifiedRequestUser = {
  configured: boolean;
  user: User | null;
  responseHeaders: Headers;
};

const UNAUTHENTICATED_ERROR_CODES = new Set([
  "bad_jwt",
  "session_not_found",
  "refresh_token_not_found",
  "refresh_token_already_used",
  "user_not_found",
]);

function isUnauthenticatedSessionError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const details = error as {
    name?: unknown;
    message?: unknown;
    status?: unknown;
    code?: unknown;
  };
  const name = String(details.name ?? "");
  const message = String(details.message ?? "").toLowerCase();
  const code = String(details.code ?? "").toLowerCase();
  const status = Number(details.status);

  if (name === "AuthSessionMissingError" || message.includes("auth session missing")) {
    return true;
  }

  if (UNAUTHENTICATED_ERROR_CODES.has(code)) return true;

  if (
    message.includes("jwt expired") ||
    message.includes("invalid jwt") ||
    message.includes("token has expired") ||
    message.includes("refresh token not found") ||
    message.includes("invalid refresh token") ||
    message.includes("session not found") ||
    message.includes("user from sub claim in jwt does not exist")
  ) {
    return true;
  }

  return (
    (status === 401 || status === 403) &&
    !message.includes("invalid api key") &&
    !message.includes("apikey")
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

  if (error && !isUnauthenticatedSessionError(error)) throw error;

  return {
    configured: true,
    user: user ?? null,
    responseHeaders,
  };
}
