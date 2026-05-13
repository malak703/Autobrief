"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

function getFormValue(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

export async function updateUsername(formData: FormData) {
  const username = getFormValue(formData, "username");

  if (username.length < 2) {
    redirect("/settings?error=Username must be at least 2 characters long.");
  }

  const supabase = await createServerSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      username,
      full_name: username,
      name: username,
    },
  });

  if (error) {
    redirect(`/settings?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/settings");
  revalidatePath("/", "layout");

  redirect("/settings?success=Username updated successfully.");
}

export async function updatePassword(formData: FormData) {
  const oldPassword = getFormValue(formData, "oldPassword");
  const newPassword = getFormValue(formData, "newPassword");
  const confirmPassword = getFormValue(formData, "confirmPassword");

  if (!oldPassword || !newPassword || !confirmPassword) {
    redirect("/settings?error=Please fill in all password fields.");
  }

  if (newPassword.length < 6) {
    redirect("/settings?error=New password must be at least 6 characters long.");
  }

  if (newPassword !== confirmPassword) {
    redirect("/settings?error=New password and confirmation do not match.");
  }

  const supabase = await createServerSupabase();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user || !user.email) {
    redirect("/login");
  }

  const { error: passwordCheckError } =
    await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPassword,
    });

  if (passwordCheckError) {
    redirect("/settings?error=Old password is incorrect.");
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    redirect(`/settings?error=${encodeURIComponent(updateError.message)}`);
  }

  revalidatePath("/settings");

  redirect("/settings?success=Password updated successfully.");
}