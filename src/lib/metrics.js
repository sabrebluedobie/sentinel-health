export function daysBack(n, end = new Date()) {
  const arr = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(d.getDate() - i);
    arr.push(d);
  }
  return arr;
}
export function fmt(d) {
  const dd = new Date(d);
  return dd.toISOString().slice(0,10);
}
export function countByDate(rows, dateKey) {
  const map = {};
  rows.forEach(r => {
    const k = fmt(r[dateKey] || r.date || r.start_time || r.device_time || r.created_at);
    map[k] = (map[k] || 0) + 1;
  });
  return map;
}
export function avgByDate(rows, dateKey, valueKey) {
  const sums = {}, counts = {};
  rows.forEach(r => {
    const k = fmt(r[dateKey]);
    const v = Number(r[valueKey]);
    if (!isFinite(v)) return;
    sums[k] = (sums[k] || 0) + v;
    counts[k] = (counts[k] || 0) + 1;
  });
  const avg = {};
  Object.keys(sums).forEach(k => avg[k] = +(sums[k] / counts[k]).toFixed(1));
  return avg;
}
export function sumByDateMinutes(sleeps) {
  const sums = {};
  sleeps.forEach(s => {
    const k = fmt(s.start_time || s.date);
    const start = new Date(s.start_time);
    const end = new Date(s.end_time);
    const mins = Math.max(0, (end - start) / 60000);
    sums[k] = (sums[k] || 0) + mins;
  });
  return sums;
}
