import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import ErrorBoundary from "./components/debug/ErrorBoundary.jsx";
import "./index.css";

// On-screen logger (works on iPhone)
(function(){
  const box = document.createElement("pre");
  box.style.cssText = "position:fixed;left:8px;right:8px;bottom:8px;max-height:40vh;overflow:auto;z-index:99999;background:#0b1220;color:#c7d2fe;border:1px solid #1f2a44;border-radius:10px;padding:10px;font-size:12px;display:none";
  document.addEventListener("keydown", (e)=>{ if(e.key==="~") box.style.display = box.style.display==="none"?"block":"none"; });
  document.body.appendChild(box);
  const log = (...args)=>{ const t=new Date().toISOString().slice(11,19); box.textContent += `[${t}] `+args.map(a=>typeof a==="string"?a:JSON.stringify(a)).join(" ")+"\n"; };
  window.__bootlog = log;
})();

function showFatal(msg){
  const el = document.createElement("pre");
  el.style.cssText = "white-space:pre-wrap;font-family:ui-monospace,Menlo,monospace;background:#111827;color:#ffe4e6;border:1px solid #4b5563;padding:12px;border-radius:10px;max-width:900px;margin:16px auto;";
  el.textContent = `App failed to start:\n\n${msg}`;
  document.body.innerHTML = ""; document.body.appendChild(el);
}

window.addEventListener("error", e => showFatal(e?.error?.stack || e.message || String(e)));
window.addEventListener("unhandledrejection", e => showFatal((e?.reason && (e.reason.stack||e.reason.message)) || String(e?.reason)));

(function sanity(){
  const need = ["VITE_SUPABASE_URL","VITE_SUPABASE_ANON_KEY"];
  const miss = need.filter(k => !import.meta.env?.[k]);
  if (miss.length){
    showFatal(`Missing env(s): ${miss.join(", ")}\n\nAdd in Vercel → Project → Settings → Environment Variables and redeploy.`);
    throw new Error("Missing required env");
  }
})();

try{
  window.__bootlog("boot", "ok");
  const rootEl = document.getElementById("root");
  if(!rootEl){ showFatal("No #root element in index.html"); }
  else{
    ReactDOM.createRoot(rootEl).render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  }
}catch(err){ showFatal(err?.stack || err?.message || String(err)); }