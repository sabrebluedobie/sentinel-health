// src/pages/Settings.jsx (wired to /api)
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import supabase from "@/lib/supabase";

export default function Settings() {
  const [url, setUrl] = useState("");
  const [token, setToken] = useState(""); // optional Nightscout token
  const [apiSecret, setApiSecret] = useState(""); // optional API secret
  const [msg, setMsg] = useState("");
  const [kind, setKind] = useState("info"); // 'ok' | 'err' | 'info'
  const [busy, setBusy] = useState(false);

  // Load existing connection if RLS allows selecting own row
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const uid = sessionData?.session?.user?.id;
        if (!uid) return;
        const { data, error } = await supabase
          .from("nightscout_connections")
          .select("url, token, api_secret")
          .eq("user_id", uid)
          .maybeSingle();
        if (!mounted) return;
        if (!error && data) {
          setUrl(data.url || "");
          setToken(data.token || "");
          setApiSecret(data.api_secret || "");
        }
      } catch (_) {}
    })();
    return () => (mounted = false);
  }, []);

  async function saveConnection(e) {
    e?.preventDefault?.();
    setMsg("");
    setKind("info");
    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const jwt = session?.access_token;
      if (!jwt) throw new Error("Please sign in first.");

      const res = await fetch("/api/nightscout/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ url: url.trim(), token: token.trim() || null, api_secret: apiSecret.trim() || null }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || payload?.ok === false) throw new Error(payload?.error || "Save failed");
      setKind("ok");
      setMsg("Saved ✓");
    } catch (err) {
      setKind("err");
      setMsg(err.message || "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function syncNow() {
    setMsg("");
    setKind("info");
    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const jwt = session?.access_token;
      if (!jwt) throw new Error("Please sign in first.");
      const res = await fetch("/api/nightscout/sync", {
        method: "POST",
        headers: { Authorization: `Bearer ${jwt}` },
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || payload?.ok === false) throw new Error(payload?.error || "Sync failed");
      setKind("ok");
      setMsg(`Synced ${payload?.inserted ?? 0} readings ✓`);
    } catch (err) {
      setKind("err");
      setMsg(err.message || "Sync failed");
    } finally {
      setBusy(false);
    }
  }

  function clearFields() {
    setUrl("");
    setToken("");
    setApiSecret("");
    setMsg("");
    setKind("info");
  }

  return (
    <main className="min-h-[calc(100vh-56px)] bg-slate-100 grid place-items-start px-4">
      <div className="mx-auto w-full max-w-xl py-10">
        <div className="flex flex-col items-center mb-6">
          <img src="/logo.png" alt="Sentinel Health" className="h-10 w-auto mb-2" />
          <h1 className="text-3xl font-semibold">Settings</h1>
        </div>

        <form onSubmit={saveConnection} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nightscout URL</label>
            <input
              type="url"
              required
              placeholder="https://yourdomain.nightscoutpro.com/"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">API Token (optional)</label>
            <input
              type="text"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="If your Nightscout uses token auth"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">API Secret (optional)</label>
            <input
              type="password"
              className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={apiSecret}
              onChange={(e) => setApiSecret(e.target.value)}
              placeholder="Used by some Nightscout deployments"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button type="button" onClick={clearFields} className="rounded-xl border px-4 py-2 text-slate-700 hover:bg-slate-50">Clear</button>
            <button type="submit" disabled={busy || !url} className="rounded-xl bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50">{busy ? "Saving…" : "Save"}</button>
            <button type="button" onClick={syncNow} disabled={busy} className="rounded-xl bg-slate-900 px-4 py-2 font-medium text-white hover:opacity-90 disabled:opacity-50">{busy ? "Syncing…" : "Sync now"}</button>
            <Link to="/" className="ml-auto text-sm text-slate-600 hover:underline">← Back to Dashboard</Link>
          </div>
        </form>

        {msg && (
          <div className={`mt-4 rounded-xl border px-3 py-2 text-sm ${kind === "ok" ? "border-emerald-300 bg-emerald-50 text-emerald-700" : kind === "err" ? "border-red-300 bg-red-50 text-red-700" : "border-slate-200 bg-white text-slate-700"}`}>
            {msg}
          </div>
        )}
      </div>
    </main>
  );
}
