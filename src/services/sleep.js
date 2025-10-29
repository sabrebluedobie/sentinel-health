// src/services/sleep.js
import { supabase } from "@/lib/supabase";

/**
 * Expects payload with:
 * user_id (uuid), date ("YYYY-MM-DD"), start_time (ISO), end_time (ISO|nullable),
 * total_sleep_hours (number), [optional: bedtime, sleep_time, wake_time, sleep_quality, times_woken, sleep_efficiency, notes],
 * timezone_offset_min (number), created_at (ISO)
 */
export async function insertSleep(payload) {
  // Hard guarantees for NOT NULL columns
  const required = ["user_id", "date", "start_time", "total_sleep_hours"];
  for (const k of required) {
    if (payload[k] === undefined || payload[k] === null || payload[k] === "")
      throw new Error(`Missing required field: ${k}`);
  }

  // Ensure types
  const row = {
    user_id: payload.user_id,
    date: payload.date, // "YYYY-MM-DD"
    start_time: new Date(payload.start_time).toISOString(),
    end_time: payload.end_time ? new Date(payload.end_time).toISOString() : null,
    total_sleep_hours: Number(payload.total_sleep_hours),
    bedtime: payload.bedtime ?? null,
    sleep_time: payload.sleep_time ?? null,
    wake_time: payload.wake_time ?? null,
    sleep_quality: payload.sleep_quality === "" ? null : payload.sleep_quality ?? null,
    times_woken: payload.times_woken === "" ? null : payload.times_woken ?? null,
    sleep_efficiency: payload.sleep_efficiency === "" ? null : payload.sleep_efficiency ?? null,
    notes: payload.notes ?? null,
    timezone_offset_min: payload.timezone_offset_min ?? null,
    created_at: payload.created_at || new Date().toISOString(),
  };

  const { error } = await supabase.from("sleep_data").insert(row);
  if (error) throw error;
  return { ok: true };
}
