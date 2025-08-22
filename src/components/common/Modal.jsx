// Sentinel Starter Kit — 2025-08-22T19:28:17.351757Z

import React from "react";
export default function Modal({ children, onClose, noClose=false }){
  return (
    <div style={{position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:1100}}>
      <div style={{position:"absolute", inset:0, overflowY:"auto"}}>
        <div style={{minHeight:"100%", display:"flex", alignItems:"center", justifyContent:"center", padding:16}}>
          <div style={{position:"relative", width:"100%", maxWidth:680}}>
            {!noClose && (<button onClick={onClose} style={{position:"absolute",right:-8,top:-8,width:32,height:32,borderRadius:"50%",background:"#fff",border:"1px solid #e5e7eb"}}>✕</button>)}
            <div style={{maxHeight:"85vh", overflowY:"auto", background:"#fff", border:"1px solid #e5e7eb", borderRadius:12, padding:16}}>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
