import React from "react";

export default function Layout({ children }) {
  return (
    <div style={{
      minHeight:"100%",
      background:"var(--page-bg,#ececec)",
      color:"var(--text,#111)",
      display:"flex",
      flexDirection:"column"
    }}>
      {children}
    </div>
  );
}