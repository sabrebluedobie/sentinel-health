// Sentinel Starter Kit — 2025-08-22T19:28:17.351757Z

import { supabase } from "@/lib/supabase";
export async function getDisclaimerConsent(userId){
  if(!userId) return null;
  const { data, error } = await supabase.from("user_consents")
    .select("user_id,type,version,accepted_at")
    .eq("user_id", userId).eq("type","disclaimer").eq("version","v1").maybeSingle();
  if(error) throw error; return data;
}
export async function upsertDisclaimerConsent(userId){
  if(!userId) return;
  const payload = { user_id: userId, type: "disclaimer", version: "v1" };
  const { error } = await supabase.from("user_consents").upsert(payload, { onConflict: "user_id,type,version" });
  if(error) throw error; return true;
}
