async function saveMigraine({ start_time, end_time, severity, triggers, meds_taken, notes }) {
  // Local save (optional)
  await supabase.from("migraine_episodes").insert([{
    start_time, end_time, severity, triggers, meds_taken, notes
  }]);

  // Nightscout bridge
  await fetch("/api/nightscout/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: "migraine",
      start_time,
      end_time,
      severity,
      triggers,
      meds_taken,
      notes,
    }),
  });
}
