import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider.jsx";

const SYMPTOMS = ["nausea","vomiting","light_sensitivity","sound_sensitivity","visual_aura","dizziness","fatigue"];
const TRIGGERS = ["stress","lack_of_sleep","weather_change","hormonal","food","dehydration","bright_lights","strong_smells","physical_exertion","alcohol"];

function TinyLineChart({ data, xKey, yKey, width = 640, height = 160, yMax }) {
  const pad = 24;
  if (!data?.length) return <div className="text-sm text-gray-500">No data yet.</div>;
  const xs = data.map(d => new Date(d[xKey]).getTime());
  const ys = data.map(d => Number(d[yKey]) || 0);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = 0, maxY = yMax ?? Math.max(10, Math.ceil(Math.max(...ys) * 1.2));
  const pts = xs.map((xv, i) => {
    const px = pad + ((xv - minX) / (maxX - minX || 1)) * (width - 2 * pad);
    const py = height - pad - ((ys[i] - minY) / (maxY - minY || 1)) * (height - 2 * pad);
    return `${px},${py}`;
  }).join(" ");
  return <svg viewBox={`0 0 ${width} ${height}`} className="w-full"><polyline fill="none" stroke="currentColor" strokeWidth="2" points={pts} /></svg>;
}

export default function LogMigraine() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 16),
    pain_level: 5,
    duration_hours: "",
    symptoms: [],
    triggers: [],
    medication_taken: "",
    medication_effective: false,
    notes: "",
    location: "",
    weather_conditions: "",
    barometric_pressure: ""
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const toggleInArray = (key, value) => {
    setForm((f) => {
      const set = new Set(f[key]);
      set.has(value) ? set.delete(value) : set.add(value);
      return { ...f, [key]: Array.from(set) };
    });
  };

  async function loadRows() {
    setLoadingList(true);
    const { data, error } = await supabase
      .from("migraine_episodes")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(50);
    if (error) console.error(error);
    setRows(data || []);
    setLoadingList(false);
  }

  useEffect(() => {
    loadRows();
    const channel = supabase
      .channel("migraine_episodes_realtime")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "migraine_episodes",
        filter: `user_id=eq.${user.id}`,
      }, () => loadRows())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user.id]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    const payload = {
      user_id: user.id,
      date: new Date(form.date).toISOString(),
      pain_level: Number(form.pain_level),
      duration_hours: form.duration_hours ? Number(form.duration_hours) : null,
      symptoms: form.symptoms,
      triggers: form.triggers,
      medication_taken: form.medication_taken || null,
      medication_effective: Boolean(form.medication_effective),
      notes: form.notes || null,
      location: form.location || null,
      weather_conditions: form.weather_conditions || null,
      barometric_pressure: form.barometric_pressure ? Number(form.barometric_pressure) : null,
    };
    const { error } = await supabase.from("migraine_episodes").insert(payload);
    setSaving(false);
    if (error) return setError(error.message);
    setForm((f) => ({ ...f, duration_hours: "", notes: "" }));
    // No need to call loadRows(); realtime will refresh automatically
  };

  return (
    <>
      <div className="p-6">
        <h1 className="text-2xl font-semibold">Log Migraine</h1>
        <p className="mt-2 text-gray-600">Record a new episode below.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 border rounded-lg p-4 mx-6">
        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Start time</span>
            <input type="datetime-local" className="border rounded p-2" value={form.date}
                   onChange={(e) => setForm({ ...form, date: e.target.value })} required />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Pain level (1–10)</span>
            <input type="number" min="1" max="10" className="border rounded p-2" value={form.pain_level}
                   onChange={(e) => setForm({ ...form, pain_level: e.target.value })} required />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Duration (hours)</span>
            <input type="number" step="0.1" min="0" className="border rounded p-2" value={form.duration_hours}
                   onChange={(e) => setForm({ ...form, duration_hours: e.target.value })} />
          </label>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.medication_effective}
                   onChange={(e) => setForm({ ...form, medication_effective: e.target.checked })} />
            <span className="text-sm font-medium">Medication effective</span>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Medication taken</span>
            <input className="border rounded p-2" value={form.medication_taken}
                   onChange={(e) => setForm({ ...form, medication_taken: e.target.value })}
                   placeholder="e.g., sumatriptan 50mg" />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium">Barometric pressure (hPa)</span>
            <input type="number" step="0.1" className="border rounded p-2" value={form.barometric_pressure}
                   onChange={(e) => setForm({ ...form, barometric_pressure: e.target.value })} />
          </label>

          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="text-sm font-medium">Location</span>
            <input className="border rounded p-2" value={form.location}
                   onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Home, office, outdoors…" />
          </label>

          <label className="flex flex-col gap-1 md:col-span-2">
            <span className="text-sm font-medium">Weather conditions</span>
            <input className="border rounded p-2" value={form.weather_conditions}
                   onChange={(e) => setForm({ ...form, weather_conditions: e.target.value })} placeholder="Rainy, hot, windy…" />
          </label>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Symptoms</p>
          <div className="flex flex-wrap gap-2">
            {SYMPTOMS.map((s) => (
              <button key={s} type="button" onClick={() => toggleInArray("symptoms", s)}
                      className={`px-3 py-1 rounded border ${form.symptoms.includes(s) ? "bg-blue-600 text-white border-blue-600" : ""}`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Triggers</p>
          <div className="flex flex-wrap gap-2">
            {TRIGGERS.map((t) => (
              <button key={t} type="button" onClick={() => toggleInArray("triggers", t)}
                      className={`px-3 py-1 rounded border ${form.triggers.includes(t) ? "bg-blue-600 text-white border-blue-600" : ""}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Notes</span>
          <textarea className="border rounded p-2" rows={3} value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </label>

        <button disabled={saving} className="bg-blue-600 text-white px-4 py-2 rounded">
          {saving ? "Saving…" : "Save episode"}
        </button>
      </form>

      <section className="p-6">
        <h2 className="text-xl font-semibold mb-3">Pain over time</h2>
        <TinyLineChart data={[...rows].sort((a,b)=>new Date(a.date)-new Date(b.date))}
                       xKey="date" yKey="pain_level" yMax={10} />
      </section>

      <section className="p-6">
        <h2 className="text-xl font-semibold mb-3">Recent episodes</h2>
        {loadingList ? (
          <p>Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-gray-600">No entries yet.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => (
              <li key={r.id} className="border rounded p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">
                    {new Date(r.date).toLocaleString()} — pain {r.pain_level}
                  </p>
                  {r.duration_hours != null && <p className="text-sm">{r.duration_hours}h</p>}
                </div>
                {(r.symptoms?.length || r.triggers?.length) ? (
                  <p className="text-sm text-gray-600 mt-1">
                    {r.symptoms?.length ? `Symptoms: ${r.symptoms.join(", ")}` : ""}
                    {r.symptoms?.length && r.triggers?.length ? " • " : ""}
                    {r.triggers?.length ? `Triggers: ${r.triggers.join(", ")}` : ""}
                  </p>
                ) : null}
                {r.notes && <p className="text-sm mt-1">{r.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
