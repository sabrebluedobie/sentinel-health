// src/services/migraines.js
import supabase from "@/lib/supabase";

export async function insertMigraine(payload) {
  const required = ["user_id", "start_time", "severity"];
  for (const k of required) {
    if (payload[k] === undefined || payload[k] === null || payload[k] === "")
      throw new Error(`Missing required field: ${k}`);
  }

  const row = {
    user_id: payload.user_id,
    start_time: new Date(payload.start_time).toISOString(),
    severity: Number(payload.severity),
    symptoms: Array.isArray(payload.symptoms) ? payload.symptoms : [],
    triggers: Array.isArray(payload.triggers) ? payload.triggers : [],
    medication_taken: payload.medication_taken ?? null,
    medication_effective:
      typeof payload.medication_effective === "boolean"
        ? payload.medication_effective
        : payload.medication_effective === "" ? null : Boolean(payload.medication_effective),
    notes: payload.notes ?? null,
    location: payload.location ?? null,
    weather_conditions: payload.weather_conditions ?? null,
    barometric_pressure:
      payload.barometric_pressure === "" || payload.barometric_pressure == null
        ? null
        : Number(payload.barometric_pressure),
    medication_notes: payload.medication_notes ?? null,
    timezone_offset_min: payload.timezone_offset_min ?? null,
    created_at: new Date().toISOString(),
  };

  // Only include end_time if provided
  if (payload.end_time) {
    row.end_time = new Date(payload.end_time).toISOString();
  }

  const { error } = await supabase.from("migraine_episodes").insert(row);
  if (error) throw error;
  return { ok: true };
}
