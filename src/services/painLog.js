// src/services/painLog.js
import supabase from "@/lib/supabase";

/**
 * Insert a comprehensive pain log entry
 * If is_migraine_event=true, also creates migraine_episodes entry
 */
export async function insertPainLog(payload) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User must be authenticated");

  // Create pain_logs entry
  const painLogData = {
    user_id: user.id,
    timestamp: payload.timestamp || new Date().toISOString(),
    overall_pain_level: Number(payload.overall_pain_level),
    pain_locations: payload.pain_locations || {}, // JSONB object
    pain_types: payload.pain_types || [], // array
    side: payload.side || null,
    is_migraine_event: payload.is_migraine_event || false,
    notes: payload.notes || null,
    triggers: payload.triggers || [],
    related_to: payload.related_to || null,
    injury_date: payload.injury_date || null,
    condition_name: payload.condition_name || null,
    medications_taken: payload.medications_taken || [],
    medication_dose: payload.medication_dose || null,
  };

  const { data: painLogEntry, error: painLogError } = await supabase
    .from("pain_logs")
    .insert([painLogData])
    .select()
    .single();

  if (painLogError) throw painLogError;

  // If this is a migraine event, create migraine_episodes entry
  if (payload.is_migraine_event && payload.migraine_details) {
    const migraineData = {
      user_id: user.id,
      pain_logs_id: painLogEntry.id, // Link back to pain_logs
      started_at: payload.timestamp || new Date().toISOString(),
      pain: payload.migraine_details.head_pain_level || payload.overall_pain_level,
      pain_level: payload.migraine_details.head_pain_level || payload.overall_pain_level,
      duration_hours: payload.migraine_details.duration_hours || null,
      symptoms: payload.migraine_details.symptoms || [],
      triggers: payload.triggers || [],
      medication_taken: payload.medications_taken?.join(", ") || null,
      medication_effective: payload.migraine_details.medication_effective || false,
      notes: payload.notes || null,
      source: "manual",
      // Weather data can be added here later
      // weather_conditions: payload.weather?.conditions || null,
      // barometric_pressure: payload.weather?.barometric_pressure || null,
    };

    const { error: migraineError } = await supabase
      .from("migraine_episodes")
      .insert([migraineData]);

    if (migraineError) throw migraineError;
  }

  return { ok: true, data: painLogEntry };
}

/**
 * Fetch pain logs for a user with optional filters
 */
export async function fetchPainLogs({ userId, startDate, endDate, isMigraineOnly = false }) {
  let query = supabase
    .from("pain_logs")
    .select("*")
    .eq("user_id", userId)
    .order("timestamp", { ascending: false });

  if (startDate) {
    query = query.gte("timestamp", startDate);
  }
  if (endDate) {
    query = query.lte("timestamp", endDate);
  }
  if (isMigraineOnly) {
    query = query.eq("is_migraine_event", true);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Fetch pain logs with linked migraine episodes
 */
export async function fetchPainLogsWithMigraines(userId) {
  const { data, error } = await supabase
    .from("pain_logs")
    .select(`
      *,
      migraine_episodes!pain_logs_id(*)
    `)
    .eq("user_id", userId)
    .order("timestamp", { ascending: false });

  if (error) throw error;
  return data;
}