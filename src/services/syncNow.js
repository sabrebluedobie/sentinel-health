import supabase from '@/lib/supabase';

async function getJWT(){
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error("Not signed in");
  return token;
}

export async function syncNightscoutNow(){
  const token = await getJWT();
  const r = await fetch("/api/cgm/nightscout/pull", { method:"POST", headers:{ Authorization:`Bearer ${token}` }});
  let out = {}; try{ out = await r.json(); } catch{ out = { error:`HTTP ${r.status}` }; }
  if (!r.ok) out.error = out.error || `HTTP ${r.status}`;
  return out;
}

export async function checkNightscoutConnection(){
  const token = await getJWT();
  const r = await fetch("/api/cgm/nightscout/debug", { method:"POST", headers:{ Authorization:`Bearer ${token}` }});
  let out = {}; try{ out = await r.json(); } catch{ out = { error:`HTTP ${r.status}` }; }
  if (!r.ok) out.error = out.error || `HTTP ${r.status}`;
  return out;
}