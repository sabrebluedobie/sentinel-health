// Sentinel Starter Kit — 2025-08-22T19:28:17.351757Z

export function localTzOffsetMinutes(){ return -new Date().getTimezoneOffset(); }
export function humanDateTime(iso){ try { return new Date(iso).toLocaleString(); } catch { return String(iso); } }
export function fmt(d){ return d.toLocaleDateString(undefined,{month:"short",day:"numeric"}); }
export function daysBack(n){ const out=[], now=new Date(); for(let i=n-1;i>=0;i--){ const d=new Date(now); d.setDate(now.getDate()-i); d.setHours(0,0,0,0); out.push(d);} return out; }
export function countByDate(rows, dateKey="date"){
  const map={}; rows.forEach(r=>{ const iso=r[dateKey]||r.date||r.created_at; if(!iso) return;
    const day=new Date(iso); day.setHours(0,0,0,0); const k=fmt(day); map[k]=(map[k]||0)+1; });
  return map;
}
export function avgByDate(rows, dateKey, valueKey){
  const map={}, n={};
  rows.forEach(r=>{ const iso=r[dateKey]; if(!iso) return;
    const day=new Date(iso); day.setHours(0,0,0,0); const k=fmt(day);
    const v=(typeof r[valueKey]==="number")?r[valueKey]:(r[valueKey]!=null?Number(r[valueKey]):null);
    if(v==null||Number.isNaN(v)) return; map[k]=(map[k]||0)+v; n[k]=(n[k]||0)+1; });
  Object.keys(map).forEach(k=> map[k]=+(map[k]/n[k]).toFixed(1)); return map;
}
export function sumSleepHoursByDate(rows) {
  const map={};
  rows.forEach(r=>{ const iso=r.start_time||r.date; const hrs=r.total_sleep_hours!=null?Number(r.total_sleep_hours):null;
    if(!iso||hrs==null||Number.isNaN(hrs)) return; const day=new Date(iso); day.setHours(0,0,0,0); const k=fmt(day); map[k]=(map[k]||0)+hrs; });
  return map;
}
