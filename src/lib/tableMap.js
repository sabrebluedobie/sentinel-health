// Map YOUR actual table + column names here (so components stay clean)
export const TABLES = {
  glucose: {
    name: "glucose_readings",       // or "blood_glucose" if you create a view
    time: "device_time",            // or "recorded_at"
    value: "value_mgdl",            // or "value"
    user: "user_id",
  },
  sleep: {
    name: "sleep_data",             // or "sleep_logs"
    start: "start_time",            // or "start"
    end: "end_time",                // or "stop"
    user: "user_id",
  },
  migraine: {
    name: "migraine_episodes",
    start: "start_time",            // or "started_at"
    pain: "severity",               // or "pain"
    user: "user_id",
  },
};
