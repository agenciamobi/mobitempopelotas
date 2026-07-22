"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function isChecked(formData: FormData, field: string) {
  return formData.get(field) === "on";
}

export async function updateAccountPreferences(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/entrar?next=/minha-conta");
  }

  const rawDisplayName = formData.get("displayName");
  const displayName =
    typeof rawDisplayName === "string" ? rawDisplayName.trim() : "";

  if (displayName.length > 80) {
    redirect("/minha-conta?status=nome-invalido");
  }

  const [profileResult, preferencesResult] = await Promise.all([
    supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email ?? null,
        display_name: displayName || null,
        avatar_url:
          (typeof user.user_metadata?.avatar_url === "string" &&
            user.user_metadata.avatar_url) ||
          (typeof user.user_metadata?.picture === "string" &&
            user.user_metadata.picture) ||
          null,
      },
      { onConflict: "id" },
    ),
    supabase.from("user_preferences").upsert(
      {
        user_id: user.id,
        weather_alerts: isChecked(formData, "weatherAlerts"),
        water_alerts: isChecked(formData, "waterAlerts"),
        daily_summary: isChecked(formData, "dailySummary"),
        community_updates: isChecked(formData, "communityUpdates"),
      },
      { onConflict: "user_id" },
    ),
  ]);

  if (profileResult.error || preferencesResult.error) {
    console.error("[account] falha ao atualizar preferências", {
      profile: profileResult.error?.message,
      preferences: preferencesResult.error?.message,
      userId: user.id,
    });
    redirect("/minha-conta?status=erro");
  }

  revalidatePath("/minha-conta");
  redirect("/minha-conta?status=salvo");
}
