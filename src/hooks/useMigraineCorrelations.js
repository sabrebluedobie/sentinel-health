export default function useMigraineCorrelations(rows = []) {
  const series = rows.map(r => ({
    pain: num(r.avg_pain ?? r.pain),
    glucose: num(r.avg_glucose ?? r.glucose),
    sleep: num(r.sleep_hours ?? r.total_sleep_hours),
  }));

  return {
    pain_vs_glucose: corrWithN(series.map(s=>s.pain), series.map(s=>s.glucose)),
    pain_vs_sleep:   corrWithN(series.map(s=>s.pain), series.map(s=>s.sleep)),
    pain_vs_glucose_lag1: corrWithN(shift(series.map(s=>s.pain),0), shift(series.map(s=>s.glucose),1)),
    pain_vs_sleep_lag1:   corrWithN(shift(series.map(s=>s.pain),0), shift(series.map(s=>s.sleep),1)),
  };
}

function num(v){ const n=Number(v); return Number.isFinite(n)?n:null; }
function mean(a){ const b=a.filter(x=>x!=null); return b.length? b.reduce((s,x)=>s+x,0)/b.length : null; }

// Returns {r: correlation, n: sample size}
function corrWithN(a,b){
  const x=[], y=[];
  for (let i=0;i<a.length;i++){ if(a[i]!=null && b[i]!=null){ x.push(a[i]); y.push(b[i]); } }
  
  const n = x.length;
  
  // Need at least 3 data points for meaningful correlation
  if (n < 3) return { r: null, n };
  
  const mx=mean(x), my=mean(y);
  let nume=0, dx=0, dy=0;
  for (let i=0;i<x.length;i++){ const vx=x[i]-mx, vy=y[i]-my; nume+=vx*vy; dx+=vx*vx; dy+=vy*vy; }
  const den=Math.sqrt(dx*dy);
  
  return {
    r: den===0 ? null : +(nume/den).toFixed(3),
    n
  };
}

function shift(arr, k){
  const out = new Array(arr.length).fill(null);
  for (let i=0;i<arr.length;i++){ const j=i-k; if (j>=0 && j<arr.length) out[i]=arr[j]; }
  return out;
}