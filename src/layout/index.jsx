// src/layout/index.jsx (example)
export default function Layout({ children }) {
  return (
    <div className="app-shell">
      {/* your header/nav here if desired */}
      {children}
    </div>
  );
}