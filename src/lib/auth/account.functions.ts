import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeaders } from "@tanstack/react-start/server";
import { z } from "zod";

import { resolveAccountAccess, type EffectiveAccountAccess } from "@/lib/auth/account-access";
import { createSupabaseRequestClient } from "@/lib/supabase/request-client.server";
import { getSupabaseServerConfig } from "@/lib/supabase/server-client.server";

const preferencesSchema = z.object({
  displayName: z.string().trim().max(80),
  weatherAlerts: z.boolean(),
  waterAlerts: z.boolean(),
  dailySummary: z.boolean(),
  communityUpdates: z.boolean(),
});

export type AccountPreferences = {
  weatherAlerts: boolean;
  waterAlerts: boolean;
  dailySummary: boolean;
  communityUpdates: boolean;
};

export type AccountSnapshot =
  | { status: "unavailable" }
  | { status: "unauthenticated" }
  | {
      status: "authenticated";
      storageReady: boolean;
      identity: {
        displayName: string;
        email: string;
        avatarUrl: string | null;
      };
      preferences: AccountPreferences;
      access: EffectiveAccountAccess;
    };

const defaultPreferences: AccountPreferences = {
  weatherAlerts: true,
  waterAlerts: true,
  dailySummary: false,
  communityUpdates: false,
};

type AccountRequestClient = ReturnType<typeof createSupabaseRequestClient>["client"];

function metadataText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function applyPrivateResponseHeaders(headers: Headers) {
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  headers.set("Vary", "Cookie, Authorization");
  setResponseHeaders(headers);
}

function loadAccountFoundation(client: AccountRequestClient, userId: string) {
  return Promise.all([
    client
      .from("profiles")
      .select("display_name,email,avatar_url")
      .eq("id", userId)
      .maybeSingle(),
    client
      .from("user_preferences")
      .select("weather_alerts,water_alerts,daily_summary,community_updates")
      .eq("user_id", userId)
      .maybeSingle(),
    client
      .from("account_access")
      .select("tier,status,source,valid_until")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);
}

export const getAccountSnapshot = createServerFn({ method: "GET" }).handler(
  async (): Promise<AccountSnapshot> => {
    const config = getSupabaseServerConfig();
    if (!config.isPublicConfigured) {
      applyPrivateResponseHeaders(new Headers());
      return { status: "unavailable" };
    }

    const { client, responseHeaders } = createSupabaseRequestClient(getRequest());
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      applyPrivateResponseHeaders(responseHeaders);
      return { status: "unauthenticated" };
    }

    let foundation = await loadAccountFoundation(client, user.id);
    let [profileResult, preferencesResult, accessResult] = foundation;
    const lookupFailed = Boolean(
      profileResult.error || preferencesResult.error || accessResult.error,
    );
    const foundationMissing = Boolean(
      !profileResult.data || !preferencesResult.data || !accessResult.data,
    );

    if (!lookupFailed && foundationMissing) {
      const { error: repairError } = await client.rpc("ensure_current_user_account_foundation");

      if (repairError) {
        console.error("[account] Falha ao reparar a fundação da conta autenticada", {
          code: repairError.code,
          message: repairError.message,
        });
      } else {
        foundation = await loadAccountFoundation(client, user.id);
        [profileResult, preferencesResult, accessResult] = foundation;
      }
    }

    const profile = profileResult.data;
    const preferences = preferencesResult.data;
    const accountAccess = accessResult.data;
    const profileError = profileResult.error;
    const preferencesError = preferencesResult.error;
    const accessError = accessResult.error;

    const displayName =
      profile?.display_name ??
      metadataText(user.user_metadata?.full_name) ??
      metadataText(user.user_metadata?.name) ??
      user.email?.split("@")[0] ??
      "Visitante";
    const email = profile?.email ?? user.email ?? "E-mail não informado";
    const avatarUrl =
      profile?.avatar_url ??
      metadataText(user.user_metadata?.avatar_url) ??
      metadataText(user.user_metadata?.picture);

    if (profileError || preferencesError || accessError) {
      console.error("[account] Falha ao consultar dados da conta", {
        profile: profileError?.message,
        preferences: preferencesError?.message,
        access: accessError?.message,
      });
    }

    const storageReady = Boolean(
      !profileError &&
        !preferencesError &&
        !accessError &&
        profile &&
        preferences &&
        accountAccess,
    );

    applyPrivateResponseHeaders(responseHeaders);

    return {
      status: "authenticated",
      storageReady,
      identity: { displayName, email, avatarUrl },
      preferences: preferences
        ? {
            weatherAlerts: preferences.weather_alerts,
            waterAlerts: preferences.water_alerts,
            dailySummary: preferences.daily_summary,
            communityUpdates: preferences.community_updates,
          }
        : defaultPreferences,
      access: resolveAccountAccess(
        accountAccess
          ? {
              tier: accountAccess.tier,
              status: accountAccess.status,
              source: accountAccess.source,
              validUntil: accountAccess.valid_until,
            }
          : null,
      ),
    };
  },
);

export const saveAccountPreferences = createServerFn({ method: "POST" })
  .validator(preferencesSchema)
  .handler(async ({ data }) => {
    const config = getSupabaseServerConfig();
    if (!config.isPublicConfigured) {
      applyPrivateResponseHeaders(new Headers());
      return { ok: false as const, code: "unavailable" as const };
    }

    const { client, responseHeaders } = createSupabaseRequestClient(getRequest());
    const {
      data: { user },
    } = await client.auth.getUser();

    if (!user) {
      applyPrivateResponseHeaders(responseHeaders);
      return { ok: false as const, code: "unauthenticated" as const };
    }

    const avatarUrl =
      metadataText(user.user_metadata?.avatar_url) ?? metadataText(user.user_metadata?.picture);
    const { error } = await client.rpc("update_account_preferences", {
      p_display_name: data.displayName,
      p_email: user.email ?? null,
      p_avatar_url: avatarUrl,
      p_weather_alerts: data.weatherAlerts,
      p_water_alerts: data.waterAlerts,
      p_daily_summary: data.dailySummary,
      p_community_updates: data.communityUpdates,
    });

    applyPrivateResponseHeaders(responseHeaders);

    if (error) {
      console.error("[account] Falha ao atualizar perfil e preferências", {
        message: error.message,
        code: error.code,
      });
      return { ok: false as const, code: "storage" as const };
    }

    return { ok: true as const };
  });
