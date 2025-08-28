"use client";
import React, { createContext, useState, useEffect } from "react";

export const ThemeContext = createContext({ primary: "#1a73e8", setPrimary: () => {} });

export function ThemeProvider({ children }) {
  const [primary, setPrimary] = useState("#1a73e8");

  useEffect(() => {
    document.documentElement.style.setProperty("--primary", primary);
  }, [primary]);

  return (
    <ThemeContext.Provider value={{ primary, setPrimary }}>
      <style>{`
        :root { --primary: ${primary}; }
        button[style*="1px solid #1a73e8"] { border-color: var(--primary) !important; background: var(--primary) !important; }
        a { color: inherit; }
      `}</style>
      {children}
    </ThemeContext.Provider>
  );
}
