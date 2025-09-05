import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "@/lib/supabase";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function Dashboard() {
  const [glucose, setGlucose] = useState([]);
  const [migraines, setMigraines] = useState([]);
  const [sleep, setSleep] = useState([]);

  useEffect(() => {
    (async () => {
      // last 14 days
      const since = new Date(Date.now() - 14*24*3600*1000).toISOString();

      const g = await supabase.from("glucose_readings")
        .select("device_time,value_mgdl").gte("device_time", since).order("device_time", { ascending: true });
      setGlucose(g.data ?? []);

      const m = await supabase.from("migraine_unified")
        .select("started_at,pain").gte("started_at", since).order("started_at", { ascending: true });
      setMigraines(m.data ?? []);

      const s = await supabase.from("sleep_data")
        .select("start_time,end_time,efficiency").gte("start_time", since).order("start_time", { ascending: true });
      setSleep(s.data ?? []);
    })();
  }, []);

  const avgGlucose14 = useMemo(() => {
    if (!glucose.length) return null;
    const sum = glucose.reduce((a, d) => a + Number(d.value_mgdl || 0), 0);
    return Math.round(sum / glucose.length);
  }, [glucose]);

  const avgSleepHrs14 = useMemo(() => {
    if (!sleep.length) return null;
    const hrs = sleep.map(s => (new Date(s.end_time) - new Date(s.start_time)) / 3600000);
    return (hrs.reduce((a,b)=>a+b,0) / hrs.length).toFixed(1);
  }, [sleep]);

  return (
    <div className="space-y-6">
      {/* Header + Quick Actions */}
      <div className="card">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <div className="flex gap-2">
            <Link to="/log-glucose" className="btn-ghost whitespace-nowrap"><span>📊</span><span>Log Glucose</span></Link>
            <Link to="/log-migraine" className="btn-ghost whitespace-nowrap"><span>🙂</span><span>Log Migraine</span></Link>
            <Link to="/log-sleep" className="btn-ghost whitespace-nowrap"><span>😴</span><span>Log Sleep</span></Link>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card"><div className="text-sm text-zinc-500">Avg Glucose (14d)</div><div className="text-2xl font-semibold">{avgGlucose14 ?? "—"}{avgGlucose14 ? " mg/dL" : ""}</div></div>
        <div className="card"><div className="text-sm text-zinc-500">Avg Sleep (14d)</div><div className="text-2xl font-semibold">{avgSleepHrs14 ?? "—"}{avgSleepHrs14 ? " h" : ""}</div></div>
        <div className="card"><div className="text-sm text-zinc-500">Migraine Episodes (14d)</div><div className="text-2xl font-semibold">{migraines.length}</div></div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="mb-2 font-medium">Glucose trend</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={glucose.map(d=>({ t: new Date(d.device_time).toLocaleDateString(), v: Number(d.value_mgdl) }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" />
              <YAxis domain={[0, 'auto']} />
              <Tooltip />
              <Line type="monotone" dataKey="v" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="mb-2 font-medium">Migraine pain (0–10)</div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={migraines.map(d=>({ t: new Date(d.started_at).toLocaleDateString(), v: Number(d.pain) || 0 }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="t" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Line type="monotone" dataKey="v" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}