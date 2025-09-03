// src/components/TopNav.jsx
import { NavLink } from "react-router-dom";

export default function TopNav({ showTabs = true }) {
  const tabs = [
    { to: "/", label: "Dashboard" },
    { to: "/glucose", label: "Glucose" },
    { to: "/sleep", label: "Sleep" },
    { to: "/migraine", label: "Migraine" },
    { to: "/settings", label: "Settings" },
    { to: "/education", label: "Education" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <img src="/logo.png" alt="Sentinel Health" className="h-7 w-auto" />
          <div className="truncate text-sm text-slate-600">
            <span className="font-semibold text-slate-900">Sentinel Health</span>
            <span className="ml-2 hidden sm:inline">Migraine Tracker</span>
          </div>
        </div>

        {showTabs && (
          <nav className="ml-auto w-full overflow-x-auto">
            <ul className="flex shrink-0 items-center gap-2">
              {tabs.map((t) => (
                <li key={t.to} className="shrink-0">
                  <NavLink
                    to={t.to}
                    end={t.to === "/"}
                    className={({ isActive }) =>
                      `inline-block rounded-xl border px-3 py-1.5 text-sm transition ${
                        isActive
                          ? "bg-slate-900 text-white border-slate-900"
                          : "border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`
                    }
                  >
                    {t.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
