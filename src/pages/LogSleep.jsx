async function saveSleep({ start_time, end_time, total_sleep_hours, notes }) {
  await supabase.from("sleep_data").insert([{ start_time, end_time, total_sleep_hours, notes }]);

  // Optional Nightscout Note
  await fetch("/api/nightscout/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: "note",
      start_time,
      notes: `Slept ${total_sleep_hours}h\n${notes || ""}`,
    }),
  });
}
