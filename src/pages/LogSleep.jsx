// src/pages/LogSleep.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import supabase from "@/lib/supabase";
import { useAuth } from "@/components/AuthContext";

/**
 * Helpers
 */
function toLocalInput(dt) {
  // format Date -> "YYYY-MM-DDTHH:mm" for <input type="datetime-local">
  const pad = (n) => String(n).padStart(2, "0");
  const y = dt.getFullYear();
  const m = pad(dt.getMonth() + 1);
  const d = pad(dt.getDate());
  const hh = pad(dt.getHours());
  const mm = pad(dt.getMinutes());
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

function minutesBetween(aIso, bIso) {
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.max(0, Math.round((b - a) / 60000));
}

/**
 * Very small line chart (no deps)
 */
function TinyLineChart({ data, width = 640, height = 160, xKey = "x", yKey = "y", yLabel = "min" }) {
  const pad = 24;
  if (!data?.length) return <div className="text-sm text-gray-500">No data yet.</div>;

  const xs = data.map((d) => new Date(d[xKey]).getTime());
  const ys = data.map((d) => Number(d[yKey]) || 0);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = 0;
  const maxY = Math.max(60, Math.ceil(Math.max(...ys) * 1.2));

  const points = xs.map((xv, i) => {
    const px = pad + ((xv - minX) / (maxX - minX || 1)) * (width - 2 * pad);
    const py = height - pad - ((ys[i] - minY) / (maxY - minY || 1)) * (height - 2 * pad);
    return `${px},${py}`;
  }).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      {/* axes */}
      <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="currentColor" strokeWidth="1" />
      <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="currentColor" strokeWidth="1" />
      {/* polyline */}
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={points} />
      <text x={pad} y={pad - 6} fontSize="10">{`Duration (${yLabel})`}</text>
    </svg>
  );
}

export default function LogSleep() {
  const { user, loading } = useAuth();
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // sensible defaults: last night 22:30 -> now
  const defaultTimes = useMemo(() => {
    const now = new Date();
    const wokeLocal = toLocalInput(now);
    const start = new Date(now);
    start.setHours(22, 30, 0, 0);
    if (start.getTime() > now.getTime()) start.setDate(start.getDate() - 1);
    return { sleptLocal: toLocalInput(start), wokeLocal };
  }, []);

  const [form, setForm] = useState({
    slept_at: "", // local string for input
    woke_at: "",
    quality: 3,   // 1-5
    notes: "",
  });

  useEffect(() => {
    setForm((f) => ({ ...f, slept_at: defaultTimes.sleptLocal, woke_at: defaultTimes.wokeLocal }));
  }, [defaultTimes.sleptLocal, defaultTimes.wokeLocal]);

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("sleep_data")
      .select("*")
      .eq("user_id", user.id)
      .order("slept_at", { ascending: false })
      .limit(200);
    if (error) {
      console.error("[sleep_data] select error:", error);
      setError(error.message);
      return;
    }
    setRows(data || []);
  }, [user]);

  useEffect(() => {
    if (!loading && user) load();
  }, [loading, user, load]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("sleep_data_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sleep_data", filter: `user_id=eq.${user.id}` },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, load]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setError("");

    const payload = {
      user_id: user.id,
      slept_at: new Date(form.slept_at).toISOString(),
      woke_at: new Date(form.woke_at).toISOString(),
      quality: Number(form.quality),
      notes: form.notes?.trim() ? form.notes.trim() : null,
    };

    const { error } = await supabase.from("sleep_data").insert(payload);
    setSaving(false);

    if (error) {
      console.error("[sleep_data] insert error:", error);
      setError(error.message);
      return;
    }

    // reset notes; realtime subscription will refresh the list
    setForm((f) => ({ ...f, notes: "" }));
  }

  const chartData = useMemo(() => {
    // oldest -> newest for chart
    const ordered = [...rows].sort((a, b) => new Date(a.slept_at) - new Date(b.slept_at));
    return ordered
      .map((r) => {
        const mins = r.minutes ?? minutesBetween(r.slept_at, r.woke_at);
        if (mins == null) return null;
        return { x: r.slept_at, y: mins };
      })
      .filter(Boolean);
  }, [rows]);

  if (loading) {
    return <div style={{ padding: 16 }}>Loading…</div>;
  }
  if (!user) {
    return <div style={{ padding: 16 }}>Please sign in to log your sleep.</div>;
  }

  return (
    <div className="p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Log Sleep</h1>
        <p className="text-gray-600">Track bedtime, wake time, and sleep quality.</p>
      </header>

      <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 border rounded-xl p-4">
        {error && <div className="md:col-span-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div>}

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Bedtime</span>
          <input
            type="datetime-local"
            className="border rounded px-3 py-2"
            value={form.slept_at}
            onChange={(e) => setForm((f) => ({ ...f, slept_at: e.target.value }))}
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Wake time</span>
          <input
            type="datetime-local"
            className="border rounded px-3 py-2"
            value={form.woke_at}
            onChange={(e) => setForm((f) => ({ ...f, woke_at: e.target.value }))}
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Quality (1–5)</span>
          <input
            type="number" min="1" max="5"
            className="border rounded px-3 py-2"
            value={form.quality}
            onChange={(e) => setForm((f) => ({ ...f, quality: e.target.value }))}
            required
          />
        </label>

        <label className="flex flex-col gap-1 md:col-span-2">
          <span className="text-sm font-medium">Notes</span>
          <input
            className="border rounded px-3 py-2"
            placeholder="optional"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </label>

        <div className="md:col-span-2">
          <button
            className="bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-60"
            disabled={saving}
            type="submit"
          >
            {saving ? "Saving…" : "Save sleep"}
          </button>
        </div>
      </form>

      <section>
        <h2 className="text-xl font-semibold mb-3">Sleep duration trend</h2>
        <TinyLineChart data={chartData} xKey="x" yKey="y" yLabel="minutes" />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Recent entries</h2>
        {rows.length === 0 ? (
          <p className="text-gray-600">No entries yet.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((r) => {
              const mins = r.minutes ?? minutesBetween(r.slept_at, r.woke_at);
              const hours = mins != null ? (mins / 60).toFixed(1) : "—";
              return (
                <li key={r.id ?? `${r.slept_at}-${r.woke_at}`} className="border rounded p-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      {r.slept_at ? new Date(r.slept_at).toLocaleString() : "—"} →{" "}
                      {r.woke_at ? new Date(r.woke_at).toLocaleString() : "—"}
                    </div>
                    {r.notes && <div className="text-sm text-gray-600 mt-1">{r.notes}</div>}
                  </div>
                  <div className="text-sm text-right">
                    <div><strong>{hours}</strong> h</div>
                    <div>Quality: {r.quality ?? "—"}/5</div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
