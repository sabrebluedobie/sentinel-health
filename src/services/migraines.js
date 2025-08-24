// Sentinel Starter Kit — 2025-08-22T19:28:17.351757Z

import supabase from "@/lib/supabase";
export async function listMigraines(userId){
  const { data, error } = await supabase.from("migraine_episodes").select("*").eq("user_id", userId)
    .order("date",{ascending:false}).limit(500);
  if(error) throw error; return data||[];
}
export async function insertMigraine(payload){
  const { error } = await supabase.from("migraine_episodes").insert(payload);
  if(error) throw error; return true;
}
