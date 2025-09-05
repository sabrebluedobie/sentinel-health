import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import supabase from "@/lib/supabase";
import { useDailyMetrics, useMigraineCorrelations } from "@/hooks/useDailyMetrics";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function App() {
  const [user, setUser] = useState(null);
  const [range, setRange] = useState(30); // 7 / 30 / 90 / 120+ uses full view
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) setUser(session?.user ?? null);
    })();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    navigate("/sign-in", { replace: true });
  }

  const { rows, loading } = useDailyMetrics(range);
  const corr = useMigraineCorrelations(rows);
  const data = rows.map(r => ({
    day: new Date(r.day).toLocaleDateString(),
    pain: Number(r.avg_pain ?? 0),
    migraines: Number(r.migraine_count ?? 0),
    glucose: Number(r.avg_glucose ?? 0),
    sleep: Number(r.sleep_hours ?? 0),
  }));

  return (
    <div className="app-shell">
      <header className="sticky top-0 bg-white/90 backdrop-blur z-10 border-b">
        <div className="mx-auto max-w-7xl px-4 h-14 flex items-center gap-3">
          <img src="/logo.svg" alt="Sentrya" className="h-7 w-auto" />
          <nav className="flex gap-2 text-sm">
            <Link className="btn-ghost" to="/">Dashboard</Link>
            <Link className="btn-ghost" to="/log-glucose">Glucose</Link>
            <Link className="btn-ghost" to="/log-sleep">Sleep</Link>
            <Link className="btn-ghost" to="/log-migraine">Migraine</Link>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {user && <span className="text-xs text-zinc-500">{user.email}</span>}
            {user ? (
              <button onClick={signOut} className="btn-primary">Sign out</button>
            ) : (
              <Link to="/sign-in" className="btn-primary">Sign in</Link>
            )}
          </div>
        </div>
      </header>

      <main className="container-page">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card md:col-span-2">
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <p className="mt-1 text-sm text-zinc-600">
              {loading ? "Loading…" :
                user ? "Welcome back! Use quick actions to log entries." :
                "You’re not signed in. You can view, but must sign in to save data."}
            </p>
          </div>

          <div className="card">
            <div className="text-sm text-zinc-600 mb-1">Range</div>
            <div className="flex gap-2">
              {[7,30,90].map(d => (
                <button key={d}
                        className={`btn-ghost ${range===d ? 'ring-2 ring-brand-600' : ''}`}
                        onClick={()=>setRange(d)}>
                  {d}d
                </button>
              ))}
              <button className={`btn-ghost ${range===120 ? 'ring-2 ring-brand-600' : ''}`} onClick={()=>setRange(120)}>
                120d+
              </button>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid gap-4 md:grid-cols-3 mt-4">
          <Link to="/log-glucose" className="card hover:ring-zinc-300 transition">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <div className="text-lg font-semibold">Log Glucose</div>
                <div className="text-sm text-zinc-600">Manual mg/dL reading</div>
              </div>
            </div>
          </Link>

          <Link to="/log-sleep" className="card hover:ring-zinc-300 transition">
            <div className="flex items-center gap-3">
              <span className="text-2xl">😴</span>
              <div>
                <div className="text-lg font-semibold">Log Sleep</div>
                <div className="text-sm text-zinc-600">Record last night</div>
              </div>
            </div>
          </Link>

          <Link to="/log-migraine" className="card hover:ring-zinc-300 transition">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🙂</span>
              <div>
                <div className="text-lg font-semibold">Log Migraine</div>
                <div className="text-sm text-zinc-600">Pain 0–10 + notes</div>
              </div>
            </div>
          </Link>
        </div>

        {/* Charts + Insights */}
        <div className="grid gap-4 lg:grid-cols-3 mt-4">
          <div className="card lg:col-span-2">
            <div className="mb-2 font-medium">Glucose ↔ Pain ({range}d)</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis yAxisId="left" domain={[0, 'auto']} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 10]} />
                <Tooltip />
                <Line yAxisId="left"  type="monotone" dataKey="glucose" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="pain"    strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <div className="font-semibold mb-2">Insights (beta)</div>
            <ul className="text-sm space-y-1">
              <li>Glucose vs pain: <b>{fmt(corr.pain_vs_glucose)}</b></li>
              <li>Sleep vs pain: <b>{fmt(corr.pain_vs_sleep)}</b></li>
              <li>Yday glucose → pain: <b>{fmt(corr.pain_vs_glucose_lag1)}</b></li>
              <li>Yday sleep → pain: <b>{fmt(corr.pain_vs_sleep_lag1)}</b></li>
            </ul>
            <p className="text-xs text-zinc-500 mt-2">
              Correlation −1..1 (|0.5|≈moderate). Lag = yesterday’s value vs today’s pain.
            </p>
          </div>

          <div className="card lg:col-span-3">
            <div className="mb-2 font-medium">Sleep ↔ Pain ({range}d)</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis yAxisId="left" domain={[0, 'auto']} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 10]} />
                <Tooltip />
                <Line yAxisId="left"  type="monotone" dataKey="sleep" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="pain"  strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </main>
    </div>
  );
}

function fmt(v){ return (v===null||Number.isNaN(v)) ? "—" : Number(v).toFixed(2); }