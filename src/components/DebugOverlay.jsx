import React, { useEffect, useMemo, useRef, useState } from 'react';

function isDebugFlagOn() {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get('debug') === '1') return true;
    if (localStorage.getItem('debug') === '1') return true;
  } catch {}
  return false;
}

export default function DebugOverlay({ data = {}, defaultOpen, maxHeight = 320 }) {
  const [open, setOpen] = useState(defaultOpen ?? isDebugFlagOn());
  const [logs, setLogs] = useState([]);
  const originals = useRef(null);

  // Patch console to capture logs
  useEffect(() => {
    originals.current = {
      log: console.log,
      warn: console.warn,
      error: console.error,
    };
    console.log = (...args) => {
      originals.current.log(...args);
      setLogs((l) => [...l, { level: 'log', msg: stringify(args) }].slice(-200));
    };
    console.warn = (...args) => {
      originals.current.warn(...args);
      setLogs((l) => [...l, { level: 'warn', msg: stringify(args) }].slice(-200));
    };
    console.error = (...args) => {
      originals.current.error(...args);
      setLogs((l) => [...l, { level: 'error', msg: stringify(args) }].slice(-200));
    };
    return () => {
      if (originals.current) {
        console.log = originals.current.log;
        console.warn = originals.current.warn;
        console.error = originals.current.error;
      }
    };
  }, []);

  const json = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return '(unable to stringify data)';
    }
  }, [data]);

  const panelStyle = {
    position: 'fixed',
    right: 12,
    bottom: 12,
    width: 360,
    maxWidth: '95vw',
    background: 'rgba(255,255,255,0.98)',
    border: '1px solid rgba(0,0,0,0.15)',
    borderRadius: 10,
    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: 12,
    zIndex: 999999,
    overflow: 'hidden',
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    background: '#111827',
    color: 'white',
    fontWeight: 600,
  };

  const sectionStyle = {
    display: 'grid',
    gridTemplateRows: '1fr',
    gap: 8,
    padding: 10,
  };

  const scrollStyle = {
    overflow: 'auto',
    maxHeight,
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 6,
    background: '#F9FAFB',
    padding: 8,
    lineHeight: 1.35,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        aria-label="Toggle Debug Overlay"
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'fixed',
          right: 12,
          bottom: open ? maxHeight + 72 : 12,
          zIndex: 999999,
          borderRadius: 999,
          padding: '10px 14px',
          border: '1px solid rgba(0,0,0,0.15)',
          background: open ? '#111827' : 'white',
          color: open ? 'white' : '#111827',
          fontWeight: 700,
          boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
        }}
      >
        {open ? '× Close Debug' : '🐞 Debug'}
      </button>

      {open && (
        <div style={panelStyle}>
          <div style={headerStyle}>
            <span>Debug Overlay</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  localStorage.setItem('debug', '1');
                  alert('Debug sticky ON (localStorage.debug=1).');
                }}
                style={smallBtn}
              >
                Stick
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('debug');
                  alert('Debug sticky OFF.');
                }}
                style={smallBtn}
              >
                Unstick
              </button>
            </div>
          </div>

          <div style={sectionStyle}>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Data</div>
              <div style={scrollStyle}>
                <code>{json}</code>
              </div>
            </div>

            <div>
              <div style={{ fontWeight: 700, margin: '8px 0 6px' }}>Console</div>
              <div style={scrollStyle}>
                {logs.length === 0 && (
                  <em>No logs yet. Try console.log().</em>
                )}
                {logs.map((l, i) => (
                  <div key={i} style={{ marginBottom: 4 }}>
                    <span
                      style={{
                        fontWeight: 700,
                        color:
                          l.level === 'error'
                            ? '#B91C1C'
                            : l.level === 'warn'
                            ? '#92400E'
                            : '#111827',
                        marginRight: 6,
                      }}
                    >
                      [{l.level.toUpperCase()}]
                    </span>
                    <span>{l.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const smallBtn = {
  fontSize: 11,
  padding: '4px 8px',
  borderRadius: 6,
  border: '1px solid rgba(255,255,255,0.35)',
  background: 'transparent',
  color: 'white',
  fontWeight: 700,
  cursor: 'pointer',
};

function stringify(args) {
  return args
    .map((a) => {
      try {
        if (typeof a === 'string') return a;
        return JSON.stringify(a, null, 2);
      } catch {
        return String(a);
      }
    })
    .join(' ');
}