import React, { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "@/components/AuthContext";
import supabase from "@/lib/supabase";

// recharts
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

// Read pie colors saved by Settings → PieColorsEditor
function getPieSymptomColorMap() {
  try {
    const raw = localStorage.getItem("app.pieSymptomColors");
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}

export default function Dashboard() {
  const { user, loading } = useContext(AuthContext);
  const nav = useNavigate();

  const [err, setErr] = useState("");

  // Glucose series (last value + timeseries)
  const [g, setG] = useState({ last: null, series: [], loading: true });

  // Sleep (bar chart series + summary)
  const [s, setS] = useState({ totalMin: 0, avgEff: null, dailyHours: [], loading: true });

  // Migraines: symptoms pie + counts
  const [symData, setSymData] = useState([]);
  const [migStats, setMigStats] = useState({ last30: 0, allTime: 0, recent: [] });

  // Show “Supabase tables on load”
  const [tableCounts, setTableCounts] = useState({ migraines: 0, glucose: 0, sleep: 0 });

  const sinceISO = useMemo(() => new Date(Date.now() - 30 * 86400000).toISOString(), []);

  useEffect(() => {
    if (!loading && !user) nav("/signin", { replace: true });
  }, [loading, user, nav]);

  async function fetchGlucose() {
    if (!user) return;
    const { data, error } = await supabase
      .from("glucose_readings")
      .select("device_time,value_mgdl")
      .eq("user_id", user.id)
      .gte("device_time", sinceISO)
      .order("device_time", { ascending: true })
      .limit(2000);
    if (error) throw error;

    const series = (data ?? [])
      .map((r) => ({ t: new Date(r.device_time).getTime(), v: Number(r.value_mgdl) }))
      .filter((p) => Number.isFinite(p.v))
      .sort((a, b) => a.t - b.t);
    const last = series.length ? series[series.length - 1].v : null;
    setG({ last, series, loading: false });
  }

  async function fetchSleep() {
    if (!user) return;

    // Defensive select for schema drift: prefer start_time/end_time; fall back to start/stop
    const { data, error } = await supabase
      .from("sleep_data")
      .select("*")
      .eq("user_id", user.id)
      .limit(5000);
    if (error) throw error;

    const SINCE_TS = Date.now() - 30 * 86400000;
    let totalMin = 0;
    let effSum = 0;
    let effCount = 0;
    const byDay = new Map();

    const getFirst = (row, candidates) => {
      for (const c of candidates) {
        if (row[c] !== undefined && row[c] !== null && String(row[c]).trim() !== "") return row[c];
      }
      return null;
    };
    const toTs = (v) => {
      const t = Date.parse(v);
      return Number.isFinite(t) ? t : NaN;
    };

    for (const r of data ?? []) {
      const sRaw = getFirst(r, ["start_time", "start", "sleep_start", "bedtime", "date", "logged_at"]);
      const eRaw = getFirst(r, ["end_time", "stop", "sleep_end", "wake_time", "wakeup", "logged_at"]);
      const sTs = sRaw ? toTs(sRaw) : NaN;
      const eTs = eRaw ? toTs(eRaw) : NaN;

      if (Number.isFinite(sTs) && Number.isFinite(eTs) && eTs > sTs && sTs >= SINCE_TS) {
        const minutes = (eTs - sTs) / 60000;
        totalMin += minutes;
        const d = new Date(sTs);
        d.setHours(0, 0, 0, 0);
        const k = d.toISOString();
        byDay.set(k, (byDay.get(k) || 0) + minutes / 60);
      }

      const effRaw = getFirst(r, ["efficiency", "sleep_efficiency", "score", "eff"]);
      const effNum = effRaw != null ? Number(effRaw) : NaN;
      if (Number.isFinite(effNum)) {
        effSum += effNum;
        effCount++;
      }
    }

    const dailyHours = [...byDay.entries()]
      .map(([k, hours]) => ({ day: new Date(k), hours: Number(hours.toFixed(2)) }))
      .sort((a, b) => a.day - b.day);

    setS({ totalMin: Math.round(totalMin), avgEff: effCount ? effSum / effCount : null, dailyHours, loading: false });
  }

  async function fetchMigraines() {
    if (!user) return;

    const { data, error } = await supabase
      .from("migraine_entries")
      .select("id,symptoms,created_at")
      .eq("user_id", user.id)
      .gte("created_at", sinceISO)
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw error;

    // Normalize symptom field (array | JSON string | CSV)
    const counts = new Map();
    const norm = (sym) => {
      if (Array.isArray(sym)) return sym.map((s) => String(s).toLowerCase().trim());
      if (typeof sym === "string") {
        try {
          const arr = JSON.parse(sym);
          if (Array.isArray(arr)) return arr.map((s) => String(s).toLowerCase().trim());
        } catch {}
        return sym
          .split(",")
          .map((s) => s.toLowerCase().trim())
          .filter(Boolean);
      }
      return [];
    };

    for (const r of data ?? []) {
      for (const k of norm(r.symptoms)) counts.set(k, (counts.get(k) || 0) + 1);
    }
    const pie = [...counts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    setSymData(pie);

    setMigStats({
      last30: data?.length || 0,
      allTime: null, // filled by fetchCounts
      recent: (data || []).slice(0, 5).map((r) => ({
        id: r.id,
        when: r.created_at,
        symptoms: norm(r.symptoms).slice(0, 4),
      })),
    });
  }

  async function fetchCounts() {
    if (!user) return;
    const [mig, glu, slp] = await Promise.all([
      supabase.from("migraine_entries").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("glucose_readings").select("*", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("sleep_data").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    ]);
    setTableCounts({
      migraines: mig.count ?? 0,
      glucose: glu.count ?? 0,
      sleep: slp.count ?? 0,
    });
    // reuse migraine count for allTime if needed
    setMigStats((m) => ({ ...m, allTime: mig.count ?? m.allTime }));
  }

  const refreshAll = async () => {
    setErr("");
    try {
      await Promise.all([fetchGlucose(), fetchSleep(), fetchMigraines(), fetchCounts()]);
    } catch (e) {
      console.error(e);
      setErr(e.message || "Failed to load data");
    }
  };

  // Initial load
  useEffect(() => {
    if (!user || loading) return;
    refreshAll();
  }, [user?.id, loading]);

  // Realtime updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("realtime:dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "glucose_readings", filter: `user_id=eq.${user.id}` },
        () => refreshAll()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sleep_data", filter: `user_id=eq.${user.id}` },
        () => refreshAll()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "migraine_entries", filter: `user_id=eq.${user.id}` },
        () => refreshAll()
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user?.id]);

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!user) return null;

  const colorMap = getPieSymptomColorMap();

  return (
    <div className="container" style={{ padding: 16 }}>
      <h1 style={{ margin: "12px 0 16px" }}>Dashboard</h1>

      {err && (
        <div
          className="card"
          style={{ border: "1px solid #fca5a5", background: "#fff7f7", padding: 12, borderRadius: 10, marginBottom: 12 }}
        >
          {err}
        </div>
      )}

      {/* Quick actions */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <Link className="btn" to="/settings">
          Settings
        </Link>
        <Link className="btn" to="/log-glucose">
          Log glucose
        </Link>
        <Link className="btn" to="/log-sleep">
          Log sleep
        </Link>
        <Link className="btn" to="/log-migraine">
          Log migraine
        </Link>
        <Link className="btn" to="/education">
          Education
        </Link>
      </div>

      {/* Supabase tables summary */}
      <div className="card" style={{ padding: 16, borderRadius: 14, marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Your data (Supabase)</h2>
        <div className="muted" style={{ marginTop: 4 }}>
          live counts from tables
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginTop: 12 }}>
          <StatTile label="Migraine entries" value={tableCounts.migraines} />
          <StatTile label="Glucose readings" value={tableCounts.glucose} />
          <StatTile label="Sleep rows" value={tableCounts.sleep} />
        </div>
      </div>

      {/* Glucose */}
      <div className="card" style={{ padding: 16, borderRadius: 14, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ margin: 0 }}>Blood glucose</h2>
          <div className="muted">last 30 days</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", marginTop: 8 }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{g.last == null ? "—" : `${g.last} mg/dL`}</div>
          <div className="muted">latest reading</div>
        </div>
        <div style={{ height: 220, marginTop: 12 }}>
          <ResponsiveContainer>
            <LineChart data={g.series.map((p) => ({ t: new Date(p.t), v: p.v }))} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" tickFormatter={(d) => new Date(d).toLocaleDateString()} minTickGap={24} />
              <YAxis domain={["auto", "auto"]} />
              <Tooltip labelFormatter={(d) => new Date(d).toLocaleString()} formatter={(v) => [`${v} mg/dL`, "glucose"]} />
              <Line type="monotone" dataKey="v" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {!g.series.length && <div className="muted">No glucose data yet.</div>}
      </div>

      {/* Sleep bar graph */}
      <div className="card" style={{ padding: 16, borderRadius: 14, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ margin: 0 }}>Sleep (bar graph)</h2>
          <div className="muted">hours per day — last 30 days</div>
        </div>
        <div style={{ height: 220, marginTop: 12 }}>
          <ResponsiveContainer>
            <BarChart
              data={s.dailyHours.map((d) => ({ day: new Date(d.day), hours: d.hours }))}
              margin={{ top: 10, right: 10, bottom: 5, left: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" tickFormatter={(d) => new Date(d).toLocaleDateString()} minTickGap={24} />
              <YAxis domain={[0, "auto"]} />
              <Tooltip labelFormatter={(d) => new Date(d).toLocaleString()} formatter={(v) => [`${v} h`, "sleep"]} />
              <Bar dataKey="hours" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ display: "flex", gap: 24, marginTop: 8, flexWrap: "wrap" }}>
          <StatTile label="Total sleep (30d)" value={`${Math.round(s.totalMin / 60)} h`} sub={`${s.totalMin} min`} />
          <StatTile label="Avg. efficiency" value={s.avgEff == null ? "—" : `${s.avgEff.toFixed(0)}%`} />
        </div>
      </div>

      {/* Migraines: counts + symptoms pie */}
      <div className="card" style={{ padding: 16, borderRadius: 14, marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <h2 style={{ margin: 0 }}>Migraines</h2>
          <div className="muted">LogMigraine table + symptoms</div>
        </div>

        <div style={{ overflowX: "auto", marginTop: 8 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 8 }}>Metric</th>
                <th style={{ textAlign: "right", padding: 8 }}>Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: 8, borderTop: "1px solid #eee" }}># migraines (last 30d)</td>
                <td style={{ padding: 8, borderTop: "1px solid #eee", textAlign: "right" }}>{migStats.last30}</td>
              </tr>
              <tr>
                <td style={{ padding: 8, borderTop: "1px solid #eee" }}># migraines (all time)</td>
                <td style={{ padding: 8, borderTop: "1px solid #eee", textAlign: "right" }}>{migStats.allTime ?? "—"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {!!migStats.recent.length && (
          <div style={{ marginTop: 8 }}>
            <div className="muted" style={{ marginBottom: 4 }}>
              Recent entries
            </div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {migStats.recent.map((r) => (
                <li key={r.id} style={{ marginBottom: 2 }}>
                  {new Date(r.when).toLocaleString()} — {r.symptoms.join(", ")}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div style={{ height: 260, marginTop: 12 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={symData.length ? symData : [{ name: "no data", value: 1 }]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {(symData.length ? symData : [{ name: "no data" }]).map((slice, i) => (
                  <Cell key={i} fill={colorMap[slice.name] || undefined} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {!symData.length && <div className="muted">No migraine entries yet.</div>}
      </div>
    </div>
  );
}

function StatTile({ label, value, sub }) {
  return (
    <div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
      <div className="muted">
        {label}
        {sub ? ` — ${sub}` : ""}
      </div>
    </div>
  );
}
