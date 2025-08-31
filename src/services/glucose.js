// src/services/glucose.js
import supabase from "@/lib/supabase";

/**
 * Expects payload with:
 * user_id (uuid), device_time (ISO), value_mgdl (number),
 * [trend (string|null), source (string|null), reading_type (string|null), note (string|null)],
 * timezone_offset_min (number|null)
 */
export async function insertGlucose(payload) {
  const required = ["user_id", "device_time", "value_mgdl"];
  for (const k of required) {
    if (payload[k] === undefined || payload[k] === null || payload[k] === "")
      throw new Error(`Missing required field: ${k}`);
  }

  const row = {
    user_id: payload.user_id,
    device_time: new Date(payload.device_time).toISOString(),
    value_mgdl: Number(payload.value_mgdl),
    trend: payload.trend ?? null,
    source: payload.source ?? "manual",
    reading_type: payload.reading_type ?? null,
    note: payload.note ?? null,
    timezone_offset_min: payload.timezone_offset_min ?? null,
    created_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("glucose_readings").insert(row);
  if (error) throw error;
  return { ok: true };
}
