const key = (n)=> `sentinel:${n}`;
const read = (n)=> { try{ return JSON.parse(localStorage.getItem(key(n))||'[]'); }catch{ return []; } };
const write = (n, rows)=> localStorage.setItem(key(n), JSON.stringify(rows));
const withId = (r)=> ({ id: r.id || crypto.randomUUID(), ...r });
const sort = (rows, order='-date')=>{
  const desc = order.startsWith('-'); const k = desc?order.slice(1):order;
  const val = (v)=> (typeof v==='string' && !isNaN(Date.parse(v))) ? Date.parse(v) : v;
  return [...rows].sort((a,b)=> (desc? -1:1) * ((val(a[k])>val(b[k]))?1:(val(a[k])<val(b[k]))?-1:0));
};
const filterMatch = (row, query={})=> Object.entries(query).every(([k,v])=>{
  const rv = row[k];
  if (v && typeof v==='object'){ if (v.$gte!=null && !(rv>=v.$gte)) return false; if (v.$lte!=null && !(rv<=v.$lte)) return false; return true; }
  return rv===v;
});
const make = (name)=> ({
  async list(order='-date', limit=50){ return sort(read(name), order).slice(0, limit); },
  async filter(query, order='-date', limit=200){ return sort(read(name).filter(r=>filterMatch(r,query)), order).slice(0,limit); },
  async create(data){ const rows=read(name); const row=withId(data); rows.push(row); write(name, rows); return row; },
  async bulkCreate(rows){ const ex=read(name); const add=rows.map(withId); write(name, ex.concat(add)); return { inserted: add.length }; },
  async delete(id){ write(name, read(name).filter(r=>r.id!==id)); },
});
export const MigrainEpisode = make('migrain_episodes');
export const SleepData = make('sleep_data');
export const GlucoseReading = make('glucose_readings');