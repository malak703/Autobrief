import { SupabaseClient } from "@supabase/supabase-js";

export type NotificationType =
  | "client_viewed_brief"
  | "client_confirmed_brief"
  | "client_edited_brief"
  | "deadline_24h_left";

type CreateNotificationParams = {
  supabase: SupabaseClient;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
};

export async function createNotificationIfEnabled({
  supabase,
  userId,
  type,
  title,
  message,
  link,
}: CreateNotificationParams) {
  const { data: preferences, error: preferencesError } = await supabase
    .from("notification_preferences")
    .select(type)
    .eq("user_id", userId)
    .maybeSingle();

  if (preferencesError) {
    console.error("Error fetching notification preferences:", preferencesError);
    return;
  }

  const isEnabled =
    preferences && type in preferences
      ? Boolean(preferences[type as keyof typeof preferences])
      : true;

  if (!isEnabled) {
    return;
  }

  const { error: notificationError } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      type,
      title,
      message,
      link,
    });

  if (notificationError) {
    console.error("Error creating notification:", notificationError);
  }
}