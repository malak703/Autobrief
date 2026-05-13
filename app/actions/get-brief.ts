"use server";

import { createServerSupabase } from "@/lib/supabase";
import { briefToSections, parseNormalizedInput } from "@/lib/brief-helpers";

export async function getBriefByToken(token: string) {
  const supabase = await createServerSupabase();
  
  const { data: brief, error } = await supabase
    .from("briefs")
    .select("*")
    .eq("token", token)
    .maybeSingle();

  if (error || !brief) {
    return { success: false, error: "Brief not found" };
  }

  const sections = briefToSections(brief);
  const intake = parseNormalizedInput(brief.raw_input);
  const whatsappChatImages =
    intake?.images.filter((img) => img.source === "whatsapp" && img.fileUrl) ?? [];

  return {
    success: true,
    data: {
      brief,
      sections,
      intake,
      whatsappChatImages,
    },
  };
}
