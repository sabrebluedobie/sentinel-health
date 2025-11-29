import React, { createContext, useContext, useState, useEffect } from 'react';

const DimModeContext = createContext();

export function useDimMode() {
  const context = useContext(DimModeContext);
  if (!context) {
    throw new Error('useDimMode must be used within DimModeProvider');
  }
  return context;
}

export function DimModeProvider({ children }) {
  // Check localStorage for saved preference
  const [dimLevel, setDimLevel] = useState(() => {
    const saved = localStorage.getItem('dimLevel');
    return saved !== null ? parseInt(saved, 10) : 0;
  });

  // Persist to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('dimLevel', dimLevel.toString());
  }, [dimLevel]);

  // Apply the dim overlay via CSS custom property
  useEffect(() => {
    document.documentElement.style.setProperty('--dim-opacity', (dimLevel / 100).toString());
  }, [dimLevel]);

  const enableDimMode = (level = 70) => {
    setDimLevel(Math.min(100, Math.max(0, level)));
  };

  const disableDimMode = () => {
    setDimLevel(0);
  };

  const adjustDimLevel = (newLevel) => {
    setDimLevel(Math.min(100, Math.max(0, newLevel)));
  };

  return (
    <DimModeContext.Provider
      value={{
        dimLevel,
        isDimmed: dimLevel > 0,
        enableDimMode,
        disableDimMode,
        adjustDimLevel,
      }}
    >
      {children}
      {/* Dim overlay - only renders when dimLevel > 0 */}
      {dimLevel > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'black',
            opacity: dimLevel / 100,
            pointerEvents: 'none',
            zIndex: 9999,
            transition: 'opacity 0.3s ease',
          }}
          aria-hidden="true"
        />
      )}
    </DimModeContext.Provider>
  );
}