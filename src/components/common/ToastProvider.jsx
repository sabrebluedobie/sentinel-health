// Sentinel Starter Kit — 2025-08-22T19:28:17.351757Z

import React, { createContext, useContext, useState } from "react";
const ToastContext = createContext(null);
export function useToast(){ return useContext(ToastContext); }
export default function ToastProvider({ children }){
  const [toasts,setToasts]=useState([]);
  function push(type,msg){ const id=Date.now()+Math.random(); setToasts(t=>[...t,{id,type,msg}]); setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)), 3200); }
  const api={ success:(m)=>push("success",m), error:(m)=>push("error",m), info:(m)=>push("info",m) };
  return (<ToastContext.Provider value={api}>
    {children}
    <div style={{position:"fixed",right:16,bottom:16,zIndex:1200}}>
      {toasts.map(t=>(<div key={t.id} style={{background:t.type==="success"?"#16a34a":t.type==="error"?"#dc2626":"#2563eb",color:"#fff",padding:"8px 10px",borderRadius:8,marginTop:8}}>{t.msg}</div>))}
    </div>
  </ToastContext.Provider>);
}
