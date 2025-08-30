import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider.jsx";

function TinyLineChart({ data, xKey, yKey, width = 640, height = 160, yMax }) {
  const pad = 24;
  if (!data?.length) return <div className="text-sm text-gray-500">No data yet.</div>;
  const xs = data.map(d => new Date(d[xKey]).getTime());
  const ys = data.map(d => Number(d[yKey]) || 0);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = 0, maxY = yMax ?? Math.max(100, Math.ceil(Math.max(...ys) * 1.2));
  const pts = xs.map((xv, i) => {
    const px = pad + ((xv - minX) / (maxX - minX || 1)) * (width - 2 * pad);
    const py = height - pad - ((ys[i] - minY) / (maxY - minY || 1)) * (height - 2 * pad);
    return `${px},${py}`;
  }).join(" ");
  return <svg viewBox={`0 0 ${width} ${height}`} className="w-full"><polyline fill="none" stroke="currentColor" strokeWidth="2" points={pts} /></svg>;
}

export default function LogGlucose() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    timestamp: new Date().toISOString().slice(0,16),
    glucose_level: "",
    reading_type: "random",
    notes: ""
  });

  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  async function loadRows() {
    const { data, error } = await supabase
      .from("glucose_readings")
      .select("*")
      .eq("user_id", user.id)
      .order("timestamp", { ascending: false })
      .limit(100);
    if (error) console.error(error);
    setRows(data || []);
  }

  useEffect(() => {
    loadRows();
    const channel = supabase
      .channel("glucose_readings_realtime")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "glucose_readings",
        filter: `user_id=eq.${user.id}`,
      }, () => loadRows())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user.id]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const { error } = await supabase.from("glucose_readings").insert({
      user_id: user.id,
      timestamp: new Date(form.timestamp).toISOString(),
      glucose_level: form.glucose_level ? Number(form.glucose_level) : null,
      reading_type: form.reading_type,
      notes: form.notes || null,
    });
    setSaving(false);
    if (error) return setError(error.message);
    setForm({ timestamp: new Date().toISOString().slice(0,16), glucose_level: "", reading_type: "random", notes: "" });
    // realtime will refresh
  };

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Log Glucose</h1>
        <p className="text-gray-600">Add fingerstick/CGM readings.</p>
      </header>

      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded p-4">
        {error && <p className="md:col-span-2 text-red-600 text-sm">{error}</p>}
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Date & Time</span>
          <input type="datetime-local" className="border rounded p-2"
                 value={form.timestamp}
                 onChange={(e)=>setForm({...form, timestamp: e.target.value})} required />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Glucose (mg/dL)</span>
          <input type="number" min="20" className="border rounded p-2"
                 value={form.glucose_level}
                 onChange={(e)=>setForm({...form, glucose_level: e.target.value})} required />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Reading Type</span>
          <select className="border rounded p-2"
                  value={form.reading_type}
                  onChange={(e)=>setForm({...form, reading_type: e.target.value})}>
            <option value="fasting">Fasting</option>
            <option value="post_meal">Post-Meal</option>
            <option value="random">Random</option>
            <option value="bedtime">Bedtime</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="text-sm font-medium">Notes</span>
          <textarea className="border rounded p-2" rows={3}
                    value={form.notes}
                    onChange={(e)=>setForm({...form, notes: e.target.value})} />
        </label>
        <button className="bg-blue-600 text-white rounded px-4 py-2" disabled={saving}>
          {saving ? "Saving…" : "Save Reading"}
        </button>
      </form>

      <section>
        <h2 className="text-xl font-semibold mb-3">Glucose trend</h2>
        <TinyLineChart
          data={[...rows].sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp))}
          xKey="timestamp"
          yKey="glucose_level"
          yMax={250}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Recent readings</h2>
        <ul className="space-y-2">
          {rows.map(r=>(
            <li key={r.id} className="border rounded p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{new Date(r.timestamp).toLocaleString()}</div>
                {r.notes && <div className="text-sm text-gray-600">{r.notes}</div>}
              </div>
              <div className="text-sm">
                <div><strong>{r.glucose_level}</strong> mg/dL</div>
                <div>{r.reading_type.replace('_',' ')}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
