import { createServerFn } from "@tanstack/react-start";
import { getRequest, setResponseHeaders } from "@tanstack/react-start/server";
import { z } from "zod";

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
    };

const defaultPreferences: AccountPreferences = {
  weatherAlerts: true,
  waterAlerts: true,
  dailySummary: false,
  communityUpdates: false,
};

function metadataText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function applyPrivateResponseHeaders(headers: Headers) {
  headers.set("Cache-Control", "private, no-store, max-age=0");
  headers.set("Pragma", "no-cache");
  headers.set("Vary", "Cookie, Authorization");
  setResponseHeaders(headers);
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

    const [{ data: profile, error: profileError }, { data: preferences, error: preferencesError }] =
      await Promise.all([
        client
          .from("profiles")
          .select("display_name,email,avatar_url")
          .eq("id", user.id)
          .maybeSingle(),
        client
          .from("user_preferences")
          .select("weather_alerts,water_alerts,daily_summary,community_updates")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);

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

    if (profileError || preferencesError) {
      console.error("[account] Falha ao consultar perfil ou preferências", {
        profile: profileError?.message,
        preferences: preferencesError?.message,
      });
    }

    applyPrivateResponseHeaders(responseHeaders);

    return {
      status: "authenticated",
      storageReady: !profileError && !preferencesError,
      identity: { displayName, email, avatarUrl },
      preferences: preferences
        ? {
            weatherAlerts: preferences.weather_alerts,
            waterAlerts: preferences.water_alerts,
            dailySummary: preferences.daily_summary,
            communityUpdates: preferences.community_updates,
          }
        : defaultPreferences,
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
    const [profileResult, preferencesResult] = await Promise.all([
      client.from("profiles").upsert(
        {
          id: user.id,
          email: user.email ?? null,
          display_name: data.displayName || null,
          avatar_url: avatarUrl,
        },
        { onConflict: "id" },
      ),
      client.from("user_preferences").upsert(
        {
          user_id: user.id,
          weather_alerts: data.weatherAlerts,
          water_alerts: data.waterAlerts,
          daily_summary: data.dailySummary,
          community_updates: data.communityUpdates,
        },
        { onConflict: "user_id" },
      ),
    ]);

    applyPrivateResponseHeaders(responseHeaders);

    if (profileResult.error || preferencesResult.error) {
      console.error("[account] Falha ao atualizar preferências", {
        profile: profileResult.error?.message,
        preferences: preferencesResult.error?.message,
      });
      return { ok: false as const, code: "storage" as const };
    }

    return { ok: true as const };
  });
