// Sentinel Starter Kit — 2025-08-22T19:28:17.351757Z

import supabase from '@/lib/supabase';
export async function listGlucose(userId){
  const { data, error } = await supabase.from("glucose_readings").select("*").eq("user_id", userId)
    .order("device_time",{ascending:false}).limit(1000);
  if(error) throw error; return data||[];
}
export async function insertGlucose(payload){
  const { error } = await supabase.from("glucose_readings").insert(payload);
  if(error) throw error; return true;
}
