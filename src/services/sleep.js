// Sentinel Starter Kit — 2025-08-22T19:28:17.351757Z

import supabase from "@/lib/supabase";
export async function listSleep(userId){
  const { data, error } = await supabase.from("sleep_data").select("*").eq("user_id", userId)
    .order("start_time",{ascending:false}).limit(365);
  if(error) throw error; return data||[];
}
export async function insertSleep(payload){
  const { error } = await supabase.from("sleep_data").insert(payload);
  if(error) throw error; return true;
}
