// src/components/TopNav.jsx
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import supabase from "@/lib/supabase";

export default function TopNav({ showTabs = true }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isHealthDropdownOpen, setIsHealthDropdownOpen] = useState(false);
  
  const healthTrackingPages = ['/glucose', '/sleep', '/migraine', '/pain'];
  const isHealthPageActive = healthTrackingPages.includes(location.pathname);
  
  const tabs = [
    { to: "/", label: "Dashboard" },
    { to: "/settings", label: "Settings" },
    { to: "/education", label: "Education" },
  ];
  
  const healthOptions = [
    { to: "/glucose", label: "Glucose" },
    { to: "/sleep", label: "Sleep" },
    { to: "/migraine", label: "Migraine" },
    { to: "/pain", label: "Pain" },
  ];

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate("/sign-in", { replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <img src="/migraine-icon.png" alt="Sentrya Migraine Tracker" className="h-8 w-auto" />
          <div className="truncate text-sm text-slate-600">
            <span className="font-semibold text-slate-900">Sentrya</span>
            <span className="ml-2">Migraine Tracker</span>
          </div>
        </div>

        {showTabs && (
          <nav className="ml-auto flex items-center gap-4 w-full overflow-x-auto">
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
              
              {/* Track Health Dropdown */}
              <li className="relative shrink-0">
                <button
                  onClick={() => setIsHealthDropdownOpen(!isHealthDropdownOpen)}
                  onBlur={() => setTimeout(() => setIsHealthDropdownOpen(false), 150)}
                  className={`inline-flex items-center gap-1 rounded-xl border px-3 py-1.5 text-sm transition ${
                    isHealthPageActive
                      ? "bg-slate-900 text-white border-slate-900"
                      : "border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  Track Health
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isHealthDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-lg z-50">
                    <ul className="py-1">
                      {healthOptions.map((option) => (
                        <li key={option.to}>
                          <NavLink
                            to={option.to}
                            className={({ isActive }) =>
                              `block px-4 py-2 text-sm transition ${
                                isActive
                                  ? "bg-slate-100 text-slate-900 font-medium"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`
                            }
                            onClick={() => setIsHealthDropdownOpen(false)}
                          >
                            Log {option.label}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            </ul>
            
            <button
              onClick={handleSignOut}
              className="shrink-0 ml-auto rounded-xl border border-red-200 bg-white px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition"
            >
              Sign Out
            </button>
          </nav>
        )}
      </div>
    </header>
  );
}