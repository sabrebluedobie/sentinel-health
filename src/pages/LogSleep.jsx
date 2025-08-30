import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../providers/AuthProvider.jsx";

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

export default function LogSleep() {
  const { user } = useAuth();

  const [form, setForm] = useState({
    timestamp: new Date().toISOString().slice(0,16),
    hours_slept: "",
    sleep_quality: 3,
    notes: ""
  });

  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  async function loadRows() {
    const { data, error } = await supabase
      .from("sleep_data")
      .select("*")
      .eq("user_id", user.id)
      .order("timestamp", { ascending: false })
      .limit(50);
    if (error) console.error(error);
    setRows(data || []);
  }

  useEffect(() => {
    loadRows();
    const channel = supabase
      .channel("sleep_data_realtime")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "sleep_data",
        filter: `user_id=eq.${user.id}`,
      }, () => loadRows())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user.id]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const { error } = await supabase.from("sleep_data").insert({
      user_id: user.id,
      timestamp: new Date(form.timestamp).toISOString(),
      hours_slept: form.hours_slept ? Number(form.hours_slept) : null,
      sleep_quality: Number(form.sleep_quality),
      notes: form.notes || null,
    });
    setSaving(false);
    if (error) return setError(error.message);
    setForm({ timestamp: new Date().toISOString().slice(0,16), hours_slept: "", sleep_quality: 3, notes: "" });
    // realtime refresh will kick in
  };

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Log Sleep</h1>
        <p className="text-gray-600">Track hours and quality.</p>
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
          <span className="text-sm font-medium">Hours Slept</span>
          <input type="number" min="0" step="0.25" className="border rounded p-2"
                 value={form.hours_slept}
                 onChange={(e)=>setForm({...form, hours_slept: e.target.value})} required />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Sleep Quality (1–5)</span>
          <input type="number" min="1" max="5" className="border rounded p-2"
                 value={form.sleep_quality}
                 onChange={(e)=>setForm({...form, sleep_quality: e.target.value})} required />
        </label>
        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="text-sm font-medium">Notes</span>
          <textarea className="border rounded p-2" rows={3}
                    value={form.notes}
                    onChange={(e)=>setForm({...form, notes: e.target.value})} />
        </label>
        <button className="bg-blue-600 text-white rounded px-4 py-2" disabled={saving}>
          {saving ? "Saving…" : "Save Sleep"}
        </button>
      </form>

      <section>
        <h2 className="text-xl font-semibold mb-3">Hours slept (last 50)</h2>
        <TinyLineChart
          data={[...rows].sort((a,b)=>new Date(a.timestamp)-new Date(b.timestamp))}
          xKey="timestamp"
          yKey="hours_slept"
          yMax={12}
        />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Recent entries</h2>
        <ul className="space-y-2">
          {rows.map(r=>(
            <li key={r.id} className="border rounded p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{new Date(r.timestamp).toLocaleString()}</div>
                {r.notes && <div className="text-sm text-gray-600">{r.notes}</div>}
              </div>
              <div className="text-sm">
                <div><strong>{r.hours_slept}</strong> h</div>
                <div>Quality: {r.sleep_quality}/5</div>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
