// Sentinel Starter Kit — 2025-08-22T19:28:17.351757Z

import React from "react";
export function StatCard({ title, value, suffix }){
  return (<div style={{borderRadius:12, padding:12, border:"1px solid #e5e7eb", background:"#fff"}}>
    <div style={{fontSize:12, textTransform:"uppercase", color:"#6b7280"}}>{title}</div>
    <div style={{fontSize:22, fontWeight:700}}>{value}{suffix?` ${suffix}`:""}</div>
  </div>);
}
export function Panel({ title, children, accentColor="#042d4d" }){
  return (<div style={{background:"#fff", borderRadius:12, boxShadow:"0 1px 4px rgba(0,0,0,.06)", overflow:"hidden", border:"1px solid #e5e7eb"}}>
    <div style={{padding:"10px 12px", fontWeight:600, fontSize:14, color:accentColor, borderBottom:"1px solid rgba(0,0,0,.06)"}}>{title}</div>
    <div style={{padding:12}}>{children}</div>
    <div style={{height:4, background:accentColor}} />
  </div>);
}
export function MultiSelectChips({ label, options, selected, setSelected, color="#042d4d" }){
  function toggle(item){ setSelected(prev=> prev.includes(item)? prev.filter(v=>v!==item) : [...prev,item]); }
  return (<div style={{marginTop:12}}>
    <div style={{fontSize:14, fontWeight:600, color:"#374151", marginBottom:6}}>{label}</div>
    <div style={{display:"flex", flexWrap:"wrap", gap:8}}>
      {options.map(opt=>{
        const active=selected.includes(opt);
        return (<button key={opt} type="button" onClick={()=>toggle(opt)}
          style={{padding:"6px 10px", borderRadius:999, border:`1px solid ${active?color:"#e5e7eb"}`, background:active?color:"#fff", color:active?"#fff":"#374151", fontSize:13}}>
          {opt}
        </button>);
      })}
    </div>
  </div>);
}
